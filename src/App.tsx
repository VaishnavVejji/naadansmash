import React, { useState } from 'react';
import { Navbar, PlayerSession } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/sections/Hero';
import { About } from './components/sections/About';
import { Events } from './components/sections/Events';
import { Gallery } from './components/sections/Gallery';
import { Organizers } from './components/sections/Organizers';
import { Community } from './components/sections/Community';
import { Contact } from './components/sections/Contact';
import { RegistrationModal } from './components/ui/RegistrationModal';
import { LightboxModal } from './components/ui/LightboxModal';
import { AlertModal } from './components/ui/AlertModal';
import { LookupRegistrationModal } from './components/ui/LookupRegistrationModal';
import { AdminPortalModal } from './components/ui/AdminPortalModal';
import { PlayerAuthModal } from './components/ui/PlayerAuthModal';
import { DatabaseEvent, GalleryImage } from './types';
import { GALLERY_IMAGES } from './data/galleryData';
import { eventsService } from './services/eventsService';

export const App: React.FC = () => {
  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<DatabaseEvent | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);

  // Player session & authentication
  const [playerSession, setPlayerSession] = useState<PlayerSession | null>(() => eventsService.getPlayerSession());
  const [isPlayerAuthOpen, setIsPlayerAuthOpen] = useState(false);
  const [authIntent, setAuthIntent] = useState<'register' | 'tickets' | null>(null);

  // Key to trigger event refresh
  const [eventUpdateKey, setEventUpdateKey] = useState(0);

  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<GalleryImage[]>(GALLERY_IMAGES);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Registration & Ticket Handlers
  const handleOpenRegistration = (event?: DatabaseEvent) => {
    if (event) {
      setSelectedEvent(event);
      // Require player phone login before registering
      if (!playerSession) {
        setAuthIntent('register');
        setIsPlayerAuthOpen(true);
      } else {
        setIsRegisterOpen(true);
      }
    } else {
      const eventsElement = document.getElementById('events');
      if (eventsElement) {
        eventsElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleOpenMyTickets = () => {
    if (!playerSession) {
      setAuthIntent('tickets');
      setIsPlayerAuthOpen(true);
    } else {
      setIsLookupOpen(true);
    }
  };

  const handlePlayerAuthSuccess = (session: PlayerSession) => {
    setPlayerSession(session);
    if (authIntent === 'register' && selectedEvent) {
      setIsRegisterOpen(true);
    } else {
      setIsLookupOpen(true);
    }
    setAuthIntent(null);
  };

  const handlePlayerLogout = () => {
    eventsService.playerLogout();
    setPlayerSession(null);
  };

  const handleOpenGalleryLightbox = (_image: GalleryImage, index: number, customList?: GalleryImage[]) => {
    setLightboxImages(customList || GALLERY_IMAGES);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleNextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
  };

  const handlePrevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  const handleExploreCommunity = () => {
    const communityElement = document.getElementById('about');
    if (communityElement) {
      communityElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-offwhite text-brand-black selection:bg-brand-teal selection:text-brand-white">
      {/* Sticky Editorial Navbar */}
      <Navbar 
        onJoinClick={() => handleOpenRegistration()} 
        onMyTicketsClick={handleOpenMyTickets}
        onLoginClick={() => {
          setAuthIntent('tickets');
          setIsPlayerAuthOpen(true);
        }}
        playerSession={playerSession}
        onPlayerLogout={handlePlayerLogout}
      />

      {/* Main Content Sections */}
      <main className="flex-grow">
        {/* A. HOME / HERO with Community Group Photo Backdrop */}
        <Hero
          onJoinClick={() => handleOpenRegistration()}
          onExploreClick={handleExploreCommunity}
        />

        {/* B. ABOUT */}
        <About />

        {/* C. EVENTS (PostgreSQL-backed weekend evening sessions with atomic registration) */}
        <Events
          key={eventUpdateKey}
          onRegisterClick={(evt) => handleOpenRegistration(evt)}
          onOpenAlertModal={() => setIsAlertOpen(true)}
          onOpenLookupModal={handleOpenMyTickets}
        />

        {/* D. GALLERY (Authentic session photos from past 2 events) */}
        <Gallery onImageSelect={handleOpenGalleryLightbox} />

        {/* ORGANIZERS & COMMUNITY LEADERSHIP */}
        <Organizers />

        {/* E. COMMUNITY */}
        <Community onJoinClick={() => handleOpenRegistration()} />

        {/* F. CONTACT */}
        <Contact />
      </main>

      {/* G. FOOTER */}
      <Footer onAdminClick={() => setIsAdminPortalOpen(true)} />

      {/* Player Phone Verification Modal */}
      <PlayerAuthModal
        isOpen={isPlayerAuthOpen}
        onClose={() => {
          setIsPlayerAuthOpen(false);
          setAuthIntent(null);
        }}
        onSuccess={handlePlayerAuthSuccess}
        title={authIntent === 'register' ? 'Phone Verification Required' : 'Sign In with Mobile'}
        subtitle={
          authIntent === 'register'
            ? 'Verify your mobile number to reserve your spot and link your ticket to your account.'
            : 'Enter your 10-digit number to automatically view your session registrations and match statuses.'
        }
      />

      {/* 2-Step Registration & Approval Modal */}
      <RegistrationModal
        event={selectedEvent}
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={() => {
          setEventUpdateKey((prev) => prev + 1);
        }}
        playerPhone={playerSession?.phone}
      />

      {/* Lightbox Modal */}
      <LightboxModal
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNext={handleNextImage}
        onPrev={handlePrevImage}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
      />

      {/* My Tickets & Status Modal */}
      <LookupRegistrationModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        playerPhone={playerSession?.phone}
        onJoinClick={() => {
          setIsLookupOpen(false);
          handleOpenRegistration();
        }}
      />

      {/* Organizer & Admin Portal Modal */}
      <AdminPortalModal
        isOpen={isAdminPortalOpen}
        onClose={() => setIsAdminPortalOpen(false)}
        onEventUpdated={() => {
          setEventUpdateKey((prev) => prev + 1);
        }}
      />
    </div>
  );
};

export default App;
