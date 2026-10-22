import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plant, PlantPhoto, GrowthStage } from '../types/plant';
import { api } from '../services/api';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Calendar,
  Layers,
  Sparkles,
  Columns,
  SplitSquareVertical,
  Grid,
  Plus,
  Trash2,
  Info,
  Clock,
  RotateCcw,
  Check,
  Upload,
  Image as ImageIcon,
  Sliders,
  ExternalLink,
  X,
} from 'lucide-react';

interface SequentialPhotoGalleryProps {
  plant: Plant;
  onUpdatePlant?: (updatedPlant: Plant) => void;
  onNavigateToTab?: (tabId: string) => void;
}

export const SequentialPhotoGallery: React.FC<SequentialPhotoGalleryProps> = ({
  plant,
  onUpdatePlant,
  onNavigateToTab,
}) => {
  // Sort photos chronologically ascending
  const photos: PlantPhoto[] = React.useMemo(() => {
    if (!plant.photos || plant.photos.length === 0) return [];
    return [...plant.photos].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [plant.photos]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 0.5x, 1x, 2x
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [activeMode, setActiveMode] = useState<'timelapse' | 'split' | 'sideBySide' | 'grid'>('timelapse');
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');

  // Split slider state (0 to 100 percentage)
  const [splitPos, setSplitPos] = useState<number>(50);
  const [splitBeforeIndex, setSplitBeforeIndex] = useState<number>(0);
  const [splitAfterIndex, setSplitAfterIndex] = useState<number>(Math.max(0, photos.length - 1));
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Side-by-side comparison indices
  const [sideByIndexA, setSideByIndexA] = useState<number>(0);
  const [sideByIndexB, setSideByIndexB] = useState<number>(Math.max(0, photos.length - 1));

  // Fullscreen lightbox
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Add photo modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>('');
  const [newPhotoCaption, setNewPhotoCaption] = useState<string>('');
  const [newPhotoDate, setNewPhotoDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newPhotoStage, setNewPhotoStage] = useState<GrowthStage>(plant.growthStage || 'vegetative');
  const [newPhotoContext, setNewPhotoContext] = useState<
    'baseline' | 'symptom_assessment' | 'treatment_application' | 'follow_up' | 'recovery_milestone'
  >('recovery_milestone');
  const [isSubmittingPhoto, setIsSubmittingPhoto] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Ensure valid indices when photos change
  useEffect(() => {
    if (photos.length > 0) {
      if (currentIndex >= photos.length) {
        setCurrentIndex(photos.length - 1);
      }
      if (splitAfterIndex >= photos.length) {
        setSplitAfterIndex(photos.length - 1);
      }
      if (sideByIndexB >= photos.length) {
        setSideByIndexB(photos.length - 1);
      }
    }
  }, [photos.length]);

  // Automated Timelapse Player Timer
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && photos.length > 1) {
      const delay = Math.round(1800 / playbackSpeed);
      interval = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= photos.length - 1) {
            if (isLooping) {
              return 0;
            } else {
              setIsPlaying(false);
              return prev;
            }
          }
          return prev + 1;
        });
      }, delay);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed, isLooping, photos.length]);

  // Keyboard navigation (Left / Right arrow keys, Space to Play/Pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(photos.length - 1, prev + 1));
      } else if (e.key === ' ' && activeMode === 'timelapse') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length, activeMode, isFullscreen]);

  // Split slider drag handling
  const handleSplitMove = useCallback(
    (clientX: number) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSplitPos(pct);
    },
    []
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSplit) {
        handleSplitMove(e.clientX);
      }
    };
    const handleMouseUp = () => {
      setIsDraggingSplit(false);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingSplit && e.touches[0]) {
        handleSplitMove(e.touches[0].clientX);
      }
    };
    const handleTouchEnd = () => {
      setIsDraggingSplit(false);
    };

    if (isDraggingSplit) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingSplit, handleSplitMove]);

  // Helper to compute days elapsed from baseline
  const getDaysOffset = (dateStr: string) => {
    if (photos.length === 0) return 0;
    const baseDate = new Date(photos[0].date).getTime();
    const curDate = new Date(dateStr).getTime();
    const diffDays = Math.round((curDate - baseDate) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getContextBadge = (context: string) => {
    switch (context) {
      case 'baseline':
        return { label: 'Baseline Specimen', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'symptom_assessment':
        return { label: 'Symptom Assessment', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'treatment_application':
        return { label: 'Treatment Applied', color: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'follow_up':
        return { label: 'Post-Treatment Follow-up', color: 'bg-teal-50 text-teal-800 border-teal-200' };
      case 'recovery_milestone':
        return { label: 'Growth & Recovery Milestone', color: 'bg-blue-50 text-blue-800 border-blue-200' };
      default:
        return { label: context.replace(/_/g, ' '), color: 'bg-neutral-50 text-neutral-700 border-neutral-200' };
    }
  };

  // Find nearest growth metric for current photo date
  const currentPhoto = photos[currentIndex];
  const matchingMetric = currentPhoto && plant.growthMetrics
    ? plant.growthMetrics.find((m) => m.date === currentPhoto.date) ||
      plant.growthMetrics.reduce((prev: any, curr: any) => {
        if (!prev) return curr;
        const prevDiff = Math.abs(new Date(prev.date).getTime() - new Date(currentPhoto.date).getTime());
        const currDiff = Math.abs(new Date(curr.date).getTime() - new Date(currentPhoto.date).getTime());
        return currDiff < prevDiff ? curr : prev;
      }, null)
    : null;

  // Add photo handler
  const handleAddPhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) {
      setPhotoError('Please provide a photo URL or choose a preset.');
      return;
    }

    setIsSubmittingPhoto(true);
    setPhotoError(null);

    try {
      const res = await api.addPlantPhoto(plant.id, {
        url: newPhotoUrl.trim(),
        caption: newPhotoCaption.trim() || undefined,
        date: newPhotoDate,
        stage: newPhotoStage,
        context: newPhotoContext,
      });

      if (onUpdatePlant && res.plant) {
        onUpdatePlant(res.plant);
      }

      setIsAddModalOpen(false);
      setNewPhotoUrl('');
      setNewPhotoCaption('');
      // Jump to the newly added photo
      if (res.plant.photos) {
        setCurrentIndex(res.plant.photos.length - 1);
      }
    } catch (err: any) {
      setPhotoError(err.message || 'Failed to add photo');
    } finally {
      setIsSubmittingPhoto(false);
    }
  };

  // Delete photo handler
  const handleDeletePhoto = async (photoId: string) => {
    if (photos.length <= 1) {
      alert('A plant must retain at least one historical photo.');
      return;
    }
    if (!window.confirm('Are you sure you want to remove this photo from the timeline?')) {
      return;
    }

    try {
      const res = await api.deletePlantPhoto(plant.id, photoId);
      if (onUpdatePlant && res.plant) {
        onUpdatePlant(res.plant);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to remove photo');
    }
  };

  // Preset botanical images for quick selection in modal
  const samplePhotoPresets = [
    {
      title: 'Monstera Split Leaf',
      stage: 'mature' as GrowthStage,
      context: 'recovery_milestone' as const,
      url: '/src/assets/images/plant_monstera_deliciosa_1792637748031.jpg',
      caption: 'Fenestrated leaf fully expanded with glossy deep-green finish.',
    },
    {
      title: 'Monstera Young Unfurling',
      stage: 'vegetative' as GrowthStage,
      context: 'recovery_milestone' as const,
      url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=1000&q=80',
      caption: 'Fresh lime-green leaf unrolling along the primary stem.',
    },
    {
      title: 'Tomato Yellow Blossom',
      stage: 'flowering' as GrowthStage,
      context: 'baseline' as const,
      url: '/src/assets/images/plant_tomato_blossom_1792637748927.jpg',
      caption: 'Healthy floral trusses blooming vigorously in full sun.',
    },
    {
      title: 'Leaf Yellowing Symptom',
      stage: 'fruiting' as GrowthStage,
      context: 'symptom_assessment' as const,
      url: '/src/assets/images/plant_leaf_yellowing_sample_1792637749401.jpg',
      caption: 'Interveinal chlorosis observed on lower canopy leaves.',
    },
    {
      title: 'Ripe Tomato Harvest Cluster',
      stage: 'fruiting' as GrowthStage,
      context: 'recovery_milestone' as const,
      url: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=1000&q=80',
      caption: 'Dense ruby-red fruit clusters ripening following treatment.',
    },
    {
      title: 'Botanical Garden Terrace',
      stage: 'vegetative' as GrowthStage,
      context: 'baseline' as const,
      url: '/src/assets/images/hero_botanical_garden_1792637746803.jpg',
      caption: 'Potted specimen placed in optimal morning illumination.',
    },
  ];

  // File upload reader for local images
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setPhotoError('Image file must be under 8MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setNewPhotoUrl(reader.result);
          setPhotoError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (photos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
          <ImageIcon className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-neutral-900">No Growth Photos Recorded Yet</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Capture or upload chronological photos of {plant.nickname} to observe growth stages, monitor symptom progression, and watch automated timelapses.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3B182E] text-white text-xs font-semibold rounded-xl hover:bg-[#2B1020] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add First Growth Photo</span>
        </button>
      </div>
    );
  }

  const daysElapsedTotal = getDaysOffset(photos[photos.length - 1].date);
  const currentBadge = currentPhoto ? getContextBadge(currentPhoto.context) : null;
  const daysFromBaseline = currentPhoto ? getDaysOffset(currentPhoto.date) : 0;

  return (
    <div className="space-y-6">
      {/* Header & Mode Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-neutral-900 tracking-tight">
              Sequential Growth Photo Gallery & Timelapse
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200">
              {photos.length} Recorded Stages ({daysElapsedTotal} Days Tracked)
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Step through chronological records to observe morphological changes, play automated growth timelapses, or compare before & after states.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Segmented Switcher */}
          <div className="inline-flex items-center p-1 bg-neutral-100 rounded-xl text-xs">
            <button
              onClick={() => {
                setActiveMode('timelapse');
                setIsPlaying(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeMode === 'timelapse'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="Sequential Timelapse & Stepper Player"
            >
              <Play className="w-3.5 h-3.5 text-[#3B182E]" />
              <span className="hidden sm:inline">Timelapse Player</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('split');
                setIsPlaying(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeMode === 'split'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="Before & After Interactive Split Slider"
            >
              <SplitSquareVertical className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Split Slider</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('sideBySide');
                setIsPlaying(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeMode === 'sideBySide'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="Side-by-Side Dual Comparison"
            >
              <Columns className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Side-by-Side</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('grid');
                setIsPlaying(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeMode === 'grid'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="Photo Grid Overview"
            >
              <Grid className="w-3.5 h-3.5 text-neutral-600" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>

          {/* Add Photo Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3B182E] text-white text-xs font-semibold rounded-xl hover:bg-[#2B1020] transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Growth Photo</span>
          </button>
        </div>
      </div>

      {/* MODE 1: TIMELAPSE & STEPPER PLAYER */}
      {activeMode === 'timelapse' && currentPhoto && (
        <div className="space-y-4">
          {/* Main Visual Player Frame */}
          <div className="bg-neutral-950 rounded-2xl overflow-hidden shadow-md border border-neutral-900 relative">
            {/* Top Overlay Badges */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold rounded-lg shadow-xs pointer-events-auto">
                  Day {daysFromBaseline + 1} ({daysFromBaseline === 0 ? 'Baseline' : `+${daysFromBaseline} days`})
                </span>
                {currentBadge && (
                  <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg backdrop-blur-md shadow-xs pointer-events-auto ${currentBadge.color}`}>
                    {currentBadge.label}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pointer-events-auto">
                <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-emerald-300 text-[11px] font-semibold rounded-lg capitalize shadow-xs">
                  {currentPhoto.stage || plant.growthStage} Stage
                </span>
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-lg transition-colors cursor-pointer"
                  title="Expand to Fullscreen Lightbox"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Main Stage Image Display */}
            <div className="relative aspect-16/10 sm:aspect-16/9 bg-neutral-950 flex items-center justify-center overflow-hidden">
              <img
                key={currentPhoto.id}
                src={currentPhoto.url}
                alt={currentPhoto.caption || `${plant.nickname} growth stage`}
                className={`w-full h-full transition-all duration-300 ${
                  fitMode === 'cover' ? 'object-cover' : 'object-contain'
                }`}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = plant.primaryPhotoUrl || '/src/assets/images/plant_monstera_deliciosa_1792637748031.jpg';
                }}
              />

              {/* Stepper Chevrons Over Image */}
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className={`absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm transition-all cursor-pointer ${
                  currentIndex === 0 ? 'opacity-20 cursor-not-allowed' : 'opacity-80 hover:opacity-100 hover:scale-105'
                }`}
                title="Previous growth photo (Left arrow)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => setCurrentIndex((prev) => Math.min(photos.length - 1, prev + 1))}
                disabled={currentIndex === photos.length - 1}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm transition-all cursor-pointer ${
                  currentIndex === photos.length - 1 ? 'opacity-20 cursor-not-allowed' : 'opacity-80 hover:opacity-100 hover:scale-105'
                }`}
                title="Next growth photo (Right arrow)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Active Playing Indicator Overlay */}
              {isPlaying && (
                <div className="absolute bottom-3 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-white">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-medium">Timelapse Playing ({playbackSpeed}x)</span>
                </div>
              )}
            </div>

            {/* Playback Controls Toolbar */}
            <div className="bg-neutral-900 border-t border-neutral-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-neutral-300">
              {/* Stepper & Play/Pause */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentIndex(0)}
                  disabled={currentIndex === 0}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
                  title="Jump to Start (Baseline Photo)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
                  title="Step Backward (Left Arrow)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    isPlaying
                      ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-xs'
                      : 'bg-[#3B182E] text-white hover:bg-[#4E203E] shadow-xs'
                  }`}
                  title={isPlaying ? 'Pause timelapse' : 'Play automated timelapse sequence'}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Timelapse</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(photos.length - 1, prev + 1))}
                  disabled={currentIndex === photos.length - 1}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
                  title="Step Forward (Right Arrow)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <span className="text-xs font-mono text-neutral-400 ml-2">
                  {currentIndex + 1} / {photos.length}
                </span>
              </div>

              {/* Speed & Tuning Options */}
              <div className="flex items-center gap-3 text-xs">
                {/* Speed Toggles */}
                <div className="flex items-center gap-1 bg-neutral-800 p-0.5 rounded-lg">
                  {[0.5, 1, 2].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        playbackSpeed === speed
                          ? 'bg-neutral-700 text-white'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                      title={`${speed}x playback speed`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>

                {/* Looping Toggle */}
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                    isLooping
                      ? 'bg-neutral-800 border-neutral-700 text-emerald-400'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  }`}
                  title="Loop timelapse continuously"
                >
                  Loop: {isLooping ? 'On' : 'Off'}
                </button>

                {/* Fit Mode Toggle */}
                <button
                  onClick={() => setFitMode(fitMode === 'contain' ? 'cover' : 'contain')}
                  className="px-2 py-1 rounded-lg text-[11px] text-neutral-400 hover:text-neutral-200 bg-neutral-800 hover:bg-neutral-700 transition-colors cursor-pointer"
                  title="Toggle image aspect fit vs cover"
                >
                  {fitMode === 'contain' ? 'Fit Image' : 'Fill Stage'}
                </button>

                {/* Delete Current Photo */}
                <button
                  onClick={() => handleDeletePhoto(currentPhoto.id)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Remove this photo from timeline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Chronological Growth Filmstrip & Scrubber */}
          <div className="bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#3B182E]" />
                Chronological Timeline Scrubber ({photos[0].date} → {photos[photos.length - 1].date})
              </span>
              <span className="text-[11px] text-neutral-400">
                Click any thumbnail to jump or use keyboard ← → arrows
              </span>
            </div>

            {/* Thumbnails Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {photos.map((photo, idx) => {
                const isSelected = idx === currentIndex;
                const offset = getDaysOffset(photo.date);
                return (
                  <button
                    key={photo.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsPlaying(false);
                    }}
                    className={`text-left p-2 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-50/70 border-[#3B182E] ring-2 ring-[#3B182E]/30 shadow-xs'
                        : 'bg-neutral-50/60 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
                    }`}
                  >
                    <div className="aspect-4/3 rounded-lg overflow-hidden bg-neutral-200 mb-1.5 relative">
                      <img
                        src={photo.url}
                        alt={photo.caption || `Stage ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white font-mono text-[9px]">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-neutral-900 truncate">{photo.date}</span>
                        <span className="text-purple-900 font-mono text-[10px]">
                          {offset === 0 ? 'Day 1' : `+${offset}d`}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 capitalize truncate">
                        {photo.stage || 'specimen'} · {photo.context.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Photo Detail & Botanical Observation Card */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-neutral-900">
                    Growth Frame #{currentIndex + 1}: {currentPhoto.date}
                  </h3>
                  <span className="text-xs text-neutral-400">
                    ({daysFromBaseline === 0 ? 'Day 1 Baseline' : `${daysFromBaseline} days elapsed`})
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  Logged under <strong>{currentPhoto.stage || plant.growthStage}</strong> growth stage.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {currentIndex > 0 && (
                  <button
                    onClick={() => {
                      setSplitBeforeIndex(0);
                      setSplitAfterIndex(currentIndex);
                      setActiveMode('split');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                    title="Compare this frame against Day 1 Baseline in split view"
                  >
                    <SplitSquareVertical className="w-3.5 h-3.5 text-blue-600" />
                    <span>Compare with Baseline</span>
                  </button>
                )}
              </div>
            </div>

            {/* Caption & Observation */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-700 block">Botanical Observations & Context</span>
              <p className="text-xs text-neutral-700 bg-neutral-50 p-3.5 rounded-xl border border-neutral-150 leading-relaxed">
                {currentPhoto.caption || 'No detailed observation recorded for this photographic milestone.'}
              </p>
            </div>

            {/* Linked Growth Metrics / Sensor Records */}
            {matchingMetric && (
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Synchronized Growth Metric ({matchingMetric.date})
                  </span>
                  <p className="text-[11px] text-emerald-800">
                    Recorded height: <strong>{matchingMetric.heightCm} cm</strong> · Leaf count: <strong>{matchingMetric.leafCount} leaves</strong>
                    {matchingMetric.stemDiameterMm ? ` · Stem caliper: ${matchingMetric.stemDiameterMm} mm` : ''}
                    {matchingMetric.milestone ? ` · Milestone: ${matchingMetric.milestone}` : ''}
                  </p>
                </div>
                {onNavigateToTab && (
                  <button
                    onClick={() => onNavigateToTab('growth')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-900 hover:text-emerald-950 underline underline-offset-2 shrink-0 cursor-pointer"
                  >
                    <span>View D3 Growth Chart</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: INTERACTIVE BEFORE & AFTER SPLIT SLIDER */}
      {activeMode === 'split' && (
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-150">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Before & After Interactive Split Slider</h3>
              <p className="text-xs text-neutral-500">
                Drag the vertical divider left or right to inspect morphological progress between any two points in time.
              </p>
            </div>

            {/* Selectors for Before & After */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500 font-medium">Before:</span>
                <select
                  value={splitBeforeIndex}
                  onChange={(e) => setSplitBeforeIndex(Number(e.target.value))}
                  className="px-2.5 py-1 bg-neutral-100 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-900 cursor-pointer"
                >
                  {photos.map((p, idx) => (
                    <option key={p.id} value={idx}>
                      #{idx + 1} ({p.date}) · {p.stage}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-neutral-400 font-bold">vs</span>

              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500 font-medium">After:</span>
                <select
                  value={splitAfterIndex}
                  onChange={(e) => setSplitAfterIndex(Number(e.target.value))}
                  className="px-2.5 py-1 bg-neutral-100 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-900 cursor-pointer"
                >
                  {photos.map((p, idx) => (
                    <option key={p.id} value={idx}>
                      #{idx + 1} ({p.date}) · {p.stage}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Interactive Split Viewport */}
          {photos[splitBeforeIndex] && photos[splitAfterIndex] && (
            <div
              ref={splitContainerRef}
              onMouseDown={() => setIsDraggingSplit(true)}
              onTouchStart={() => setIsDraggingSplit(true)}
              className="relative aspect-16/10 sm:aspect-16/9 bg-neutral-950 rounded-2xl overflow-hidden select-none cursor-ew-resize border border-neutral-900 shadow-md"
            >
              {/* After Photo (Full background) */}
              <img
                src={photos[splitAfterIndex].url}
                alt="After state"
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />

              {/* Before Photo (Clipped overlay) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${splitPos}%` }}
              >
                <img
                  src={photos[splitBeforeIndex].url}
                  alt="Before state"
                  className="absolute inset-0 w-full h-full object-cover max-w-none"
                  style={{
                    width: splitContainerRef.current ? `${splitContainerRef.current.clientWidth}px` : '100%',
                    height: splitContainerRef.current ? `${splitContainerRef.current.clientHeight}px` : '100%',
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Vertical Divider Line with Grab Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 pointer-events-none"
                style={{ left: `${splitPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-neutral-900 shadow-lg flex items-center justify-center font-bold text-xs pointer-events-auto cursor-ew-resize border border-neutral-200">
                  <Sliders className="w-3.5 h-3.5 text-[#3B182E]" />
                </div>
              </div>

              {/* Overlaid Badges */}
              <div className="absolute top-3 left-3 z-10">
                <span className="px-2.5 py-1 bg-black/70 backdrop-blur-md text-emerald-300 text-[11px] font-semibold rounded-lg shadow-xs">
                  BEFORE: {photos[splitBeforeIndex].date} ({photos[splitBeforeIndex].stage})
                </span>
              </div>

              <div className="absolute top-3 right-3 z-10">
                <span className="px-2.5 py-1 bg-black/70 backdrop-blur-md text-blue-300 text-[11px] font-semibold rounded-lg shadow-xs">
                  AFTER: {photos[splitAfterIndex].date} ({photos[splitAfterIndex].stage})
                </span>
              </div>

              {/* Days Delta pill */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
                <span className="px-3 py-1 bg-black/80 backdrop-blur-md text-white text-[11px] font-bold rounded-full shadow-xs">
                  Δ {Math.abs(getDaysOffset(photos[splitAfterIndex].date) - getDaysOffset(photos[splitBeforeIndex].date))} Days Difference
                </span>
              </div>
            </div>
          )}

          {/* Observations Comparison Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-1">
              <span className="font-semibold text-neutral-900 block">
                Before: {photos[splitBeforeIndex]?.date} ({photos[splitBeforeIndex]?.context.replace(/_/g, ' ')})
              </span>
              <p className="text-neutral-600 text-[11px] leading-relaxed">
                {photos[splitBeforeIndex]?.caption || 'No caption provided.'}
              </p>
            </div>

            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200/70 space-y-1">
              <span className="font-semibold text-purple-950 block">
                After: {photos[splitAfterIndex]?.date} ({photos[splitAfterIndex]?.context.replace(/_/g, ' ')})
              </span>
              <p className="text-purple-900 text-[11px] leading-relaxed">
                {photos[splitAfterIndex]?.caption || 'No caption provided.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: SIDE-BY-SIDE DUAL VIEW */}
      {activeMode === 'sideBySide' && (
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-150">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Side-by-Side Dual Specimen Comparison</h3>
              <p className="text-xs text-neutral-500">
                Compare foliage structure, leaf chlorosis, or flower development across any two historical dates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column Photo A */}
            <div className="space-y-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-900">Photo A</span>
                <select
                  value={sideByIndexA}
                  onChange={(e) => setSideByIndexA(Number(e.target.value))}
                  className="px-2.5 py-1 bg-white rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-800"
                >
                  {photos.map((p, idx) => (
                    <option key={p.id} value={idx}>
                      #{idx + 1} ({p.date})
                    </option>
                  ))}
                </select>
              </div>

              {photos[sideByIndexA] && (
                <>
                  <div className="aspect-4/3 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800">
                    <img
                      src={photos[sideByIndexA].url}
                      alt="Comparison Photo A"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                      <span>Date: {photos[sideByIndexA].date}</span>
                      <span className="capitalize">{photos[sideByIndexA].stage} Stage</span>
                    </div>
                    <p className="text-neutral-700 text-[11px] bg-white p-2.5 rounded-lg border border-neutral-200/80">
                      {photos[sideByIndexA].caption || 'No notes recorded.'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Right Column Photo B */}
            <div className="space-y-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-900">Photo B</span>
                <select
                  value={sideByIndexB}
                  onChange={(e) => setSideByIndexB(Number(e.target.value))}
                  className="px-2.5 py-1 bg-white rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-800"
                >
                  {photos.map((p, idx) => (
                    <option key={p.id} value={idx}>
                      #{idx + 1} ({p.date})
                    </option>
                  ))}
                </select>
              </div>

              {photos[sideByIndexB] && (
                <>
                  <div className="aspect-4/3 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800">
                    <img
                      src={photos[sideByIndexB].url}
                      alt="Comparison Photo B"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                      <span>Date: {photos[sideByIndexB].date}</span>
                      <span className="capitalize">{photos[sideByIndexB].stage} Stage</span>
                    </div>
                    <p className="text-neutral-700 text-[11px] bg-white p-2.5 rounded-lg border border-neutral-200/80">
                      {photos[sideByIndexB].caption || 'No notes recorded.'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 4: FULL PHOTO GRID OVERVIEW */}
      {activeMode === 'grid' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, idx) => {
              const badge = getContextBadge(photo.context);
              return (
                <div
                  key={photo.id}
                  className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs group flex flex-col justify-between"
                >
                  <div className="relative aspect-4/3 bg-neutral-100 overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Plant photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-white font-mono text-[10px]">
                        #{idx + 1}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold backdrop-blur-md ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setCurrentIndex(idx);
                        setActiveMode('timelapse');
                      }}
                      className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                    >
                      <span className="px-3 py-1.5 rounded-xl bg-white/90 text-neutral-900 font-bold text-xs shadow-md">
                        Open in Timelapse
                      </span>
                    </button>
                  </div>

                  <div className="p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-neutral-500 text-[11px]">
                      <span className="font-semibold text-neutral-900">{photo.date}</span>
                      <span className="capitalize">{photo.stage || 'vegetative'}</span>
                    </div>

                    <p className="text-neutral-700 line-clamp-2 text-[11px] leading-relaxed">
                      {photo.caption || 'No caption recorded.'}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                      <button
                        onClick={() => {
                          setCurrentIndex(idx);
                          setActiveMode('timelapse');
                        }}
                        className="text-purple-900 hover:text-purple-950 font-semibold text-[11px] cursor-pointer"
                      >
                        Step Here →
                      </button>

                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="text-neutral-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isFullscreen && currentPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-6 animate-fadeIn">
          <div className="flex items-center justify-between text-white pb-3 border-b border-neutral-800">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold">{plant.nickname} — Growth Record #{currentIndex + 1}</h3>
              <p className="text-xs text-neutral-400">
                {currentPhoto.date} · Day {daysFromBaseline + 1} · {currentPhoto.stage} Stage
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition-colors cursor-pointer"
                title="Close Fullscreen (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center relative overflow-hidden py-4">
            <img
              src={currentPhoto.url}
              alt={currentPhoto.caption || 'Plant photo'}
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />

            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-neutral-900/80 hover:bg-neutral-900 text-white disabled:opacity-20 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(photos.length - 1, prev + 1))}
              disabled={currentIndex === photos.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-neutral-900/80 hover:bg-neutral-900 text-white disabled:opacity-20 cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center text-xs text-neutral-300 bg-neutral-900/80 backdrop-blur-md p-3 rounded-xl max-w-2xl mx-auto w-full">
            <p className="line-clamp-2">{currentPhoto.caption || 'No caption recorded.'}</p>
          </div>
        </div>
      )}

      {/* ADD GROWTH PHOTO MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-150">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-neutral-900">Add Growth Photo to Timeline</h3>
                <p className="text-xs text-neutral-500">Record a new dated photo milestone for {plant.nickname}.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {photoError && (
              <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200">
                {photoError}
              </div>
            )}

            <form onSubmit={handleAddPhotoSubmit} className="space-y-4 text-xs">
              {/* Presets or Upload Choice */}
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-700 block">Choose Photo Source</label>
                <div className="grid grid-cols-3 gap-2">
                  {samplePhotoPresets.slice(0, 3).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewPhotoUrl(preset.url);
                        setNewPhotoStage(preset.stage);
                        setNewPhotoContext(preset.context);
                        setNewPhotoCaption(preset.caption);
                      }}
                      className={`p-2 rounded-xl border text-left flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        newPhotoUrl === preset.url
                          ? 'border-[#3B182E] bg-purple-50 ring-2 ring-[#3B182E]/20'
                          : 'border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.title}
                        className="w-full h-12 object-cover rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[10px] font-medium text-neutral-800 truncate text-center w-full">
                        {preset.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload Option */}
              <div className="space-y-1">
                <label className="font-medium text-neutral-600 block">Or Upload Local Image</label>
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-neutral-300 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors text-neutral-600">
                  <Upload className="w-4 h-4" />
                  <span className="font-medium">Browse image from device...</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Photo URL Input */}
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700 block">Photo Image URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://... or /src/assets/images/..."
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#3B182E]/20 text-xs"
                />
              </div>

              {/* Date & Stage */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700 block">Date of Photo</label>
                  <input
                    type="date"
                    required
                    value={newPhotoDate}
                    onChange={(e) => setNewPhotoDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#3B182E]/20 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700 block">Growth Stage</label>
                  <select
                    value={newPhotoStage}
                    onChange={(e) => setNewPhotoStage(e.target.value as GrowthStage)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#3B182E]/20 text-xs capitalize cursor-pointer"
                  >
                    <option value="seed">Seed</option>
                    <option value="seedling">Seedling</option>
                    <option value="vegetative">Vegetative</option>
                    <option value="budding">Budding</option>
                    <option value="flowering">Flowering</option>
                    <option value="fruiting">Fruiting</option>
                    <option value="mature">Mature Specimen</option>
                  </select>
                </div>
              </div>

              {/* Context Selector */}
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700 block">Botanical Context</label>
                <select
                  value={newPhotoContext}
                  onChange={(e) => setNewPhotoContext(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#3B182E]/20 text-xs cursor-pointer"
                >
                  <option value="baseline">Baseline Specimen</option>
                  <option value="recovery_milestone">Growth & Recovery Milestone</option>
                  <option value="symptom_assessment">Symptom Assessment Inspection</option>
                  <option value="treatment_application">Treatment Application</option>
                  <option value="follow_up">Post-Treatment Follow-up</option>
                </select>
              </div>

              {/* Caption */}
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700 block">Caption & Growth Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 10th leaf unfurling smoothly; fresh lime-green color with 4 clear fenestrations."
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#3B182E]/20 text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPhoto}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#3B182E] hover:bg-[#2B1020] rounded-xl transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingPhoto ? 'Adding to Timeline...' : 'Save Growth Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
