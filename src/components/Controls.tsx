import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';

interface ControlsProps {
  isHost: boolean;
  playing: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  muted: boolean;
  onToggleMute: () => void;
}

function CyberButton({
  onClick,
  children,
  large,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  large?: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.1 } : {}}
      whileTap={!disabled ? { scale: 0.9 } : {}}
      className={`flex items-center justify-center rounded-full border transition-all duration-200 ${
        large
          ? 'w-14 h-14 border-[#00ff41] text-[#00ff41]'
          : 'w-10 h-10 border-[#005500] text-[#007700]'
      } ${
        disabled
          ? 'opacity-30 cursor-not-allowed'
          : 'cursor-pointer hover:border-[#00ff41] hover:text-[#00ff41]'
      } bg-black`}
      style={
        !disabled && large
          ? { boxShadow: '0 0 15px #00ff4180, inset 0 0 15px #00ff4110' }
          : {}
      }
    >
      {children}
    </motion.button>
  );
}

export function Controls({
  isHost,
  playing,
  onPlay,
  onPause,
  onSkipBack,
  onSkipForward,
  volume,
  onVolumeChange,
  muted,
  onToggleMute,
}: ControlsProps) {
  const [showVolume, setShowVolume] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <CyberButton onClick={onSkipBack} disabled={!isHost}>
          <SkipBack size={18} />
        </CyberButton>

        <CyberButton
          onClick={playing ? onPause : onPlay}
          large
          disabled={!isHost}
        >
          {playing ? <Pause size={24} /> : <Play size={24} />}
        </CyberButton>

        <CyberButton onClick={onSkipForward} disabled={!isHost}>
          <SkipForward size={18} />
        </CyberButton>
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => { onToggleMute(); setShowVolume(v => !v); }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="text-[#00ff41] opacity-70 hover:opacity-100 transition-opacity"
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </motion.button>

        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: showVolume ? 100 : 0, opacity: showVolume ? 1 : 0 }}
          className="overflow-hidden"
        >
          <input
            type="range"
            min={0}
            max={100}
            value={muted ? 0 : volume}
            onChange={e => onVolumeChange(Number(e.target.value))}
            className="cyber-slider w-24"
          />
        </motion.div>
      </div>

      {!isHost && (
        <p className="text-xs font-mono text-[#004400] tracking-widest">
          [ LISTENER MODE — HOST CONTROLS PLAYBACK ]
        </p>
      )}
    </div>
  );
}
