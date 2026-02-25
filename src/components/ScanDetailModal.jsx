import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useLanguage } from '@/components/LanguageContext';
import { CheckCircle2, XCircle, Clock, Calendar, Percent, Loader2, HelpCircle, Pencil, Check, X, Trash2, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/50',
    labelKey: 'pendingAnalysis',
    descKey: 'pendingDesc',
  },
  positive: {
    icon: XCircle,
    color: 'text-rose-500 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-900/50',
    labelKey: 'abnormalLabel',
    descKey: 'abnormalDesc',
  },
  negative: {
    icon: CheckCircle2,
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/50',
    labelKey: 'normalLabel',
    descKey: 'normalDesc',
  }
};

export default function ScanDetailModal({ scan, open, onOpenChange, onUpdateNotes, onRenameScan, onDeleteScan }) {
  const { t } = useLanguage();
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [isRenamingInModal, setIsRenamingInModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (scan) {
      setNotes(scan.notes || '');
      setSavedNotes(scan.notes || '');
      setIsEditingName(false);
      setEditName(scan.name || '');
    }
  }, [scan]);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDeleteScan?.(scan.id);
    setIsDeleting(false);
    onOpenChange(false);
  };

  const handleRename = async () => {
    setIsRenamingInModal(true);
    await onRenameScan?.(scan.id, editName);
    setIsRenamingInModal(false);
    setIsEditingName(false);
  };

  if (!scan) return null;

  const status = statusConfig[scan.result] || statusConfig.pending;
  const StatusIcon = status.icon;

  const handleSaveNotes = async () => {
    setIsSaving(true);
    await onUpdateNotes?.(scan.id, notes);
    setSavedNotes(notes);
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  className="h-8 text-base w-1/2"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleRename} disabled={isRenamingInModal}>
                  {isRenamingInModal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400" onClick={() => setIsEditingName(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <span>{scan.name || t('scanDetails')}</span>
                <button
                  onClick={() => { setEditName(scan.name || ''); setIsEditingName(true); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image */}
          <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img
              src={scan.image_url}
              alt="Retina scan"
              className="w-full h-auto max-h-64 object-contain"
            />
          </div>

          {/* Result Badge */}
          <div className={`flex items-center gap-3 p-4 rounded-xl ${status.bg}`}>
            <StatusIcon className={`w-8 h-8 ${status.color}`} />
            <div className="flex-1">
              <p className={`font-semibold ${status.color}`}>{t(status.labelKey)}</p>
              {scan.result !== 'pending' && scan.confidence != null && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('confidence')}: {scan.confidence}%
                </p>
              )}
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

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{t('scannedOn')} {format(new Date(scan.created_date + 'Z'), 'MMMM d, yyyy • h:mm a')}</span>
            </div>

            {scan.confidence != null && scan.result !== 'pending' && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Percent className="w-4 h-4" />
                <span>{t('confidenceScore')}: {scan.confidence}%</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('notes')}</p>
            <Textarea
              placeholder={t('addNotes')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            {notes !== savedNotes && (
              <Button 
                onClick={handleSaveNotes} 
                disabled={isSaving}
                size="sm"
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('saving')}
                    </>
                    ) : t('saveNotes')}
              </Button>
            )}
          </div>

          {/* Delete */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 w-full"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {t('deleteScan')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}