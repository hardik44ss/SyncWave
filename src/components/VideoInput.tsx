import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Play } from 'lucide-react';

interface VideoInputProps {
  onVideoSubmit: (videoId: string) => void;
  currentVideoId: string | null;
}

function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname === 'youtu.be') return url.pathname.slice(1);
    if (url.hostname.includes('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v) return v;
      const match = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (match) return match[1];
    }
  } catch {}
  return null;
}

export function VideoInput({ onVideoSubmit, currentVideoId }: VideoInputProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractVideoId(input);
    if (!videoId) {
      setError('INVALID_INPUT :: PASTE A YOUTUBE URL OR VIDEO ID');
      return;
    }
    setError('');
    onVideoSubmit(videoId);
    setInput('');
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-mono tracking-[0.3em] text-[#004400] uppercase flex items-center gap-2">
        <Link size={12} />
        Load Track
      </h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setError(''); }}
            placeholder="youtube.com/watch?v=... or video ID"
            className="w-full bg-black border border-[#003300] text-[#00ff41] font-mono text-sm px-4 py-2.5 rounded focus:outline-none focus:border-[#00ff41] placeholder-[#002200] transition-colors"
            style={{ caretColor: '#00ff41' }}
          />
          {error && (
            <p className="absolute -bottom-5 left-0 text-[10px] font-mono text-[#ff0044]">{error}</p>
          )}
        </div>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2.5 border border-[#00ff41] text-[#00ff41] font-mono text-sm rounded bg-black flex items-center gap-2 hover:bg-[#00ff4110] transition-colors"
          style={{ boxShadow: '0 0 10px #00ff4140' }}
        >
          <Play size={14} />
          LOAD
        </motion.button>
      </form>
      {currentVideoId && (
        <p className="text-[10px] font-mono text-[#004400]">
          ACTIVE :: youtu.be/{currentVideoId}
        </p>
      )}
    </div>
  );
}
