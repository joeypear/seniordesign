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