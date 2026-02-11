import React, { useEffect, useState } from 'react';
import { Moon, Sun, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import AccountSettings from '@/components/AccountSettings';

export default function Layout({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="fixed top-4 right-4 z-50 flex gap-2">
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
      </div>
      {children}
    </div>
  );
}