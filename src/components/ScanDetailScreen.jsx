import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useLanguage } from '@/components/LanguageContext';
import {
  CheckCircle2, XCircle, Clock, Calendar, Loader2,
  HelpCircle, Pencil, Check, X, Trash2, Download,
  FileDown, ChevronDown, ArrowLeft, AlertTriangle
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { validateFilename, recordAction, isRateLimited, subscribeRateLimit } from '@/lib/security';
import { exportAsPdf, exportAsDicom, exportAsFhir, exportAsCsv } from '@/lib/exporters';

const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/50', labelKey: 'pendingAnalysis', descKey: 'pendingDesc' },
  abnormal: { icon: XCircle, color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/50', labelKey: 'abnormalLabel', descKey: 'abnormalDesc' },
  normal: { icon: CheckCircle2, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/50', labelKey: 'normalLabel', descKey: 'normalDesc' },
  no_result: { icon: AlertTriangle, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/50', labelKey: 'pendingAnalysis', descKey: 'pendingDesc' },
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
    if (exportFormat === 'pdf') {
      await exportAsPdf(scan, notes);
    } else if (exportFormat === 'dicom') {
      await exportAsDicom(scan, notes);
    } else if (exportFormat === 'fhir') {
      exportAsFhir(scan, notes);
    } else {
      exportAsCsv(scan, notes);
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
        <div className={`flex items-start gap-3 p-4 rounded-xl ${status.bg}`}>
          <StatusIcon className={`w-8 h-8 mt-0.5 shrink-0 ${status.color}`} />
          <div className="flex-1 min-w-0">
            {scan.result === 'pending' ? (
              <p className={`font-semibold ${status.color}`}>{t(status.labelKey)}</p>
            ) : scan.result === 'normal' || scan.result === 'abnormal' || scan.result === 'no_result' ? (
              <>
                <p className={`font-semibold ${status.color}`}>
                  {scan.result === 'normal' ? 'Normal' : scan.result === 'abnormal' ? 'Abnormal' : 'No Result'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                  {scan.result === 'normal'
                    ? 'No signs of diabetic retinopathy detected. Routine follow-up screenings are still recommended.'
                    : scan.result === 'abnormal'
                    ? 'Potential signs of diabetic retinopathy detected. Please consult a clinician for further evaluation.'
                    : 'Confidence too low to determine a result. Please retake the image.'}
                </p>
                {scan.confidence != null && scan.result !== 'no_result' && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Confidence: {scan.result === 'normal' ? (100 - Number(scan.confidence)).toFixed(1) : Number(scan.confidence).toFixed(1)}%
                  </p>
                )}
              </>
            ) : (
              <>
                <p className={`font-semibold ${status.color}`}>{t(status.labelKey)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Analysis unavailable</p>
              </>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0">
                <HelpCircle className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="left" className="max-w-[260px] text-sm space-y-2">
              <p>This is a <strong>screening tool only</strong> — it does not diagnose any condition.</p>
              <p>The confidence score reflects how certain the model is in its result. A higher score means a stronger signal, but it is never a guarantee.</p>
              <p>Even if your scan appears normal, you should still consult a clinician if you have any concerns about your eye health.</p>
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