import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Pending'
  },
  positive: {
    icon: XCircle,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    label: 'DR Detected'
  },
  negative: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    label: 'No DR Detected'
  }
};

export default function ScanHistory({ scans, onScanClick }) {
  if (!scans || scans.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No scans yet</p>
        <p className="text-sm">Upload an image to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {scans.map((scan, index) => {
        const status = statusConfig[scan.result] || statusConfig.pending;
        const StatusIcon = status.icon;

        return (
          <motion.div
            key={scan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onScanClick?.(scan)}
            className={`flex items-center gap-4 p-3 rounded-xl border ${status.border} ${status.bg} cursor-pointer hover:shadow-md transition-all`}
          >
            <img
              src={scan.image_url}
              alt="Scan"
              className="w-16 h-16 rounded-lg object-cover shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-4 h-4 ${status.color}`} />
                <span className={`font-medium ${status.color}`}>{status.label}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {format(new Date(scan.created_date), 'MMM d, yyyy • h:mm a')}
              </p>
              {scan.confidence && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Confidence: {scan.confidence}%
                </p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </motion.div>
        );
      })}
    </div>
  );
}