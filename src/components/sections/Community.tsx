import React from 'react';
import { ArrowRight, Sparkles, MessageCircle } from 'lucide-react';
import { BRAND_CONFIG } from '../../data/communityData';

interface CommunityProps {
  onJoinClick: () => void;
}

export const Community: React.FC<CommunityProps> = ({ onJoinClick }) => {
  const items = [
    {
      number: '01',
      title: 'SPORTS SHOES',
      desc: 'Comfortable athletic sneakers or sports footwear for good court grip and quick footwork.',
      icon: (
        <div className="text-4xl sm:text-5xl my-2 filter drop-shadow-sm select-none transform transition-transform group-hover:scale-110 duration-300">
          👟
        </div>
      ),
      tilt: 'sm:-rotate-2',
      hasLoanerNote: false,
    },
    {
      number: '02',
      title: 'BADMINTON RACKET',
      desc: 'Bring your favorite racquet for match play.',
      loanerNote: "Don't have one? Contact organizer to check if a loaner is available!",
      hasLoanerNote: true,
      icon: (
        <div className="text-4xl sm:text-5xl my-2 filter drop-shadow-sm select-none transform transition-transform group-hover:scale-110 duration-300">
          🏸
        </div>
      ),
      tilt: 'sm:rotate-1',
    },
    {
      number: '03',
      title: 'WATER BOTTLE',
      desc: 'Stay hydrated through high-intensity 3-hour doubles rotations and evening matches.',
      icon: (
        <div className="text-4xl sm:text-5xl my-2 filter drop-shadow-sm select-none transform transition-transform group-hover:scale-110 duration-300">
          🥤
        </div>
      ),
      tilt: 'sm:-rotate-1',
      hasLoanerNote: false,
    },
    {
      number: '04',
      title: 'COMFORTABLE SPORTSWEAR',
      desc: 'Breathable dry-fit jersey, athletic shorts, and wristbands for maximum mobility on court.',
      icon: (
        <div className="text-4xl sm:text-5xl my-2 filter drop-shadow-sm select-none transform transition-transform group-hover:scale-110 duration-300">
          👕
        </div>
      ),
      tilt: 'sm:rotate-2',
      hasLoanerNote: false,
    },
  ];

  return (
    <section 
      id="what-to-bring" 
      className="py-14 sm:py-18 bg-[#1f0847] relative overflow-hidden text-white"
    >
      {/* Background radial atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(94,27,184,0.35),transparent_70%)] pointer-events-none" />

      {/* Anchor for any old #community hash links */}
      <div id="community" className="absolute -top-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="mb-12 sm:mb-16">
          <div className="inline-block text-[#ffd400] text-xs sm:text-sm font-heading font-extrabold uppercase tracking-[0.25em] mb-2 drop-shadow-xs">
            PACK YOUR BAG
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white uppercase leading-[1.05] drop-shadow-md">
            WHAT TO BRING
          </h2>
          <p className="text-xs sm:text-sm text-white/70 mt-3 max-w-xl leading-relaxed">
            Everything else — from court bookings to balanced game rotations — is taken care of by the NAADANSMASH team. Pack these essentials for your weekend game:
          </p>
        </div>

        {/* Wire & Sticky Notes Stage */}
        <div className="relative pt-6 sm:pt-10 pb-8 sm:pb-12">
          {/* Hanging Clothesline / Wire running across the section */}
          <div className="hidden sm:block absolute top-6 sm:top-10 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ffd400]/70 to-transparent shadow-[0_0_12px_rgba(255,212,0,0.4)] pointer-events-none z-0" />

          {/* Cards Grid: 4 items (Shoes, Racket, Water Bottle, Sportswear) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-5 lg:gap-6 max-w-6xl mx-auto relative z-10">
            {items.map((item) => (
              <div
                key={item.number}
                className={`group relative bg-[#ffd400] text-brand-black rounded-2xl p-5 sm:p-6 shadow-[0_20px_45px_rgba(0,0,0,0.55)] transition-all duration-300 hover:-translate-y-2.5 hover:rotate-0 hover:shadow-[0_28px_55px_rgba(0,0,0,0.7)] flex flex-col items-center text-center justify-between cursor-default min-h-[300px] sm:min-h-[320px] ${item.tilt}`}
              >
                <div className="w-full flex flex-col items-center">
                  {/* Pin / Dot at top center */}
                  <div className="w-4 h-4 rounded-full bg-[#19053b] border-2 border-black/40 shadow-inner mb-2 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  </div>

                  {/* Number */}
                  <div className="font-heading font-black text-xs sm:text-sm text-black/60 tracking-widest uppercase">
                    {item.number}
                  </div>

                  {/* Illustrated Icon */}
                  <div>
                    {item.icon}
                  </div>

                  {/* Title */}
                  <h3 className="font-heading font-black text-base sm:text-lg text-black uppercase tracking-tight leading-tight mb-2">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[11px] sm:text-xs text-black/80 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                {/* Optional Loaner Note & Organizer Contact on Racket Card */}
                {item.hasLoanerNote && (
                  <div className="mt-3 pt-2.5 border-t border-black/15 w-full">
                    <p className="text-[10px] sm:text-[11px] font-bold text-black leading-snug mb-2">
                      If you don't have one, contact organizer to check if a loaner is available!
                    </p>
                    <a
                      href={`https://wa.me/${BRAND_CONFIG.contacts.whatsapp}?text=Hi%20NAADANSMASH!%20I'm%20joining%20the%20upcoming%20session%20and%20wanted%20to%20check%20if%20a%20loaner%20racket%20is%20available.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-black hover:bg-black/80 text-[#ffd400] text-[10px] font-mono uppercase font-bold tracking-wider transition-colors shadow-xs"
                    >
                      <MessageCircle className="w-3 h-3 text-[#ffd400]" />
                      <span>Ask Organizer</span>
                    </a>
                  </div>
                )}

                {/* Bottom subtle fold corner decoration */}
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-gradient-to-tl from-black/20 to-transparent rounded-br-2xl pointer-events-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Court Amenities & Action Bar — Compact 1-Page Fit */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.04] backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-white/90">
            <Sparkles className="w-4 h-4 text-[#ffd400] shrink-0" />
            <span>Court bookings, organized match play & post-game Kerala chai are all taken care of.</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onJoinClick}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#ffd400] hover:bg-[#ffe14d] text-brand-black font-heading font-extrabold text-xs uppercase tracking-wider transition-all shadow-md transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Join Next Game</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Community;
