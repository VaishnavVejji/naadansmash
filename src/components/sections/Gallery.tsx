import React, { useState } from 'react';
import { Maximize2, Camera, Images, ArrowRight, Folder } from 'lucide-react';
import { GALLERY_IMAGES, FIRST_SESSION_IMAGES, SECOND_SESSION_IMAGES } from '../../data/galleryData';
import { GalleryImage } from '../../types';

interface GalleryProps {
  onImageSelect: (image: GalleryImage, index: number, customList?: GalleryImage[]) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ onImageSelect }) => {
  const [selectedFolder, setSelectedFolder] = useState<'all' | 's2' | 's1'>('all');

  const currentImages = 
    selectedFolder === 's2'
      ? SECOND_SESSION_IMAGES
      : selectedFolder === 's1'
      ? FIRST_SESSION_IMAGES
      : GALLERY_IMAGES;

  const mainImage = currentImages[0];
  const totalCount = currentImages.length;

  return (
    <section id="gallery" className="py-12 sm:py-16 bg-brand-offwhite relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header — Compact & Direct */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-black/[0.08] pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-black/[0.08] text-brand-black text-[11px] font-mono uppercase tracking-[0.2em] mb-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-teal" />
              <span>03 / VISUAL ARCHIVES</span>
            </div>
            <h2 className="font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tightest text-brand-black uppercase leading-[1.05]">
              SESSION <span>PHOTOS.</span>
            </h2>
            <p className="text-xs sm:text-sm text-brand-charcoal/80 mt-2 max-w-xl leading-relaxed">
              Authentic match photography and group memories from our Kochi sessions, documented by Media Head Mithravinda.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Folder Filter Selector */}
            <div className="inline-flex rounded-xl bg-white p-1 border border-black/[0.08] shadow-2xs text-xs font-mono">
              <button
                onClick={() => setSelectedFolder('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedFolder === 'all'
                    ? 'bg-brand-black text-white font-semibold'
                    : 'text-brand-muted hover:text-brand-black'
                }`}
              >
                All ({GALLERY_IMAGES.length})
              </button>
              <button
                onClick={() => setSelectedFolder('s2')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  selectedFolder === 's2'
                    ? 'bg-brand-black text-white font-semibold'
                    : 'text-brand-muted hover:text-brand-black'
                }`}
              >
                <Folder className="w-3.5 h-3.5 text-brand-teal" />
                <span>Session #2 ({SECOND_SESSION_IMAGES.length})</span>
              </button>
              <button
                onClick={() => setSelectedFolder('s1')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  selectedFolder === 's1'
                    ? 'bg-brand-black text-white font-semibold'
                    : 'text-brand-muted hover:text-brand-black'
                }`}
              >
                <Folder className="w-3.5 h-3.5 text-brand-teal" />
                <span>Session #1 ({FIRST_SESSION_IMAGES.length})</span>
              </button>
            </div>

            <button
              onClick={() => onImageSelect(mainImage, 0, currentImages)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-black hover:bg-brand-charcoal text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-sm"
            >
              <Images className="w-4 h-4 text-brand-teal" />
              <span>Full View ({totalCount})</span>
            </button>
          </div>
        </div>

        {/* ONE MAIN PHOTO CARD (FIT TO 1 PAGE & EDGE-TO-EDGE) */}
        <div
          onClick={() => onImageSelect(mainImage, 0, currentImages)}
          className="relative w-full rounded-3xl overflow-hidden border border-black/[0.08] shadow-premium bg-brand-charcoal group cursor-pointer h-72 sm:h-80 md:h-96 lg:h-[460px]"
        >
          <img
            src={mainImage.src}
            alt={mainImage.title}
            className="w-full h-full object-cover object-center group-hover:scale-[1.01] transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2.5">
            <span className="px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md text-white text-[11px] font-mono uppercase tracking-wider border border-white/20 flex items-center gap-2 shadow-xs">
              <Camera className="w-3.5 h-3.5 text-brand-teal" />
              <span>{mainImage.tag || 'Official Community Photo'}</span>
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-brand-teal text-white text-[11px] font-mono uppercase tracking-wider font-semibold">
              Kochi, Kerala
            </span>
          </div>

          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <div className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm text-brand-black flex items-center justify-center shadow-lg group-hover:bg-white transition-colors">
              <Maximize2 className="w-4 h-4 text-brand-teal" />
            </div>
          </div>

          {/* Bottom Caption & Action */}
          <div className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7 sm:right-7 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
            <div className="max-w-xl">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/70 block mb-1">
                {selectedFolder === 's1'
                  ? 'FOLDER: FIRST SESSION • INAUGURAL SMASH'
                  : selectedFolder === 's2'
                  ? 'FOLDER: SECOND SESSION • WEEKEND SMASH'
                  : 'NAADANSMASH COLLECTIVE • PAST 2 SESSIONS'}
              </span>
              <h3 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white uppercase tracking-tight">
                {mainImage.title}
              </h3>
              <p className="text-xs sm:text-sm text-white/80 mt-1 leading-relaxed">
                {mainImage.caption}
              </p>
            </div>

            <div className="shrink-0">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-brand-black text-xs font-mono uppercase tracking-wider font-bold shadow-lg group-hover:bg-brand-teal group-hover:text-white transition-colors">
                <span>See More Photos ({totalCount})</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
