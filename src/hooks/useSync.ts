import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface UseSyncOptions {
  socket: Socket | null;
  roomId: string;
  isHost: boolean;
  isPlayerReady: boolean;
  play: () => void;
  pause: () => void;
  seekTo: (t: number) => void;
  getCurrentTime: () => number;
  onVideoChange: (videoId: string) => void;
  onUsersChange: (users: unknown[]) => void;
  onHostChange: (newHostId: string) => void;
  onPlayingChange: (playing: boolean) => void;
}

const DRIFT_THRESHOLD = 1.5;
const SYNC_INTERVAL = 8000;

export function useSync({
  socket,
  roomId,
  isHost,
  isPlayerReady,
  play,
  pause,
  seekTo,
  getCurrentTime,
  onVideoChange,
  onUsersChange,
  onHostChange,
  onPlayingChange,
}: UseSyncOptions) {
  const latencyRef = useRef(0);
  const isPlayingRef = useRef(false);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const computeAdjustedTime = useCallback((currentTime: number, serverTime: number): number => {
    const now = Date.now();
    const elapsed = (now - serverTime) / 1000 + latencyRef.current / 1000;
    return currentTime + elapsed;
  }, []);

  const measureLatency = useCallback(() => {
    if (!socket) return;
    const clientTime = Date.now();
    socket.emit('ping-server', { clientTime }, (res: { serverTime: number; clientTime: number }) => {
      const rtt = Date.now() - res.clientTime;
      latencyRef.current = rtt / 2;
    });
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    measureLatency();
    const latencyInterval = setInterval(measureLatency, 30000);

    socket.on('play', ({ currentTime, serverTime }: { currentTime: number; serverTime: number }) => {
      isPlayingRef.current = true;
      onPlayingChange(true);
      if (!isHost && isPlayerReady) {
        const adjusted = computeAdjustedTime(currentTime, serverTime);
        seekTo(adjusted);
        play();
      }
    });

    socket.on('pause', ({ currentTime, serverTime }: { currentTime: number; serverTime: number }) => {
      isPlayingRef.current = false;
      onPlayingChange(false);
      if (!isHost && isPlayerReady) {
        const adjusted = computeAdjustedTime(currentTime, serverTime);
        seekTo(adjusted);
        pause();
      }
    });

    socket.on('seek', ({ currentTime, serverTime }: { currentTime: number; serverTime: number }) => {
      if (!isHost && isPlayerReady) {
        const adjusted = computeAdjustedTime(currentTime, serverTime);
        seekTo(adjusted);
      }
    });

    socket.on('video-changed', ({ videoId }: { videoId: string }) => {
      isPlayingRef.current = false;
      onPlayingChange(false);
      onVideoChange(videoId);
    });

    socket.on('user-joined', ({ users }: { users: unknown[] }) => {
      onUsersChange(users);
    });

    socket.on('user-left', ({ users }: { users: unknown[] }) => {
      onUsersChange(users);
    });

    socket.on('host-changed', ({ newHostId, users }: { newHostId: string; users: unknown[] }) => {
      onUsersChange(users);
      onHostChange(newHostId);
    });

    socket.on('sync-response', ({ currentTime, serverTime, playing }: { currentTime: number; serverTime: number; playing: boolean }) => {
      if (isHost || !isPlayerReady) return;
      const adjusted = computeAdjustedTime(currentTime, serverTime);
      const localTime = getCurrentTime();
      const drift = Math.abs(localTime - adjusted);
      if (drift > DRIFT_THRESHOLD) {
        seekTo(adjusted);
        if (playing) play();
        else pause();
      }
    });

    return () => {
      clearInterval(latencyInterval);
      socket.off('play');
      socket.off('pause');
      socket.off('seek');
      socket.off('video-changed');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('host-changed');
      socket.off('sync-response');
    };
  }, [socket, isHost, isPlayerReady, play, pause, seekTo, getCurrentTime, computeAdjustedTime, measureLatency, onVideoChange, onUsersChange, onHostChange, onPlayingChange]);

  useEffect(() => {
    if (!socket || isHost || !isPlayerReady) return;

    syncIntervalRef.current = setInterval(() => {
      socket.emit('sync-request', { roomId });
    }, SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [socket, isHost, isPlayerReady, roomId]);
}
