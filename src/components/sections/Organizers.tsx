import React from 'react';
import { MessageCircle, Shield, Award, Sparkles, Camera } from 'lucide-react';
import { TEAM_MEMBERS } from '../../data/communityData';
import { InstagramIcon } from '../ui/Icons';

export const Organizers: React.FC = () => {
  return (
    <section id="organizers" className="py-16 sm:py-20 bg-white relative border-t border-b border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-8 border-b border-black/[0.08] pb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-offwhite border border-black/[0.08] text-brand-black text-[11px] font-mono uppercase tracking-[0.2em] mb-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-teal" />
            <span>04 / LEADERSHIP & TEAM</span>
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tightest text-brand-black uppercase leading-[1.05]">
            THE TEAM BEHIND <br />
            <span>NAADANSMASH.</span>
          </h2>
          <p className="text-xs sm:text-sm text-brand-charcoal/80 mt-2 max-w-2xl leading-relaxed">
            Every weekend session is driven by our community organizers who manage the courts, decide match schedules, and our media lead documenting the spirit of the game across Kochi.
          </p>
        </div>

        {/* 3-Column Balanced Team Grid — Fit to Viewport */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-7 mb-10">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.id}
              className="bg-brand-offwhite rounded-3xl p-5 sm:p-6 border border-black/[0.08] shadow-subtle hover:shadow-premium transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Photo Space — Generous, Well-Proportioned Frame */}
                <div className="relative mb-5 rounded-2xl overflow-hidden h-64 sm:h-72 md:h-72 lg:h-80 w-full bg-brand-charcoal border border-black/[0.08]">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className={`w-full h-full object-cover object-top transition-all duration-500 group-hover:scale-[1.03] ${
                      member.isPlaceholder ? 'filter grayscale opacity-60' : 'filter grayscale group-hover:grayscale-0'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Category / Role Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md text-white text-[11px] font-mono uppercase tracking-wider border border-white/10 flex items-center gap-1.5 shadow-xs font-semibold">
                      {member.badgeType === 'media' ? (
                        <Camera className="w-3.5 h-3.5 text-brand-teal" />
                      ) : (
                        <Award className="w-3.5 h-3.5 text-brand-teal" />
                      )}
                      <span>{member.badge}</span>
                    </span>
                  </div>

                  {member.isPlaceholder && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-white/90 bg-black/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 block text-center font-medium">
                        {member.placeholderNote || 'Organizer 2 — Details Arriving Soon'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Role Badge */}
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-brand-teal mb-2.5">
                  {member.badgeType === 'media' ? (
                    <Camera className="w-3.5 h-3.5" />
                  ) : (
                    <Shield className="w-3.5 h-3.5" />
                  )}
                  <span>{member.role}</span>
                </div>

                <h3 className="font-heading font-extrabold text-2xl lg:text-3xl text-brand-black mb-3 uppercase tracking-tight">
                  {member.name}
                </h3>

                <p className="text-sm sm:text-base text-brand-charcoal/80 leading-relaxed mb-6 font-normal">
                  {member.bio}
                </p>
              </div>

              {/* Action / Connect */}
              <div className="pt-5 border-t border-black/[0.08] flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-brand-muted">
                  Kochi Badminton
                </span>

                {member.action.type === 'whatsapp' && (
                  <a
                    href={member.action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-black hover:text-white text-brand-black border border-black/[0.08] text-xs font-mono font-semibold uppercase tracking-wider transition-all shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-brand-teal" />
                    <span>WhatsApp</span>
                  </a>
                )}

                {member.action.type === 'instagram' && (
                  <a
                    href={member.action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-black hover:text-white text-brand-black border border-black/[0.08] text-xs font-mono font-semibold uppercase tracking-wider transition-all shadow-xs"
                  >
                    <InstagramIcon className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Instagram</span>
                  </a>
                )}

                {member.action.type === 'reserved' && (
                  <span className="text-[11px] font-mono uppercase tracking-wider text-brand-muted px-3 py-1.5 rounded-full bg-white border border-black/[0.06] font-medium">
                    Space Reserved
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Badminton Meetup Clarification Box */}
        <div className="p-6 sm:p-8 rounded-2xl bg-brand-offwhite border border-black/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-black/[0.08] text-brand-teal flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-heading font-bold text-base text-brand-black">
                A Badminton Meetup — Not A Coaching Session
              </div>
              <div className="text-xs sm:text-sm text-brand-muted mt-0.5">
                NAADANSMASH is a social badminton meetup for fun, competitive weekend games. Our organizer Sivaram is an experienced coach who organizes the courts and balances player rotations so everyone enjoys great match play!
              </div>
            </div>
          </div>
          <a
            href="#events"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-black text-white text-xs font-mono uppercase tracking-wider hover:bg-brand-charcoal transition-colors shrink-0"
          >
            <span>View Next Event Status</span>
          </a>
        </div>
      </div>
    </section>
  );
};
