import { useEffect, useRef, useState, useCallback } from 'react';
import { YTPlayer } from '../types';

let apiLoaded = false;
let apiLoading = false;
const readyCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (apiLoaded) { resolve(); return; }
    readyCallbacks.push(resolve);
    if (apiLoading) return;
    apiLoading = true;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      readyCallbacks.forEach(cb => cb());
      readyCallbacks.length = 0;
    };
  });
}

interface UseYouTubeOptions {
  containerId: string;
  onStateChange?: (state: number) => void;
  onReady?: () => void;
}

export function useYouTube({ containerId, onStateChange, onReady }: UseYouTubeOptions) {
  const playerRef = useRef<YTPlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [playerState, setPlayerState] = useState(-1);
  const onStateChangeRef = useRef(onStateChange);
  const onReadyRef = useRef(onReady);

  useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

  useEffect(() => {
    let mounted = true;

    loadYouTubeAPI().then(() => {
      if (!mounted || !document.getElementById(containerId)) return;

      playerRef.current = new window.YT.Player(containerId, {
        height: '100%',
        width: '100%',
        playerVars: {
          playsinline: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
        },
        events: {
          onReady: () => {
            if (!mounted) return;
            setIsReady(true);
            onReadyRef.current?.();
          },
          onStateChange: (event) => {
            if (!mounted) return;
            setPlayerState(event.data);
            onStateChangeRef.current?.(event.data);
          },
        },
      });
    });

    return () => {
      mounted = false;
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = null;
      setIsReady(false);
    };
  }, [containerId]);

  const loadVideo = useCallback((videoId: string, startSeconds = 0) => {
    if (!playerRef.current || !isReady) return;
    playerRef.current.loadVideoById(videoId, startSeconds);
  }, [isReady]);

  const play = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
  }, []);

  const getCurrentTime = useCallback((): number => {
    return playerRef.current?.getCurrentTime() ?? 0;
  }, []);

  const getDuration = useCallback((): number => {
    return playerRef.current?.getDuration() ?? 0;
  }, []);

  const setVolume = useCallback((vol: number) => {
    playerRef.current?.setVolume(vol);
  }, []);

  return {
    isReady,
    playerState,
    player: playerRef,
    loadVideo,
    play,
    pause,
    seekTo,
    getCurrentTime,
    getDuration,
    setVolume,
  };
}
