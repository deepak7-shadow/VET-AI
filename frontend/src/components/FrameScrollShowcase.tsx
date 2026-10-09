import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Sliders, 
  Sparkles, 
  Activity, 
  ShieldCheck, 
  Eye, 
  Cpu, 
  ChevronRight,
  Zap,
  Layers
} from 'lucide-react';

interface FrameScrollShowcaseProps {
  totalFrames?: number;
  onNavigateToAnalysis?: () => void;
  onOpenExcretaModal?: () => void;
}

export const FrameScrollShowcase: React.FC<FrameScrollShowcaseProps> = ({
  totalFrames = 120,
  onNavigateToAnalysis,
  onOpenExcretaModal
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  
  const [currentFrame, setCurrentFrame] = useState(0);
  const [targetFrame, setTargetFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Preload images into memory
  useEffect(() => {
    let isMounted = true;
    const images: HTMLImageElement[] = [];
    let loaded = 0;

    for (let i = 0; i < totalFrames; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `/frames/frame_${frameNum}.jpg`;
      img.onload = () => {
        if (!isMounted) return;
        loaded++;
        setLoadedCount(loaded);
        if (loaded >= Math.min(15, totalFrames)) {
          setIsReady(true);
        }
      };
      images.push(img);
    }

    imagesRef.current = images;

    return () => {
      isMounted = false;
    };
  }, [totalFrames]);

  // Draw frame on canvas with aspect ratio preservation
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imagesRef.current[frameIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    // Canvas dimensions
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Cover aspect ratio
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = width / height;

    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      drawHeight = width / imgRatio;
      offsetY = (height - drawHeight) / 2;
    } else {
      drawWidth = height * imgRatio;
      offsetX = (width - drawWidth) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }, []);

  // Smooth lerp frame updater loop
  useEffect(() => {
    let animId: number;

    const updateLoop = () => {
      setCurrentFrame(prev => {
        const diff = targetFrame - prev;
        if (Math.abs(diff) < 0.2) {
          drawFrame(Math.round(targetFrame));
          return targetFrame;
        }
        const next = prev + diff * 0.18; // smooth spring lerp
        drawFrame(Math.round(next));
        return next;
      });

      animId = requestAnimationFrame(updateLoop);
    };

    animId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animId);
  }, [targetFrame, drawFrame]);

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(20, Math.round(33 / playbackSpeed)); // ~30-50 fps
    const interval = setInterval(() => {
      setTargetFrame(prev => (prev + 1) % totalFrames);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, totalFrames]);

  // Scroll wheel scrubber inside showcase container
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    setTargetFrame(prev => {
      const next = prev + delta * 2;
      return Math.max(0, Math.min(totalFrames - 1, next));
    });
    if (isPlaying) setIsPlaying(false);
  };

  // Resize canvas to container resolution
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }

      drawFrame(Math.round(targetFrame));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [targetFrame, drawFrame]);

  // Telemetry phase info based on scroll progress
  const progressPercent = Math.round((targetFrame / (totalFrames - 1)) * 100);
  
  const getPhaseInfo = () => {
    if (progressPercent < 28) {
      return {
        title: 'Phase 1: 3D Twin & Holographic Radar Scan',
        subtitle: 'Autonomous spatial livestock modeling and continuous multi-angle biometric tracking.',
        tag: 'Biometric Arena',
        color: '#16845B'
      };
    } else if (progressPercent < 58) {
      return {
        title: 'Phase 2: Feeding Intelligence & Rumen Capacity',
        subtitle: 'Intake velocity monitoring, bunk visitation frequency, and metabolic divergence telemetry.',
        tag: 'Feeding Intelligence',
        color: '#3877C8'
      };
    } else if (progressPercent < 82) {
      return {
        title: 'Phase 3: Multi-Agent Triage & Clinical RAG',
        subtitle: 'Weighted disease risk scoring, YOLO26 excreta classification, and pathology cross-referencing.',
        tag: 'Disease Screening',
        color: '#D97732'
      };
    } else {
      return {
        title: 'Phase 4: Predictive Health Architecture',
        subtitle: 'Complete herd stratification, automated alerts dispatch, and veterinary PDF report generation.',
        tag: 'Clinical Decision Support',
        color: '#16845B'
      };
    }
  };

  const phase = getPhaseInfo();

  return (
    <div className={`card-elevated bg-white/95 backdrop-blur-md border border-[#E5EAF0] rounded-3xl p-5 sm:p-7 shadow-xl shadow-emerald-950/5 relative overflow-hidden transition-all ${
      isFullscreen ? 'fixed inset-4 z-50 rounded-2xl flex flex-col justify-between' : ''
    }`}>
      {/* Top Header & Interactive Mode Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight flex items-center gap-2">
              <span>Cinematic 3D Scroll Animation</span>
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7F0] border border-[#C4EBD5] text-[#16845B] text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#16845B] animate-pulse" />
              <span>Scroll-Scrub Enabled ({totalFrames} FPS Frames)</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1 font-medium">
            Scroll or drag the scrubber to interactively orbit through the 3D multi-agent veterinary screening walkthrough.
          </p>
        </div>

        {/* Playback & Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
              isPlaying
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'btn-primary text-xs'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Auto Play</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setTargetFrame(0);
              setCurrentFrame(0);
            }}
            className="p-2 bg-white border border-[#E5EAF0] hover:bg-slate-50 text-[#172033] rounded-xl transition-colors shadow-xs"
            title="Reset to Start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setPlaybackSpeed(s => s === 1 ? 2 : s === 2 ? 0.5 : 1)}
            className="px-2.5 py-1.5 bg-white border border-[#E5EAF0] hover:bg-slate-50 text-[#172033] text-xs font-semibold rounded-xl transition-colors shadow-xs"
            title="Playback Speed"
          >
            {playbackSpeed}x
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-white border border-[#E5EAF0] hover:bg-slate-50 text-[#172033] rounded-xl transition-colors shadow-xs"
            title={isFullscreen ? 'Exit Fullscreen' : 'Theater Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Presentation Viewport */}
      <div 
        ref={containerRef}
        onWheel={handleWheel}
        className={`relative w-full rounded-2xl border border-[#E5EAF0] bg-slate-950 overflow-hidden cursor-ew-resize group select-none ${
          isFullscreen ? 'flex-1 min-h-[450px]' : 'aspect-video max-h-[540px]'
        }`}
      >
        <canvas 
          ref={canvasRef} 
          className="w-full h-full object-cover block"
        />

        {/* Loading overlay if assets are caching */}
        {!isReady && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            <p className="text-xs font-semibold text-emerald-200">
              Buffering 3D Frames ({loadedCount}/{totalFrames})...
            </p>
          </div>
        )}

        {/* Floating Contextual Glassmorphic Telemetry Overlay */}
        <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-md z-20 pointer-events-none">
          <div className="bg-slate-900/75 backdrop-blur-md border border-white/15 text-white rounded-2xl p-4 shadow-2xl animate-hud-float">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {phase.tag}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-emerald-300">
                Frame {Math.round(currentFrame) + 1} / {totalFrames}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {phase.title}
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {phase.subtitle}
            </p>
          </div>
        </div>

        {/* Scroll / Scrub Hint Pill */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
          <div className="px-3 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-md border border-white/15 text-slate-200 text-[11px] font-medium flex items-center gap-2 shadow-lg">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Scroll Wheel or Drag Scrubber Below to Animate</span>
          </div>
        </div>

        {/* Progress Pill */}
        <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
          <div className="px-3 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-md border border-white/15 text-emerald-300 text-xs font-mono font-bold shadow-lg">
            {progressPercent}% Complete
          </div>
        </div>
      </div>

      {/* Interactive Frame Scrubbing Timeline & Slider Bar */}
      <div className="mt-4 pt-3 border-t border-[#E5EAF0] space-y-2 relative z-10">
        <div className="flex items-center justify-between text-xs text-[#667085]">
          <span className="font-semibold text-[#172033] flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#16845B]" />
            Timeline Scrubber
          </span>
          <span className="font-mono text-[11px]">
            {Math.round(currentFrame) + 1} / {totalFrames} ({progressPercent}%)
          </span>
        </div>

        {/* Interactive Scrub Range Input */}
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={totalFrames - 1}
            value={Math.round(targetFrame)}
            onChange={(e) => {
              setTargetFrame(Number(e.target.value));
              if (isPlaying) setIsPlaying(false);
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#16845B] transition-all"
          />
        </div>

        {/* 4 Phase Marker Steps */}
        <div className="grid grid-cols-4 gap-2 text-center pt-1">
          {[
            { label: '3D Radar Twin', frame: 0 },
            { label: 'Feeding Telemetry', frame: 35 },
            { label: 'Disease Triage', frame: 75 },
            { label: 'Veterinary Summary', frame: 119 }
          ].map((m, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTargetFrame(m.frame);
                if (isPlaying) setIsPlaying(false);
              }}
              className="text-[10px] sm:text-[11px] font-semibold text-[#667085] hover:text-[#16845B] transition-colors truncate"
            >
              • {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
