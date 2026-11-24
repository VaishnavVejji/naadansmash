import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ArrowRight, 
  Bell, 
  Check, 
  Search
} from 'lucide-react';
import { DatabaseEvent } from '../../types';
import { eventsService } from '../../services/eventsService';
import { BRAND_CONFIG } from '../../data/communityData';

interface EventsProps {
  onRegisterClick: (event: DatabaseEvent) => void;
  onOpenAlertModal: () => void;
  onOpenLookupModal: () => void;
}

export const Events: React.FC<EventsProps> = ({ 
  onRegisterClick, 
  onOpenAlertModal,
  onOpenLookupModal,
}) => {
  const [events, setEvents] = useState<DatabaseEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
    const handleEventUpdate = () => loadEvents();
    window.addEventListener('naadansmash_event_updated', handleEventUpdate);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadEvents(true);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    // Live cross-device sync: background poll every 8 seconds
    const pollInterval = setInterval(() => {
      loadEvents(true);
    }, 8000);
    return () => {
      window.removeEventListener('naadansmash_event_updated', handleEventUpdate);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(pollInterval);
    };
  }, []);

  const loadEvents = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const data = await eventsService.getEvents();
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const upcomingEvents = events.filter(
    (e) => !e.isHistorical && (e.status === 'published' || e.status === 'closed' || e.event_date >= '2026-11-22')
  );

  const inProgressEvent = events.find(
    (e) => !e.isHistorical && (e.status === 'in_progress' || e.status === 'draft')
  );

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
              Sessions happen on weekends during evening hours. Lock your spot below.
            </p>
          </div>

          {/* Controls & Quick Actions */}
          <div className="mt-8 md:mt-0 flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-offwhite border border-black/[0.08] text-xs font-mono text-brand-charcoal">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold uppercase tracking-wider text-brand-black">Upcoming Session</span>
            </div>

            {/* Quick Action: My Ticket */}
            <button
              onClick={onOpenLookupModal}
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider px-4 py-2 rounded-xl border border-black/[0.12] hover:bg-brand-offwhite text-brand-black transition-colors font-semibold shadow-2xs"
              title="Access your registration confirmation and details"
            >
              <Search className="w-3.5 h-3.5 text-brand-teal" />
              <span>My Ticket</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center text-brand-muted font-mono text-xs uppercase tracking-widest">
            Loading session details from database...
          </div>
        )}

        {/* UPCOMING EVENTS VIEW */}
        {!loading && (
          <div>
            {upcomingEvents.length === 0 ? (
              /* REQUIRED STATE: NEXT GAME COMING SOON */
              <div className="bg-brand-offwhite rounded-3xl p-10 sm:p-16 border border-black/[0.08] text-center max-w-3xl mx-auto shadow-subtle animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-white border border-black/[0.08] flex items-center justify-center mx-auto mb-6 text-brand-teal shadow-xs">
                  <Bell className="w-7 h-7" />
                </div>

                <div className="inline-block px-3 py-1 rounded-full bg-brand-black text-white text-[10px] font-mono font-semibold uppercase tracking-[0.2em] mb-4">
                  {inProgressEvent?.status === 'in_progress' ? 'SESSION PLANNING IN PROGRESS' : 'SESSION SCHEDULING'}
                </div>

                <h3 className="font-heading font-extrabold text-3xl sm:text-5xl text-brand-black uppercase tracking-tight mb-4">
                  {inProgressEvent?.status === 'in_progress' ? 'NEXT SESSION IN PROGRESS' : 'NEXT GAME COMING SOON'}
                </h3>

                <p className="text-base text-brand-charcoal/80 max-w-lg mx-auto leading-relaxed mb-8">
                  {inProgressEvent?.status === 'in_progress'
                    ? 'Our team is currently finalizing court availability and evening timings for the upcoming session. Stay tuned or join the WhatsApp broadcast below to receive instant notification the moment registration opens!'
                    : 'Weekend evening meetup sessions are finalized and posted once court availability is confirmed. Join the broadcast to be alerted the moment registration opens.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left max-w-xl mx-auto">
                  <div className="p-4 bg-white rounded-xl border border-black/[0.08]">
                    <div className="text-[10px] font-mono text-brand-muted uppercase tracking-wider font-semibold">Cadence</div>
                    <div className="font-bold text-sm text-brand-black mt-0.5">Weekends</div>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-black/[0.08]">
                    <div className="text-[10px] font-mono text-brand-muted uppercase tracking-wider font-semibold">Timing</div>
                    <div className="font-bold text-sm text-brand-black mt-0.5">Evenings (Meetup Session)</div>
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
                {upcomingEvents.map((evt) => {
                  const isCompleted = evt.status === 'completed';
                  const isClosed = evt.status === 'closed' || isCompleted || (evt.available_slots !== undefined && evt.available_slots <= 0);
                  const isRegistrationOpen = evt.status === 'published' && !isClosed;
                  return (
                  <div
                    key={evt.id}
                    className="bg-brand-offwhite rounded-3xl border border-black/[0.08] shadow-subtle hover:shadow-premium transition-all duration-300 overflow-hidden"
                  >
                    {/* Top Ticket Header */}
                    <div className="p-4 sm:p-6 bg-white border-b border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider ${
                          isRegistrationOpen 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${
                            isRegistrationOpen ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'
                          }`} />
                          {isRegistrationOpen
                            ? 'Registration Open'
                            : isCompleted
                            ? 'Session Completed & Closed'
                            : 'Registration Closed'}
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
                            <span>Evening Time</span>
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
                          <span>Doubles match rotations</span>
                        </div>
                        <span className="text-black/20">•</span>
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-brand-teal" />
                          <span>Quality indoor arena courts</span>
                        </div>
                        <span className="text-black/20">•</span>
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-brand-teal" />
                          <span>Balanced games for all levels</span>
                        </div>
                      </div>

                      {/* Session Status Strip (Slot counter removed per preference) */}
                      <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-black/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <Users className="w-3.5 h-3.5 text-brand-teal" />
                          <span className="text-brand-charcoal uppercase font-semibold">Weekend Doubles Session</span>
                        </div>
                        <div className="text-xs font-mono font-bold">
                          {isRegistrationOpen ? (
                            <span className="text-emerald-700 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                              Open For Registration
                            </span>
                          ) : (
                            <span className="text-rose-700 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-600" />
                              {isCompleted ? 'Session Completed' : 'Registration Closed'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="p-4 sm:p-6 bg-white border-t border-black/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-[11px] text-brand-muted text-center sm:text-left">
                        {isRegistrationOpen
                          ? '* Pay via UPI or Cash directly at the venue. Atomic database protection prevents duplicate bookings.'
                          : isCompleted
                          ? '* This match session has concluded and registrations are closed. Check back soon for the next game schedule.'
                          : '* Registrations for this session are currently closed. Join alerts below to get notified for the next game.'}
                      </div>

                      {isRegistrationOpen ? (
                        <button
                          onClick={() => onRegisterClick(evt)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-7 rounded-full bg-brand-teal hover:bg-[#126f8c] text-white font-heading font-semibold text-xs uppercase tracking-widest transition-all duration-200 shadow-sm"
                        >
                          <span>RESERVE A SPOT</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                          <button
                            disabled
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-black/10 text-brand-charcoal/50 font-heading font-semibold text-xs uppercase tracking-widest cursor-not-allowed border border-black/[0.08]"
                          >
                            <span>{isCompleted ? 'SESSION COMPLETED' : 'REGISTRATION CLOSED'}</span>
                          </button>
                          <button
                            onClick={onOpenAlertModal}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-brand-black hover:bg-black/80 text-white font-heading font-medium text-xs uppercase tracking-widest transition-colors shrink-0"
                          >
                            <span>GET ALERTS</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
