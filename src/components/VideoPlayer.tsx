import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Play, Pause, Maximize, RotateCw, RefreshCw, Volume2, VolumeX, AlertTriangle, Tv, Info } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  title: string;
  subTitle?: string;
  poster?: string;
}

export default function VideoPlayer({ src, title, subTitle, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const hlsRef = useRef<Hls | null>(null);
  const [isRotatingLandscape, setIsRotatingLandscape] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Initialize and load video (supporting HLS and native MP4)
  const initPlayer = () => {
    setIsLoading(true);
    setHasError(false);
    setProgress(0);

    const video = videoRef.current;
    if (!video) return;

    // Destroy existing HLS instance synchronously to prevent race conditions
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (src.endsWith(".m3u8") || src.includes(".m3u8")) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          enableWorker: true,
          lowLatencyMode: true
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          video.play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.log("HLS play promise handled/interrupted cleanly: ", err.message);
              setIsPlaying(false);
            });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.warn("HLS Error:", data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setHasError(true);
                setIsLoading(false);
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support (Safari, iOS)
        video.src = src;
        const handleLoadedMetadata = () => {
          setIsLoading(false);
          video.play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.log("Native HLS play request handled cleanly: ", err.message);
              setIsPlaying(false);
            });
        };
        const handleError = () => {
          setHasError(true);
          setIsLoading(false);
        };

        video.addEventListener("loadedmetadata", handleLoadedMetadata);
        video.addEventListener("error", handleError);
      } else {
        setHasError(true);
        setIsLoading(false);
      }
    } else {
      // Direct stream link or video URL (mp4, webm etc.)
      video.src = src;
      video.onloadstart = () => setIsLoading(true);
      video.oncanplay = () => {
        setIsLoading(false);
        video.play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.log("Direct video play request handled cleanly: ", err.message);
            setIsPlaying(false);
          });
      };
      video.onerror = () => {
        setHasError(true);
        setIsLoading(false);
      };
    }
  };

  useEffect(() => {
    initPlayer();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  // Handle controls auto-hide
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 4000);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || isLoading || hasError) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.log("Play interrupted or stopped cleanly: ", err.message);
          setIsPlaying(false);
        });
    }
    resetControlsTimeout();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
    resetControlsTimeout();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    setVolume(val);
    video.volume = val;
    setIsMuted(val === 0);
    resetControlsTimeout();
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (video.duration) {
      setDuration(video.duration);
      setProgress((video.currentTime / video.duration) * 100);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const pct = parseFloat(e.target.value);
    const targetTime = (pct / 100) * video.duration;
    video.currentTime = targetTime;
    setProgress(pct);
    setCurrentTime(targetTime);
    resetControlsTimeout();
  };

  const handleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.error("Error enabling fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
    resetControlsTimeout();
  };

  const toggleLandscapeMockup = () => {
    setIsRotatingLandscape(!isRotatingLandscape);
    resetControlsTimeout();
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds === Infinity) return "00:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      id="unified-video-player-container"
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
      dir="rtl"
      className={`relative bg-black rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 border border-slate-800 flex items-center justify-center select-none ${
        isRotatingLandscape ? "aspect-video md:-rotate-0" : "aspect-video"
      } w-full`}
    >
      {/* Video instance */}
      <video
        ref={videoRef}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
        onClick={togglePlay}
        muted={isMuted}
      />

      {/* Splash overlay when paused / not loaded */}
      {poster && !isPlaying && !hasError && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-65 z-10 transition-opacity pointer-events-none" 
          style={{ backgroundImage: `url(${poster})` }}
        />
      )}

      {/* Center Big Play Button when paused/not playing */}
      {!isPlaying && !isLoading && !hasError && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 z-30 cursor-pointer"
          title="تشغيل"
        >
          <Play className="w-7 h-7 fill-current translate-x-[2px]" />
        </button>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div id="player-loading" className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm flex flex-col items-center justify-center z-25 space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
          <div className="text-white text-sm font-medium animate-pulse">جاري تحميل البث المباشر...</div>
          <div className="text-slate-400 text-xs text-center px-4">قد يستغرق فك تشفير HLS بضع ثوانٍ</div>
        </div>
      )}

      {/* Error state overlay */}
      {hasError && (
        <div id="player-error" className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center z-20 p-6 text-center space-y-4 border border-red-500/30">
          <AlertTriangle className="w-16 h-16 text-yellow-500 animate-bounce" />
          <div className="text-white text-lg font-bold">عذراً، فشل تشغيل هذا الرابط</div>
          <p className="text-slate-400 text-sm max-w-md">
            قد يكون رابط البث المباشر (.m3u8) متوقفاً حالياً أو غير متوافق مع متصفحك. يمكنك محاولة إعادة التحميل أو تحديث الرابط من لوحة التحكم.
          </p>
          <button
            onClick={initPlayer}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-medium rounded-xl flex items-center gap-2 text-sm shadow-lg shadow-blue-500/10 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 animate-spin-hover" />
            إعادة محاولة الاتصال
          </button>
        </div>
      )}

      {/* Dynamic Ambient Info Bar on hover top */}
      {showControls && (
        <div
          id="player-info-hud"
          className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 to-transparent p-4 flex justify-between items-center z-20 text-white"
        >
          <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100 line-clamp-1">{title}</h4>
              {subTitle && <p className="text-xs text-slate-300 line-clamp-1">{subTitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 flex items-center gap-1">
              <Tv className="w-3.5 h-3.5" />
              مستقر HLS
            </span>
          </div>
        </div>
      )}

      {/* Controls Overlay bottom */}
      {showControls && (
        <div
          id="player-controls-hud"
          className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-12 pb-4 px-4 flex flex-col gap-3 z-20 text-white transition-all"
        >
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-300">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={handleProgressChange}
              className="flex-1 accent-blue-500 h-1.5 cursor-pointer rounded-lg bg-slate-700 outline-none transition-all hover:h-2"
            />
            <span className="text-xs font-mono text-slate-300">
              {duration ? formatTime(duration) : "مباشر"}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            {/* Play/Pause & Volume */}
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition shadow-inner cursor-pointer"
                title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
              >
                {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
              </button>

              <div className="flex items-center gap-2 group">
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-slate-300" /> : <Volume2 className="w-5 h-5 text-white" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 accent-white h-1 bg-slate-700 rounded-lg cursor-pointer opacity-80 group-hover:opacity-100 transition"
                />
              </div>
            </div>

            {/* Rotation & Fullscreen */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLandscapeMockup}
                className={`w-9 h-9 flex items-center justify-center rounded-lg border transition cursor-pointer ${
                  isRotatingLandscape
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-slate-900/80 border-slate-700/60 text-slate-300 hover:text-white"
                }`}
                title="تدوير الشاشة"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                onClick={handleFullscreen}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white cursor-pointer"
                title="ملء الشاشة"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
