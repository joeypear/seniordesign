import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Eye, History } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageUploader from '@/components/ImageUploader';
import ScanPreview from '@/components/ScanPreview';
import ScanHistory from '@/components/ScanHistory';
import ScanDetailModal from '@/components/ScanDetailModal';
import OnboardingGuide from '@/components/OnboardingGuide';
import ModelInfoButton from '@/components/ModelInfoButton';
import MissionInfoButton from '@/components/MissionInfoButton';
import ContactUsButton from '@/components/ContactUsButton';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const { t } = useLanguage();
  const [previewImage, setPreviewImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedScan, setSelectedScan] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('onboardingSeen');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('onboardingSeen', 'true');
    // Trigger disclaimer to show after onboarding completes
    window.dispatchEvent(new CustomEvent('showDisclaimer'));
  };

  const { data: scans = [], isLoading } = useQuery({
    queryKey: ['scans'],
    queryFn: () => base44.entities.Scan.list('-created_date', 50)
  });

  const createScanMutation = useMutation({
    mutationFn: (data) => base44.entities.Scan.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
    }
  });

  const deleteScanMutation = useMutation({
    mutationFn: (scanId) => base44.entities.Scan.delete(scanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
    }
  });

  const renameScanMutation = useMutation({
    mutationFn: ({ scanId, name }) => base44.entities.Scan.update(scanId, { name }),
    onSuccess: (_, { scanId, name }) => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
      setSelectedScan(prev => prev?.id === scanId ? { ...prev, name } : prev);
    }
  });

  const updateNotesMutation = useMutation({
    mutationFn: ({ scanId, notes }) => base44.entities.Scan.update(scanId, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
    }
  });

  const handleImageUploaded = (url) => {
    setPreviewImage(url);
  };

  const handleAnalyze = async (scanName) => {
    setIsAnalyzing(true);
    
    // Create scan with pending status (AI integration will update this later)
    await createScanMutation.mutateAsync({
      name: scanName || undefined,
      image_url: previewImage,
      result: 'pending'
    });

    setIsAnalyzing(false);
    setPreviewImage(null);
  };

  const handleCancel = () => {
    setPreviewImage(null);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-orange-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <OnboardingGuide open={showOnboarding} onClose={handleCloseOnboarding} />
      <ScanDetailModal 
        scan={selectedScan} 
        open={!!selectedScan} 
        onOpenChange={(open) => !open && setSelectedScan(null)}
        onUpdateNotes={(scanId, notes) => updateNotesMutation.mutateAsync({ scanId, notes })}
        onRenameScan={(scanId, name) => renameScanMutation.mutateAsync({ scanId, name })}
        onDeleteScan={(scanId) => deleteScanMutation.mutateAsync(scanId)}
      />
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-3">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699f3a159c6c9f68128f785e/b55df7ef4_slightly_transformed.png" alt="DR Monster Logo" className="w-20 h-20" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            DR <span style={{ background: 'linear-gradient(to right, #f97316, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Monster</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('appSubtitle')}</p>
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {previewImage ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <ScanPreview
                imageUrl={previewImage}
                onCancel={handleCancel}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
              />
            </motion.div>
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Tabs defaultValue="scan" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl p-1 shadow-sm">
                  <TabsTrigger 
                    value="scan" 
                    className="rounded-lg data-[state=active]:text-white data-[state=active]:shadow-md transition-all [&[data-state=active]]:bg-[image:linear-gradient(to_right,#fb923c,#f43f5e)]"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {t('newScan')}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history"
                    className="rounded-lg data-[state=active]:text-white data-[state=active]:shadow-md transition-all [&[data-state=active]]:bg-[image:linear-gradient(to_right,#4fd1c5,#48bb78)]"
                  >
                    <History className="w-4 h-4 mr-2" />
                    {t('history')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="scan" className="mt-0">
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">{t('uploadTitle')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('uploadSubtitle')}</p>
                    <ImageUploader
                      onImageUploaded={handleImageUploaded}
                      isUploading={isUploading}
                      setIsUploading={setIsUploading}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('scanHistory')}</h2>
                    {isLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-3 border-teal-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <ScanHistory 
                        scans={scans}
                        onScanClick={(scan) => setSelectedScan(scan)}
                        onDeleteScan={(scanId) => deleteScanMutation.mutateAsync(scanId)}
                        onRenameScan={(scanId, name) => renameScanMutation.mutateAsync({ scanId, name })}
                      />
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="text-center mt-8 space-y-3">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t('footerDisclaimer')}
          </p>
          <div className="flex items-center justify-center gap-2">
            <ModelInfoButton />
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <MissionInfoButton />
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <ContactUsButton />
          </div>
        </div>
      </div>
    </div>
  );
}