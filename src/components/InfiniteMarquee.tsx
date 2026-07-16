import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export const InfiniteMarquee = ({ text, className }: { text?: string, className?: string }) => {
  const content = (
    <span className="font-bebas text-xl md:text-3xl tracking-widest text-gen-lime uppercase flex items-center gap-12 pr-12">
      CYBERPUNK RUNNER 
      <span className="text-gen-lime opacity-80 mt-[-10px]">✦</span> 
      NO MERCY 
      <span className="text-gen-lime opacity-80 mt-[-10px]">✦</span> 
      ON-CHAIN CONSENSUS 
      <span className="text-gen-lime opacity-80 mt-[-10px]">✦</span>
      SURVIVE THE MAINFRAME
      <span className="text-gen-lime opacity-80 mt-[-10px]">✦</span>
    </span>
  );

  return (
    <div className="overflow-hidden whitespace-nowrap py-2 border-y-2 border-white/10 bg-[#0a0a0a] flex">
      <motion.div
        className="flex whitespace-nowrap w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 60 }}
      >
        <div className="flex items-center">
          {Array(4).fill(null).map((_, i) => <React.Fragment key={`a-${i}`}>{content}</React.Fragment>)}
        </div>
        <div className="flex items-center">
          {Array(4).fill(null).map((_, i) => <React.Fragment key={`b-${i}`}>{content}</React.Fragment>)}
        </div>
      </motion.div>
    </div>
  );
};
