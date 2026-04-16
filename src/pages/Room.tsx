import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, LogOut, Wifi, WifiOff } from 'lucide-react';
import { getSocket } from '../lib/socket';
import { useYouTube } from '../hooks/useYouTube';
import { useSync } from '../hooks/useSync';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { Controls } from '../components/Controls';
import { ProgressBar } from '../components/ProgressBar';
import { Waveform } from '../components/Waveform';
import { ConnectedDevices } from '../components/ConnectedDevices';
import { VideoInput } from '../components/VideoInput';
import { ScanlineOverlay } from '../components/ScanlineOverlay';
import { User } from '../types';

interface RoomProps {
  roomId: string;
  isHost: boolean;
  username: string;
  userId: string;
  onLeave: () => void;
}

const PLAYER_ID = 'yt-player';

export function Room({ roomId, isHost: initialIsHost, username, userId, onLeave }: RoomProps) {
  const [isHost, setIsHost] = useState(initialIsHost);
  const [users, setUsers] = useState<User[]>([]);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(true);
  const [copyNotice, setCopyNotice] = useState('');
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socket = getSocket();

  const handlePlayerReady = useCallback(() => {
    setVolume(80);
  }, []);

  const handleStateChange = useCallback((state: number) => {
    if (!isHost) return;
    const YTState = window.YT?.PlayerState;
    if (!YTState) return;
    if (state === YTState.PLAYING) setPlaying(true);
    else if (state === YTState.PAUSED) setPlaying(false);
  }, [isHost]);

  const { isReady, loadVideo, play, pause, seekTo, getCurrentTime, getDuration, setVolume: setYTVolume } = useYouTube({
    containerId: PLAYER_ID,
    onReady: handlePlayerReady,
    onStateChange: handleStateChange,
  });

  const handleUsersChange = useCallback((newUsers: unknown[]) => {
    setUsers(newUsers as User[]);
  }, []);

  const handleHostChange = useCallback((newHostId: string) => {
    if (newHostId === userId || newHostId === socket.id) {
      setIsHost(true);
    }
  }, [userId, socket.id]);

  const handleVideoChange = useCallback((vid: string) => {
    setVideoId(vid);
    setPlaying(false);
    setCurrentTime(0);
  }, []);

  const handlePlayingChange = useCallback((p: boolean) => {
    setPlaying(p);
  }, []);

  useSync({
    socket,
    roomId,
    isHost,
    isPlayerReady: isReady,
    play,
    pause,
    seekTo,
    getCurrentTime,
    onVideoChange: handleVideoChange,
    onUsersChange: handleUsersChange,
    onHostChange: handleHostChange,
    onPlayingChange: handlePlayingChange,
  });

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket]);

  useEffect(() => {
    if (!isReady || !videoId) return;
    loadVideo(videoId, 0);
  }, [isReady, videoId, loadVideo]);

  useEffect(() => {
    setYTVolume(muted ? 0 : volume);
  }, [volume, muted, setYTVolume]);

  useEffect(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      if (isReady) {
        setCurrentTime(getCurrentTime());
        setDuration(getDuration());
      }
    }, 500);
    return () => { if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); };
  }, [isReady, getCurrentTime, getDuration]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('room')) {
      const newUrl = `${window.location.pathname}?room=${roomId}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [roomId]);

  const handlePlay = useCallback(() => {
    if (!isHost) return;
    const t = getCurrentTime();
    play();
    setPlaying(true);
    socket.emit('play', { roomId, currentTime: t });
  }, [isHost, getCurrentTime, play, socket, roomId]);

  const handlePause = useCallback(() => {
    if (!isHost) return;
    const t = getCurrentTime();
    pause();
    setPlaying(false);
    socket.emit('pause', { roomId, currentTime: t });
  }, [isHost, getCurrentTime, pause, socket, roomId]);

  const handleSeek = useCallback((time: number) => {
    if (!isHost) return;
    seekTo(time);
    socket.emit('seek', { roomId, currentTime: time });
  }, [isHost, seekTo, socket, roomId]);

  const handleSkipBack = useCallback(() => {
    if (!isHost) return;
    const t = Math.max(0, getCurrentTime() - 10);
    seekTo(t);
    socket.emit('seek', { roomId, currentTime: t });
  }, [isHost, getCurrentTime, seekTo, socket, roomId]);

  const handleSkipForward = useCallback(() => {
    if (!isHost) return;
    const d = getDuration();
    const t = Math.min(d, getCurrentTime() + 10);
    seekTo(t);
    socket.emit('seek', { roomId, currentTime: t });
  }, [isHost, getCurrentTime, getDuration, seekTo, socket, roomId]);

  const handleVideoSubmit = useCallback((vid: string) => {
    if (!isHost) return;
    setVideoId(vid);
    socket.emit('change-video', { roomId, videoId: vid });
  }, [isHost, socket, roomId]);

  const handleVolumeChange = useCallback((v: number) => {
    setVolume(v);
    setMuted(v === 0);
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted(m => {
      const next = !m;
      setYTVolume(next ? 0 : volume);
      return next;
    });
  }, [volume, setYTVolume]);

  const copyRoomLink = useCallback(() => {
    const link = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setCopyNotice('LINK COPIED');
      setTimeout(() => { setCopied(false); setCopyNotice(''); }, 2000);
    });
  }, [roomId]);

  const handleLeave = useCallback(() => {
    socket.disconnect();
    const url = window.location.pathname;
    window.history.replaceState({}, '', url);
    onLeave();
  }, [socket, onLeave]);

  return (
    <div className="min-h-screen bg-black text-[#00ff41] font-mono">
      <ScanlineOverlay />

      <div className="relative z-10 max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{ background: connected ? '#00ff41' : '#ff0044' }}
                animate={{ opacity: connected ? [1, 0.3, 1] : 1 }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-xs tracking-widest text-[#004400]">
                {connected ? 'CONNECTED' : 'RECONNECTING...'}
              </span>
              {connected ? <Wifi size={12} className="text-[#004400]" /> : <WifiOff size={12} className="text-[#ff0044]" />}
            </div>
            <h1 className="text-xl tracking-widest text-[#00ff41]">
              SYNCWAVE
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-[#004400] tracking-widest">ROOM</div>
              <div className="text-lg tracking-[0.3em] text-[#00ff41]" style={{ textShadow: '0 0 10px #00ff41' }}>
                {roomId}
              </div>
            </div>

            <AnimatePresence>
              {copyNotice && (
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] text-[#00ff41] absolute right-28"
                >
                  {copyNotice}
                </motion.span>
              )}
            </AnimatePresence>

            <motion.button
              onClick={copyRoomLink}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 border border-[#003300] rounded hover:border-[#00ff41] transition-colors"
              title="Copy room link"
            >
              <Copy size={16} className={copied ? 'text-[#00ff41]' : 'text-[#004400]'} />
            </motion.button>

            <motion.button
              onClick={handleLeave}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 border border-[#330000] rounded hover:border-[#ff0044] text-[#330000] hover:text-[#ff0044] transition-colors"
              title="Leave room"
            >
              <LogOut size={16} />
            </motion.button>
          </div>
        </motion.header>

        <div className="flex items-center justify-between text-[10px] tracking-widest text-[#003300]">
          <span>{isHost ? '[ HOST ]' : '[ LISTENER ]'}</span>
          <span>USER :: {username}</span>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <YouTubePlayer containerId={PLAYER_ID} hasVideo={!!videoId} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 border border-[#001a00] rounded-lg p-5"
          style={{ background: 'rgba(0,10,0,0.8)', boxShadow: 'inset 0 0 30px rgba(0,255,65,0.02)' }}
        >
          <Waveform playing={playing} bars={40} />
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            isHost={isHost}
            onSeek={handleSeek}
          />
          <Controls
            isHost={isHost}
            playing={playing}
            onPlay={handlePlay}
            onPause={handlePause}
            onSkipBack={handleSkipBack}
            onSkipForward={handleSkipForward}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            muted={muted}
            onToggleMute={handleToggleMute}
          />
        </motion.div>

        {isHost && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border border-[#001a00] rounded-lg p-5"
            style={{ background: 'rgba(0,10,0,0.8)' }}
          >
            <VideoInput onVideoSubmit={handleVideoSubmit} currentVideoId={videoId} />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="border border-[#001a00] rounded-lg p-5"
          style={{ background: 'rgba(0,10,0,0.8)' }}
        >
          <ConnectedDevices users={users} currentUserId={userId} />
        </motion.div>

        <div className="text-center text-[10px] font-mono text-[#001a00] tracking-widest pb-4">
          SYNCWAVE · LATENCY-COMPENSATED SYNC · ALL NODES IN SYNC
        </div>
      </div>
    </div>
  );
}
