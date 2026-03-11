import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/components/LanguageContext';

export default function ScanPreview({ imageUrl, onCancel, onAnalyze, onRecrop, isAnalyzing }) {
  const { t } = useLanguage();
  const [scanName, setScanName] = useState('');
  const [notes, setNotes] = useState('');

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col overflow-hidden"
        style={{ height: '100dvh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="font-semibold text-foreground">{t('uploadTitle')}</span>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Image */}
        <div className="flex-1 relative overflow-hidden">
          <img
            src={imageUrl}
            alt="Retina scan"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 px-6 py-5 border-t border-border">
          <Input
            placeholder={t('nameScanPlaceholder')}
            value={scanName}
            onChange={(e) => setScanName(e.target.value)}
            className="bg-white dark:bg-gray-800"
          />
          <Textarea
            placeholder={t('addNotes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-white dark:bg-gray-800 resize-none"
            rows={3}
          />
          <Button
            onClick={() => onAnalyze(scanName, notes)}
            disabled={isAnalyzing}
            className="w-full h-14 text-lg font-semibold rounded-xl text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/50 transition-all hover:scale-[1.01]"
            style={{ background: 'linear-gradient(to right, #8b5cf6, #9333ea)' }}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t('analyzing')}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {t('analyzeButton')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}