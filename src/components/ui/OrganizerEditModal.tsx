import React, { useState, useEffect } from 'react';
import { X, Check, Save, Settings, QrCode, CheckCircle, XCircle } from 'lucide-react';
import { DatabaseEvent } from '../../types';
import { eventsService } from '../../services/eventsService';

interface OrganizerEditModalProps {
  event: DatabaseEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const OrganizerEditModal: React.FC<OrganizerEditModalProps> = ({
  event,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [title, setTitle] = useState(event?.title || '');
  const [eventDate, setEventDate] = useState(event?.event_date || '');
  const [startTime, setStartTime] = useState(event?.start_time ? event.start_time.slice(0, 5) : '18:00');
  const [endTime, setEndTime] = useState(event?.end_time ? event.end_time.slice(0, 5) : '20:00');
  const [venue, setVenue] = useState(event?.venue || '');
  const [fee, setFee] = useState(event?.registration_fee ?? 250);
  const [maxParticipants, setMaxParticipants] = useState(event?.max_participants ?? 24);
  const [status, setStatus] = useState(event?.status || 'published');
  const [description, setDescription] = useState(event?.description || '');
  const [upiId, setUpiId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && event) {
      setTitle(event.title);
      setEventDate(event.event_date);
      setStartTime(event.start_time.slice(0, 5));
      setEndTime(event.end_time.slice(0, 5));
      setVenue(event.venue);
      setFee(event.registration_fee);
      setMaxParticipants(event.max_participants);
      setStatus(event.status);
      setDescription(event.description);
      eventsService.getPaymentSettings().then((settings) => {
        setUpiId(settings.upi_id);
        setAccountName(settings.account_display_name);
      });
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    const updated: DatabaseEvent = {
      ...event,
      title,
      event_date: eventDate,
      start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
      end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
      venue,
      registration_fee: Number(fee),
      max_participants: Number(maxParticipants),
      status,
      description,
    };

    await eventsService.updateEventManually(updated);

    if (upiId.trim()) {
      await eventsService.updatePaymentSettings({
        upi_id: upiId.trim(),
        account_display_name: accountName.trim() || 'NAADANSMASH Kochi Sports Club',
      });
    }

    setSaving(false);
    setSuccess(true);
    setTimeout(() => {
      onUpdated();
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="relative bg-white rounded-3xl max-w-xl w-full border border-black/[0.08] shadow-2xl overflow-hidden my-8">
        <div className="px-6 py-4 bg-brand-black text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-brand-teal" />
            <div>
              <h3 className="font-heading font-extrabold text-base text-white uppercase">
                Organizer: Event Settings & Database
              </h3>
              <p className="text-[11px] font-mono text-white/70">
                Update date, evening timings, venue, and participant capacity.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-mono font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Database event record updated successfully!</span>
            </div>
          )}

          {/* Quick Registration Status Controls */}
          <div className="p-3.5 rounded-2xl bg-brand-offwhite border border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                status === 'published' ? 'bg-emerald-500 animate-pulse' : status === 'closed' ? 'bg-rose-600' : 'bg-amber-500'
              }`} />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-black">
                Registration: {status === 'published' ? 'Open for Sign-ups' : status === 'closed' ? 'Closed' : status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {status !== 'published' && (
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span>Open Registration</span>
                </button>
              )}
              {status !== 'closed' && (
                <button
                  type="button"
                  onClick={() => setStatus('closed')}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  <span>Close Registration</span>
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-brand-charcoal mb-1">
              Event Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-brand-charcoal mb-1">
                Event Date (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-brand-charcoal mb-1">
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm font-mono"
              >
                <option value="published">Published (Open for Registration)</option>
                <option value="closed">Closed (Registration Closed — Nobody Else Can Register)</option>
                <option value="in_progress">In Progress / Scheduling (No Sessions Currently Planned)</option>
                <option value="draft">Draft (Hidden from Public)</option>
                <option value="completed">Completed (Archived in Past Events)</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-brand-charcoal mb-1">
                Start Time (Evening)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-brand-charcoal mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-brand-charcoal mb-1">
                Fee (₹ INR)
              </label>
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-brand-charcoal mb-1">
                Max Capacity (Participants)
              </label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-brand-charcoal mb-1">
              Venue Name & Address
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm"
            />
          </div>

          {/* Organizer UPI & QR Configuration */}
          <div className="p-4 rounded-2xl bg-brand-offwhite border border-black/[0.08] space-y-3">
            <div className="flex items-center gap-2 text-brand-teal font-mono text-xs uppercase tracking-wider font-semibold">
              <QrCode className="w-4 h-4" />
              <span>Organizer UPI & QR Configuration</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-brand-charcoal mb-1">
                  Organizer UPI ID
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. naadansmash@upi"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-black/[0.08] text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-brand-charcoal mb-1">
                  Account Display Name
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. NAADANSMASH Kochi Sports Club"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-black/[0.08] text-xs"
                />
              </div>
            </div>
            <p className="text-[11px] text-brand-muted">
              Updating this dynamically recalculates the vector QR code and UPI URI shown to players across the registration flow.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-brand-charcoal mb-1">
              Description & Session Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm resize-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-black/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full border border-black/[0.08] text-xs font-mono uppercase tracking-wider text-brand-charcoal hover:bg-black/[0.04]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-teal hover:bg-[#126f8c] text-white text-xs font-mono uppercase tracking-widest"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Updating Database...' : 'Save & Publish Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
