import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, Calendar, Percent } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/50',
    label: 'Pending Analysis'
  },
  positive: {
    icon: XCircle,
    color: 'text-rose-500 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-900/50',
    label: 'Abnormal Detected'
  },
  negative: {
    icon: CheckCircle2,
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/50',
    label: 'Normal'
  }
};

export default function ScanDetailModal({ scan, open, onOpenChange }) {
  if (!scan) return null;

  const status = statusConfig[scan.result] || statusConfig.pending;
  const StatusIcon = status.icon;

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
            <div>
              <p className={`font-semibold ${status.color}`}>{status.label}</p>
              {scan.result !== 'pending' && scan.confidence != null && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Confidence: {scan.confidence}%
                </p>
              )}
            </div>
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
          {scan.notes && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{scan.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}