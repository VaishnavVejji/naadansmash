import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, MessageCircle, Ticket, LogOut } from 'lucide-react';
import { BRAND_CONFIG } from '../../data/communityData';

export interface PlayerSession {
  phone: string;
  fullPhone: string;
  verified: boolean;
}

interface NavbarProps {
  onJoinClick: () => void;
  onMyTicketsClick: () => void;
  onLoginClick: () => void;
  playerSession: PlayerSession | null;
  onPlayerLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onJoinClick, 
  onMyTicketsClick,
  onLoginClick,
  playerSession,
  onPlayerLogout,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Events', href: '#events' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Organizers', href: '#organizers' },
    { label: 'What to Bring', href: '#what-to-bring' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-black/[0.06] shadow-sm py-3.5'
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5 sm:py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Brand Name */}
          <a
            href="#home"
            className="flex items-center gap-3.5 group focus:outline-none shrink-0"
            aria-label="NAADANSMASH Home"
          >
            <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-full overflow-hidden bg-white border border-white/20 p-1 shadow-sm transition-transform duration-300 group-hover:scale-105 shrink-0">
              <img
                src="/images/naadansmash-logo.png"
                alt="NAADANSMASH Official Logo"
                className="w-full h-full object-contain"
                width={48}
                height={48}
              />
            </div>
            <div className="flex flex-col">
              <span
                className={`font-heading font-extrabold text-xl sm:text-2xl tracking-tight leading-none transition-colors ${
                  isScrolled ? 'text-brand-black group-hover:text-brand-teal' : 'text-white'
                }`}
              >
                NAADANSMASH
              </span>
              <span
                className={`text-[10px] tracking-[0.2em] font-semibold uppercase mt-0.5 ${
                  isScrolled ? 'text-brand-muted' : 'text-white/70'
                }`}
              >
                Kochi • Kerala
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className={`px-3.5 py-2 text-xs xl:text-sm font-semibold tracking-wide uppercase transition-colors rounded-lg ${
                  isScrolled
                    ? 'text-brand-charcoal hover:text-brand-teal hover:bg-black/[0.03]'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {/* Player My Tickets & Session */}
            {playerSession ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onMyTicketsClick}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                    isScrolled
                      ? 'bg-brand-offwhite text-brand-black hover:bg-brand-teal/10 hover:text-brand-teal border border-black/[0.08]'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                  title="View your session registrations & live status"
                >
                  <Ticket className="w-3.5 h-3.5 text-brand-teal" />
                  <span>My Tickets</span>
                </button>
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border ${
                    isScrolled
                      ? 'bg-brand-teal/10 text-brand-teal border-brand-teal/30'
                      : 'bg-white/15 text-white border-white/25'
                  }`}
                >
                  <span className="font-semibold">{playerSession.phone}</span>
                  <button
                    onClick={onPlayerLogout}
                    title="Log Out of Participant Portal"
                    className="p-1 hover:text-red-400 transition-colors"
                    aria-label="Log Out"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isScrolled
                    ? 'text-brand-charcoal hover:text-brand-teal hover:bg-black/[0.04]'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
                title="Sign in with mobile number to view tickets"
              >
                <Ticket className="w-4 h-4 text-brand-teal" />
                <span>My Tickets</span>
              </button>
            )}

            <a
              href={`https://wa.me/${BRAND_CONFIG.contacts.whatsapp}?text=Hi%20NAADANSMASH!%20I'd%20love%20to%20know%20more%20about%20joining%20the%20community%20in%20Kochi.`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center p-2.5 rounded-full transition-colors ${
                isScrolled
                  ? 'text-brand-charcoal hover:text-brand-teal hover:bg-black/[0.04]'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
              title="Chat on WhatsApp"
              aria-label="Chat on WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </a>

            <button
              onClick={onJoinClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-teal text-white font-heading font-semibold text-xs tracking-wider uppercase shadow-sm hover:bg-[#126f8c] transition-all duration-200 transform hover:-translate-y-0.5 focus:ring-2 focus:ring-brand-teal/40"
            >
              <span>Join Next Game</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile / Tablet Menu Trigger */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={onMyTicketsClick}
              className="px-3 py-1.5 rounded-full bg-white/15 text-white border border-white/20 text-[11px] font-semibold uppercase tracking-wider shadow-sm flex items-center gap-1"
            >
              <Ticket className="w-3 h-3 text-brand-teal" />
              <span>Tickets</span>
            </button>
            <button
              onClick={onJoinClick}
              className="px-3.5 py-1.5 rounded-full bg-brand-teal text-white text-xs font-semibold uppercase tracking-wider shadow-sm"
            >
              Join
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors focus:outline-none ${
                isScrolled
                  ? 'text-brand-charcoal hover:bg-black/[0.05]'
                  : 'text-white hover:bg-white/15'
              }`}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-brand-black text-white border-b border-white/10 px-5 pt-4 pb-7 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white/90 hover:text-brand-teal hover:bg-white/5 rounded-xl transition-colors"
              >
                {link.label}
              </a>
            ))}
            
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              {/* Player Status / Login */}
              {playerSession ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono text-white/90">
                      Logged in: <strong className="text-white">+91 {playerSession.phone}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onPlayerLogout();
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold uppercase"
                  >
                    Log Out
                  </button>
                </div>
              ) : null}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onMyTicketsClick();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-white/10 border border-white/15 text-white font-heading font-semibold text-xs uppercase tracking-wider hover:bg-white/15"
              >
                <Ticket className="w-4 h-4 text-brand-teal" />
                <span>{playerSession ? 'View My Tickets & Status' : 'Sign In / View Tickets'}</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onJoinClick();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-brand-teal text-white font-heading font-semibold text-xs uppercase tracking-wider shadow-sm hover:bg-[#126f8c]"
              >
                <span>Join Next Game</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <a
                href={`https://wa.me/${BRAND_CONFIG.contacts.whatsapp}?text=Hi%20NAADANSMASH!%20I'd%20love%20to%20know%20more%20about%20joining%20the%20community%20in%20Kochi.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-white/20 text-white/90 font-medium text-xs hover:bg-white/5"
              >
                <MessageCircle className="w-4 h-4 text-brand-teal" />
                <span>Chat with Organizers on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
