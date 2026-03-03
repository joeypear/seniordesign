import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, Shield, LogOut, Trash2, Pencil, Check, X, Globe, ImageDown, Moon, Sun, Monitor, Camera } from 'lucide-react';
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

function SectionHeader({ label }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-gray-400 dark:text-[#8B8FA8]">
      {label}
    </p>
  );
}

function SettingCard({ icon: Icon, iconColor = '#a78bfa', children }) {
  return (
    <div className="rounded-xl overflow-hidden flex bg-gray-50 dark:bg-[#22263A] border border-gray-200 dark:border-white/[0.06]">
      <div className="w-1 shrink-0 rounded-l-xl" style={{ background: iconColor }} />
      <div className="flex-1 p-4">
        {children}
      </div>
    </div>
  );
}

export default function AccountSettings() {
  const { t, lang, changeLang } = useLanguage();
  const [downloadFormat, setDownloadFormat] = useState(() => localStorage.getItem('downloadFormat') || 'jpg');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const queryClient = useQueryClient();

  const applyTheme = (value) => {
    setTheme(value);
    localStorage.setItem('theme', value);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = value === 'dark' || (value === 'system' && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
  };

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

  const joinedDate = user?.created_date
    ? new Date(user.created_date.endsWith('Z') ? user.created_date : user.created_date + 'Z')
        .toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : null;

  const displayName = user?.username || user?.full_name || 'User';
  const initials = displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const themeOptions = [
    { value: 'system', icon: <Monitor className="w-3.5 h-3.5" />, label: 'System' },
    { value: 'light', icon: <Sun className="w-3.5 h-3.5" />, label: 'Light' },
    { value: 'dark', icon: <Moon className="w-3.5 h-3.5" />, label: 'Dark' },
  ];

  return (
    <div className="rounded-xl bg-white dark:bg-[#1A1D2E] text-gray-800 dark:text-[#e2e8f0]">
      {/* Content */}
      <div className="p-6 space-y-6">

        {/* Profile Section */}
        <div>
          <SectionHeader label="Profile" />
          <div
            className="rounded-xl p-5 relative overflow-hidden"
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-[#2C3150] dark:to-[#22263A] border border-purple-100 dark:border-purple-500/20"
          >
            {/* Subtle glow */}
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />

            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative group shrink-0">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)' }}
                >
                  {user?.profile_picture || user?.avatar_url ? (
                    <img src={user.profile_picture || user.avatar_url} alt="profile" className="w-full h-full object-cover" />
                  ) : initials}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-2 mb-1">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Enter your name"
                      className="h-8 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <button onClick={handleSaveName} disabled={isSavingName || !newName.trim()}
                      className="p-1.5 rounded-md text-green-400 hover:bg-green-400/10 transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={handleCancelEdit}
                      className="p-1.5 rounded-md text-gray-400 hover:bg-white/10 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-base font-semibold text-gray-900 dark:text-white truncate">{displayName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize shrink-0 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                      {user?.role || 'user'}
                    </span>
                    <button onClick={handleEditName}
                      className="p-1 rounded text-white/30 hover:text-white/70 transition-colors shrink-0">
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#8B8FA8]">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>
                {joinedDate && (
                  <div className="mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-[#8B8FA8] border border-gray-200 dark:border-white/[0.08]">
                      {t('joined')} {joinedDate}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div>
          <SectionHeader label="Preferences" />
          <div className="space-y-3">

            {/* Appearance */}
            <SettingCard icon={Moon} iconColor="#a78bfa">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Appearance</p>
                  <p className="text-xs mt-0.5" style={{ color: '#8B8FA8' }}>Applies to dialogs and menus</p>
                </div>
                <div className="flex items-center gap-0.5 p-1 rounded-lg shrink-0 bg-gray-100 dark:bg-[#1A1D2E] border border-gray-200 dark:border-white/[0.08]">
                  {themeOptions.map(({ value, icon, label }) => (
                    <button
                      key={value}
                      onClick={() => applyTheme(value)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
                      style={{
                        background: theme === value ? '#2C3150' : 'transparent',
                        color: theme === value ? '#a78bfa' : '#8B8FA8',
                        boxShadow: theme === value ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                      }}
                    >
                      {icon}
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </SettingCard>

            {/* Download Format */}
            <SettingCard icon={ImageDown} iconColor="#34d399">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Download Format</p>
                  <p className="text-xs mt-0.5" style={{ color: '#8B8FA8' }}>Default image export format</p>
                </div>
                <Select
                  value={downloadFormat}
                  onValueChange={(val) => { setDownloadFormat(val); localStorage.setItem('downloadFormat', val); }}
                >
                  <SelectTrigger className="w-32 h-8 text-xs shrink-0"
                    style={{ background: '#1A1D2E', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#22263A', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {['jpg', 'png', 'webp', 'heic'].map(fmt => (
                      <SelectItem key={fmt} value={fmt} className="text-xs text-white focus:bg-white/10">
                        {fmt.toUpperCase()} (.{fmt})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </SettingCard>

            {/* Language */}
            <SettingCard icon={Globe} iconColor="#60a5fa">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">{t('language')}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#8B8FA8' }}>Interface display language</p>
                </div>
                <Select value={lang} onValueChange={changeLang}>
                  <SelectTrigger className="w-36 h-8 text-xs shrink-0"
                    style={{ background: '#1A1D2E', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#22263A', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {Object.entries(languages).map(([code, { label, flag }]) => (
                      <SelectItem key={code} value={code} className="text-xs text-white focus:bg-white/10">
                        <span className="flex items-center gap-2">
                          <img src={flag} alt={label} className="w-5 h-3.5 object-cover rounded-sm" />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </SettingCard>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <SectionHeader label="Account" />
          <div className="space-y-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 text-left"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <LogOut className="w-4 h-4 shrink-0" style={{ color: '#8B8FA8' }} />
              {t('logOut')}
            </button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 text-left"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#f87171',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  {t('deleteAccount')}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('deleteAccountConfirm')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('deleteAccountDesc')}</AlertDialogDescription>
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

      </div>
    </div>
  );
}