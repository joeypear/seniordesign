import React from 'react';
import { Eye, History } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { motion } from 'framer-motion';

export default function BottomNav({ activeTab, onTabChange }) {
  const { t } = useLanguage();

  const tabs = [
    {
      key: 'scan',
      icon: Eye,
      labelKey: 'newScan',
      activeGradient: 'from-orange-400 to-rose-500',
      activeColor: 'text-orange-500 dark:text-orange-400',
    },
    {
      key: 'history',
      icon: History,
      labelKey: 'history',
      activeGradient: 'from-teal-400 to-green-400',
      activeColor: 'text-teal-500 dark:text-teal-400',
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#1A1D2E]/95 backdrop-blur-md border-t border-gray-100 dark:border-[#2E3350]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className="flex-1 flex flex-col items-center gap-1 py-3 relative transition-all duration-200"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full bg-gradient-to-r ${tab.activeGradient}`}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-all duration-200 ${
                  isActive ? tab.activeColor : 'text-gray-400 dark:text-gray-600'
                }`}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span
                className={`text-[10px] font-medium transition-all duration-200 ${
                  isActive ? tab.activeColor : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                {t(tab.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}