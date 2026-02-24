import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/LanguageContext';

export default function ScanPreview({ imageUrl, onCancel, onAnalyze, isAnalyzing }) {
  const { t } = useLanguage();
  const [scanName, setScanName] = useState('');

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden shadow-xl">
        <img
          src={imageUrl}
          alt="Retina scan"
          className="w-full aspect-square object-cover"
        />
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <Input
        placeholder={t('nameScanPlaceholder')}
        value={scanName}
        onChange={(e) => setScanName(e.target.value)}
        className="bg-white dark:bg-gray-800"
      />

      <Button
        onClick={() => onAnalyze(scanName)}
        disabled={isAnalyzing}
        className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-purple-200 dark:shadow-purple-900/50 transition-all hover:scale-[1.01]"
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
  );
}