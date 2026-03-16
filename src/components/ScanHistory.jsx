import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { useLanguage } from '@/components/LanguageContext';
import { CheckCircle2, XCircle, Clock, Trash2, Edit2, Filter, ArrowUpDown, Loader2, Search, Download, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/50',
    badgeText: 'text-amber-700 dark:text-amber-300',
    labelKey: 'pending'
  },
  abnormal: {
    icon: XCircle,
    color: 'text-rose-500 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/50',
    badgeText: 'text-rose-700 dark:text-rose-300',
    labelKey: 'abnormal'
  },
  normal: {
    icon: CheckCircle2,
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    labelKey: 'normal'
  }
};

function OverflowMenu({ scan, onDownload, onRename, onDelete, downloadingId, deletingId, t }) {
  const [open, setOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [editName, setEditName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, []);

  const handleRename = async () => {
    setRenamingId(scan.id);
    await onRename(scan.id, editName);
    setRenamingId(null);
    setShowRenameDialog(false);
  };

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        className="flex items-center justify-center w-12 h-12 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-12 z-50 w-44 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
          >
            <button
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onDownload(scan, e); }}
              disabled={downloadingId === scan.id}
            >
              {downloadingId === scan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-emerald-500" />}
              Download
            </button>
            <button
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
              onClick={(e) => { e.stopPropagation(); setOpen(false); setEditName(scan.name || ''); setShowRenameDialog(true); }}
            >
              <Edit2 className="w-4 h-4 text-blue-500" />
              {t('renameScan')}
            </button>
            <button
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors min-h-[44px]"
              onClick={(e) => { e.stopPropagation(); setOpen(false); setShowDeleteDialog(true); }}
              disabled={deletingId === scan.id}
            >
              {deletingId === scan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {t('delete')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('renameScan')}</DialogTitle>
            <DialogDescription>{t('enterNewName')}</DialogDescription>
          </DialogHeader>
          <Input
            placeholder={t('scanName')}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !renamingId) handleRename(); }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)} disabled={!!renamingId}>{t('cancel')}</Button>
            <Button onClick={handleRename} disabled={!!renamingId}>
              {renamingId ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('saving')}</> : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteThisScan')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onDelete(scan.id); setShowDeleteDialog(false); }}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ScanHistory({ scans, onScanClick, onDeleteScan, onRenameScan }) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (scan, e) => {
    e?.stopPropagation();
    setDownloadingId(scan.id);
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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadingId(null);
  };

  const handleDelete = async (scanId) => {
    setDeletingId(scanId);
    await onDeleteScan(scanId);
    setDeletingId(null);
  };

  let filteredScans = scans.filter(scan => {
    if (filter !== 'all' && scan.result !== filter) return false;
    if (searchQuery && !(scan.name || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  filteredScans = [...filteredScans].sort((a, b) => {
    const dateA = new Date(a.created_date).getTime();
    const dateB = new Date(b.created_date).getTime();
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });

  if (!scans || scans.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>{t('noScansYet')}</p>
        <p className="text-sm">{t('uploadToStart')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <style>{`
        .sh-scroll-list { scrollbar-width: none; }
        .sh-scroll-list::-webkit-scrollbar { display: none; }
        @media (hover: hover) {
          .sh-scroll-list { scrollbar-width: thin; scrollbar-color: transparent transparent; transition: scrollbar-color 300ms ease; }
          .sh-scroll-list:hover { scrollbar-color: #d1d5db transparent; }
          .dark .sh-scroll-list:hover { scrollbar-color: #4B5563 transparent; }
          .sh-scroll-list::-webkit-scrollbar { display: block; width: 4px; }
          .sh-scroll-list::-webkit-scrollbar-track { background: transparent; }
          .sh-scroll-list::-webkit-scrollbar-thumb { background: transparent; border-radius: 9999px; }
          .sh-scroll-list:hover::-webkit-scrollbar-thumb { background: #d1d5db; }
          .dark .sh-scroll-list:hover::-webkit-scrollbar-thumb { background: #4B5563; }
        }
      `}</style>

      {/* Search bar — full width */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder={t('searchByName')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-base bg-white dark:bg-gray-800 dark:border-gray-600 w-full"
        />
      </div>

      {/* Filter + Sort row */}
      <div className="flex gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="flex-1 bg-white dark:bg-gray-800 dark:border-gray-600 text-base h-12">
            <Filter className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allResults')}</SelectItem>
            <SelectItem value="abnormal">{t('abnormal')}</SelectItem>
            <SelectItem value="normal">{t('normal')}</SelectItem>
            <SelectItem value="pending">{t('pending')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="flex-1 bg-white dark:bg-gray-800 dark:border-gray-600 text-base h-12">
            <ArrowUpDown className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t('newest')}</SelectItem>
            <SelectItem value="oldest">{t('oldest')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredScans.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <p className="text-sm">{t('noScansMatch')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredScans.map((scan, index) => {
            const status = statusConfig[scan.result] || statusConfig.pending;
            const StatusIcon = status.icon;
            const statusLabel = t(status.labelKey);

            return (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`flex items-center gap-3 px-3 py-5 rounded-xl border transition-colors ${status.bg} ${status.border} hover:opacity-90`}
              >
                {/* Thumbnail */}
                <img
                  src={scan.image_url}
                  alt="Scan"
                  className="w-16 h-16 rounded-lg object-cover shadow-sm flex-shrink-0 cursor-pointer"
                  onClick={() => onScanClick?.(scan)}
                />

                {/* Center info */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onScanClick?.(scan)}>
                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${status.badgeBg} ${status.badgeText}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusLabel}
                  </span>
                  {/* Name */}
                  {scan.name && (
                    <p className="text-base font-medium text-gray-800 dark:text-gray-200 truncate mt-1">
                      {scan.name}
                    </p>
                  )}
                  {/* Date */}
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 whitespace-nowrap">
                    {format(new Date(scan.created_date + 'Z'), 'MMM d, yyyy · h:mm a')}
                  </p>
                </div>

                {/* ⋯ Menu */}
                <OverflowMenu
                  scan={scan}
                  onDownload={handleDownload}
                  onRename={onRenameScan}
                  onDelete={handleDelete}
                  downloadingId={downloadingId}
                  deletingId={deletingId}
                  t={t}
                />
              </motion.div>
            );
          })}

        </div>
      )}
    </div>
  );
}