import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  Bell, 
  Info, 
  Edit3, 
  Check, 
  Search, 
  Lock,
  Folder,
  Camera,
  Images
} from 'lucide-react';
import { DatabaseEvent, GalleryImage } from '../../types';
import { eventsService } from '../../services/eventsService';
import { BRAND_CONFIG } from '../../data/communityData';
import { FIRST_SESSION_IMAGES, SECOND_SESSION_IMAGES } from '../../data/galleryData';

interface EventsProps {
  onRegisterClick: (event: DatabaseEvent) => void;
  onOpenAlertModal: () => void;
  onOpenOrganizerEditModal: (event: DatabaseEvent) => void;
  onOpenLookupModal: () => void;
  onOpenAdminModal?: () => void;
  onOpenPhotoLightbox?: (images: GalleryImage[], index: number) => void;
}

const DEFAULT_HISTORICAL_S2: DatabaseEvent = {
  id: '33333333-3333-3333-3333-333333333333',
  title: 'Weekend Evening Smash — Session #2',
  description: 'Our second high-energy session. 24 players on court for fast-paced doubles rotations, tournament feather shuttles, and authentic community connections.',
  event_date: '2026-11-22',
  start_time: '17:30:00',
  end_time: '20:30:00',
  venue: 'Cochin Sports Arena, Edappally, Kochi',
  registration_fee: 250,
  max_participants: 24,
  registration_deadline: '2026-11-22T16:00:00+05:30',
  status: 'completed',
  created_at: '2026-11-10T10:00:00+05:30',
  available_slots: 0,
  isHistorical: true,
};

export const Events: React.FC<EventsProps> = ({ 
  onRegisterClick, 
  onOpenAlertModal,
  onOpenOrganizerEditModal,
  onOpenLookupModal,
  onOpenAdminModal,
  onOpenPhotoLightbox
}) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [pastFolderFilter, setPastFolderFilter] = useState<'all' | 's2' | 's1'>('all');
  const [events, setEvents] = useState<DatabaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [forceComingSoon, setForceComingSoon] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await eventsService.getEvents();
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Historical events: Session #1 and Session #2
  const baseHistorical = events.filter(
    (e) => e.isHistorical || (e.event_date <= '2026-11-22' && e.status === 'completed')
  );
  const hasS2 = baseHistorical.some(
    (e) => e.event_date === '2026-11-22' || (e.title.includes('Session #2') && e.status === 'completed')
  );
  const historicalEvents = hasS2 ? baseHistorical : [DEFAULT_HISTORICAL_S2, ...baseHistorical];

  const upcomingEvents = forceComingSoon 
    ? [] 
    : events.filter(
        (e) => !e.isHistorical && e.event_date > '2026-11-22' && e.status === 'published'
      );

  const inProgressEvent = events.find(
    (e) => !e.isHistorical && (e.status === 'in_progress' || e.status === 'draft')
  );
  const targetEditEvent = upcomingEvents[0] || inProgressEvent;

  return (
    <section id="events" className="py-16 sm:py-20 bg-white relative border-t border-b border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-black/[0.08] pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-offwhite border border-black/[0.08] text-brand-black text-[11px] font-mono uppercase tracking-[0.2em] mb-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-teal" />
              <span>02 / MATCH RESERVATION</span>
            </div>
            <h2 className="font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tightest text-brand-black uppercase leading-[1.05]">
              THE NEXT GAME <br />
              <span>STARTS HERE.</span>
            </h2>
            <p className="text-xs sm:text-sm text-brand-charcoal/80 mt-2 max-w-2xl leading-relaxed">
              Sessions happen on weekends during evening hours scheduled by our coach. Lock your spot below.
            </p>
          </div>

          {/* Controls: Tabs & Actions */}
          <div className="mt-8 md:mt-0 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="inline-flex rounded-xl bg-brand-offwhite p-1 border border-black/[0.08]">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold rounded-lg transition-all ${
                  activeTab === 'upcoming'
                    ? 'bg-brand-black text-white shadow-xs'
                    : 'text-brand-charcoal hover:text-brand-black'
                }`}
              >
                Upcoming Session ({upcomingEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold rounded-lg transition-all ${
                  activeTab === 'past'
                    ? 'bg-brand-black text-white shadow-xs'
                    : 'text-brand-charcoal hover:text-brand-black'
                }`}
              >
                Past Events ({historicalEvents.length})
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenLookupModal}
                className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-3 py-2 rounded-lg border border-black/[0.12] hover:bg-brand-offwhite text-brand-black transition-colors"
                title="Access your registration confirmation and details"
              >
                <Search className="w-3.5 h-3.5 text-brand-teal" />
                <span>My Ticket</span>
              </button>

              {onOpenAdminModal && (
                <button
                  onClick={onOpenAdminModal}
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-3 py-2 rounded-lg bg-brand-black text-white hover:bg-brand-charcoal transition-colors"
                  title="Organizers & Coaches: Player court check-in, attendance & payment verification"
                >
                  <Lock className="w-3.5 h-3.5 text-brand-teal" />
                  <span>Court Check-in</span>
                </button>
              )}

              {activeTab === 'upcoming' && (
                <>
                  <button
                    onClick={() => setForceComingSoon(!forceComingSoon)}
                    className="text-[11px] font-mono px-3 py-2 rounded-lg border border-black/[0.12] hover:bg-brand-offwhite text-brand-charcoal transition-colors"
                    title="Toggle Coming Soon empty state"
                  >
                    {forceComingSoon ? 'Show Scheduled' : 'Preview Empty State'}
                  </button>

                  {targetEditEvent && (
                    <button
                      onClick={() => onOpenOrganizerEditModal(targetEditEvent)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-3 py-2 rounded-lg border border-black/[0.12] hover:bg-brand-offwhite text-brand-charcoal transition-colors"
                      title="Organizers: Update the next event details manually"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-brand-teal" />
                      <span>Quick Edit</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center text-brand-muted font-mono text-xs uppercase tracking-widest">
            Loading session details from database...
          </div>
        )}

        {/* Tab 1: UPCOMING EVENTS VIEW */}
        {!loading && activeTab === 'upcoming' && (
          <div>
            {upcomingEvents.length === 0 ? (
              /* REQUIRED STATE: NEXT GAME COMING SOON */
              <div className="bg-brand-offwhite rounded-3xl p-10 sm:p-16 border border-black/[0.08] text-center max-w-3xl mx-auto shadow-subtle animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-white border border-black/[0.08] flex items-center justify-center mx-auto mb-6 text-brand-teal shadow-xs">
                  <Bell className="w-7 h-7" />
                </div>

                <div className="inline-block px-3 py-1 rounded-full bg-brand-black text-white text-[10px] font-mono font-semibold uppercase tracking-[0.2em] mb-4">
                  {inProgressEvent?.status === 'in_progress' ? 'COACH SCHEDULING IN PROGRESS' : 'COACH SCHEDULING'}
                </div>

                <h3 className="font-heading font-extrabold text-3xl sm:text-5xl text-brand-black uppercase tracking-tight mb-4">
                  {inProgressEvent?.status === 'in_progress' ? 'NEXT SESSION IN PROGRESS' : 'NEXT GAME COMING SOON'}
                </h3>

                <p className="text-base text-brand-charcoal/80 max-w-lg mx-auto leading-relaxed mb-8">
                  {inProgressEvent?.status === 'in_progress'
                    ? 'Our coach and organizers are currently finalizing court availability and evening timings for the upcoming session. Stay tuned or join the WhatsApp broadcast below to receive instant notification the moment registration opens!'
                    : 'Weekend evening court sessions are finalized and posted manually once court availability is confirmed by our coach. Join the broadcast to be alerted the moment registration opens.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left max-w-xl mx-auto">
                  <div className="p-4 bg-white rounded-xl border border-black/[0.08]">
                    <div className="text-[10px] font-mono text-brand-muted uppercase tracking-wider font-semibold">Cadence</div>
                    <div className="font-bold text-sm text-brand-black mt-0.5">Weekends</div>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-black/[0.08]">
                    <div className="text-[10px] font-mono text-brand-muted uppercase tracking-wider font-semibold">Timing</div>
                    <div className="font-bold text-sm text-brand-black mt-0.5">Evenings (By Coach)</div>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-black/[0.08]">
                    <div className="text-[10px] font-mono text-brand-muted uppercase tracking-wider font-semibold">Location</div>
                    <div className="font-bold text-sm text-brand-black mt-0.5">Kochi, Kerala</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={onOpenAlertModal}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-brand-teal hover:bg-[#126f8c] text-white font-heading font-semibold text-xs uppercase tracking-widest transition-all"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Get Notified First</span>
                  </button>

                  <a
                    href={`https://wa.me/${BRAND_CONFIG.contacts.whatsapp}?text=Hi%20NAADANSMASH!%20Please%20add%20me%20to%20the%20weekend%20game%20announcements%20broadcast.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white border border-black/[0.12] hover:bg-brand-offwhite text-brand-black font-heading font-medium text-xs uppercase tracking-widest transition-all"
                  >
                    <span>Join WhatsApp Broadcast</span>
                    <ArrowRight className="w-4 h-4 text-brand-teal" />
                  </a>
                </div>
              </div>
            ) : (
              /* PREMIUM EVENT-BOOKING PLATFORM CARD */
              <div className="max-w-4xl mx-auto">
                {upcomingEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="bg-brand-offwhite rounded-3xl border border-black/[0.08] shadow-subtle hover:shadow-premium transition-all duration-300 overflow-hidden"
                  >
                    {/* Top Ticket Header */}
                    <div className="p-4 sm:p-6 bg-white border-b border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider ${
                          (evt.available_slots ?? evt.max_participants) > 0 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${
                            (evt.available_slots ?? evt.max_participants) > 0 ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'
                          }`} />
                          {(evt.available_slots ?? evt.max_participants) > 0 ? 'Registration Open' : 'Slots Full'}
                        </span>
                        <span className="text-xs font-mono text-brand-muted uppercase">
                          Kochi Chapter
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-mono uppercase tracking-wider text-brand-muted">
                          Entry Fee:
                        </span>
                        <span className="font-heading font-extrabold text-2xl sm:text-3xl text-brand-black">
                          ₹{evt.registration_fee}
                        </span>
                        <span className="text-xs text-brand-muted">/ player</span>
                      </div>
                    </div>

                    {/* Middle Card Content */}
                    <div className="p-5 sm:p-6 space-y-4">
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-1.5">
                          <h3 className="font-heading font-extrabold text-xl sm:text-3xl text-brand-black tracking-tight uppercase">
                            {evt.title}
                          </h3>
                          <button
                            onClick={() => onOpenOrganizerEditModal(evt)}
                            className="shrink-0 p-1.5 rounded-lg text-brand-muted hover:text-brand-black hover:bg-white border border-transparent hover:border-black/[0.08] transition-colors"
                            title="Organizer: Edit this event"
                          >
                            <Edit3 className="w-4 h-4 text-brand-teal" />
                          </button>
                        </div>
                        <p className="text-xs sm:text-sm text-brand-charcoal/80 leading-relaxed max-w-3xl">
                          {evt.description}
                        </p>
                      </div>

                      {/* Detail Metrics Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-black/[0.06]">
                          <div className="flex items-center gap-2 text-brand-muted text-[10px] font-mono uppercase tracking-wider mb-0.5">
                            <Calendar className="w-3.5 h-3.5 text-brand-teal" />
                            <span>Date</span>
                          </div>
                          <div className="font-heading font-bold text-sm sm:text-base text-brand-black">
                            {new Date(evt.event_date).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </div>

                        <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-black/[0.06]">
                          <div className="flex items-center gap-2 text-brand-muted text-[10px] font-mono uppercase tracking-wider mb-0.5">
                            <Clock className="w-3.5 h-3.5 text-brand-teal" />
                            <span>Evening Time (By Coach)</span>
                          </div>
                          <div className="font-heading font-bold text-sm sm:text-base text-brand-black">
                            {evt.start_time.slice(0, 5)} – {evt.end_time.slice(0, 5)}
                          </div>
                        </div>

                        <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-black/[0.06]">
                          <div className="flex items-center gap-2 text-brand-muted text-[10px] font-mono uppercase tracking-wider mb-0.5">
                            <MapPin className="w-3.5 h-3.5 text-brand-teal" />
                            <span>Venue</span>
                          </div>
                          <div className="font-heading font-bold text-sm sm:text-base text-brand-black truncate">
                            {evt.venue}
                          </div>
                          <div className="text-[10px] text-brand-muted truncate">
                            Kochi, Kerala
                          </div>
                        </div>
                      </div>

                      {/* Inclusion Highlights */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-brand-charcoal pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-brand-teal" />
                          <span>Feather shuttles</span>
                        </div>
                        <span className="text-black/20">•</span>
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-brand-teal" />
                          <span>Quality indoor arena courts</span>
                        </div>
                        <span className="text-black/20">•</span>
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-brand-teal" />
                          <span>Coach-balanced doubles rotations</span>
                        </div>
                      </div>

                      {/* Capacity Progress Bar */}
                      <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-black/[0.06]">
                        <div className="flex items-center justify-between text-xs mb-2 font-mono">
                          <span className="text-brand-charcoal uppercase flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-brand-teal" />
                            <span>Player Roster Capacity</span>
                          </span>
                          <span className="font-bold text-brand-black">
                            {evt.available_slots ?? evt.max_participants} of {evt.max_participants} Slots Available
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-brand-offwhite overflow-hidden">
                          <div
                            className="h-full bg-brand-teal rounded-full transition-all duration-500"
                            style={{
                              width: `${((evt.max_participants - (evt.available_slots ?? evt.max_participants)) / evt.max_participants) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="p-4 sm:p-6 bg-white border-t border-black/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-[11px] text-brand-muted text-center sm:text-left">
                        * Pay via UPI or Cash directly at the venue. Atomic database protection prevents duplicate bookings.
                      </div>

                      {(evt.available_slots ?? evt.max_participants) > 0 ? (
                        <button
                          onClick={() => onRegisterClick(evt)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-7 rounded-full bg-brand-teal hover:bg-[#126f8c] text-white font-heading font-semibold text-xs uppercase tracking-widest transition-all duration-200 shadow-sm"
                        >
                          <span>RESERVE A SPOT</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={onOpenAlertModal}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-4 px-8 rounded-full bg-brand-black text-white font-heading font-medium text-xs sm:text-sm uppercase tracking-widest"
                        >
                          <span>JOIN WAITLIST</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: HISTORICAL / PAST SESSIONS VIEW */}
        {activeTab === 'past' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header & Folder Filter Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-brand-offwhite border border-black/[0.08]">
              <div className="flex items-center gap-2.5 text-xs text-brand-charcoal">
                <Info className="w-4 h-4 text-brand-teal shrink-0" />
                <span>
                  <strong>Concluded Matches:</strong> High-resolution session captures organized by event folders.
                </span>
              </div>

              {/* Folder Selector Pills */}
              <div className="inline-flex rounded-xl bg-white p-1 border border-black/[0.08] shadow-2xs shrink-0 text-xs font-mono">
                <button
                  onClick={() => setPastFolderFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    pastFolderFilter === 'all'
                      ? 'bg-brand-black text-white font-semibold'
                      : 'text-brand-muted hover:text-brand-black'
                  }`}
                >
                  All ({historicalEvents.length})
                </button>
                <button
                  onClick={() => setPastFolderFilter('s2')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    pastFolderFilter === 's2'
                      ? 'bg-brand-black text-white font-semibold'
                      : 'text-brand-muted hover:text-brand-black'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5 text-brand-teal" />
                  <span>Session #2 ({SECOND_SESSION_IMAGES.length})</span>
                </button>
                <button
                  onClick={() => setPastFolderFilter('s1')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    pastFolderFilter === 's1'
                      ? 'bg-brand-black text-white font-semibold'
                      : 'text-brand-muted hover:text-brand-black'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5 text-brand-teal" />
                  <span>Session #1 ({FIRST_SESSION_IMAGES.length})</span>
                </button>
              </div>
            </div>

            {/* Concluded Session Cards */}
            <div className="grid grid-cols-1 gap-6">
              {historicalEvents
                .filter((evt) => {
                  if (pastFolderFilter === 'all') return true;
                  const isS1 = evt.title.includes('Session #1') || evt.event_date === '2026-11-15';
                  return pastFolderFilter === 's1' ? isS1 : !isS1;
                })
                .map((evt) => {
                  const isS1 = evt.title.includes('Session #1') || evt.event_date === '2026-11-15';
                  const sessionFolder = isS1
                    ? {
                        folderName: 'first session',
                        folderDisplay: 'public/images/first session/',
                        images: FIRST_SESSION_IMAGES,
                      }
                    : {
                        folderName: 'second sesssion',
                        folderDisplay: 'public/images/second sesssion/',
                        images: SECOND_SESSION_IMAGES,
                      };

                  return (
                    <div
                      key={evt.id}
                      className="bg-brand-offwhite rounded-3xl p-6 sm:p-7 border border-black/[0.08] shadow-xs space-y-5"
                    >
                      {/* Top Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-black text-white text-[10px] font-mono font-semibold uppercase tracking-wider">
                              <CheckCircle className="w-3.5 h-3.5 text-brand-teal" />
                              Concluded Match Session
                            </span>
                            <span className="text-xs font-mono text-brand-muted">
                              Full Attendance ({evt.max_participants}/{evt.max_participants} Players)
                            </span>
                          </div>

                          <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-brand-black uppercase">
                            {evt.title}
                          </h3>
                          <p className="text-xs text-brand-charcoal/70 font-mono mt-0.5">
                            Concluded on {new Date(evt.event_date).toLocaleDateString('en-IN', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })} • {evt.start_time.slice(0, 5)} – {evt.end_time.slice(0, 5)} • {evt.venue}
                          </p>
                        </div>

                        <button
                          onClick={() => onOpenPhotoLightbox?.(sessionFolder.images, 0)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-black hover:bg-brand-charcoal text-white text-xs font-mono uppercase tracking-wider font-semibold shadow-xs transition-colors shrink-0"
                        >
                          <Camera className="w-3.5 h-3.5 text-brand-teal" />
                          <span>View Folder Photos ({sessionFolder.images.length})</span>
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm text-brand-charcoal/80 leading-relaxed max-w-3xl">
                        {evt.description}
                      </p>

                      {/* Session Photo Folder Strip */}
                      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-black/[0.08] space-y-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                          <div className="flex items-center gap-2 text-brand-black font-semibold">
                            <Folder className="w-4 h-4 text-brand-teal shrink-0" />
                            <span>
                              Folder: <code className="font-normal text-brand-teal bg-brand-offwhite px-2 py-0.5 rounded border border-black/[0.06]">{sessionFolder.folderDisplay}</code>
                            </span>
                          </div>
                          <span className="text-brand-muted text-[11px] uppercase tracking-wider">
                            {sessionFolder.images.length} Match & Community Photos Captured
                          </span>
                        </div>

                        {/* Photo Thumbnail Strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
                          {sessionFolder.images.slice(0, 5).map((img, idx) => {
                            const isFifth = idx === 4;
                            const remainingCount = sessionFolder.images.length - 5;
                            return (
                              <div
                                key={img.id}
                                onClick={() => onOpenPhotoLightbox?.(sessionFolder.images, idx)}
                                className="group relative rounded-xl overflow-hidden aspect-[4/3] bg-brand-charcoal cursor-pointer border border-black/[0.08] shadow-2xs"
                                title={`Click to preview: ${img.title}`}
                              >
                                <img
                                  src={img.src}
                                  alt={img.title}
                                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />

                                {isFifth && remainingCount > 0 && (
                                  <div className="absolute inset-0 bg-brand-black/75 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-2 text-center group-hover:bg-brand-black/85 transition-colors">
                                    <Images className="w-4 h-4 text-brand-teal mb-1" />
                                    <span className="font-heading font-extrabold text-xs uppercase tracking-wider">
                                      +{remainingCount} More
                                    </span>
                                    <span className="text-[9px] font-mono text-white/70">
                                      Open Folder
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
