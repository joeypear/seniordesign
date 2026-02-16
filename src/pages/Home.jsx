import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Eye, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageUploader from '@/components/ImageUploader';
import ScanPreview from '@/components/ScanPreview';
import ScanHistory from '@/components/ScanHistory';
import ScanDetailModal from '@/components/ScanDetailModal';
import OnboardingGuide from '@/components/OnboardingGuide';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <OnboardingGuide open={showOnboarding} onClose={handleCloseOnboarding} />
      <ScanDetailModal 
        scan={selectedScan} 
        open={!!selectedScan} 
        onOpenChange={(open) => !open && setSelectedScan(null)}
        onUpdateNotes={(scanId, notes) => updateNotesMutation.mutateAsync({ scanId, notes })}
      />
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 shadow-lg shadow-orange-200 dark:shadow-orange-900/50 mb-4">
            <Eye className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            DR <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">Monster</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Diabetic Retinopathy Screening</p>
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
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    New Scan
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history"
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-400 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                  >
                    <History className="w-4 h-4 mr-2" />
                    History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="scan" className="mt-0">
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Upload Retina Image</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Use camera or upload from your device</p>
                    <ImageUploader
                      onImageUploaded={handleImageUploaded}
                      isUploading={isUploading}
                      setIsUploading={setIsUploading}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Scan History</h2>
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
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
          For screening purposes only. Consult a healthcare professional for diagnosis.
        </p>
      </div>
    </div>
  );
}