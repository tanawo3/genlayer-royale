import React from 'react';
import { motion, Variants } from 'motion/react';
import { cn } from '../lib/utils';

export const TextReveal = ({ text, className, delay = 0 }: { text: string, className?: string, delay?: number }) => {
  const words = text.split(" ");
  
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: delay }
    }
  };
  
  const child: Variants = {
    hidden: { y: "150%", opacity: 0 },
    visible: {
      y: "0%",
      opacity: 1,
      transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] }
    }
  };

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      whileInView="visible" 
      viewport={{ once: true, margin: "-10%" }}
      className={cn("flex flex-wrap overflow-hidden", className)}
    >
      {words.map((word, i) => (
        <span key={i} className="overflow-hidden inline-flex mr-[0.25em]">
          <motion.span variants={child}>{word}</motion.span>
        </span>
      ))}
    </motion.div>
  );
};
