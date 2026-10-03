import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';

export default function Contact() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-orange-50 via-white to-teal-50 dark:from-[#161B2E] dark:via-[#161B2E] dark:to-[#161B2E]">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to DR Monster
        </Link>

        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Contact DR Monster
        </h1>

        <div className="space-y-4 text-base leading-relaxed text-gray-600 dark:text-gray-300">
          <p>
            Have questions, feedback, or need support with the app? We'd love to hear from you. Whether you're a patient using DR Monster to keep up with your regular retinal screening, a healthcare worker deploying it in the field, or a researcher interested in the model — your messages help us improve.
          </p>
          <p>
            The fastest way to reach the team is by email. We read every message and typically respond within a few business days.
          </p>
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <Mail className="w-5 h-5 text-orange-500 shrink-0" />
            <a
              href="mailto:screening.diabeticretinopathy@gmail.com"
              className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-500 font-medium break-all"
            >
              screening.diabeticretinopathy@gmail.com
            </a>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please remember that DR Monster is a screening tool, not a diagnostic service. If you are experiencing symptoms or are concerned about your eye health, contact a qualified healthcare professional right away.
          </p>
        </div>
      </div>
    </div>
  );
}