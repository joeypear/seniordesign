import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useLanguage } from '@/components/LanguageContext';
import {
  CheckCircle2, XCircle, Clock, Calendar, Loader2,
  HelpCircle, Pencil, Check, X, Trash2, Download,
  FileDown, ChevronDown, ArrowLeft
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import { validateFilename, recordAction, isRateLimited, subscribeRateLimit } from '@/lib/security';

const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/50', labelKey: 'pendingAnalysis', descKey: 'pendingDesc' },
  abnormal: { icon: XCircle, color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/50', labelKey: 'abnormalLabel', descKey: 'abnormalDesc' },
  normal: { icon: CheckCircle2, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/50', labelKey: 'normalLabel', descKey: 'normalDesc' },
};

export default function ScanDetailScreen({ scan, scansLoading, onBack, onUpdateNotes, onRenameScan, onDeleteScan }) {
  const { t } = useLanguage();
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [renameError, setRenameError] = useState('');
  const [rateLimited, setRateLimited] = useState(isRateLimited());
  useEffect(() => subscribeRateLimit(setRateLimited), []);

  useEffect(() => {
    if (scan) {
      setNotes(scan.notes || '');
      setSavedNotes(scan.notes || '');
      setEditName(scan.name || '');
    }
  }, [scan?.id]);

  if (scansLoading || !scan) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-orange-50 via-white to-teal-50 dark:from-[#161B2E] dark:via-[#161B2E] dark:to-[#161B2E] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const status = statusConfig[scan.result] || statusConfig.pending;
  const StatusIcon = status.icon;

  const handleSaveNotes = async () => {
    setIsSaving(true);
    await onUpdateNotes(scan.id, notes);
    setSavedNotes(notes);
    setIsSaving(false);
  };

  const handleRename = async () => {
    const trimmed = editName.trim();
    if (trimmed !== '') {
      const { valid, error } = validateFilename(trimmed);
      if (!valid) { setRenameError(error); return; }
    }
    if (!recordAction()) return;
    setRenameError('');
    setIsRenaming(true);
    await onRenameScan(scan.id, trimmed);
    setIsRenaming(false);
    setIsEditingName(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDeleteScan(scan.id);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    const response = await fetch(scan.image_url);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const title = scan.name || 'retinal-scan';
    const result = scan.result || 'pending';
    const date = format(new Date(scan.created_date + 'Z'), 'yyyy-MM-dd');
    const ext = localStorage.getItem('downloadFormat') || 'jpg';
    a.download = `${title}_${result}_${date}.${ext}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsDownloading(false);
  };

  const handleExport = async (exportFormat) => {
    setIsExporting(true);
    const title = scan.name || 'retinal-scan';
    const result = scan.result || 'pending';
    const date = format(new Date(scan.created_date + 'Z'), 'yyyy-MM-dd');
    const filename = `${title}_${result}_${date}`;

    if (exportFormat === 'pdf') {
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
    } else if (exportFormat === 'fhir') {
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
    } else if (exportFormat === 'dicom') {
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
    } else {
      const rows = [['Field', 'Value'], ['Scan Name', scan.name || 'Untitled'], ['Date', date], ['Result', result], ['Notes', notes || '']];
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${filename}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }
    setIsExporting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="min-h-[100dvh] bg-gradient-to-b from-orange-50 via-white to-teal-50 dark:from-[#161B2E] dark:via-[#161B2E] dark:to-[#161B2E]"
    >
      {/* Hide layout buttons (info + account) while on detail screen */}
      <style>{`.fixed.top-4.right-4.z-50 { display: none !important; }`}</style>
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/85 dark:bg-[#1A1D2E]/90 backdrop-blur-md border-b border-gray-100 dark:border-[#2E3350] flex items-center gap-3 px-4" style={{ height: 56 }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors shrink-0 pr-2 h-full"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{t('history')}</span>
        </button>

        <div className="flex-1 min-w-0 flex justify-center">
          <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100 truncate">
            {t('scanDetails')}
          </h1>
        </div>

        {/* Spacer to balance back button */}
        <div className="w-16 shrink-0" />
      </div>

      {/* Scrollable content */}
      <div className="max-w-lg mx-auto px-4 pt-4 pb-12 space-y-5">

        {/* Metadata row */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 px-1">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>{format(new Date(scan.created_date + 'Z'), 'MMMM d, yyyy · h:mm a')}</span>
          {scan.name && (
            <>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="truncate">{scan.name}</span>
            </>
          )}
        </div>

        {/* Image */}
        <div className="rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm">
          <img src={scan.image_url} alt="Retina scan" className="w-full h-auto max-h-72 object-contain" />
        </div>

        {/* Result Badge */}
        <div className={`flex items-center gap-3 p-4 rounded-xl ${status.bg}`}>
          <StatusIcon className={`w-8 h-8 ${status.color}`} />
          <div className="flex-1">
            <p className={`font-semibold ${status.color}`}>{t(status.labelKey)}</p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <HelpCircle className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="left" className="max-w-[250px] text-sm">
              {t(status.descKey)}
            </PopoverContent>
          </Popover>
        </div>

        {/* Editable scan name */}
        <div className="bg-white/80 dark:bg-[#22263A] rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-[#2E3350]">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5 px-1">Eye / Title</p>
          {isEditingName ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <Input
                  value={editName}
                  onChange={(e) => { setEditName(e.target.value); setRenameError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') { setIsEditingName(false); setRenameError(''); } }}
                  className="h-10 text-base flex-1"
                  autoFocus
                  disabled={rateLimited}
                />
                <Button size="icon" variant="ghost" className="h-10 w-10 text-green-600 shrink-0" onClick={handleRename} disabled={isRenaming || rateLimited}>
                  {isRenaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-10 w-10 text-gray-400 shrink-0" onClick={() => { setIsEditingName(false); setRenameError(''); }}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              {renameError && <p className="text-xs text-rose-500 px-1">{renameError}</p>}
              {rateLimited && <p className="text-xs text-rose-500 px-1">Too many actions. Please wait 30 seconds.</p>}
            </div>
          ) : (
            <button
              onClick={() => { setEditName(scan.name || ''); setIsEditingName(true); }}
              className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-md border border-input bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <span className="flex-1 text-base truncate">
                {scan.name
                  ? <span className="text-gray-800 dark:text-gray-100">{scan.name}</span>
                  : <span className="text-muted-foreground">{t('nameScanPlaceholder')}</span>}
              </span>
              <Pencil className="w-4 h-4 text-gray-400 shrink-0" />
            </button>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white/80 dark:bg-[#22263A] rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-[#2E3350] space-y-2">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 px-1">Notes</p>
          <Textarea
            placeholder="Add clinical notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px] resize-none"
            rows={3}
          />
          {notes !== savedNotes && (
            <Button onClick={handleSaveNotes} disabled={isSaving} size="sm" className="w-full">
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('saving')}</> : t('saveNotes')}
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white/80 dark:bg-[#22263A] rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-[#2E3350] flex flex-col gap-3">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 px-1">Actions</p>
          <div className="grid grid-cols-2 gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting} className="w-full h-12 text-base text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center justify-center">
                  {isExporting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <FileDown className="w-5 h-5 mr-2" />}
                  {isExporting ? t('processing') : 'Export'}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => handleExport('pdf')}>Export as PDF</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleExport('dicom')}>Export as DICOM</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleExport('fhir')}>Export as FHIR</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" onClick={handleDownload} disabled={isDownloading} className="w-full h-12 text-base text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center justify-center">
              {isDownloading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
              {isDownloading ? t('processing') : 'Save Image'}
            </Button>
          </div>

        </div>

        <div className="bg-white/80 dark:bg-[#22263A] rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-[#2E3350]">
            <Button variant="outline" onClick={handleDelete} disabled={isDeleting} className="w-full h-11 text-sm text-rose-500 hover:text-rose-600 border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20">
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              {t('deleteScan')}
            </Button>
        </div>
      </div>
    </motion.div>
  );
}