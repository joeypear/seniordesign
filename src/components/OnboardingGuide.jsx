import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Camera, History, Eye, ChevronRight, ChevronLeft, X } from 'lucide-react';

const steps = [
  {
    icon: Eye,
    title: 'Welcome to DR Monster',
    description: 'This tool helps screen for potential diabetic retinopathy by analyzing retina images. Let\'s walk through how to use it.',
    color: 'from-teal-500 to-emerald-500'
  },
  {
    icon: Camera,
    title: 'Capture or Upload',
    description: 'Record a video of the retina using your device camera and select a frame, or upload an existing image or video. For best results, ensure the image is clear and well-lit.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: History,
    title: 'View Your History',
    description: 'All your scans are saved in the History tab. You can filter by result, rename scans, and delete old ones anytime.',
    color: 'from-purple-500 to-pink-500'
  }
];

export default function OnboardingGuide({ open, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!open) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const step = steps[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className={`bg-gradient-to-r ${step.color} p-6 relative`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkip}
            className="absolute top-2 right-2 text-white/80 hover:text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
          
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center"
          >
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <StepIcon className="w-10 h-10 text-white" />
            </div>
          </motion.div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-2 mt-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-teal-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={`flex-1 bg-gradient-to-r ${step.color} hover:opacity-90 text-white`}
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}