import { motion } from 'framer-motion';

export function ScanlineOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,255,65,0.08) 1px, rgba(0,255,65,0.08) 2px)',
        }}
      />
      <motion.div
        className="absolute left-0 right-0 h-[2px] opacity-[0.06]"
        style={{ background: 'linear-gradient(to right, transparent, #00ff41, transparent)' }}
        animate={{ top: ['-2px', '100vh'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  );
}
