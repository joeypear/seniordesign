import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ModelInfoButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-xs"
      >
        About Our Model
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">About Our Model</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Training Data</h4>
              <p>
                Our model was trained using 6,000 publicly available retinal images, comprising both healthy retinas and retinas with diabetic retinopathy. This diverse dataset ensures robust detection capabilities across various stages and presentations of the condition.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Technology</h4>
              <p>
                Built with PyTorch, our convolutional neural network (CNN) architecture was specifically designed for medical image analysis. After extensive training and validation, the model achieved an accuracy of 92% in detecting diabetic retinopathy.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Privacy & Data Usage</h4>
              <p>
                Your uploaded images are stored securely and anonymously for screening purposes only. <strong>We do not use your images to further train or improve the model.</strong> Your privacy and data security are our top priorities.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}