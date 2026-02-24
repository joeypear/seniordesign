import React, { useState } from 'react';
import { format } from 'date-fns';
import { useLanguage } from '@/components/LanguageContext';
import { CheckCircle2, XCircle, Clock, ChevronRight, Trash2, Edit2, Filter, ArrowUpDown, Loader2, Search } from 'lucide-react';
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
    labelKey: 'pending'
  },
  positive: {
    icon: XCircle,
    color: 'text-rose-500 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800',
    labelKey: 'abnormal'
  },
  negative: {
    icon: CheckCircle2,
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    labelKey: 'normal'
  }
};

export default function ScanHistory({ scans, onScanClick, onDeleteScan, onRenameScan }) {
  const { t } = useLanguage();
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [deletingId, setDeletingId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDelete = async (scanId) => {
    setDeletingId(scanId);
    await onDeleteScan(scanId);
    setDeletingId(null);
  };

  const handleRename = async (scanId, name) => {
    setRenamingId(scanId);
    await onRenameScan(scanId, name);
    setRenamingId(null);
    setEditingId(null);
  };

  // Filter scans
  let filteredScans = scans.filter(scan => {
    if (filter !== 'all' && scan.result !== filter) return false;
    if (searchQuery && !(scan.name || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
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
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs bg-white dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="bg-white dark:bg-gray-800 dark:border-gray-600 text-xs h-8 w-auto px-2">
            <Filter className="w-3 h-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="positive">Abnormal</SelectItem>
            <SelectItem value="negative">Normal</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="bg-white dark:bg-gray-800 dark:border-gray-600 text-xs h-8 w-auto px-2">
            <ArrowUpDown className="w-3 h-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
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
                    if (e.key === 'Enter' && !renamingId) {
                      handleRename(scan.id, editName);
                    }
                  }}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingId(null)} disabled={renamingId === scan.id}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleRename(scan.id, editName)}
                    disabled={renamingId === scan.id}
                  >
                    {renamingId === scan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : 'Save'}
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
                  disabled={deletingId === scan.id}
                >
                  {deletingId === scan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
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
                    onClick={() => handleDelete(scan.id)}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={deletingId === scan.id}
                  >
                    {deletingId === scan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : 'Delete'}
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