import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { User, Mail, Calendar, Shield, LogOut, Trash2, Pencil, Check, X, Globe, ImageDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage, languages } from '@/components/LanguageContext';
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
import { format } from 'date-fns';

export default function AccountSettings() {
  const { t, lang, changeLang } = useLanguage();
  const [downloadFormat, setDownloadFormat] = useState(() => localStorage.getItem('downloadFormat') || 'jpg');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const handleEditName = () => {
    setNewName(user?.username || user?.full_name || '');
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setIsSavingName(true);
    try {
      await base44.auth.updateMe({ username: newName.trim() });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsEditingName(false);
    } catch (error) {
      alert('Unable to update name. Please try again.');
    }
    setIsSavingName(false);
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setNewName('');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await base44.entities.User.delete(user.id);
      await base44.auth.logout();
    } catch (error) {
      alert('Unable to delete account. Please contact support.');
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl p-6 border border-purple-100 dark:border-purple-900">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #c084fc, #ec4899)' }}>
            {user?.profile_picture || user?.avatar_url ? (
              <img
                src={user.profile_picture || user.avatar_url}
                alt="profile"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <span style={{ display: (user?.profile_picture || user?.avatar_url) ? 'none' : 'flex' }}>
              {(user?.username || user?.full_name)?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter your name"
                  className="h-9 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSaveName}
                  disabled={isSavingName || !newName.trim()}
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {user?.username || user?.full_name || 'User'}
                </h3>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleEditName}
                  className="h-7 w-7 text-gray-400 hover:text-gray-600"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <Mail className="w-4 h-4" />
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <Shield className="w-4 h-4" />
            <span className="capitalize">{user?.role || 'user'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{t('joined')} {user?.created_date ? new Date(user.created_date.endsWith('Z') ? user.created_date : user.created_date + 'Z').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</span>
          </div>
        </div>
      </div>

      {/* Download Format */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <ImageDown className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Download Format</span>
        </div>
        <Select
          value={localStorage.getItem('downloadFormat') || 'jpg'}
          onValueChange={(val) => { localStorage.setItem('downloadFormat', val); window.dispatchEvent(new Event('downloadFormatChanged')); }}
        >
          <SelectTrigger className="w-full bg-white dark:bg-gray-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="jpg">JPEG (.jpg)</SelectItem>
            <SelectItem value="png">PNG (.png)</SelectItem>
            <SelectItem value="webp">WebP (.webp)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Language Selector */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('language')}</span>
        </div>
        <Select value={lang} onValueChange={changeLang}>
          <SelectTrigger className="w-full bg-white dark:bg-gray-800">
            <SelectValue placeholder={t('selectLanguage')} />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(languages).map(([code, { label, flag }]) => (
              <SelectItem key={code} value={code}>
                <span className="flex items-center gap-2">
                  <img src={flag} alt={label} className="w-5 h-3.5 object-cover rounded-sm inline-block" />
                  {label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start h-12 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <LogOut className="w-4 h-4 mr-3" />
          {t('logOut')}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start h-12 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <Trash2 className="w-4 h-4 mr-3" />
              {t('deleteAccount')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('deleteAccountConfirm')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('deleteAccountDesc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? t('deleting') : t('deleteAccount')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}