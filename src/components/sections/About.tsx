import React from 'react';
import { CORE_PILLARS, BRAND_CONFIG } from '../../data/communityData';
import { CheckCircle2 } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <section id="about" className="py-16 sm:py-20 bg-brand-offwhite relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-black/[0.08] text-brand-black text-[11px] font-mono uppercase tracking-[0.2em] mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-teal" />
            <span>01 / ABOUT THE MOVEMENT</span>
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tightest text-brand-black uppercase leading-[1.05] mb-4">
            NOT JUST A GAME.<br />
            <span>IT'S OUR COMMUNITY.</span>
          </h2>
          <p className="text-sm sm:text-base text-brand-charcoal/80 leading-relaxed font-normal">
            In the heart of Kochi, Kerala, we built NAADANSMASH for players who want more than just an empty court. We created a weekend home where badminton enthusiasts, weekend hobbyists, busy working professionals, and newcomers gather for competitive games and genuine camaraderie.
          </p>
        </div>

        {/* Feature Split: Story & Real Session Photo Frame */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-14">
          <div className="lg:col-span-7 space-y-4 text-brand-charcoal">
            <h3 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-brand-black">
              Born from a simple love for the shuttle in Kochi.
            </h3>
            <p className="leading-relaxed text-xs sm:text-sm text-brand-charcoal/85">
              Finding quality court time, consistent playing partners, and a zero-pressure environment shouldn’t be a hassle. We set out to streamline weekend badminton in Kochi: reserved multi-court facilities, organized doubles match rotations, and an energetic circle of friends waiting for you at the net.
            </p>
            <p className="leading-relaxed text-xs sm:text-sm text-brand-charcoal/85">
              Whether you’re smashing steep angles down the line or just rediscovering your service touch after years away from the court, there is always an open spot for you in our circle.
            </p>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-black/[0.08] shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                <span className="font-medium text-brand-black">Open to All Skill Levels</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-black/[0.08] shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                <span className="font-medium text-brand-black">Organized Match Play</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-black/[0.08] shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                <span className="font-medium text-brand-black">Premier Kochi Badminton Arenas</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-black/[0.08] shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                <span className="font-medium text-brand-black">Post-Match Chai & Culture</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden bg-white border border-black/[0.08] shadow-subtle">
              <div className="relative aspect-[4/3] overflow-hidden bg-brand-charcoal">
                <img
                  src="/images/gallery/team-huddle.jpg"
                  alt="NAADANSMASH Kochi community briefing"
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div className="p-5 bg-white border-t border-black/[0.08]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-heading font-bold text-sm text-brand-black">Pre-Game Court Gathering</div>
                    <div className="text-xs text-brand-muted">{BRAND_CONFIG.location.city}, {BRAND_CONFIG.location.state}</div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-brand-offwhite text-brand-black border border-black/[0.08] text-[10px] font-mono uppercase tracking-wider">
                    Past Session Capture
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The 3 Core Pillars: 01 PLAY, 02 CONNECT, 03 REPEAT */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-muted font-bold block mb-1">
              THE MANIFESTO
            </span>
            <h3 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-brand-black uppercase">
              THE THREE PILLARS
            </h3>
            <p className="text-xs sm:text-sm text-brand-charcoal/70 mt-1">
              The rhythm that guides every weekend session in Kochi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {CORE_PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="bg-white rounded-2xl p-6 sm:p-7 border border-black/[0.08] shadow-xs hover:border-brand-teal/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5 pb-4 border-b border-black/[0.06]">
                    <span className="font-heading font-extrabold text-3xl text-brand-black">
                      {pillar.num}
                    </span>
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-brand-offwhite text-brand-charcoal border border-black/[0.06]">
                      {pillar.tag}
                    </span>
                  </div>

                  <h4 className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight text-brand-black mb-2.5 uppercase">
                    {pillar.title}
                  </h4>

                  <p className="text-brand-charcoal/80 text-xs sm:text-sm leading-relaxed mb-5">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-black/[0.06]">
                  <ul className="space-y-2">
                    {pillar.details.map((detail) => (
                      <li key={detail} className="text-xs font-medium text-brand-charcoal/90 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-teal shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
