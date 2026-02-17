import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ContactUsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-xs hover:bg-transparent"
      >
        Contact Us
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Contact Us</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              Have questions, feedback, or need support? We'd love to hear from you.
            </p>
            
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Mail className="w-5 h-5 text-orange-500" />
              <a 
                href="mailto:placeholder@gmail.com" 
                className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-500 font-medium transition-colors"
              >
                placeholder@gmail.com
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}