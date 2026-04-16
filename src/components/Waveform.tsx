import { motion } from 'framer-motion';

interface WaveformProps {
  playing: boolean;
  bars?: number;
}

export function Waveform({ playing, bars = 32 }: WaveformProps) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-16">
      {Array.from({ length: bars }).map((_, i) => {
        const delay = (i / bars) * 0.8;
        const minH = 4;
        const maxH = 40 + Math.sin(i * 0.4) * 20;
        return (
          <motion.div
            key={i}
            className="w-[3px] rounded-full"
            style={{
              background: playing
                ? `linear-gradient(to top, #00ff41, #00ffaa)`
                : '#1a3a1a',
              boxShadow: playing ? '0 0 6px #00ff41' : 'none',
            }}
            animate={
              playing
                ? {
                    height: [minH, maxH, minH],
                    opacity: [0.6, 1, 0.6],
                  }
                : { height: minH, opacity: 0.3 }
            }
            transition={
              playing
                ? {
                    duration: 0.6 + Math.random() * 0.6,
                    delay,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
                : { duration: 0.4 }
            }
          />
        );
      })}
    </div>
  );
}
