import { motion } from 'framer-motion';

interface YouTubePlayerProps {
  containerId: string;
  hasVideo: boolean;
}

export function YouTubePlayer({ containerId, hasVideo }: YouTubePlayerProps) {
  return (
    <div className="relative">
      <div
        className="relative rounded-lg overflow-hidden border border-[#003300]"
        style={{
          boxShadow: hasVideo ? '0 0 20px #00ff4140, inset 0 0 20px #00000080' : 'none',
          aspectRatio: '16/9',
        }}
      >
        {!hasVideo && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center space-y-3">
              <motion.div
                className="text-4xl font-mono text-[#002200]"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {'> _ <'}
              </motion.div>
              <p className="text-xs font-mono text-[#003300] tracking-widest">
                AWAITING SIGNAL...
              </p>
            </div>
          </motion.div>
        )}
        <div id={containerId} className="w-full h-full" />
      </div>

      {hasVideo && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            background: 'linear-gradient(to bottom, transparent 80%, #00000060)',
          }}
        />
      )}

      <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.1) 2px, rgba(0,255,65,0.1) 4px)',
            backgroundSize: '100% 4px',
          }}
        />
      </div>
    </div>
  );
}
