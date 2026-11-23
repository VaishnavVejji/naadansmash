import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { GalleryImage } from '../../types';

interface LightboxModalProps {
  images: GalleryImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrev,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, onNext, onPrev]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <div className="fixed inset-0 z-50 bg-brand-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 select-none animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between text-brand-white z-20">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-widest font-mono text-brand-ice font-semibold bg-brand-charcoal/80 px-3 py-1.5 rounded-full border border-white/10">
            {currentIndex + 1} / {images.length}
          </span>
          {currentImage.tag && (
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-brand-teal bg-brand-ice/10 px-3 py-1.5 rounded-full border border-brand-teal/20">
              {currentImage.tag}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-brand-charcoal hover:bg-brand-teal text-brand-white transition-colors border border-white/10"
            aria-label="Close Lightbox (Esc)"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Center Image Display with Navigation Arrows */}
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
        {/* Previous Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-2 sm:left-6 z-20 p-3 sm:p-4 rounded-full bg-brand-black/60 hover:bg-brand-teal text-brand-white border border-white/20 transition-all transform hover:scale-105"
          aria-label="Previous image (Left Arrow)"
          title="Previous Image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Central Image */}
        <div className="max-w-5xl max-h-[75vh] sm:max-h-[80vh] flex items-center justify-center p-2">
          <img
            src={currentImage.src}
            alt={currentImage.title}
            className="max-w-full max-h-[75vh] sm:max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/10"
          />
        </div>

        {/* Next Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-2 sm:right-6 z-20 p-3 sm:p-4 rounded-full bg-brand-black/60 hover:bg-brand-teal text-brand-white border border-white/20 transition-all transform hover:scale-105"
          aria-label="Next image (Right Arrow)"
          title="Next Image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Information Bar */}
      <div className="max-w-3xl mx-auto w-full text-center bg-brand-charcoal/80 border border-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 z-20 text-brand-white">
        <h4 className="font-heading font-bold text-lg sm:text-xl text-brand-white mb-1">
          {currentImage.title}
        </h4>
        <p className="text-xs sm:text-sm text-brand-ice/80 max-w-xl mx-auto">
          {currentImage.caption}
        </p>
      </div>
    </div>
  );
};
