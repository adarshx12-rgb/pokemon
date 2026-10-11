'use client';
import { motion } from 'framer-motion';

// The curtain is hidden with CSS under reduced motion (not a JS branch) so server and client markup match.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[90] origin-top border-b border-red bg-ink motion-reduce:hidden"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
      />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.3 }}>
        {children}
      </motion.div>
    </>
  );
}
