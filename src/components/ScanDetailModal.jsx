import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, Calendar, Percent, Loader2, HelpCircle, Pencil, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
    label: 'Pending Analysis',
    description: 'The analysis is still in progress. Results will be available shortly.'
  },
  positive: {
    icon: XCircle,
    color: 'text-rose-500 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-900/50',
    label: 'Abnormal',
    description: 'The analysis indicates potential signs of diabetic retinopathy. We recommend consulting a healthcare professional for further evaluation.'
  },
  negative: {
    icon: CheckCircle2,
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/50',
    label: 'Normal',
    description: 'No signs of diabetic retinopathy were detected. Routine follow-up screenings are still recommended.'
  }
};

export default function ScanDetailModal({ scan, open, onOpenChange, onUpdateNotes }) {
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (scan) {
      setNotes(scan.notes || '');
      setSavedNotes(scan.notes || '');
    }
  }, [scan]);

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
            {scan.name || 'Scan Details'}
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
              <p className={`font-semibold ${status.color}`}>{status.label}</p>
              {scan.result !== 'pending' && scan.confidence != null && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Confidence: {scan.confidence}%
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
                {status.description}
              </PopoverContent>
            </Popover>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Scanned on {format(new Date(scan.created_date + 'Z'), 'MMMM d, yyyy • h:mm a')}</span>
            </div>

            {scan.confidence != null && scan.result !== 'pending' && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Percent className="w-4 h-4" />
                <span>Confidence Score: {scan.confidence}%</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</p>
            <Textarea
              placeholder="Add notes about this scan..."
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
                    Saving...
                  </>
                ) : 'Save Notes'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}