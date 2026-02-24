import React, { useEffect, useState } from 'react';
import { Moon, Sun, User, Info } from 'lucide-react';
import DisclaimerDialog from '@/components/DisclaimerDialog';
import { Button } from '@/components/ui/button';
import { LanguageProvider, useLanguage } from '@/components/LanguageContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import AccountSettings from '@/components/AccountSettings';

function LayoutInner({ children }) {
  const { isRtl } = useLanguage();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    const seen = localStorage.getItem('disclaimerSeen');
    return !seen;
  });

  const handleDisclaimerClose = (open) => {
    setShowDisclaimer(open);
    if (!open) {
      localStorage.setItem('disclaimerSeen', 'true');
    }
  };

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={darkMode ? 'dark' : ''} dir={isRtl ? 'rtl' : 'ltr'}>
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
          onClick={() => setDarkMode(!darkMode)}
          variant="outline"
          size="icon"
          className="rounded-full shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </Button>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            >
              <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Account Settings</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <AccountSettings />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {children}
    </div>
  );
}