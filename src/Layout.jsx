import React, { useEffect, useState, useCallback } from 'react';
import { User, Info, ChevronLeft } from 'lucide-react';
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

        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-lg w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto as-dialog-scroll as-settings-dialog">
            {/* Desktop header (hidden on mobile) */}
            <DialogHeader className="as-settings-desktop-header">
              <DialogTitle>{t('accountSettings')}</DialogTitle>
            </DialogHeader>
            {/* Mobile sticky header (hidden on desktop) */}
            <div className="as-settings-mobile-header">
              <button
                className="as-settings-back-btn"
                onClick={() => setShowSettings(false)}
                aria-label="Back"
              >
                <ChevronLeft size={22} />
              </button>
              <span className="as-settings-mobile-title">{t('accountSettings')}</span>
              <span style={{ width: 36 }} />
            </div>
            <div className="mt-1">
              <AccountSettings />
            </div>
          </DialogContent>
        </Dialog>
        <style>{`
          @media (max-width: 480px) {
            /* Full-screen modal */
            .as-settings-dialog {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              width: 100vw !important;
              max-width: 100vw !important;
              height: 100dvh !important;
              max-height: 100dvh !important;
              margin: 0 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              border: none !important;
              overflow-y: auto !important;
              overflow-x: hidden !important;
              translate: none !important;
              transform: none !important;
              padding: 0 !important;
            }
            /* Kill the transform that Radix applies */
            .as-settings-dialog[data-state="open"],
            .as-settings-dialog[data-state="closed"] {
              left: 0 !important;
              top: 0 !important;
              transform: none !important;
              translate: none !important;
            }
            /* Remove overlay dimming */
            [data-radix-dialog-overlay] {
              background: transparent !important;
              backdrop-filter: none !important;
            }
            /* Hide the default × close button */
            .as-settings-dialog > button[data-radix-dialog-close],
            .as-settings-dialog > .absolute.right-4 {
              display: none !important;
            }
            /* Hide desktop DialogHeader */
            .as-settings-desktop-header { display: none !important; }
            /* Show mobile header */
            .as-settings-mobile-header { display: flex !important; }
            /* Remove default DialogContent padding on mobile (AccountSettings handles its own) */
            .as-settings-dialog > div:last-child {
              padding: 0;
            }
          }
          @media (min-width: 481px) {
            .as-settings-mobile-header { display: none !important; }
          }
          /* Sticky mobile header bar */
          .as-settings-mobile-header {
            position: sticky;
            top: 0;
            z-index: 10;
            display: none;
            align-items: center;
            justify-content: space-between;
            height: 56px;
            padding: 0 20px;
            background: hsl(var(--popover));
            border-bottom: 1.5px solid hsl(var(--border) / 0.8);
          }
          .as-settings-back-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            background: none;
            border: none;
            cursor: pointer;
            color: hsl(var(--foreground));
            padding: 4px;
            border-radius: 8px;
            width: 36px;
            height: 36px;
          }
          .as-settings-back-btn:hover {
            background: hsl(var(--accent));
          }
          .as-settings-mobile-title {
            font-size: 16px;
            font-weight: 600;
            color: hsl(var(--foreground));
          }
        `}</style>
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