import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Flame, 
  Camera, 
  Sparkles,
  ShieldCheck,
  Check,
  Film,
  ExternalLink
} from 'lucide-react';
import { MediaItem } from '../types';
import { getMediaEmbedInfo } from '../utils/mediaUtils';

interface ProductGalleryProps {
  media: MediaItem[];
  selectedVariantIndex: number;
}

const FALLBACK_IMAGE = '/uploads/media-1788721815153-p1sjl.jpeg';

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  media,
  selectedVariantIndex
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Video states
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const safeMedia: MediaItem[] = (media && media.length > 0) ? media : [
    {
      id: 'fallback-media',
      type: 'image' as const,
      url: FALLBACK_IMAGE,
      title: 'Máquina EXXTRA TECH Barber Pro',
      alt: 'Máquina cortadora profesional'
    }
  ];

  // Safe index clamping
  useEffect(() => {
    if (activeIndex >= safeMedia.length) {
      setActiveIndex(Math.max(0, safeMedia.length - 1));
    }
  }, [safeMedia.length, activeIndex]);

  // When variant changes with image index
  const prevVariantIndexRef = useRef(selectedVariantIndex);
  useEffect(() => {
    if (
      selectedVariantIndex !== undefined &&
      selectedVariantIndex >= 0 &&
      selectedVariantIndex < safeMedia.length &&
      selectedVariantIndex !== prevVariantIndexRef.current
    ) {
      prevVariantIndexRef.current = selectedVariantIndex;
      setActiveIndex(selectedVariantIndex);
    }
  }, [selectedVariantIndex, safeMedia.length]);

  // Reset errors and loading state whenever the active media changes
  const currentItem = safeMedia[activeIndex] || safeMedia[0];
  const embedInfo = getMediaEmbedInfo(currentItem?.url || '', currentItem?.type);
  const isVideoMedia = currentItem?.type === 'video' || (currentItem?.type !== 'image' && embedInfo.platform !== 'image');

  useEffect(() => {
    setVideoError(false);
    setIsPlaying(true);
    // Don't leave skeleton loading stuck
    setIsMediaLoading(false);

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [activeIndex, currentItem?.url, isMuted]);

  // Handle ESC and arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZoomed) {
        setIsZoomed(false);
      }
      if (e.key === 'ArrowRight') {
        handleNext();
      }
      if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomed, safeMedia.length]);

  const handleNext = () => {
    if (safeMedia.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % safeMedia.length);
  };

  const handlePrev = () => {
    if (safeMedia.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + safeMedia.length) % safeMedia.length);
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStartX(null);
  };

  const toggleVideoPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  };

  return (
    <div className="w-full flex flex-col gap-3.5">
      {/* Top Gallery Header with Photo Counter & Guarantee */}
      <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          {isVideoMedia ? (
            <Film className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          ) : (
            <Camera className="w-3.5 h-3.5 text-amber-500" />
          )}
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            {isVideoMedia ? 'Reel de Demostración' : 'Galería Oficial'} ({activeIndex + 1}/{safeMedia.length})
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Fotos y Videos 100% Reales</span>
          <span className="sm:hidden">Contenido Real</span>
        </div>
      </div>

      {/* Main Showcase Frame */}
      <div 
        className="relative aspect-square sm:aspect-4/3 lg:aspect-square w-full rounded-2xl overflow-hidden bg-[#121214] border border-white/10 group shadow-2xl select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Ambient Subtle Accent Glow */}
        <div className="absolute inset-0 bg-linear-to-tr from-amber-500/10 via-transparent to-white/5 pointer-events-none z-10" />

        {/* Floating Product Badges */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
          {isVideoMedia ? (
            <span className="bg-linear-to-r from-red-600 to-amber-600 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md">
              <Film className="w-3.5 h-3.5 fill-white" />
              REEL EN ACCIÓN
            </span>
          ) : (
            <span className="bg-amber-500 text-black text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 fill-black" />
              MÁS VENDIDO EN BARBERÍAS
            </span>
          )}
          <span className="bg-black/75 backdrop-blur-md border border-white/15 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full w-fit shadow-md">
            40% OFF HOY
          </span>
        </div>

        {/* Action Controls: Zoom & Mute */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {embedInfo.platform === 'native_video' && !videoError && (
            <button
              type="button"
              onClick={toggleMute}
              className="p-2.5 bg-black/70 hover:bg-black/90 text-white rounded-xl backdrop-blur-md border border-white/15 transition-all cursor-pointer shadow-lg active:scale-95"
              title={isMuted ? 'Activar sonido' : 'Silenciar'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-zinc-300" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            className="p-2.5 bg-black/70 hover:bg-black/90 text-white rounded-xl backdrop-blur-md border border-white/15 transition-all opacity-85 hover:opacity-100 cursor-pointer shadow-lg active:scale-95"
            title="Ver en pantalla completa"
          >
            <Maximize2 className="w-4 h-4 text-zinc-200" />
          </button>
        </div>

        {/* Main Media Container */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#121214]">
          {/* SKELETON: Only show when actually waiting on an image */}
          {isMediaLoading && (
            <div className="absolute inset-0 bg-[#202024] animate-pulse z-5 flex items-center justify-center">
              <span className="text-xs font-mono text-zinc-500">Cargando multimedia...</span>
            </div>
          )}

          {/* 1. Instagram Embed */}
          {embedInfo.platform === 'instagram' && embedInfo.embedUrl ? (
            <div className="w-full h-full flex items-center justify-center bg-black p-1">
              <iframe
                src={embedInfo.embedUrl}
                className="w-full h-full max-w-105 rounded-xl border-0"
                allowFullScreen
                scrolling="no"
                title={currentItem.title || 'Reel de Instagram'}
              />
            </div>
          ) : embedInfo.platform === 'youtube' && embedInfo.embedUrl ? (
            /* 2. YouTube Embed */
            <div className="w-full h-full flex items-center justify-center bg-black">
              <iframe
                src={embedInfo.embedUrl}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={currentItem.title || 'Video YouTube'}
              />
            </div>
          ) : embedInfo.platform === 'tiktok' && embedInfo.embedUrl ? (
            /* 3. TikTok Embed */
            <div className="w-full h-full flex items-center justify-center bg-black">
              <iframe
                src={embedInfo.embedUrl}
                className="w-full h-full max-w-100 border-0"
                allowFullScreen
                title={currentItem.title || 'Video TikTok'}
              />
            </div>
          ) : embedInfo.platform === 'native_video' && !videoError ? (
            /* 4. Native Video Player */
            <div 
              className="relative w-full h-full flex items-center justify-center cursor-pointer bg-zinc-950 group"
              onClick={toggleVideoPlay}
            >
              <video
                ref={videoRef}
                key={`vid-${currentItem.id || activeIndex}-${currentItem.url}`}
                src={currentItem.url}
                autoPlay
                muted={isMuted}
                loop
                playsInline
                preload="auto"
                className="w-full h-full object-cover sm:object-contain"
                onLoadedData={() => {
                  setIsMediaLoading(false);
                  setVideoError(false);
                }}
                onCanPlay={() => {
                  setIsMediaLoading(false);
                  setVideoError(false);
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={(e) => {
                  const err = (e.target as HTMLVideoElement).error;
                  console.warn('Video decoding warning:', err, currentItem.url);
                  // If not an aborted error, show fallback with retry
                  if (err && err.code !== 1) {
                    setVideoError(true);
                  }
                  setIsMediaLoading(false);
                }}
              />

              {/* Tap to Play / Pause Indicator */}
              <div 
                className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-15 pointer-events-none transition-opacity duration-200 ${
                  isPlaying ? 'opacity-0 group-hover:opacity-60' : 'opacity-100'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-2xl transition-transform transform scale-110">
                  {isPlaying ? (
                    <Pause className="w-8 h-8 fill-black" />
                  ) : (
                    <Play className="w-8 h-8 fill-black ml-1" />
                  )}
                </div>
                {!isPlaying && (
                  <span className="mt-3 px-3 py-1 bg-black/80 rounded-full text-xs font-bold text-white tracking-wide">
                    Toca para reproducir reel
                  </span>
                )}
              </div>
            </div>
          ) : videoError ? (
            /* Fallback Card when video cannot be played directly */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-900 text-zinc-300">
              <Film className="w-14 h-14 text-amber-400 mb-3 opacity-90" />
              <p className="text-base font-bold text-white mb-1">Reel / Video de Demostración</p>
              <p className="text-xs text-zinc-400 mb-4 max-w-sm">{currentItem.title || 'Video oficial de la máquina cortadora BB IMPORT'}</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setVideoError(false);
                    setTimeout(() => {
                      if (videoRef.current) {
                        videoRef.current.load();
                        videoRef.current.play().catch(() => {});
                      }
                    }, 50);
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Reintentar Reproducir
                </button>
                <a 
                  href={currentItem.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir Archivo
                </a>
              </div>
            </div>
          ) : (
            /* 5. Standard Image */
            <img
              key={currentItem.id ? `main-media-${currentItem.id}` : `main-media-idx-${activeIndex}`}
              src={currentItem.url || FALLBACK_IMAGE}
              alt={currentItem.alt || currentItem.title || 'Máquina cortadora EXXTRA TECH'}
              referrerPolicy="no-referrer"
              onLoad={() => setIsMediaLoading(false)}
              onError={(e) => {
                setIsMediaLoading(false);
                const target = e.target as HTMLImageElement;
                if (target.src !== FALLBACK_IMAGE && !target.src.endsWith(FALLBACK_IMAGE)) {
                  target.src = FALLBACK_IMAGE;
                }
              }}
              className="w-full h-full object-cover object-center transition-all duration-300 ease-out transform group-hover:scale-105"
            />
          )}
        </div>

        {/* Navigation Arrows */}
        {safeMedia.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              id="gallery-prev-btn"
              aria-label="Elemento anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/70 hover:bg-black/95 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all opacity-90 hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer shadow-xl"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              id="gallery-next-btn"
              aria-label="Elemento siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/70 hover:bg-black/95 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all opacity-90 hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer shadow-xl"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}

        {/* Bottom Pagination Dots */}
        {safeMedia.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-black/70 backdrop-blur-md rounded-full border border-white/15 shadow-md">
            {safeMedia.map((m, idx) => {
              const isDotVideo = m.type === 'video' || getMediaEmbedInfo(m.url, m.type).platform !== 'image';
              return (
                <button
                  type="button"
                  key={`dot-${m.id || idx}`}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === activeIndex
                      ? isDotVideo ? 'w-6 bg-red-500' : 'w-6 bg-amber-500'
                      : 'w-2 bg-white/40 hover:bg-white/80'
                  }`}
                  aria-label={`Ir a ${isDotVideo ? 'reel' : 'foto'} ${idx + 1}`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Thumbnails Strip */}
      {safeMedia.length > 1 && (
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 scrollbar-none py-1">
          {safeMedia.map((item, idx) => {
            const isSelected = idx === activeIndex;
            const thumbEmbed = getMediaEmbedInfo(item.url || '', item.type);
            const isItemVideo = item.type === 'video' || (item.type !== 'image' && thumbEmbed.platform !== 'image');

            return (
              <button
                type="button"
                key={`thumb-${item.id || idx}`}
                onClick={() => setActiveIndex(idx)}
                className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#1E1E22] transition-all cursor-pointer ${
                  isSelected
                    ? 'border-2 border-amber-500 ring-2 ring-amber-500/30 shadow-lg scale-105'
                    : 'border border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                }`}
                aria-label={`Ver ${isItemVideo ? 'video' : 'foto'} ${idx + 1}`}
              >
                {isItemVideo ? (
                  <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden">
                    {thumbEmbed.platform === 'native_video' ? (
                      <video
                        src={`${item.url}#t=0.5`}
                        preload="metadata"
                        muted
                        className="w-full h-full object-cover opacity-75 pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-tr from-red-600/30 via-zinc-900 to-black flex items-center justify-center">
                        <Film className="w-6 h-6 text-amber-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center shadow">
                        <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-1 right-1 bg-black/85 text-[8px] font-black text-amber-400 px-1 py-0.2 rounded font-mono">
                      REEL
                    </span>
                  </div>
                ) : (
                  <img
                    src={item.url || FALLBACK_IMAGE}
                    alt={item.title || `Miniatura ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                    }}
                    className="w-full h-full object-cover"
                  />
                )}
                {isSelected && (
                  <div className="absolute inset-0 bg-amber-500/15 pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {embedInfo.platform === 'native_video' ? (
              <video
                src={currentItem.url}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl border border-white/10 bg-black"
              />
            ) : embedInfo.embedUrl ? (
              <iframe
                src={embedInfo.embedUrl}
                className="w-full h-[75vh] max-w-lg rounded-2xl shadow-2xl border border-white/10 bg-black"
                allowFullScreen
                title={currentItem?.title || 'Vista ampliada'}
              />
            ) : (
              <img
                src={currentItem?.url || FALLBACK_IMAGE}
                alt={currentItem?.title || 'Vista ampliada'}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                }}
                className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            )}
            
            <div className="mt-3 flex items-center justify-between w-full px-2 text-xs text-zinc-400">
              <span className="font-bold text-white">
                {currentItem?.title || 'EXXTRA TECH Barber Pro BB IMPORT'}
              </span>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs cursor-pointer border border-white/15 transition-all shadow-lg active:scale-95"
              >
                ✕ Cerrar Vista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
