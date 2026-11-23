import React from 'react';
import { ArrowUp, Mail, MessageCircle, MapPin, Lock } from 'lucide-react';
import { InstagramIcon } from '../ui/Icons';
import { BRAND_CONFIG } from '../../data/communityData';

interface FooterProps {
  onAdminClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-brand-black text-white pt-20 pb-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-white/10">
          {/* Brand Column */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-6">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-white p-1 border border-white/20 shrink-0">
                  <img
                    src="/images/naadansmash-logo.png"
                    alt="NAADANSMASH Official Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-2xl tracking-tight text-white">
                    {BRAND_CONFIG.name}
                  </h3>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/60">
                    {BRAND_CONFIG.location.city}, {BRAND_CONFIG.location.state}
                  </p>
                </div>
              </div>

              <p className="font-heading font-bold text-xl text-white tracking-wider mb-4">
                {BRAND_CONFIG.tagline}
              </p>
              
              <p className="text-white/70 text-sm leading-relaxed max-w-sm mb-6 font-normal">
                Kochi's grassroots badminton movement. Bringing players together for competitive weekend evening games, genuine community connection, and healthy competition.
              </p>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 text-white/90 text-xs font-mono border border-white/10">
                <MapPin className="w-3.5 h-3.5 text-brand-teal" />
                <span>Kochi, Kerala, India</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-white/50 mb-6 font-semibold">
              NAVIGATION
            </h4>
            <ul className="space-y-3 text-xs font-mono uppercase tracking-wider">
              <li>
                <a href="#home" className="text-white/70 hover:text-white transition-colors">
                  01 / Home
                </a>
              </li>
              <li>
                <a href="#about" className="text-white/70 hover:text-white transition-colors">
                  02 / About
                </a>
              </li>
              <li>
                <a href="#events" className="text-white/70 hover:text-white transition-colors">
                  03 / Match Sessions
                </a>
              </li>
              <li>
                <a href="#gallery" className="text-white/70 hover:text-white transition-colors">
                  04 / Session Photos
                </a>
              </li>
              <li>
                <a href="#organizers" className="text-white/70 hover:text-white transition-colors">
                  05 / Organizers & Media Team
                </a>
              </li>
              <li>
                <a href="#what-to-bring" className="text-white/70 hover:text-white transition-colors">
                  06 / What to Bring
                </a>
              </li>
              <li>
                <a href="#contact" className="text-white/70 hover:text-white transition-colors">
                  07 / Contact Venue
                </a>
              </li>
            </ul>
          </div>

          {/* Connect & Social */}
          <div className="md:col-span-4">
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-white/50 mb-6 font-semibold">
              CONNECT
            </h4>
            <p className="text-xs text-white/70 mb-5 leading-relaxed">
              We announce session slots and drop weekend timings on WhatsApp and Instagram.
            </p>

            <div className="flex flex-col gap-3 text-xs font-mono">
              <a
                href={`https://wa.me/${BRAND_CONFIG.contacts.whatsapp}?text=Hi%20NAADANSMASH!`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-brand-teal" />
                <span>WhatsApp: {BRAND_CONFIG.contacts.whatsappFormatted}</span>
              </a>

              <a
                href={BRAND_CONFIG.contacts.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
              >
                <InstagramIcon className="w-4 h-4 text-brand-teal" />
                <span>Instagram: @{BRAND_CONFIG.contacts.instagram}</span>
              </a>

              <a
                href={`mailto:${BRAND_CONFIG.contacts.email}`}
                className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
              >
                <Mail className="w-4 h-4 text-brand-teal" />
                <span>{BRAND_CONFIG.contacts.email}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/50">
          <div>
            © {new Date().getFullYear()} NAADANSMASH. Kochi, Kerala. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            {onAdminClick && (
              <a
                href="/admin"
                onClick={(e) => {
                  e.preventDefault();
                  onAdminClick();
                }}
                className="inline-flex items-center gap-1.5 text-white/50 hover:text-white transition-colors cursor-pointer"
                title="Dedicated Organizer and Match Management Portal"
              >
                <Lock className="w-3 h-3 text-brand-teal" />
                <span>Admin Website</span>
              </a>
            )}
            <span>Premium Sports Community</span>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
              aria-label="Back to top"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
