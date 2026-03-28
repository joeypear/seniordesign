import { format } from 'date-fns';
import jsPDF from 'jspdf';

export async function exportAsPdf(scan, notes) {
  const title = scan.name || 'retinal-scan';
  const result = scan.result || 'pending';
  const date = format(new Date(scan.created_date + 'Z'), 'yyyy-MM-dd');
  const filename = `${title}_${result}_${date}`;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = scan.image_url;
  await new Promise(resolve => { img.onload = resolve; });
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  pdf.setFontSize(18); pdf.setFont('helvetica', 'bold');
  pdf.text('DR Monster – Retinal Scan Report', margin, 20);
  pdf.setFontSize(11); pdf.setFont('helvetica', 'normal');
  pdf.text(`Scan Name: ${scan.name || 'Untitled'}`, margin, 32);
  pdf.text(`Date: ${format(new Date(scan.created_date + 'Z'), 'MMMM d, yyyy')}`, margin, 40);
  pdf.text(`Result: ${result.charAt(0).toUpperCase() + result.slice(1)}`, margin, 48);
  if (notes) { const splitNotes = pdf.splitTextToSize(`Notes: ${notes}`, contentWidth); pdf.text(splitNotes, margin, 56); }
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const imgWidth = contentWidth;
  const imgHeight = imgWidth / imgAspect;
  const yOffset = notes ? 64 : 56;
  pdf.addImage(img, 'JPEG', margin, yOffset, imgWidth, imgHeight);
  pdf.setFontSize(9); pdf.setTextColor(120);
  pdf.text('For screening purposes only. Consult a healthcare professional for diagnosis.', margin, 290);
  pdf.save(`${filename}.pdf`);
}

export async function exportAsDicom(scan, notes) {
  const title = scan.name || 'retinal-scan';
  const result = scan.result || 'pending';
  const date = format(new Date(scan.created_date + 'Z'), 'yyyy-MM-dd');
  const filename = `${title}_${result}_${date}`;

  // Load image onto canvas to extract raw pixel data
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = scan.image_url;
  await new Promise(resolve => { img.onload = resolve; });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Convert to grayscale (average RGB) into a Uint8Array
  const pixelCount = canvas.width * canvas.height;
  const grayPixels = new Uint8Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    const r = imageData.data[i * 4];
    const g = imageData.data[i * 4 + 1];
    const b = imageData.data[i * 4 + 2];
    grayPixels[i] = Math.round((r + g + b) / 3);
  }

  const scanDate = new Date(scan.created_date + 'Z');
  const studyDate = format(scanDate, 'yyyyMMdd');
  const studyTime = format(scanDate, 'HHmmss');
  const uid = `2.25.${Date.now()}${Math.floor(Math.random() * 1000000)}`;
  const sopClassUID = '1.2.840.10008.5.1.4.1.1.77.1.5.1';
  const transferSyntaxUID = '1.2.840.10008.1.2.1'; // Explicit VR Little Endian

  // ── Hand-written DICOM binary encoder (Explicit VR Little Endian) ──
  const enc = new TextEncoder();

  const writeStr = (vr, str) => {
    const bytes = enc.encode(str);
    // DICOM strings must be even length
    const padded = bytes.length % 2 === 0 ? bytes : new Uint8Array([...bytes, 0x20]);
    return padded;
  };

  const writeUI = (str) => {
    const bytes = enc.encode(str);
    const padded = bytes.length % 2 === 0 ? bytes : new Uint8Array([...bytes, 0x00]);
    return padded;
  };

  const writeUS = (val) => {
    const buf = new ArrayBuffer(2);
    new DataView(buf).setUint16(0, val, true);
    return new Uint8Array(buf);
  };

  // Build a single explicit-VR tag element
  // tag: [group, element] as numbers
  // vr: 2-char string
  // valueBytes: Uint8Array
  const buildTag = (group, element, vr, valueBytes) => {
    const isLong = ['OB', 'OW', 'OF', 'SQ', 'UC', 'UR', 'UT', 'UN'].includes(vr);
    const headerLen = isLong ? 12 : 8;
    const buf = new ArrayBuffer(headerLen + valueBytes.length);
    const dv = new DataView(buf);
    dv.setUint16(0, group, true);
    dv.setUint16(2, element, true);
    dv.setUint8(4, vr.charCodeAt(0));
    dv.setUint8(5, vr.charCodeAt(1));
    if (isLong) {
      dv.setUint16(6, 0, true); // reserved
      dv.setUint32(8, valueBytes.length, true);
    } else {
      dv.setUint16(6, valueBytes.length, true);
    }
    new Uint8Array(buf).set(valueBytes, headerLen);
    return new Uint8Array(buf);
  };

  // Build meta information (group 0002)
  const metaTags = [
    buildTag(0x0002, 0x0001, 'OB', new Uint8Array([0x00, 0x01])), // File Meta Info Version
    buildTag(0x0002, 0x0002, 'UI', writeUI(sopClassUID)),           // Media Storage SOP Class UID
    buildTag(0x0002, 0x0003, 'UI', writeUI(uid)),                   // Media Storage SOP Instance UID
    buildTag(0x0002, 0x0010, 'UI', writeUI(transferSyntaxUID)),     // Transfer Syntax UID
  ];

  // Calculate meta length (all tags after 0002,0000)
  const metaContentLength = metaTags.reduce((sum, t) => sum + t.length, 0);
  const metaLengthTag = buildTag(0x0002, 0x0000, 'UL', (() => {
    const b = new ArrayBuffer(4); new DataView(b).setUint32(0, metaContentLength, true); return new Uint8Array(b);
  })());

  // Build dataset tags (sorted by tag number)
  const patientName = scan.name || 'Anonymous';
  const studyDesc = 'Retinal Screening - DR Monster';
  const imgComments = notes || '';

  const dataTags = [
    buildTag(0x0008, 0x0020, 'DA', writeStr('DA', studyDate)),
    buildTag(0x0008, 0x0030, 'TM', writeStr('TM', studyTime)),
    buildTag(0x0008, 0x0060, 'CS', writeStr('CS', 'OP')),
    buildTag(0x0008, 0x0070, 'LO', writeStr('LO', 'DR Monster')),
    buildTag(0x0008, 0x103E, 'LO', writeStr('LO', studyDesc)),
    buildTag(0x0008, 0x0018, 'UI', writeUI(uid)),                   // SOP Instance UID
    buildTag(0x0008, 0x0016, 'UI', writeUI(sopClassUID)),           // SOP Class UID
    buildTag(0x0010, 0x0010, 'PN', writeStr('PN', patientName)),
    buildTag(0x0020, 0x000D, 'UI', writeUI(uid)),                   // Study Instance UID
    buildTag(0x0020, 0x000E, 'UI', writeUI(uid)),                   // Series Instance UID
    buildTag(0x0028, 0x0002, 'US', writeUS(1)),                     // Samples Per Pixel
    buildTag(0x0028, 0x0004, 'CS', writeStr('CS', 'MONOCHROME2')), // Photometric Interpretation
    buildTag(0x0028, 0x0010, 'US', writeUS(canvas.height)),         // Rows
    buildTag(0x0028, 0x0011, 'US', writeUS(canvas.width)),          // Columns
    buildTag(0x0028, 0x0100, 'US', writeUS(8)),                     // Bits Allocated
    buildTag(0x0028, 0x0101, 'US', writeUS(8)),                     // Bits Stored
    buildTag(0x0028, 0x0102, 'US', writeUS(7)),                     // High Bit
    buildTag(0x0028, 0x0103, 'US', writeUS(0)),                     // Pixel Representation
    buildTag(0x4008, 0x0300, 'LT', writeStr('LT', imgComments)),   // Image Comments
    buildTag(0x0040, 0xA124, 'LO', writeStr('LO', `AI Screening Result: ${scan.result ? scan.result.charAt(0).toUpperCase() + scan.result.slice(1) : 'Pending'}`)), // AI Result
    buildTag(0x7FE0, 0x0010, 'OW', grayPixels),                    // Pixel Data
  ];

  // Concatenate everything: preamble (128 bytes) + "DICM" + meta + data
  const preamble = new Uint8Array(128); // zeros
  const magic = enc.encode('DICM');

  const allParts = [preamble, magic, metaLengthTag, ...metaTags, ...dataTags];
  const totalLen = allParts.reduce((s, p) => s + p.length, 0);
  const output = new Uint8Array(totalLen);
  let offset = 0;
  for (const part of allParts) { output.set(part, offset); offset += part.length; }

  const blob = new Blob([output], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.dcm`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

export function exportAsFhir(scan, notes) {
  const title = scan.name || 'retinal-scan';
  const result = scan.result || 'pending';
  const date = format(new Date(scan.created_date + 'Z'), 'yyyy-MM-dd');
  const filename = `${title}_${result}_${date}`;

  const fhirReport = {
    resourceType: 'DiagnosticReport', id: scan.id,
    status: scan.result === 'pending' ? 'registered' : 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'RAD', display: 'Radiology' }] }],
    code: { coding: [{ system: 'http://loinc.org', code: '71237-0', display: 'Diabetic retinopathy study' }], text: 'Diabetic Retinopathy Screening' },
    effectiveDateTime: new Date(scan.created_date + 'Z').toISOString(),
    issued: new Date(scan.created_date + 'Z').toISOString(),
    conclusion: scan.result === 'normal' ? 'No signs of diabetic retinopathy detected.' : scan.result === 'abnormal' ? 'Potential signs of diabetic retinopathy detected. Further evaluation recommended.' : 'Analysis pending.',
    conclusionCode: [{ coding: [{ system: 'http://snomed.info/sct', code: scan.result === 'normal' ? '38103003' : scan.result === 'abnormal' ? '4855003' : '261665006', display: scan.result === 'normal' ? 'Normal' : scan.result === 'abnormal' ? 'Diabetic retinopathy' : 'Unknown' }] }],
    ...(notes ? { note: [{ text: notes }] } : {}),
    ...(scan.name ? { identifier: [{ value: scan.name }] } : {}),
    presentedForm: [{ contentType: 'image/jpeg', url: scan.image_url, title: 'Retinal scan image' }],
  };
  const blob = new Blob([JSON.stringify(fhirReport, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}_fhir.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

export function exportAsCsv(scan, notes) {
  const title = scan.name || 'retinal-scan';
  const result = scan.result || 'pending';
  const date = format(new Date(scan.created_date + 'Z'), 'yyyy-MM-dd');
  const filename = `${title}_${result}_${date}`;

  const rows = [['Field', 'Value'], ['Scan Name', scan.name || 'Untitled'], ['Date', date], ['Result', result], ['Notes', notes || '']];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}
