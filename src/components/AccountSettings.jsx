import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, LogOut, Trash2, Pencil, Check, X, Globe, ImageDown, Moon, Sun, Monitor, Camera } from 'lucide-react';
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

/* ── helpers ── */
function applyDataTheme(value) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = value === 'dark' || (value === 'system' && prefersDark);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  // keep .dark class in sync for shadcn components
  document.documentElement.classList.toggle('dark', isDark);
}

function SectionHeader({ label }) {
  return (
    <p className="as-themed text-xs font-semibold uppercase tracking-widest mb-3"
      style={{ color: 'var(--as-section-header)' }}>
      {label}
    </p>
  );
}

function SettingCard({ accentColor = 'var(--as-accent)', children }) {
  return (
    <div className="as-themed rounded-xl overflow-hidden flex"
      style={{
        background: 'var(--as-card)',
        border: '1px solid var(--as-border)',
      }}>
      <div className="w-1 shrink-0" style={{ background: accentColor }} />
      <div className="flex-1 p-4">{children}</div>
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
  const mediaListenerRef = useRef(null);

  // Apply theme and manage system listener
  const handleThemeChange = (value) => {
    setTheme(value);
    localStorage.setItem('theme', value);
    applyDataTheme(value);

    // Clean up previous system listener
    if (mediaListenerRef.current) {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', mediaListenerRef.current);
      mediaListenerRef.current = null;
    }

    if (value === 'system') {
      const listener = () => applyDataTheme('system');
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener);
      mediaListenerRef.current = listener;
    }
  };

  // On mount: apply saved theme and set up system listener if needed
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'system';
    applyDataTheme(saved);
    if (saved === 'system') {
      const listener = () => applyDataTheme('system');
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener);
      mediaListenerRef.current = listener;
    }
    return () => {
      if (mediaListenerRef.current) {
        window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', mediaListenerRef.current);
      }
    };
  }, []);

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
    } catch {
      alert('Unable to update name. Please try again.');
    }
    setIsSavingName(false);
  };

  const handleCancelEdit = () => { setIsEditingName(false); setNewName(''); };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await base44.entities.User.delete(user.id);
      await base44.auth.logout();
    } catch {
      alert('Unable to delete account. Please contact support.');
      setIsDeleting(false);
    }
  };

  const joinedDate = user?.created_date
    ? new Date(user.created_date.endsWith('Z') ? user.created_date : user.created_date + 'Z')
        .toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : null;

  const displayName = user?.username || user?.full_name || 'User';
  const initials = displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  if (isLoading) {
    return (
      <div className="flex justify-center py-12" style={{ background: 'var(--as-bg)' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--as-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const themeOptions = [
    { value: 'system', icon: <Monitor className="w-3.5 h-3.5" />, label: 'System' },
    { value: 'light', icon: <Sun className="w-3.5 h-3.5" />, label: 'Light' },
    { value: 'dark', icon: <Moon className="w-3.5 h-3.5" />, label: 'Dark' },
  ];

  return (
    <div className="as-themed rounded-xl" style={{ background: 'var(--as-bg)', color: 'var(--as-text-primary)' }}>
      <div className="p-6 space-y-6">

        {/* ── Profile ── */}
        <div>
          <SectionHeader label="Profile" />
          <div className="as-themed rounded-xl p-5 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, var(--as-profile-gradient-start) 0%, var(--as-profile-gradient-end) 100%)`,
              border: '1px solid var(--as-profile-border)',
            }}>
            {/* Glow */}
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, var(--as-glow) 0%, transparent 70%)`, transform: 'translate(-30%,-30%)' }} />

            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative group shrink-0">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)' }}>
                  {user?.profile_picture || user?.avatar_url
                    ? <img src={user.profile_picture || user.avatar_url} alt="profile" className="w-full h-full object-cover" />
                    : initials}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="Enter your name"
                      autoFocus
                      className="as-themed flex-1 h-8 px-2 rounded-md text-sm outline-none"
                      style={{
                        background: 'var(--as-input-bg)',
                        border: '1px solid var(--as-input-border)',
                        color: 'var(--as-text-primary)',
                      }}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') handleCancelEdit(); }}
                    />
                    <button onClick={handleSaveName} disabled={isSavingName || !newName.trim()}
                      className="p-1.5 rounded-md transition-colors" style={{ color: '#34d399' }}>
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={handleCancelEdit}
                      className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--as-text-muted)' }}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-base font-semibold truncate" style={{ color: 'var(--as-text-primary)' }}>{displayName}</span>
                    <span className="as-themed text-xs px-2 py-0.5 rounded-full capitalize shrink-0"
                      style={{
                        background: 'var(--as-badge-bg)',
                        color: 'var(--as-badge-color)',
                        border: '1px solid var(--as-badge-border)',
                      }}>
                      {user?.role || 'user'}
                    </span>
                    <button onClick={handleEditName} className="p-1 rounded transition-colors"
                      style={{ color: 'var(--as-text-muted)' }}>
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--as-text-muted)' }}>
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>

                {joinedDate && (
                  <div className="mt-2">
                    <span className="as-themed text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: 'var(--as-pill-bg)',
                        color: 'var(--as-text-muted)',
                        border: '1px solid var(--as-pill-border)',
                      }}>
                      {t('joined')} {joinedDate}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Preferences ── */}
        <div>
          <SectionHeader label="Preferences" />
          <div className="space-y-3">

            {/* Appearance */}
            <SettingCard accentColor="var(--as-accent)">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--as-text-primary)' }}>Appearance</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--as-text-muted)' }}>Applies to dialogs and menus</p>
                </div>
                <div className="as-themed flex items-center gap-0.5 p-1 rounded-lg shrink-0"
                  style={{ background: 'var(--as-segment-bg)', border: '1px solid var(--as-border)' }}>
                  {themeOptions.map(({ value, icon, label }) => (
                    <button
                      key={value}
                      onClick={() => handleThemeChange(value)}
                      className="as-themed flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
                      style={{
                        background: theme === value ? 'var(--as-segment-selected)' : 'transparent',
                        color: theme === value ? 'var(--as-accent)' : 'var(--as-text-muted)',
                        boxShadow: theme === value ? 'var(--as-segment-selected-shadow)' : 'none',
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
            <SettingCard accentColor="var(--as-left-bar-green, #34d399)">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--as-text-primary)' }}>Download Format</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--as-text-muted)' }}>Default image export format</p>
                </div>
                <Select value={downloadFormat} onValueChange={val => { setDownloadFormat(val); localStorage.setItem('downloadFormat', val); }}>
                  <SelectTrigger className="as-themed w-32 h-8 text-xs shrink-0"
                    style={{ background: 'var(--as-select-bg)', border: '1px solid var(--as-select-border)', color: 'var(--as-text-primary)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'var(--as-select-content-bg)', border: '1px solid var(--as-border)' }}>
                    {['jpg', 'png', 'webp', 'heic'].map(fmt => (
                      <SelectItem key={fmt} value={fmt} className="text-xs" style={{ color: 'var(--as-text-primary)' }}>
                        {fmt.toUpperCase()} (.{fmt})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </SettingCard>

            {/* Language */}
            <SettingCard accentColor="var(--as-left-bar-blue, #60a5fa)">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--as-text-primary)' }}>{t('language')}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--as-text-muted)' }}>Interface display language</p>
                </div>
                <Select value={lang} onValueChange={changeLang}>
                  <SelectTrigger className="as-themed w-36 h-8 text-xs shrink-0"
                    style={{ background: 'var(--as-select-bg)', border: '1px solid var(--as-select-border)', color: 'var(--as-text-primary)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'var(--as-select-content-bg)', border: '1px solid var(--as-border)' }}>
                    {Object.entries(languages).map(([code, { label, flag }]) => (
                      <SelectItem key={code} value={code} className="text-xs" style={{ color: 'var(--as-text-primary)' }}>
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

        {/* ── Account ── */}
        <div>
          <SectionHeader label="Account" />
          <div className="space-y-2">
            <ThemedButton
              onClick={() => base44.auth.logout()}
              style={{
                border: '1px solid var(--as-logout-border)',
                color: 'var(--as-logout-text)',
                '--hover-bg': 'var(--as-logout-hover-bg)',
              }}
            >
              <LogOut className="w-4 h-4 shrink-0" style={{ color: 'var(--as-icon-muted)' }} />
              {t('logOut')}
            </ThemedButton>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <ThemedButton
                  style={{
                    border: '1px solid var(--as-delete-border)',
                    color: 'var(--as-delete-text)',
                    '--hover-bg': 'var(--as-delete-hover-bg)',
                  }}
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  {t('deleteAccount')}
                </ThemedButton>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('deleteAccountConfirm')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('deleteAccountDesc')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
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

// Small helper button with hover state via inline onMouseEnter/Leave
function ThemedButton({ children, onClick, style = {} }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="as-themed w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left"
      style={{
        background: hovered ? style['--hover-bg'] || 'transparent' : 'transparent',
        border: style.border,
        color: style.color,
        transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
      }}
    >
      {children}
    </button>
  );
}