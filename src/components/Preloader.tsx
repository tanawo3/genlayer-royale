import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const Preloader = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 800);
          return 100;
        }
        return p + Math.floor(Math.random() * 15) + 1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ y: 0 }}
      exit={{ y: "-100%", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
      className="fixed inset-0 z-[9999] bg-[#050505] text-[#ccff00] flex flex-col justify-end p-8 md:p-16"
    >
      <div className="flex justify-between items-end w-full">
        <div className="font-bebas text-4xl md:text-8xl tracking-widest leading-none">
          GENLAYER<br/>ROYALE
        </div>
        <div className="font-mono text-6xl md:text-[12rem] font-bold leading-none">
          {Math.min(progress, 100)}%
        </div>
      </div>
    </motion.div>
  );
};
