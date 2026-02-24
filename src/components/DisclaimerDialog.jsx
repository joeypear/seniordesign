import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Lightbulb, Stethoscope, Database } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function DisclaimerDialog({ open, onOpenChange }) {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            {t('importantInfo')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="flex gap-3">
            <Stethoscope className="w-5 h-5 text-teal-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-1">{t('screeningToolOnly')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('screeningToolDesc')}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-1">{t('flashSafety')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('flashSafetyDesc')}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Database className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-1">{t('dataStorage')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('dataStorageDesc')}</p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
          >
            {t('iUnderstand')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}