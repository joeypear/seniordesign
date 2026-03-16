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
    setIsRenaming(true);
    await onRenameScan(scan.id, editName);
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
      style={{ position: 'relative', zIndex: 100 }}
    >
      {/* Hide layout buttons (info + account) while on detail screen */}
      <style>{`.fixed.top-4.right-4.z-50 { display: none !important; }`}</style>
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/85 dark:bg-[#1A1D2E]/90 backdrop-blur-md border-b border-gray-100 dark:border-[#2E3350] flex items-center gap-3 px-4 py-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{t('history')}</span>
        </button>

        <div className="flex-1 min-w-0 flex justify-center">
          {isEditingName ? (
            <div className="flex items-center gap-2 w-full">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsEditingName(false); }}
                className="h-7 text-sm"
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 shrink-0" onClick={handleRename} disabled={isRenaming}>
                {isRenaming ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 shrink-0" onClick={() => setIsEditingName(false)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => { setEditName(scan.name || ''); setIsEditingName(true); }}
              className="flex items-center gap-1.5 group max-w-full"
            >
              <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                {scan.name || t('scanDetails')}
              </h1>
              <Pencil className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          )}
        </div>

        {/* Spacer to balance back button */}
        <div className="w-16 shrink-0" />
      </div>

      {/* Scrollable content */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-10">
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

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 px-1">
          <Calendar className="w-4 h-4" />
          <span>{t('scannedOn')} {format(new Date(scan.created_date + 'Z'), 'MMMM d, yyyy • h:mm a')}</span>
        </div>

        {/* Notes */}
        <div className="bg-white/80 dark:bg-[#22263A] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-[#2E3350] space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('notes')}</p>
          <Textarea
            placeholder={t('addNotes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          {notes !== savedNotes && (
            <Button onClick={handleSaveNotes} disabled={isSaving} size="sm" className="w-full">
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('saving')}</> : t('saveNotes')}
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white/80 dark:bg-[#22263A] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-[#2E3350] flex flex-col gap-2">
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isExporting} className="flex-1 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                  {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                  {isExporting ? t('processing') : 'Export'}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => handleExport('pdf')}>Export as PDF</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleExport('fhir')}>Export as FHIR</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading} className="flex-1 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
              {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              {isDownloading ? t('processing') : 'Save Image'}
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={handleDelete} disabled={isDeleting} className="w-full text-rose-500 hover:text-rose-600 border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20">
            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            {t('deleteScan')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}