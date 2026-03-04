import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 72; // px to pull before triggering

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);
  const isTriggered = pullDistance >= THRESHOLD;

  const handleTouchStart = useCallback((e) => {
    const el = containerRef.current;
    if (el && el.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startY.current === null || isRefreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      e.preventDefault();
      setPullDistance(Math.min(delta * 0.5, THRESHOLD * 1.4));
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD * 0.6);
      await onRefresh?.();
      setIsRefreshing(false);
    }
    setPullDistance(0);
    startY.current = null;
  }, [pullDistance, isRefreshing, onRefresh]);

  return (
    <div className="relative overflow-hidden">
      {/* Pull indicator */}
      <AnimatePresence>
        {(pullDistance > 8 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 flex justify-center z-10 pointer-events-none"
            style={{ height: isRefreshing ? 48 : pullDistance }}
          >
            <div className="flex items-center justify-center h-full">
              <motion.div
                animate={isRefreshing ? { rotate: 360 } : { rotate: (pullDistance / THRESHOLD) * 270 }}
                transition={isRefreshing ? { repeat: Infinity, duration: 0.7, ease: 'linear' } : { duration: 0 }}
                className={`transition-colors duration-200 ${isTriggered || isRefreshing ? 'text-teal-500' : 'text-gray-400'}`}
              >
                <RefreshCw className="w-5 h-5" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable content */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${isRefreshing ? 48 : pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}