import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/LanguageContext';

import ImageUploader from '@/components/ImageUploader';
import ScanPreview from '@/components/ScanPreview';
import ScanHistory from '@/components/ScanHistory';
import OnboardingGuide from '@/components/OnboardingGuide';
import ModelInfoButton from '@/components/ModelInfoButton';
import MissionInfoButton from '@/components/MissionInfoButton';
import ContactUsButton from '@/components/ContactUsButton';
import BottomNav from '@/components/BottomNav';
import PullToRefresh from '@/components/PullToRefresh';
import ScanDetailScreen from '@/components/ScanDetailScreen';
import { motion, AnimatePresence } from 'framer-motion';

function getTabFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  return tab === 'history' ? 'history' : 'scan';
}

function setTabInUrl(tab) {
  const url = new URL(window.location.href);
  url.searchParams.set('tab', tab);
  url.searchParams.delete('scanId');
  window.history.pushState({}, '', url.toString());
}

function getScanIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('scanId') || null;
}

function setScanIdInUrl(scanId) {
  const url = new URL(window.location.href);
  url.searchParams.set('tab', 'history');
  url.searchParams.set('scanId', scanId);
  window.history.pushState({}, '', url.toString());
}

export default function Home() {
  const { t } = useLanguage();
  const [previewImage, setPreviewImage] = useState(null);
  const [preCropImage, setPreCropImage] = useState(null);
  const [restoreCropUrl, setRestoreCropUrl] = useState(null);
  const [restoreVideoFile, setRestoreVideoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState(getTabFromUrl);
  const [selectedScanId, setSelectedScanId] = useState(getScanIdFromUrl);
  const queryClient = useQueryClient();

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('onboardingSeen');
    if (!hasSeenOnboarding) setShowOnboarding(true);
  }, []);

  // Sync state from URL on back/forward navigation
  useEffect(() => {
    const handler = () => {
      setActiveTab(getTabFromUrl());
      setSelectedScanId(getScanIdFromUrl());
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedScanId(null);
    setTabInUrl(tab);
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('onboardingSeen', 'true');
    window.dispatchEvent(new CustomEvent('showDisclaimer'));
  };

  const { data: scans = [], isLoading, refetch } = useQuery({
    queryKey: ['scans'],
    queryFn: () => base44.entities.Scan.list('-created_date', 50),
  });

  const createScanMutation = useMutation({
    mutationFn: (data) => base44.entities.Scan.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scans'] }),
  });

  const deleteScanMutation = useMutation({
    mutationFn: (scanId) => base44.entities.Scan.delete(scanId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scans'] }),
  });

  const renameScanMutation = useMutation({
    mutationFn: ({ scanId, name }) => base44.entities.Scan.update(scanId, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scans'] }),
  });

  const updateNotesMutation = useMutation({
    mutationFn: ({ scanId, notes }) => base44.entities.Scan.update(scanId, { notes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scans'] }),
  });

  const handleImageUploaded = (url, rawUrl, videoFile) => {
    setPreCropImage(rawUrl || null);
    setRestoreVideoFile(videoFile || null);
    setPreviewImage(url);
  };

  const handleBackToCropper = () => {
    setPreviewImage(null);
    if (preCropImage) {
      setRestoreCropUrl(preCropImage);
    }
  };

  const handleRestoreCropUrlConsumed = () => {
    setRestoreCropUrl(null);
    setRestoreVideoFile(null);
  };

  const handleAnalyze = async (scanName, notes) => {
    setIsAnalyzing(true);
    await createScanMutation.mutateAsync({
      name: scanName || undefined,
      image_url: previewImage,
      result: 'pending',
      notes: notes || undefined,
    });
    setIsAnalyzing(false);
    setPreviewImage(null);
  };

  const handleCancel = () => setPreviewImage(null);

  const handleScanClick = (scan) => {
    setSelectedScanId(scan.id);
    setScanIdInUrl(scan.id);
  };

  const handleBackFromDetail = () => {
    setSelectedScanId(null);
    setTabInUrl('history');
    setActiveTab('history');
  };

  const selectedScan = scans.find(s => s.id === selectedScanId) || null;

  // Show scan detail screen (full-screen overlay within the page)
  if (selectedScanId) {
    return (
      <ScanDetailScreen
        scan={selectedScan}
        scansLoading={isLoading}
        onBack={handleBackFromDetail}
        onUpdateNotes={(scanId, notes) => updateNotesMutation.mutateAsync({ scanId, notes })}
        onRenameScan={(scanId, name) => renameScanMutation.mutateAsync({ scanId, name })}
        onDeleteScan={async (scanId) => {
          await deleteScanMutation.mutateAsync(scanId);
          handleBackFromDetail();
        }}
      />
    );
  }

  const isHistory = activeTab === 'history' && !previewImage;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-orange-50 via-white to-teal-50 dark:from-[#161B2E] dark:via-[#161B2E] dark:to-[#161B2E]">
      <OnboardingGuide open={showOnboarding} onClose={handleCloseOnboarding} />

      {/* Mini header — history tab only */}
      {isHistory && (
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between" style={{ height: 56 }}>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b197ac7dc234617b635f3b/957c3239e_fixed_background_with_fade.png"
            alt="DR Monster Logo"
            className="w-9 h-9"
            style={{ imageRendering: 'auto' }}
            width={384}
            height={384}
          />
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 pb-28" style={{ paddingTop: isHistory ? 8 : 32 }}>
        {/* Full header — scan tab only */}
        {!isHistory && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex justify-center mb-3">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b197ac7dc234617b635f3b/957c3239e_fixed_background_with_fade.png"
                alt="DR Monster Logo"
                className="w-16 h-16"
                style={{ imageRendering: 'auto' }}
                width={384}
                height={384}
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              DR{' '}
              <span style={{ background: 'linear-gradient(to right, #f97316, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Monster
              </span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('appSubtitle')}</p>
          </motion.div>
        )}

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
                onCancel={handleBackToCropper}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === 'scan' && (
                <div className="bg-white/80 dark:bg-[#22263A] backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-[#2E3350]">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">{t('uploadTitle')}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('uploadSubtitle')}</p>
                  <ImageUploader
                    onImageUploaded={handleImageUploaded}
                    isUploading={isUploading}
                    setIsUploading={setIsUploading}
                    restoreCropUrl={restoreCropUrl}
                    onRestoreCropUrlConsumed={handleRestoreCropUrlConsumed}
                    restoreVideoFile={restoreVideoFile}
                  />
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{t('scanHistory')}</h2>
                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <PullToRefresh onRefresh={refetch}>
                      <ScanHistory
                        scans={scans}
                        onScanClick={handleScanClick}
                        onDeleteScan={(scanId) => deleteScanMutation.mutateAsync(scanId)}
                        onRenameScan={(scanId, name) => renameScanMutation.mutateAsync({ scanId, name })}
                      />
                    </PullToRefresh>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="text-center mt-8 space-y-3">
          <p className="text-xs text-gray-400 dark:text-gray-500">{t('footerDisclaimer')}</p>
          <div className="flex items-center justify-center gap-2">
            <ModelInfoButton />
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <MissionInfoButton />
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <ContactUsButton />
          </div>
        </div>
      </div>

      {/* Fixed Bottom Nav */}
      {!previewImage && (
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </div>
  );
}