import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/components/LanguageContext';

export default function ModelInfoButton() {
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
        {t('aboutModel')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
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