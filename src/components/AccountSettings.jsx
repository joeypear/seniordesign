import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LogOut, Trash2, Pencil, Check, X, Globe, ImageDown, Moon, Sun, Monitor } from 'lucide-react';
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

const styles = `
  /* Dialog scrollbar */
  .as-dialog-scroll {
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
    transition: scrollbar-color 300ms ease;
  }
  .as-dialog-scroll:hover,
  .as-dialog-scroll:focus-within {
    scrollbar-color: #d1d5db transparent;
  }
  .dark .as-dialog-scroll:hover,
  .dark .as-dialog-scroll:focus-within {
    scrollbar-color: #2C3150 #1A1D2E;
  }
  .as-dialog-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .as-dialog-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .as-dialog-scroll::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 9999px;
    transition: background 300ms ease;
  }
  .as-dialog-scroll:hover::-webkit-scrollbar-thumb,
  .as-dialog-scroll:focus-within::-webkit-scrollbar-thumb {
    background: #d1d5db;
  }
  .dark .as-dialog-scroll:hover::-webkit-scrollbar-thumb,
  .dark .as-dialog-scroll:focus-within::-webkit-scrollbar-thumb {
    background: #2C3150;
  }
  .dark .as-dialog-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .as-root {
    --as-bg: #F0F2FA;
    --as-card: #FFFFFF;
    --as-card-hover: #EEF0FB;
    --as-border: #DDE0F0;
    --as-text-primary: #0F1117;
    --as-text-secondary: #6B7080;
    --as-text-label: #9499AA;
    --as-accent: #7C5CFC;
    --as-seg-bg: #E2E5F5;
    --as-seg-selected: #FFFFFF;
    --as-seg-selected-shadow: 0 1px 4px rgba(0,0,0,0.12);
    --as-avatar-gradient: linear-gradient(135deg, #a78bfa, #ec4899);
    --as-transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
  }
  .as-root[data-theme="dark"] {
    --as-bg: #1A1D2E;
    --as-card: #22263A;
    --as-card-hover: #2C3150;
    --as-border: #2E3350;
    --as-text-primary: #FFFFFF;
    --as-text-secondary: #8B8FA8;
    --as-text-label: #8B8FA8;
    --as-accent: #7C5CFC;
    --as-seg-bg: #2C3150;
    --as-seg-selected: #3D4470;
    --as-seg-selected-shadow: 0 1px 6px rgba(0,0,0,0.4);
  }
  .as-root * { transition: var(--as-transition); box-sizing: border-box; }
  .as-root { background: transparent; border-radius: 0; padding: 0; overflow: visible; }
  
  .as-body { padding: 2px 0; display: flex; flex-direction: column; gap: 14px; width: 100%; }

  /* Profile Card */
  .as-profile-card {
    background: var(--as-card);
    border: 1px solid var(--as-border);
    border-radius: 14px;
    padding: 14px 16px;
    position: relative;
    overflow: hidden;
    width: 100%;
  }
  .as-profile-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(124,92,252,0.06) 0%, rgba(236,72,153,0.04) 100%);
    pointer-events: none;
  }
  .as-avatar-wrap {
    position: relative;
    width: 64px;
    height: 64px;
    flex-shrink: 0;
  }
  .as-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--as-avatar-gradient);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    overflow: hidden;
    transition: var(--as-transition);
    cursor: pointer;
  }
  .as-avatar-wrap {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 3px solid transparent;
    transition: border-color 150ms ease;
    cursor: pointer;
    flex-shrink: 0;
  }
  .as-avatar-wrap:hover { border-color: var(--as-accent); }
  .as-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .as-profile-row { display: flex; align-items: flex-start; gap: 16px; }
  .as-profile-info { flex: 1; min-width: 0; }
  .as-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .as-name {
    font-size: 17px;
    font-weight: 600;
    color: var(--as-text-primary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .as-role-badge {
    font-size: 11px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 20px;
    background: rgba(124,92,252,0.12);
    color: var(--as-accent);
    text-transform: capitalize;
    border: 1px solid rgba(124,92,252,0.2);
  }
  .as-email {
    font-size: 13px;
    color: var(--as-text-secondary);
    margin-top: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .as-joined-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 6px;
    font-size: 11px;
    color: var(--as-text-secondary);
    background: var(--as-bg);
    border: 1px solid var(--as-border);
    border-radius: 20px;
    padding: 3px 10px;
  }
  .as-edit-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--as-text-label);
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 150ms ease, background 150ms ease;
    flex-shrink: 0;
  }
  .as-edit-btn:hover { color: var(--as-accent); background: rgba(124,92,252,0.08); }
  .as-name-input {
    font-size: 14px;
    height: 34px;
    background: var(--as-bg);
    border: 1px solid var(--as-border);
    color: var(--as-text-primary);
    border-radius: 8px;
    padding: 0 10px;
    outline: none;
    flex: 1;
    transition: border-color 150ms ease;
  }
  .as-name-input:focus { border-color: var(--as-accent); }
  .as-icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 5px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    transition: background 150ms ease, color 150ms ease;
  }
  .as-icon-btn.confirm { color: #22c55e; }
  .as-icon-btn.confirm:hover { background: rgba(34,197,94,0.1); }
  .as-icon-btn.cancel { color: var(--as-text-secondary); }
  .as-icon-btn.cancel:hover { background: var(--as-card-hover); }

  /* Section header */
  .as-section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--as-text-label);
    margin-bottom: 6px;
    padding-left: 2px;
  }

  /* Setting cards */
  .as-setting-card {
    background: var(--as-card);
    border: 1px solid var(--as-border);
    border-radius: 12px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-left: 3px solid var(--as-accent);
    transition: background 150ms ease, var(--as-transition);
    width: 100%;
  }
  .as-setting-card:hover { background: var(--as-card-hover); }
  .as-setting-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--as-text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 2px;
  }
  .as-setting-label svg { color: var(--as-accent); }
  .as-setting-helper {
    font-size: 11px;
    font-weight: 300;
    color: var(--as-text-secondary);
  }
  .as-setting-left { flex: 1; min-width: 0; }
  .as-setting-right { flex-shrink: 0; }

  /* Segmented control */
  .as-seg {
    display: flex;
    background: var(--as-seg-bg);
    border-radius: 8px;
    padding: 3px;
    gap: 2px;
  }
  .as-seg-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    background: transparent;
    color: var(--as-text-secondary);
    transition: background 150ms ease, color 150ms ease, box-shadow 150ms ease;
    white-space: nowrap;
  }
  .as-seg-btn.active {
    background: var(--as-seg-selected);
    color: var(--as-text-primary);
    box-shadow: var(--as-seg-selected-shadow);
  }

  /* Select overrides */
  .as-select-trigger {
    background: var(--as-bg) !important;
    border-color: var(--as-border) !important;
    color: var(--as-text-primary) !important;
    font-size: 13px !important;
    height: 36px !important;
    border-radius: 8px !important;
    min-width: 120px;
    max-width: 160px;
  }

  /* Danger zone */
  .as-danger-section { display: flex; flex-direction: column; gap: 7px; }
  .as-action-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 14px;
    border-radius: 10px;
    border: 1px solid var(--as-border);
    background: var(--as-card);
    color: var(--as-text-primary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
    text-align: left;
    box-sizing: border-box;
  }
  .as-action-btn:hover { background: var(--as-card-hover); }
  .as-action-btn.danger {
    color: #ef4444;
    border-color: rgba(239,68,68,0.25);
  }
  .as-action-btn.danger:hover { background: rgba(239,68,68,0.06); border-color: rgba(239,68,68,0.4); }

  .as-spinner {
    width: 32px; height: 32px;
    border: 3px solid rgba(124,92,252,0.2);
    border-top-color: var(--as-accent);
    border-radius: 50%;
    animation: as-spin 0.7s linear infinite;
  }
  @keyframes as-spin { to { transform: rotate(360deg); } }
`;

function applyThemeToDOM(value) {
  localStorage.setItem('theme', value);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = value === 'dark' || (value === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', isDark);
  // Also set data-theme on root for CSS custom props
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
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

  // Determine current effective theme for the panel
  const [effectiveDark, setEffectiveDark] = useState(() => {
    const saved = localStorage.getItem('theme') || 'system';
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (theme === 'system') {
        setEffectiveDark(e.matches);
        applyThemeToDOM('system');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const handleTheme = (value) => {
    setTheme(value);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = value === 'dark' || (value === 'system' && prefersDark);
    setEffectiveDark(isDark);
    applyThemeToDOM(value);
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
    : '';

  const avatarLetter = (user?.username || user?.full_name)?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  const themeOptions = [
    { value: 'system', icon: <Monitor size={13} />, label: 'System' },
    { value: 'light', icon: <Sun size={13} />, label: 'Light' },
    { value: 'dark', icon: <Moon size={13} />, label: 'Dark' },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="as-root" data-theme={effectiveDark ? 'dark' : 'light'}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="as-spinner" />
          </div>
        ) : (
          <div className="as-body">

            {/* — PROFILE — */}
            <div>
              <div className="as-section-label">Profile</div>
              <div className="as-profile-card">
                <div className="as-profile-row">
                  <div className="as-avatar-wrap">
                    <div className="as-avatar">
                      {user?.profile_picture || user?.avatar_url
                        ? <img src={user.profile_picture || user.avatar_url} alt="avatar" onError={(e) => e.target.style.display='none'} />
                        : avatarLetter}
                    </div>
                  </div>
                  <div className="as-profile-info">
                    {isEditingName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          className="as-name-input"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="Enter your name"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveName();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <button className="as-icon-btn confirm" onClick={handleSaveName} disabled={isSavingName || !newName.trim()}>
                          <Check size={15} />
                        </button>
                        <button className="as-icon-btn cancel" onClick={handleCancelEdit}>
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <div className="as-name-row">
                        <span className="as-name">{user?.username || user?.full_name || 'User'}</span>
                        <span className="as-role-badge">{user?.role || 'user'}</span>
                        <button className="as-edit-btn" onClick={handleEditName} title="Edit name">
                          <Pencil size={13} />
                        </button>
                      </div>
                    )}
                    <div className="as-email">{user?.email}</div>
                    {joinedDate && (
                      <div className="as-joined-pill">
                        <span>📅</span>
                        <span>{t('joined')} {joinedDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* — PREFERENCES — */}
            <div>
              <div className="as-section-label">Preferences</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>

                {/* Appearance */}
                <div className="as-setting-card">
                  <div className="as-setting-left">
                    <div className="as-setting-label">
                      <Moon size={14} />
                      Appearance
                    </div>
                    <div className="as-setting-helper">Controls light or dark theme</div>
                  </div>
                  <div className="as-setting-right">
                    <div className="as-seg">
                      {themeOptions.map(({ value, icon, label }) => (
                        <button
                          key={value}
                          className={`as-seg-btn${theme === value ? ' active' : ''}`}
                          onClick={() => handleTheme(value)}
                        >
                          {icon}
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Download Format */}
                <div className="as-setting-card">
                  <div className="as-setting-left">
                    <div className="as-setting-label">
                      <ImageDown size={14} />
                      Download Format
                    </div>
                    <div className="as-setting-helper">Format used when saving images</div>
                  </div>
                  <div className="as-setting-right">
                    <Select
                      value={downloadFormat}
                      onValueChange={(val) => { setDownloadFormat(val); localStorage.setItem('downloadFormat', val); }}
                    >
                      <SelectTrigger className="as-select-trigger" style={{ minWidth: '130px' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jpg">JPEG (.jpg)</SelectItem>
                        <SelectItem value="png">PNG (.png)</SelectItem>
                        <SelectItem value="webp">WebP (.webp)</SelectItem>
                        <SelectItem value="heic">HEIC (.heic)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Language */}
                <div className="as-setting-card">
                  <div className="as-setting-left">
                    <div className="as-setting-label">
                      <Globe size={14} />
                      {t('language')}
                    </div>
                    <div className="as-setting-helper">Interface display language</div>
                  </div>
                  <div className="as-setting-right">
                    <Select value={lang} onValueChange={changeLang}>
                      <SelectTrigger className="as-select-trigger" style={{ minWidth: '130px' }}>
                        <SelectValue placeholder={t('selectLanguage')} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(languages).map(([code, { label, flag }]) => (
                          <SelectItem key={code} value={code}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <img src={flag} alt={label} style={{ width: '18px', height: '13px', objectFit: 'cover', borderRadius: '2px' }} />
                              {label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* — DANGER ZONE — */}
            <div>
              <div className="as-section-label">Danger Zone</div>
              <div className="as-danger-section">
                <button className="as-action-btn" onClick={() => base44.auth.logout()}>
                  <LogOut size={16} />
                  {t('logOut')}
                </button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="as-action-btn danger">
                      <Trash2 size={16} />
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
        )}
      </div>
    </>
  );
}