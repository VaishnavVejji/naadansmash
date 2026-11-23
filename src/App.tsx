import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
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

  // Key to trigger event refresh
  const [eventUpdateKey, setEventUpdateKey] = useState(0);

  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<GalleryImage[]>(GALLERY_IMAGES);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Direct Registration & Ticket Handlers
  const handleOpenRegistration = async (event?: DatabaseEvent) => {
    if (event) {
      setSelectedEvent(event);
      setIsRegisterOpen(true);
    } else {
      try {
        const events = await eventsService.getEvents();
        const active = events.find((e: DatabaseEvent) => !e.isHistorical && (e.status === 'published' || e.status === 'closed' || e.event_date >= '2026-11-22')) || events[0];
        if (active) {
          setSelectedEvent(active);
          setIsRegisterOpen(true);
          return;
        }
      } catch {}
      const eventsElement = document.getElementById('events');
      if (eventsElement) {
        eventsElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleOpenMyTickets = () => {
    setIsLookupOpen(true);
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
      {/* Editorial Navbar with Direct Registration & Ticket Access */}
      <Navbar 
        onJoinClick={() => handleOpenRegistration()} 
        onMyTicketsClick={handleOpenMyTickets}
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

      {/* G. FOOTER with Discreet Admin / Organizer Access */}
      <Footer onAdminClick={() => setIsAdminPortalOpen(true)} />

      {/* 2-Step Registration & Approval Modal */}
      <RegistrationModal
        event={selectedEvent}
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={() => {
          setEventUpdateKey((prev) => prev + 1);
        }}
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

      {/* My Tickets & Status Modal (Phone-Driven Lookup) */}
      <LookupRegistrationModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        onJoinClick={() => {
          setIsLookupOpen(false);
          handleOpenRegistration();
        }}
      />

      {/* Organizer & Admin Portal Modal (Hidden & Authenticated) */}
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
