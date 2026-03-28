import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/components/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';

export default function ModelInfoButton() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-xs hover:bg-transparent"
      >
        {t('aboutModel')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-md"
          style={isMobile ? {
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
            <DialogTitle className="text-xl">{t('aboutModel')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('trainingData')}</h4>
              <p>{t('trainingDataDesc')}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('technology')}</h4>
              <p>{t('technologyDesc')}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('privacyData')}</h4>
              <p>{t('privacyDataDesc')}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}