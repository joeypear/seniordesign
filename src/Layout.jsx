import React, { useEffect, useState, useCallback } from 'react';
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
          <DialogContent className="max-w-lg w-[calc(100vw-2rem)] sm:w-full max-h-[90vh] overflow-y-auto as-dialog-scroll sm:rounded-lg rounded-t-2xl rounded-b-none sm:bottom-auto fixed sm:static bottom-0 left-0 right-0 mx-auto">
            <DialogHeader>
              <DialogTitle>{t('accountSettings')}</DialogTitle>
            </DialogHeader>
            <div className="mt-1">
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
      <style>{`
        /* ── Deep purple-dark token overrides ── */
        .dark {
          --background: 228 34% 14% !important;   /* #161B2E  page bg */
          --foreground: 0 0% 98% !important;
          --card: 231 27% 18% !important;          /* #22263A  card */
          --card-foreground: 0 0% 98% !important;
          --popover: 233 27% 15% !important;       /* #1A1D2E  modal/popover */
          --popover-foreground: 0 0% 98% !important;
          --secondary: 232 28% 25% !important;     /* #2C3150  hover/active */
          --secondary-foreground: 0 0% 98% !important;
          --muted: 232 28% 25% !important;
          --muted-foreground: 0 0% 63.9% !important;
          --accent: 232 28% 25% !important;
          --accent-foreground: 0 0% 98% !important;
          --border: 232 26% 22% !important;
          --input: 232 26% 22% !important;
          --sidebar-background: 233 27% 15% !important;
          --sidebar-accent: 232 28% 25% !important;
          --sidebar-border: 232 26% 22% !important;
        }

        /* Ensure the document body uses the page-bg token */
        .dark body,
        .dark #root {
          background-color: #161B2E !important;
        }

        /* shadcn dialog / sheet overlaid surfaces */
        .dark [data-radix-popper-content-wrapper],
        .dark [role="dialog"],
        .dark [cmdk-root] {
          background-color: #1A1D2E;
        }
      `}</style>
      <LayoutInner>{children}</LayoutInner>
    </LanguageProvider>
  );
}