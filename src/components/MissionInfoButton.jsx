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
              Diabetic retinopathy screening remains out of reach for millions of people worldwide. Many communities lack the specialized equipment and trained professionals required for proper eye examinations, leaving preventable vision loss undetected.
            </p>
            
            <p>
              We built this tool to address that gap. Using only a smartphone and our mount, patients and healthcare workers anywhere in the world can access affordable, portable screening without the need for costly infrastructure or specialist referrals.
            </p>
            
            <p>
              Vision loss from diabetic retinopathy is largely preventable, yet for millions, early detection remains out of reach. Our mission is to ensure that geography and resources never determine whether someone loses their sight.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}