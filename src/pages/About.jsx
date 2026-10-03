import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft } from 'lucide-react';

export default function About() {
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    base44.entities.FaqEntry.list('sort_order', 20)
      .then((rows) => setFaqs(rows || []))
      .catch(() => setFaqs([]));
  }, []);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-orange-50 via-white to-teal-50 dark:from-[#161B2E] dark:via-[#161B2E] dark:to-[#161B2E]">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to DR Monster
        </Link>

        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          About DR Monster — Free Diabetic Retinopathy Screening
        </h1>

        <div className="space-y-4 text-base leading-relaxed text-gray-600 dark:text-gray-300">
          <p>
            DR Monster is a free AI-powered screening tool that helps detect potential signs of diabetic retinopathy, one of the leading causes of preventable blindness worldwide. Using only a smartphone, patients and healthcare workers can capture an image of the retina and receive an AI analysis in seconds — no expensive equipment, no specialist referral, and no waiting list required.
          </p>
          <p>
            The app is designed for anyone living with diabetes, as well as community health workers, nurses, and clinics in underserved areas where access to ophthalmologists and fundus cameras is limited. Diabetic retinopathy often shows no symptoms until vision loss is already irreversible, which is why regular, affordable screening matters so much. DR Monster closes that gap by making screening portable, fast, and accessible anywhere in the world.
          </p>
          <p>
            Our AI model is a convolutional neural network built with PyTorch and trained on 41,000 publicly available retinal images, covering both healthy retinas and retinas at various stages of diabetic retinopathy. It achieved 92% accuracy in validation and continues to be refined with patient safety as the top priority.
          </p>
          <p>
            DR Monster is built and maintained by Joe Pearson, an independent developer passionate about global health equity and accessible medical technology. The tool is intended for screening purposes only and does not replace a diagnosis from a qualified healthcare professional — always consult an eye-care specialist about your results.
          </p>
        </div>

        {faqs.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div key={faq.id} className="bg-white/80 dark:bg-[#22263A] rounded-xl p-4 border border-gray-100 dark:border-[#2E3350]">
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{faq.question}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 text-sm">
          <Link to="/Contact" className="text-orange-500 hover:text-orange-600 font-medium">
            Contact us →
          </Link>
        </div>
      </div>
    </div>
  );
}