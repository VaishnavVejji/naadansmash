import React from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { BRAND_CONFIG } from '../../data/communityData';

interface HeroProps {
  onJoinClick: () => void;
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onJoinClick, onExploreClick }) => {
  return (
    <section id="home" className="relative min-h-[96vh] flex flex-col justify-between pt-28 pb-12 overflow-hidden bg-brand-black">
      {/* Cinematic Backdrop: Official Community Photograph */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/community-group.jpg"
          alt="NAADANSMASH Community Kochi"
          className="w-full h-full object-cover object-center filter brightness-[0.42] contrast-[1.08] saturate-[0.95]"
        />
        {/* Subtle, Linear Editorial Dark Vignette (No Cheesy Glows) */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/55 to-brand-black/40" />
      </div>

      {/* Main Center Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center my-auto">
        {/* Minimalist Location & Manifesto Tag */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-md mb-8 animate-fade-in">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-teal" />
          <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-white/90 font-medium">
            {BRAND_CONFIG.tagline}
          </span>
          <span className="text-white/20">•</span>
          <span className="text-[11px] text-white/70 flex items-center gap-1 font-mono uppercase tracking-wider">
            <MapPin className="w-3 h-3 text-brand-teal" />
            {BRAND_CONFIG.location.city}, {BRAND_CONFIG.location.state}
          </span>
        </div>

        {/* Hero Headline: Bold, Confident, Solid Editorial White */}
        <h1 className="font-heading font-extrabold text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tightest text-white leading-[0.95] mb-8 uppercase">
          BADMINTON.<br />
          <span>BEYOND THE COURT.</span>
        </h1>

        {/* Hero Description */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-white/80 font-normal leading-relaxed mb-12">
          More than just a game. A community of people who come together to play, connect and create unforgettable moments.
        </p>

        {/* Action Buttons: Pure Blue for Primary, Crisp Ghost for Secondary */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mb-12">
          <button
            onClick={onJoinClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-brand-teal hover:bg-[#126f8c] text-white font-heading font-semibold text-xs sm:text-sm uppercase tracking-widest transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm focus:ring-4 focus:ring-brand-teal/30"
          >
            <span>JOIN THE NEXT GAME</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-heading font-medium text-xs sm:text-sm uppercase tracking-widest border border-white/25 hover:border-white/50 backdrop-blur-sm transition-all duration-200"
          >
            <span>EXPLORE OUR COMMUNITY</span>
          </button>
        </div>
      </div>

      {/* Editorial Metadata Strip: Minimalist 4-Column Bar with 1px Dividers */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-white/15 text-left text-white/90">
          <div className="py-2">
            <div className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/50 mb-1">
              01 / CADENCE
            </div>
            <div className="font-heading font-bold text-sm sm:text-base text-white">
              Weekends
            </div>
            <div className="text-xs text-white/70">Evening times set by coach</div>
          </div>

          <div className="py-2">
            <div className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/50 mb-1">
              02 / VENUE
            </div>
            <div className="font-heading font-bold text-sm sm:text-base text-white">
              Kochi, Kerala
            </div>
            <div className="text-xs text-white/70">Indoor Courts (Location Varies)</div>
          </div>

          <div className="py-2">
            <div className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/50 mb-1">
              03 / SKILL LEVEL
            </div>
            <div className="font-heading font-bold text-sm sm:text-base text-white">
              Open to All Levels
            </div>
            <div className="text-xs text-white/70">Beginner to Advanced</div>
          </div>

          <div className="py-2">
            <div className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/50 mb-1">
              04 / FORMAT
            </div>
            <div className="font-heading font-bold text-sm sm:text-base text-white">
              Doubles & Rotations
            </div>
            <div className="text-xs text-white/70">Coach Coordinated Games</div>
          </div>
        </div>
      </div>
    </section>
  );
};
