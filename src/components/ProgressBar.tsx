import { motion } from 'framer-motion';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  isHost: boolean;
  onSeek?: (time: number) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ProgressBar({ currentTime, duration, isHost, onSeek }: ProgressBarProps) {
  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHost || !onSeek || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    onSeek(ratio * duration);
  };

  return (
    <div className="w-full space-y-2">
      <div
        className={`relative h-2 rounded-full overflow-hidden bg-[#0a1a0a] border border-[#003300] ${isHost ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={handleClick}
        role={isHost ? 'slider' : undefined}
        aria-valuenow={currentTime}
        aria-valuemin={0}
        aria-valuemax={duration}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: 'linear-gradient(to right, #00ff41, #00ffaa)',
            boxShadow: '0 0 8px #00ff41, 0 0 20px #00ff4140',
          }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
        {isHost && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#00ff41] bg-black"
            style={{
              left: `calc(${percent}% - 6px)`,
              boxShadow: '0 0 8px #00ff41',
            }}
            animate={{ left: `calc(${percent}% - 6px)` }}
            transition={{ duration: 0.5, ease: 'linear' }}
          />
        )}
      </div>
      <div className="flex justify-between text-xs font-mono text-[#00ff41] opacity-70">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
