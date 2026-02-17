import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function MissionInfoButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-xs hover:bg-transparent"
      >
        Our Mission
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Our Mission</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              We know that current diabetic retinopathy screening techniques can be expensive and not accessible to all parts of the world. Many communities lack the specialized equipment and trained professionals needed for proper eye examinations.
            </p>
            
            <p>
              That's why we created this tool—to make screening <strong>low-cost, portable, and accessible</strong> to everyone, anywhere. All you need is a phone.
            </p>
            
            <p>
              Our goal is to democratize healthcare by bringing advanced AI-powered screening capabilities to underserved populations, helping detect diabetic retinopathy early and prevent vision loss worldwide.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}