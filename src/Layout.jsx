import React, { useEffect, useState } from 'react';
import { User, Info } from 'lucide-react';
import DisclaimerDialog from '@/components/DisclaimerDialog';
import { Button } from '@/components/ui/button';
import { LanguageProvider, useLanguage } from '@/components/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AccountSettings from '@/components/AccountSettings';

function applyThemeGlobally(value) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = value === 'dark' || (value === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

function LayoutInner({ children }) {
  const { isRtl, t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);

  // Apply theme on mount and listen for OS-level changes
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'system';
    applyThemeGlobally(saved);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const current = localStorage.getItem('theme') || 'system';
      if (current === 'system') applyThemeGlobally('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    const disclaimerSeen = localStorage.getItem('disclaimerSeen');
    const onboardingSeen = localStorage.getItem('onboardingSeen');
    // Auto-show disclaimer only if onboarding was already seen previously
    return !disclaimerSeen && !!onboardingSeen;
  });

  const handleDisclaimerClose = (open) => {
    setShowDisclaimer(open);
    if (!open) {
      localStorage.setItem('disclaimerSeen', 'true');
    }
  };

  useEffect(() => {
    const handler = () => setShowDisclaimer(true);
    window.addEventListener('showDisclaimer', handler);
    return () => window.removeEventListener('showDisclaimer', handler);
  }, []);

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'}>
      <DisclaimerDialog open={showDisclaimer} onOpenChange={handleDisclaimerClose} />

      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Button
          onClick={() => setShowDisclaimer(true)}
          variant="outline"
          size="icon"
          className="rounded-full shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        >
          <Info className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Button>

        <Button
          onClick={() => setShowSettings(true)}
          variant="outline"
          size="icon"
          className="rounded-full shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        >
          <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Button>

        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('accountSettings')}</DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              <AccountSettings />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {children}
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <LanguageProvider>
      <LayoutInner>{children}</LayoutInner>
    </LanguageProvider>
  );
}