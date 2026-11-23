import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, MessageCircle, Ticket } from 'lucide-react';
import { BRAND_CONFIG } from '../../data/communityData';

interface NavbarProps {
  onJoinClick: () => void;
  onMyTicketsClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onJoinClick, 
  onMyTicketsClick,
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
          ? 'bg-white/95 backdrop-blur-md border-b border-black/[0.06] shadow-sm py-2.5 sm:py-3.5'
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-3 sm:py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Logo & Brand Name */}
          <a
            href="#home"
            className="flex items-center gap-2 sm:gap-3.5 group focus:outline-none shrink-0 min-w-0"
            aria-label="NAADANSMASH Home"
          >
            <div className="relative h-9 w-9 sm:h-12 sm:w-12 rounded-full overflow-hidden bg-white border border-white/20 p-0.5 sm:p-1 shadow-sm transition-transform duration-300 group-hover:scale-105 shrink-0">
              <img
                src="/images/naadansmash-logo.png"
                alt="NAADANSMASH Official Logo"
                className="w-full h-full object-contain"
                width={48}
                height={48}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className={`font-heading font-extrabold text-base sm:text-2xl tracking-tight leading-none transition-colors truncate ${
                  isScrolled ? 'text-brand-black group-hover:text-brand-teal' : 'text-white'
                }`}
              >
                NAADANSMASH
              </span>
              <span
                className={`text-[9px] sm:text-[10px] tracking-[0.12em] sm:tracking-[0.2em] font-semibold uppercase mt-0.5 ${
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
            {/* My Tickets Button */}
            <button
              onClick={onMyTicketsClick}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                isScrolled
                  ? 'bg-brand-offwhite text-brand-black hover:bg-brand-teal/10 hover:text-brand-teal border border-black/[0.08]'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
              title="Access your match tickets and live confirmation status"
            >
              <Ticket className="w-3.5 h-3.5 text-brand-teal" />
              <span>My Tickets</span>
            </button>

            {/* WhatsApp Link */}
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

            {/* Direct Join CTA */}
            <button
              onClick={onJoinClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-teal text-white font-heading font-semibold text-xs tracking-wider uppercase shadow-sm hover:bg-[#126f8c] transition-all duration-200 transform hover:-translate-y-0.5 focus:ring-2 focus:ring-brand-teal/40"
            >
              <span>Join Next Game</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile / Tablet Quick Triggers */}
          <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onMyTicketsClick}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-[11px] font-semibold uppercase tracking-wider transition-colors shadow-sm ${
                isScrolled
                  ? 'bg-brand-offwhite text-brand-black border-black/[0.1] hover:bg-black/5'
                  : 'bg-white/15 text-white border-white/20 hover:bg-white/25'
              }`}
              title="My Tickets"
            >
              <Ticket className="w-3.5 h-3.5 text-brand-teal" />
              <span>Tickets</span>
            </button>
            <button
              onClick={onJoinClick}
              className="px-3 py-1.5 rounded-full bg-brand-teal hover:bg-[#126f8c] text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-sm transition-transform active:scale-95"
            >
              Join
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-1.5 rounded-lg transition-colors focus:outline-none ${
                isScrolled
                  ? 'text-brand-charcoal hover:bg-black/[0.05]'
                  : 'text-white hover:bg-white/15'
              }`}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
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
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onMyTicketsClick();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-white/10 border border-white/15 text-white font-heading font-semibold text-xs uppercase tracking-wider hover:bg-white/15"
              >
                <Ticket className="w-4 h-4 text-brand-teal" />
                <span>View My Tickets & Status</span>
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
