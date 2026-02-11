import React, { useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, ChevronRight, Trash2, Edit2, Filter, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    label: 'Pending'
  },
  positive: {
    icon: XCircle,
    color: 'text-rose-500 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800',
    label: 'DR Detected'
  },
  negative: {
    icon: CheckCircle2,
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    label: 'No DR Detected'
  }
};

export default function ScanHistory({ scans, onScanClick, onDeleteScan, onRenameScan }) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Filter scans
  let filteredScans = scans.filter(scan => {
    if (filter === 'all') return true;
    return scan.result === filter;
  });

  // Sort scans
  filteredScans = [...filteredScans].sort((a, b) => {
    const dateA = new Date(a.created_date).getTime();
    const dateB = new Date(b.created_date).getTime();
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });

  if (!scans || scans.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No scans yet</p>
        <p className="text-sm">Upload an image to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="bg-white dark:bg-gray-800">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="positive">DR Detected</SelectItem>
              <SelectItem value="negative">No DR Detected</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-white dark:bg-gray-800">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredScans.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <p className="text-sm">No scans match the selected filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredScans.map((scan, index) => {
        const status = statusConfig[scan.result] || statusConfig.pending;
        const StatusIcon = status.icon;

        return (
          <motion.div
            key={scan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-4 p-3 rounded-xl border ${status.border} ${status.bg}`}
          >
            <img
              src={scan.image_url}
              alt="Scan"
              className="w-16 h-16 rounded-lg object-cover shadow-sm cursor-pointer"
              onClick={() => onScanClick?.(scan)}
            />
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onScanClick?.(scan)}>
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-4 h-4 ${status.color}`} />
                <span className={`font-medium ${status.color}`}>{status.label}</span>
              </div>
              {scan.name && (
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
                  {scan.name}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {format(new Date(scan.created_date + 'Z'), 'MMM d, yyyy • h:mm a')}
              </p>

            </div>
            <Dialog open={editingId === scan.id} onOpenChange={(open) => !open && setEditingId(null)}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(scan.id);
                    setEditName(scan.name || '');
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rename Scan</DialogTitle>
                  <DialogDescription>
                    Enter a new name for this scan
                  </DialogDescription>
                </DialogHeader>
                <Input
                  placeholder="Scan name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onRenameScan(scan.id, editName);
                      setEditingId(null);
                    }
                  }}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    onRenameScan(scan.id, editName);
                    setEditingId(null);
                  }}>
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this scan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this scan from your history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDeleteScan(scan.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </motion.div>
          );
        })}
        </div>
      )}
    </div>
  );
}