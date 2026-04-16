import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Hash, ArrowRight, Zap } from 'lucide-react';
import { getSocket } from '../lib/socket';

interface HomeProps {
  onRoomJoined: (roomId: string, isHost: boolean, username: string, userId: string) => void;
}

const adjectives = ['NEON', 'GHOST', 'CYBER', 'VOID', 'DARK', 'FLUX', 'ECHO', 'ROGUE'];
const nouns = ['WOLF', 'SYNC', 'NODE', 'WAVE', 'GRID', 'PULSE', 'CORE', 'BYTE'];

function randomUsername(): string {
  const a = adjectives[Math.floor(Math.random() * adjectives.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  return `${a}_${n}`;
}

export function Home({ onRoomJoined }: HomeProps) {
  const [mode, setMode] = useState<'none' | 'create' | 'join'>('none');
  const [username, setUsername] = useState(randomUsername);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const socket = getSocket();

  const handleCreate = () => {
    if (!username.trim()) return;
    setLoading(true);
    setError('');
    socket.emit('create-room', { username: username.trim() }, (res: { success: boolean; roomId: string; isHost: boolean }) => {
      setLoading(false);
      if (res.success) {
        onRoomJoined(res.roomId, res.isHost, username.trim(), socket.id ?? '');
      } else {
        setError('FAILED TO CREATE ROOM');
      }
    });
  };

  const handleJoin = () => {
    if (!username.trim() || !roomCode.trim()) return;
    setLoading(true);
    setError('');
    socket.emit('join-room', { roomId: roomCode.trim().toUpperCase(), username: username.trim() }, (res: { success: boolean; error?: string }) => {
      setLoading(false);
      if (res.success) {
        onRoomJoined(roomCode.trim().toUpperCase(), false, username.trim(), socket.id ?? '');
      } else {
        setError(res.error?.toUpperCase() ?? 'FAILED TO JOIN ROOM');
      }
    });
  };

  const urlParams = new URLSearchParams(window.location.search);
  const roomFromUrl = urlParams.get('room');

  if (roomFromUrl && mode === 'none') {
    setRoomCode(roomFromUrl);
    setMode('join');
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px"
            style={{
              left: `${(i / 20) * 100}%`,
              top: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, transparent, #00ff4108, transparent)',
            }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{
              duration: 3 + Math.random() * 4,
              delay: Math.random() * 5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <motion.div
          className="flex items-center justify-center gap-3 mb-4"
          animate={{ filter: ['drop-shadow(0 0 8px #00ff41)', 'drop-shadow(0 0 20px #00ff41)', 'drop-shadow(0 0 8px #00ff41)'] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Radio size={36} className="text-[#00ff41]" />
          <h1 className="text-5xl font-mono font-bold text-[#00ff41] tracking-widest">
            SYNC<span className="text-white">WAVE</span>
          </h1>
        </motion.div>
        <motion.p
          className="text-xs font-mono text-[#004400] tracking-[0.4em]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          REAL-TIME SYNCHRONIZED MUSIC STREAMING
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="space-y-2">
          <label className="text-[10px] font-mono text-[#004400] tracking-widest">CALLSIGN</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value.toUpperCase())}
            placeholder="YOUR_ALIAS"
            maxLength={20}
            className="w-full bg-black border border-[#003300] text-[#00ff41] font-mono text-sm px-4 py-3 rounded focus:outline-none focus:border-[#00ff41] focus:shadow-[0_0_10px_#00ff4140] placeholder-[#002200] transition-all uppercase tracking-widest"
            style={{ caretColor: '#00ff41' }}
          />
        </div>

        <AnimatePresence mode="wait">
          {mode === 'none' && (
            <motion.div
              key="buttons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-4"
            >
              <motion.button
                onClick={() => setMode('create')}
                whileHover={{ scale: 1.03, boxShadow: '0 0 20px #00ff4160' }}
                whileTap={{ scale: 0.97 }}
                className="py-4 border border-[#00ff41] text-[#00ff41] font-mono text-sm rounded bg-black hover:bg-[#00ff4108] transition-colors flex flex-col items-center gap-2"
              >
                <Zap size={20} />
                CREATE ROOM
              </motion.button>
              <motion.button
                onClick={() => setMode('join')}
                whileHover={{ scale: 1.03, boxShadow: '0 0 20px #00aa4460' }}
                whileTap={{ scale: 0.97 }}
                className="py-4 border border-[#005500] text-[#00aa44] font-mono text-sm rounded bg-black hover:bg-[#00aa4408] transition-colors flex flex-col items-center gap-2"
              >
                <Hash size={20} />
                JOIN ROOM
              </motion.button>
            </motion.div>
          )}

          {mode === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <motion.button
                onClick={handleCreate}
                disabled={loading || !username.trim()}
                whileHover={!loading ? { scale: 1.02, boxShadow: '0 0 30px #00ff4180' } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className="w-full py-4 border border-[#00ff41] text-[#00ff41] font-mono text-sm rounded bg-black flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                style={{ boxShadow: '0 0 15px #00ff4140' }}
              >
                {loading ? (
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    INITIALIZING...
                  </motion.span>
                ) : (
                  <>INITIALIZE ROOM <ArrowRight size={16} /></>
                )}
              </motion.button>
              <button
                onClick={() => { setMode('none'); setError(''); }}
                className="w-full text-xs font-mono text-[#003300] hover:text-[#006600] transition-colors"
              >
                [ BACK ]
              </button>
            </motion.div>
          )}

          {mode === 'join' && (
            <motion.div
              key="join"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-[#004400] tracking-widest">ROOM CODE</label>
                <input
                  value={roomCode}
                  onChange={e => { setRoomCode(e.target.value.toUpperCase()); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="XXXXXX"
                  maxLength={6}
                  className="w-full bg-black border border-[#003300] text-[#00ff41] font-mono text-2xl px-4 py-3 rounded focus:outline-none focus:border-[#00ff41] focus:shadow-[0_0_10px_#00ff4140] placeholder-[#002200] transition-all uppercase tracking-[0.5em] text-center"
                  style={{ caretColor: '#00ff41' }}
                />
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs font-mono text-[#ff0044] text-center"
                >
                  ERROR :: {error}
                </motion.p>
              )}
              <motion.button
                onClick={handleJoin}
                disabled={loading || !username.trim() || !roomCode.trim()}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className="w-full py-4 border border-[#005500] text-[#00aa44] font-mono text-sm rounded bg-black flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#00ff41] hover:text-[#00ff41] transition-all"
              >
                {loading ? (
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }}>
                    CONNECTING...
                  </motion.span>
                ) : (
                  <>CONNECT TO ROOM <ArrowRight size={16} /></>
                )}
              </motion.button>
              <button
                onClick={() => { setMode('none'); setError(''); setRoomCode(''); }}
                className="w-full text-xs font-mono text-[#003300] hover:text-[#006600] transition-colors"
              >
                [ BACK ]
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-[10px] font-mono text-[#002200] tracking-widest text-center"
      >
        NO ACCOUNT REQUIRED · REAL-TIME SYNC · LOW LATENCY
      </motion.div>
    </div>
  );
}
