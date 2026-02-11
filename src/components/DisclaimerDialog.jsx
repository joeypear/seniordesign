import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Lightbulb, Stethoscope } from 'lucide-react';

export default function DisclaimerDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Important Information
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="flex gap-3">
            <Stethoscope className="w-5 h-5 text-teal-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-1">Screening Tool Only</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This tool is designed to detect potential abnormalities and help determine if a patient should seek further medical evaluation. It does <strong>not</strong> provide a medical diagnosis.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-1">Flash Safety</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Avoid prolonged flashlight exposure when capturing retina images, as extended bright light can cause discomfort or potential damage to the eye.
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
          >
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}