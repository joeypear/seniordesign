import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/components/LanguageContext';

export default function ContactUsButton() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-xs hover:bg-transparent"
      >
        {t('contactUs')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-md"
          style={window.innerWidth <= 480 ? {
            position: 'fixed',
            left: '16px',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            margin: '0',
            width: 'calc(100vw - 32px)',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 80px)',
            borderRadius: '16px',
            overflowY: 'auto',
            boxSizing: 'border-box',
          } : {}}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">{t('contactUs')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <p>{t('contactDesc')}</p>
            
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Mail className="w-5 h-5 text-orange-500" />
              <a 
                href="mailto:screening.diabeticretinopathy@gmail.com" 
                className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-500 font-medium transition-colors text-sm truncate block"
              >
                Our Email
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}