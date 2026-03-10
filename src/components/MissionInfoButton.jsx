import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/components/LanguageContext';

export default function MissionInfoButton() {
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
        {t('ourMission')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md popup-modal">
          <DialogHeader>
            <DialogTitle className="text-xl">{t('ourMission')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <p>{t('missionP1')}</p>
            <p>{t('missionP2')}</p>
            <p>{t('missionP3')}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}