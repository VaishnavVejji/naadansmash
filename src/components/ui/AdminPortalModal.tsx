import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Lock, 
  UserCheck, 
  Users, 
  CheckCircle, 
  Search, 
  LogOut, 
  Save, 
  Settings, 
  QrCode, 
  MessageCircle, 
  AlertCircle,
  FileImage,
  Clock,
  XCircle,
  Mail,
  Eye,
  EyeOff,
  Send,
  ExternalLink,
  Check,
  Download,
  History,
  PlusCircle
} from 'lucide-react';
import { DatabaseEvent, PaymentStatus, AttendanceStatus } from '../../types';
import { eventsService } from '../../services/eventsService';
import { emailService } from '../../services/emailService';
import { 
  getOrganiserWhatsAppNumber, 
  getFormattedOrganiserWhatsApp, 
  saveOrganiserWhatsAppNumber 
} from '../../utils/whatsapp';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  events?: DatabaseEvent[];
  onEventUpdated: () => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  events,
  onEventUpdated,
}) => {
  // Auth state
  const [session, setSession] = useState<{ userId: string; email: string; role: string; fullName: string } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Events list state
  const [allEvents, setAllEvents] = useState<DatabaseEvent[]>(events || []);

  // Dashboard tab state: roster | event | communications
  const [activeTab, setActiveTab] = useState<'roster' | 'event' | 'communications'>('roster');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingScreenshot, setViewingScreenshot] = useState<{
    url: string;
    playerName: string;
    regNo: string;
  } | null>(null);

  // Event editing state
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('17:30');
  const [endTime, setEndTime] = useState('20:30');
  const [venue, setVenue] = useState('');
  const [fee, setFee] = useState(250);
  const [maxParticipants, setMaxParticipants] = useState(24);
  const [status, setStatus] = useState('published');
  const [description, setDescription] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCreatingNewEvent, setIsCreatingNewEvent] = useState(false);
  const [viewingAuditPlayer, setViewingAuditPlayer] = useState<any | null>(null);

  // Payment Rejection Dialog state
  const [rejectingPlayer, setRejectingPlayer] = useState<{
    id: string;
    name: string;
    regNo: string;
    email?: string;
  } | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('12-digit UTR reference was not found in bank credits.');
  const [rejectionSubmitting, setRejectionSubmitting] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Communications & Email (Resend) Settings state
  const [resendApiKey, setResendApiKey] = useState('');
  const [resendFromEmail, setResendFromEmail] = useState('');
  const [showResendKey, setShowResendKey] = useState(false);
  const [organiserWhatsApp, setOrganiserWhatsApp] = useState('8304883872');
  const [commSaveSuccess, setCommSaveSuccess] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string; id?: string } | null>(null);

  const populateEventForm = useCallback((ev: DatabaseEvent) => {
    setTitle(ev.title);
    setEventDate(ev.event_date);
    setStartTime(ev.start_time.slice(0, 5));
    setEndTime(ev.end_time.slice(0, 5));
    setVenue(ev.venue);
    setFee(ev.registration_fee);
    setMaxParticipants(ev.max_participants);
    setStatus(ev.status);
    setDescription(ev.description);

    eventsService.getPaymentSettings().then((pay) => {
      setUpiId(pay.upi_id);
      setAccountName(pay.account_display_name);
    });
  }, []);

  // Initialize session, active event, and communications config once when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const existing = eventsService.getAdminSession();
    setSession(existing);

    const commConfig = emailService.getConfig();
    setResendApiKey(commConfig.apiKey);
    setResendFromEmail(commConfig.fromEmail);
    setOrganiserWhatsApp(getOrganiserWhatsAppNumber());
    setTestEmailRecipient(existing?.email || 'player.verify@naadansmash.com');

    let isMounted = true;
    const initList = async () => {
      const list = events && events.length > 0 ? events : await eventsService.getEvents();
      if (!isMounted) return;
      setAllEvents(list);
      const activeEvent = list.find((e) => e.status === 'published') || list[0];
      if (activeEvent) {
        setSelectedEventId(activeEvent.id);
        populateEventForm(activeEvent);
      }
    };
    initList();

    return () => {
      isMounted = false;
    };
  }, [isOpen, populateEventForm]);

  const loadRoster = useCallback(async (evId: string) => {
    if (!evId) return;
    setRosterLoading(true);
    try {
      const data = await eventsService.getEventRegistrations(evId);
      setRegistrations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRosterLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session && selectedEventId) {
      loadRoster(selectedEventId);
    }
  }, [session, selectedEventId, loadRoster]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    const res = await eventsService.adminLogin(email.trim(), password.trim());
    setAuthLoading(false);

    if (res.success && res.user) {
      setSession({
        userId: res.user.id || 'admin',
        email: res.user.email || email.trim() || 'organizer@naadansmash.com',
        role: res.role || 'organizer',
        fullName: res.user.user_metadata?.full_name || 'Coach / Organizer',
      });
      setEmail('');
      setPassword('');
    } else {
      setAuthError(res.message);
    }
  };

  const handleLogout = async () => {
    await eventsService.adminLogout();
    setSession(null);
  };

  const handleAttendanceChange = async (regId: string, newStatus: AttendanceStatus) => {
    await eventsService.updateRegistrationAttendance(regId, newStatus);
    setRegistrations((prev) =>
      prev.map((r) => (r.id === regId ? { ...r, attendance_status: newStatus } : r))
    );
  };

  const handlePaymentChange = async (regId: string, newStatus: PaymentStatus, reason?: string) => {
    const result = await eventsService.updateRegistrationPayment(regId, newStatus, reason);
    setRegistrations((prev) =>
      prev.map((r) =>
        r.id === regId
          ? {
              ...r,
              payment_status: newStatus,
              rejection_reason: newStatus === 'rejected' ? reason : undefined,
              registration_status:
                newStatus === 'verified'
                  ? 'confirmed'
                  : newStatus === 'rejected'
                  ? 'rejected'
                  : 'payment_submitted',
            }
          : r
      )
    );

    if (newStatus === 'verified') {
      setFeedbackBanner({
        message: result.emailResult?.sent
          ? `✓ Payment verified. Confirmation email sent via Resend (Provider ID: ${result.emailResult.id}).`
          : `✓ Payment verified. Participant confirmed (YOU'RE IN!).`,
        type: 'success',
      });
      setTimeout(() => setFeedbackBanner(null), 4000);
    } else if (newStatus === 'rejected') {
      setFeedbackBanner({
        message: result.emailResult?.sent
          ? `Payment rejected. Notification email sent via Resend with organiser contact instructions.`
          : `Payment rejected. Reason stored and visible in participant lookup.`,
        type: 'info',
      });
      setTimeout(() => setFeedbackBanner(null), 4000);
    }
  };

  const openRejectionDialog = (player: any) => {
    setRejectingPlayer({
      id: player.id,
      name: player.full_name,
      regNo: player.registration_number,
      email: player.email,
    });
    setRejectionReasonInput('12-digit UTR reference was not found in bank credits.');
  };

  const handleConfirmRejection = async () => {
    if (!rejectingPlayer) return;
    setRejectionSubmitting(true);
    try {
      await handlePaymentChange(rejectingPlayer.id, 'rejected', rejectionReasonInput.trim());
      setRejectingPlayer(null);
    } finally {
      setRejectionSubmitting(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEvent(true);
    setSaveSuccess(false);

    if (isCreatingNewEvent) {
      const created = await eventsService.createEvent({
        title,
        description,
        event_date: eventDate,
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
        end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
        venue,
        registration_fee: Number(fee),
        max_participants: Number(maxParticipants),
        status: status as any,
      });

      setAllEvents((prev) => [...prev, created]);
      setSelectedEventId(created.id);
      setIsCreatingNewEvent(false);
    } else {
      const currentEvent = allEvents.find((ev) => ev.id === selectedEventId);
      if (!currentEvent) return;

      const updated: DatabaseEvent = {
        ...currentEvent,
        title,
        event_date: eventDate,
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
        end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
        venue,
        registration_fee: Number(fee),
        max_participants: Number(maxParticipants),
        status: status as any,
        description,
      };

      await eventsService.updateEventManually(updated);
      setAllEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
    }

    if (upiId.trim()) {
      await eventsService.updatePaymentSettings({
        upi_id: upiId.trim(),
        account_display_name: accountName.trim() || 'NAADANSMASH Kochi Sports Club',
      });
    }

    setSavingEvent(false);
    setSaveSuccess(true);
    onEventUpdated();
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportCSV = () => {
    const selectedEvent = allEvents.find((e) => e.id === selectedEventId);
    const rows = [
      [
        'Registration Number',
        'Player Name',
        'Phone',
        'Email',
        'Skill Level',
        'Playing Category',
        'Payment Status',
        'Attendance Status',
        'UTR Reference',
        'Rejection Reason',
        'Registered At',
      ],
      ...filteredRegistrations.map((p) => [
        `"${p.registration_number || ''}"`,
        `"${(p.full_name || '').replace(/"/g, '""')}"`,
        `"${p.phone || ''}"`,
        `"${p.email || ''}"`,
        `"${p.skill_level || ''}"`,
        `"${p.playing_category || ''}"`,
        `"${p.payment_status || ''}"`,
        `"${p.attendance_status || ''}"`,
        `"${p.utr_reference || ''}"`,
        `"${(p.rejection_reason || '').replace(/"/g, '""')}"`,
        `"${p.created_at || ''}"`,
      ]),
    ];

    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `naadansmash-roster-${selectedEvent?.event_date || 'session'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveCommunications = (e: React.FormEvent) => {
    e.preventDefault();
    emailService.saveConfig(resendApiKey, resendFromEmail);
    if (organiserWhatsApp.trim()) {
      saveOrganiserWhatsAppNumber(organiserWhatsApp.trim());
    }
    setCommSaveSuccess(true);
    setTimeout(() => setCommSaveSuccess(false), 3000);
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient || !testEmailRecipient.includes('@')) {
      setTestEmailResult({
        success: false,
        message: 'Please enter a valid recipient email address.',
      });
      return;
    }

    setSendingTestEmail(true);
    setTestEmailResult(null);
    try {
      const res = await emailService.testConnection(testEmailRecipient.trim());
      setTestEmailResult(res);
    } finally {
      setSendingTestEmail(false);
    }
  };

  if (!isOpen) return null;

  // Filter registrations by search query
  const filteredRegistrations = registrations.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.full_name?.toLowerCase().includes(q) ||
      r.phone?.includes(q) ||
      r.registration_number?.toLowerCase().includes(q) ||
      r.skill_level?.toLowerCase().includes(q) ||
      r.utr_reference?.toLowerCase().includes(q)
    );
  });

  const presentCount = registrations.filter((r) => r.attendance_status === 'present').length;
  const verifiedCount = registrations.filter((r) => r.payment_status === 'verified').length;
  const rejectedCount = registrations.filter((r) => r.payment_status === 'rejected').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative bg-white rounded-3xl max-w-4xl w-full border border-black/[0.08] shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-brand-black text-white flex items-center justify-between shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-charcoal text-brand-teal flex items-center justify-center border border-white/10">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-base text-white uppercase tracking-tight">
                  Organizer & Coach Portal
                </h3>
                {session && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase">
                    Admin Active
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-white/60">
                {session ? `Logged in as ${session.fullName} (${session.email})` : 'Court check-in & event management'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {session && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                title="Log out of admin session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {!session ? (
            /* 1. ADMIN LOGIN VIEW */
            <div className="max-w-md mx-auto py-8">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-brand-offwhite border border-black/[0.08] text-brand-teal flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <UserCheck className="w-7 h-7" />
                </div>
                <h4 className="font-heading font-extrabold text-2xl text-brand-black uppercase">
                  Organizer Sign In
                </h4>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                  Sign in with your Supabase credentials or organizer PIN to manage court rosters, verify payments, and update sessions.
                </p>
              </div>

              {authError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                    Email / Username
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="organizer@naadansmash.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm focus:border-brand-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                    Password / Organizer PIN
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm focus:border-brand-teal"
                  />
                </div>

                <div className="p-3 rounded-xl bg-brand-offwhite border border-black/[0.06] text-[11px] text-brand-charcoal/80 space-y-1">
                  <span className="font-mono font-bold text-brand-black block">Quick Access Credentials:</span>
                  <div className="flex justify-between font-mono text-xs">
                    <span>Organizer Password:</span>
                    <strong className="text-brand-teal">naadansmash2026</strong>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 px-6 rounded-full bg-brand-teal hover:bg-[#126f8c] text-white font-heading font-semibold text-xs uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{authLoading ? 'Verifying...' : 'Sign In as Organizer'}</span>
                </button>
              </form>
            </div>
          ) : (
            /* 2. ADMIN DASHBOARD VIEW */
            <div>
              {/* Feedback Banner (e.g. on Payment Verification / Rejection) */}
              {feedbackBanner && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-mono mb-4 flex items-center gap-2 border ${
                    feedbackBanner.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : feedbackBanner.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  {feedbackBanner.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>{feedbackBanner.message}</span>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-black/[0.08] pb-4">
                <div className="inline-flex rounded-xl bg-brand-offwhite p-1 border border-black/[0.08] flex-wrap gap-1">
                  <button
                    onClick={() => setActiveTab('roster')}
                    className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'roster'
                        ? 'bg-brand-black text-white shadow-xs'
                        : 'text-brand-charcoal hover:text-brand-black'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Court Check-in ({registrations.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('event')}
                    className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'event'
                        ? 'bg-brand-black text-white shadow-xs'
                        : 'text-brand-charcoal hover:text-brand-black'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Event & QR</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('communications')}
                    className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'communications'
                        ? 'bg-brand-black text-white shadow-xs'
                        : 'text-brand-charcoal hover:text-brand-black'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email & WhatsApp</span>
                  </button>
                </div>

                {/* Session Selector & Add Event Button */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-brand-muted uppercase">Session:</span>
                  <select
                    value={selectedEventId}
                    onChange={(e) => {
                      setIsCreatingNewEvent(false);
                      setSelectedEventId(e.target.value);
                      const ev = allEvents.find((item) => item.id === e.target.value);
                      if (ev) populateEventForm(ev);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-brand-offwhite border border-black/[0.08] text-xs font-mono font-semibold"
                  >
                    {allEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({ev.event_date})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewEvent(true);
                      setActiveTab('event');
                      setTitle(`Weekend Evening Smash — Session #${allEvents.length + 1}`);
                      setEventDate(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
                      setStartTime('17:30');
                      setEndTime('20:30');
                      setVenue('Flymate Badminton Hub, Kakkanad, Kochi');
                      setFee(250);
                      setMaxParticipants(24);
                      setStatus('published');
                      setDescription('Weekend evening badminton meetup session. 3 hours of structured doubles rotations paired by skill level with refreshments included.');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-brand-teal hover:bg-[#126f8c] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-colors flex items-center gap-1 shrink-0"
                    title="Create New Event Session"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">New Event</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: PLAYER ATTENDANCE & COURT CHECK-IN */}
              {activeTab === 'roster' && (
                <div className="space-y-6">
                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-brand-offwhite border border-black/[0.08]">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted block">
                        Total Registered
                      </span>
                      <span className="font-heading font-extrabold text-2xl text-brand-black">
                        {registrations.length}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 block">
                        Court Present
                      </span>
                      <span className="font-heading font-extrabold text-2xl text-emerald-700">
                        {presentCount}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-brand-teal block">
                        Payment Verified
                      </span>
                      <span className="font-heading font-extrabold text-2xl text-brand-teal">
                        {verifiedCount}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-rose-800 block">
                        Payment Rejected
                      </span>
                      <span className="font-heading font-extrabold text-2xl text-rose-700">
                        {rejectedCount}
                      </span>
                    </div>
                  </div>

                  {/* Search Filter & CSV Export */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Filter by player name, phone, UTR or reg # (e.g. NS-2611...)"
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-brand-offwhite border border-black/[0.08] text-xs font-mono"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="px-4 py-2 rounded-xl bg-brand-offwhite border border-black/[0.08] hover:bg-black/[0.04] text-brand-black text-xs font-mono font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-2xs"
                      title="Download court roster as CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-brand-teal" />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  {/* Player Roster List */}
                  {rosterLoading ? (
                    <div className="py-12 text-center text-xs font-mono text-brand-muted">
                      Loading participant court roster...
                    </div>
                  ) : filteredRegistrations.length === 0 ? (
                    <div className="py-12 text-center text-xs font-mono text-brand-muted">
                      No registrations found matching your query.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredRegistrations.map((player) => (
                        <div
                          key={player.id}
                          className="p-4 rounded-2xl bg-white border border-black/[0.08] hover:border-black/20 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-heading font-bold text-base text-brand-black">
                                {player.full_name}
                              </span>
                              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-brand-offwhite border border-black/[0.08] text-brand-teal font-semibold">
                                {player.registration_number}
                              </span>
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-black/[0.04] text-brand-charcoal uppercase">
                                {player.skill_level}
                              </span>

                              {/* Payment Status Tag */}
                              {player.payment_status === 'verified' && (
                                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                                  ✓ Paid
                                </span>
                              )}
                              {player.payment_status === 'rejected' && (
                                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold uppercase">
                                  ✗ Rejected
                                </span>
                              )}
                              {player.payment_status === 'pending' && (
                                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase">
                                  Pending
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs font-mono text-brand-muted flex-wrap">
                              <span>📱 {player.phone}</span>
                              {player.email && <span>✉ {player.email}</span>}
                              {player.utr_reference && (
                                <span>
                                  UTR:{' '}
                                  <strong className="text-brand-black">{player.utr_reference}</strong>
                                </span>
                              )}
                              {player.payment_screenshot_path && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setViewingScreenshot({
                                      url: player.payment_screenshot_path,
                                      playerName: player.full_name,
                                      regNo: player.registration_number,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 text-brand-teal hover:underline font-semibold"
                                >
                                  <FileImage className="w-3.5 h-3.5" />
                                  <span>View Receipt</span>
                                </button>
                              )}
                            </div>

                            {/* Rejection Reason Display if Rejected */}
                            {player.payment_status === 'rejected' && player.rejection_reason && (
                              <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-[11px] font-mono text-rose-900 mt-1">
                                <strong>Rejection Reason:</strong> "{player.rejection_reason}"
                              </div>
                            )}
                          </div>

                          {/* Quick Toggles: Attendance & Payment */}
                          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                            {/* Payment Audit History link */}
                            <button
                              type="button"
                              onClick={() => setViewingAuditPlayer(player)}
                              className="p-2 rounded-lg bg-brand-offwhite border border-black/[0.08] hover:text-brand-teal hover:bg-black/[0.02] transition-colors text-brand-charcoal"
                              title="View Payment Audit History"
                            >
                              <History className="w-4 h-4 text-brand-teal" />
                            </button>

                            {/* WhatsApp link to player */}
                            <a
                              href={`https://wa.me/91${player.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(player.full_name)}!%20Organizers%20checking%20in%20from%20NAADANSMASH%20regarding%20today's%20session.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-brand-offwhite border border-black/[0.08] hover:text-emerald-700 hover:bg-emerald-50 transition-colors text-brand-charcoal"
                              title="Message attendee on WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4 text-emerald-600" />
                            </a>

                            {/* Attendance Toggle */}
                            <div className="flex items-center rounded-lg bg-brand-offwhite p-1 border border-black/[0.08] text-xs font-mono">
                              <button
                                onClick={() => handleAttendanceChange(player.id, 'present')}
                                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                                  player.attendance_status === 'present'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-brand-charcoal hover:text-emerald-700'
                                }`}
                              >
                                ✓ Present
                              </button>
                              <button
                                onClick={() => handleAttendanceChange(player.id, 'registered')}
                                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                                  player.attendance_status === 'registered'
                                    ? 'bg-brand-black text-white shadow-xs'
                                    : 'text-brand-muted hover:text-brand-black'
                                }`}
                              >
                                Registered
                              </button>
                              <button
                                onClick={() => handleAttendanceChange(player.id, 'absent')}
                                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                                  player.attendance_status === 'absent'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-brand-muted hover:text-rose-700'
                                }`}
                              >
                                Absent
                              </button>
                            </div>

                            {/* Payment 3-Way Action Toggle: Paid / Pending / Reject */}
                            <div className="flex items-center rounded-lg bg-brand-offwhite p-1 border border-black/[0.08] text-xs font-mono">
                              <button
                                onClick={() => handlePaymentChange(player.id, 'verified')}
                                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                                  player.payment_status === 'verified'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-brand-charcoal hover:text-emerald-700'
                                }`}
                                title="Verify payment (marks confirmed)"
                              >
                                ✓ Paid
                              </button>
                              <button
                                onClick={() => handlePaymentChange(player.id, 'pending')}
                                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                                  player.payment_status === 'pending'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'text-brand-muted hover:text-amber-700'
                                }`}
                                title="Mark pending"
                              >
                                Pending
                              </button>
                              <button
                                onClick={() => openRejectionDialog(player)}
                                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                                  player.payment_status === 'rejected'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-brand-muted hover:text-rose-700'
                                }`}
                                title="Reject payment with reason"
                              >
                                ✗ Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: EVENT & QR SETTINGS */}
              {activeTab === 'event' && (
                <form onSubmit={handleSaveEvent} className="space-y-4">
                  {isCreatingNewEvent && (
                    <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-brand-teal text-xs font-mono font-semibold flex items-center justify-between">
                      <span>Creating New Badminton Event Session</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingNewEvent(false);
                          const ev = allEvents.find((e) => e.id === selectedEventId) || allEvents[0];
                          if (ev) populateEventForm(ev);
                        }}
                        className="text-[10px] text-brand-charcoal hover:underline uppercase"
                      >
                        Cancel / Revert
                      </button>
                    </div>
                  )}

                  {saveSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-mono font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Event and payment settings updated in database! Changes reflect immediately on public site.</span>
                    </div>
                  )}

                  {/* Quick Next Session Registration Status Banner / Controls */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-brand-offwhite border border-black/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            status === 'published'
                              ? 'bg-emerald-500 animate-pulse'
                              : status === 'closed'
                              ? 'bg-rose-600'
                              : status === 'in_progress'
                              ? 'bg-amber-500'
                              : 'bg-brand-charcoal'
                          }`}
                        />
                        <span className="font-heading font-bold text-xs uppercase tracking-wider text-brand-black">
                          Registration Status:{' '}
                          {status === 'published'
                            ? 'Open for Registration'
                            : status === 'closed'
                            ? 'Registration Closed (Sign-ups Disabled)'
                            : status === 'in_progress'
                            ? 'In Progress / Planning (No Sessions Planned)'
                            : status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-brand-charcoal/80 mt-1">
                        {status === 'published'
                          ? 'Public site displays the session card and actively accepts registrations.'
                          : status === 'closed'
                          ? 'Public site displays REGISTRATION CLOSED. Nobody else can register.'
                          : status === 'in_progress'
                          ? 'Public site displays the "NEXT GAME COMING SOON" planning banner.'
                          : `Session status is ${status}.`}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {status !== 'published' && (
                        <button
                          type="button"
                          onClick={() => setStatus('published')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-semibold uppercase tracking-wider shadow-xs transition-colors flex items-center gap-1.5"
                          title="Open registration for this session"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Open Registration</span>
                        </button>
                      )}

                      {status !== 'closed' && (
                        <button
                          type="button"
                          onClick={() => setStatus('closed')}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-semibold uppercase tracking-wider shadow-xs transition-colors flex items-center gap-1.5"
                          title="Close registration so nobody else can register"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Close Registration</span>
                        </button>
                      )}

                      {status !== 'in_progress' && (
                        <button
                          type="button"
                          onClick={() => setStatus('in_progress')}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-mono font-semibold uppercase tracking-wider shadow-xs transition-colors flex items-center gap-1.5"
                          title="Put in progress (show Coming Soon banner when no sessions planned)"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Put In Progress</span>
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
                        onChange={(e) => setStatus(e.target.value)}
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
                        End Time (Evening)
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
                        Registration Fee (₹ INR)
                      </label>
                      <input
                        type="number"
                        value={fee}
                        onChange={(e) => setFee(Number(e.target.value))}
                        required
                        min={0}
                        className="w-full px-3.5 py-2 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-brand-charcoal mb-1">
                        Maximum Capacity (Players)
                      </label>
                      <input
                        type="number"
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(Number(e.target.value))}
                        required
                        min={4}
                        max={60}
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
                          placeholder="e.g. psivaram17-1@oksbi"
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
                          placeholder="e.g. Sivaram P Babu (NAADANSMASH)"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-black/[0.08] text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-black/[0.08]">
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-black/[0.08] shrink-0 bg-brand-offwhite flex items-center justify-center p-0.5">
                        <img
                          src="/images/qr.jpeg"
                          alt="Official UPI QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-xs">
                        <div className="font-mono font-bold text-brand-black">Official QR Code Photo Active</div>
                        <div className="text-brand-muted text-[11px]">Displayed to participants across registration & ticket lookup</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-black/[0.08]">
                    <button
                      type="submit"
                      disabled={savingEvent}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-teal hover:bg-[#126f8c] text-white text-xs font-mono uppercase tracking-widest transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingEvent ? 'Saving...' : isCreatingNewEvent ? 'Create & Publish New Session' : 'Save & Publish Event'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: COMMUNICATIONS & RESEND EMAIL */}
              {activeTab === 'communications' && (
                <div className="space-y-6">
                  {commSaveSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-mono font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Communications configuration updated successfully!</span>
                    </div>
                  )}

                  {/* Resend Integration Card */}
                  <form onSubmit={handleSaveCommunications} className="p-5 rounded-2xl bg-brand-offwhite border border-black/[0.08] space-y-4">
                    <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-brand-teal" />
                        <h4 className="font-heading font-extrabold text-sm uppercase text-brand-black">
                          Resend Email Notification Integration
                        </h4>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        resendApiKey && resendApiKey.startsWith('re_')
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {resendApiKey && resendApiKey.startsWith('re_') ? 'Key Configured' : 'Key Missing'}
                      </span>
                    </div>

                    <p className="text-xs text-brand-charcoal/80 leading-relaxed">
                      NAADANSMASH sends automated, transactional emails for <strong>Registration Received</strong>, <strong>Payment Verified</strong>, and <strong>Payment Rejected</strong> via Resend. Deliveries are reported strictly when confirmed by the Resend API.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                          Resend API Key (starts with re_)
                        </label>
                        <div className="relative">
                          <input
                            type={showResendKey ? 'text' : 'password'}
                            value={resendApiKey}
                            onChange={(e) => setResendApiKey(e.target.value)}
                            placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white border border-black/[0.08] text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowResendKey(!showResendKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-black transition-colors"
                          >
                            {showResendKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <span className="text-[10px] text-brand-muted mt-1 block">
                          Generate in your dashboard at <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-brand-teal hover:underline inline-flex items-center gap-0.5">resend.com <ExternalLink className="w-2.5 h-2.5" /></a>
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                          From Sender Address
                        </label>
                        <input
                          type="text"
                          value={resendFromEmail}
                          onChange={(e) => setResendFromEmail(e.target.value)}
                          placeholder="NAADANSMASH <onboarding@resend.dev>"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/[0.08] text-xs font-mono"
                        />
                        <span className="text-[10px] text-brand-muted mt-1 block">
                          Use Resend's free onboarding sender (<code>onboarding@resend.dev</code>) for testing, or your verified domain.
                        </span>
                      </div>
                    </div>

                    {/* WhatsApp Configuration in Settings */}
                    <div className="pt-4 border-t border-black/[0.06] space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        <h4 className="font-heading font-extrabold text-sm uppercase text-brand-black">
                          Official Organiser WhatsApp Number
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                            Contact Phone (Digits only)
                          </label>
                          <input
                            type="text"
                            value={organiserWhatsApp}
                            onChange={(e) => setOrganiserWhatsApp(e.target.value)}
                            placeholder="8304883872"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/[0.08] text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                            Formatted Organiser Display
                          </label>
                          <div className="px-3.5 py-2.5 rounded-xl bg-black/[0.04] text-xs font-mono font-bold text-brand-black">
                            {getFormattedOrganiserWhatsApp()} (Sivaram)
                          </div>
                        </div>
                      </div>

                      <p className="text-[10px] text-brand-muted leading-relaxed">
                        WhatsApp buttons across registration confirmation and lookup modals prefill standard messages directed to this verified number. Messages are reviewed and sent by the user in their own WhatsApp client.
                      </p>
                    </div>

                    <div className="pt-3 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-black hover:bg-brand-charcoal text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Communication Settings</span>
                      </button>
                    </div>
                  </form>

                  {/* Resend Connection Test Card */}
                  <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-4">
                    <div className="flex items-center gap-2 text-brand-charcoal">
                      <Send className="w-4 h-4 text-brand-teal" />
                      <h4 className="font-heading font-extrabold text-sm uppercase text-brand-black">
                        Send Resend Test Email
                      </h4>
                    </div>

                    <p className="text-xs text-brand-charcoal/80 leading-relaxed">
                      Dispatch a real test notification to verify your API credentials. Delivery is reported as successful strictly when confirmed with a valid Resend dispatch ID.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="email"
                        value={testEmailRecipient}
                        onChange={(e) => setTestEmailRecipient(e.target.value)}
                        placeholder="your.email@example.com"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-brand-offwhite border border-black/[0.08] text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleSendTestEmail}
                        disabled={sendingTestEmail}
                        className="px-5 py-2.5 rounded-xl bg-brand-teal hover:bg-[#126f8c] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-colors disabled:opacity-50 shrink-0"
                      >
                        {sendingTestEmail ? 'Sending via Resend...' : 'Test Connection'}
                      </button>
                    </div>

                    {testEmailResult && (
                      <div
                        className={`p-3.5 rounded-xl text-xs font-mono flex items-start gap-2.5 border ${
                          testEmailResult.success
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-rose-50 border-rose-200 text-rose-950'
                        }`}
                      >
                        {testEmailResult.success ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <strong className="block font-semibold">
                            {testEmailResult.success ? '✓ Resend Confirmed Delivery' : 'Resend Dispatch Notice'}
                          </strong>
                          <span>{testEmailResult.message}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* REJECTION REASON DIALOG MODAL */}
      {rejectingPlayer && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="relative bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-black/10 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h4 className="font-heading font-extrabold text-base uppercase text-brand-black">
                  Reject Payment Details
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setRejectingPlayer(null)}
                className="p-1.5 rounded-full hover:bg-black/[0.04] text-brand-muted hover:text-brand-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-brand-offwhite text-xs font-mono space-y-1">
              <div>
                <span className="text-brand-muted">Player: </span>
                <strong className="text-brand-black">{rejectingPlayer.name}</strong>
              </div>
              <div>
                <span className="text-brand-muted">Reg #: </span>
                <strong className="text-brand-teal">{rejectingPlayer.regNo}</strong>
              </div>
              {rejectingPlayer.email && (
                <div>
                  <span className="text-brand-muted">Email: </span>
                  <span className="text-brand-charcoal">{rejectingPlayer.email}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal">
                Select or Customize Rejection Reason:
              </label>

              {/* Quick preset buttons */}
              <div className="space-y-1.5">
                {[
                  '12-digit UTR reference was not found in bank credits.',
                  'Transferred amount does not match the registration fee.',
                  'Duplicate transaction reference previously submitted.',
                  'Transaction receipt screenshot or UTR reference is illegible.',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectionReasonInput(preset)}
                    className={`w-full text-left p-2 rounded-lg text-[11px] font-mono border transition-all ${
                      rejectionReasonInput === preset
                        ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                        : 'bg-white border-black/[0.08] text-brand-charcoal hover:bg-black/[0.02]'
                    }`}
                  >
                    • {preset}
                  </button>
                ))}
              </div>

              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                rows={3}
                required
                placeholder="Enter detailed reason for payment rejection..."
                className="w-full p-3 rounded-xl bg-brand-offwhite border border-black/[0.08] text-xs font-mono focus:border-rose-500"
              />
            </div>

            <p className="text-[10px] text-brand-muted leading-relaxed">
              When confirmed, the participant's status will update to <strong>Payment Rejected</strong>. They will see this reason in their ticket lookup along with instructions to contact the organiser on WhatsApp. If an email is on file, a notification will be dispatched via Resend.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.08]">
              <button
                type="button"
                onClick={() => setRejectingPlayer(null)}
                className="px-4 py-2 rounded-xl bg-brand-offwhite text-brand-charcoal hover:bg-black/[0.04] text-xs font-mono uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejectionSubmitting || !rejectionReasonInput.trim()}
                onClick={handleConfirmRejection}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {rejectionSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Audit History Modal */}
      {viewingAuditPlayer && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-black/10 flex flex-col max-h-[85vh]">
            <div className="p-4 bg-brand-black text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-brand-teal" />
                <div>
                  <h4 className="font-heading font-extrabold text-sm uppercase text-white">
                    Payment & Attendance Audit History
                  </h4>
                  <p className="text-[11px] font-mono text-white/70">
                    {viewingAuditPlayer.full_name} • {viewingAuditPlayer.registration_number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingAuditPlayer(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1 bg-brand-offwhite/50">
              {(!viewingAuditPlayer.payment_audit_history || viewingAuditPlayer.payment_audit_history.length === 0) ? (
                <div className="p-6 text-center text-xs font-mono text-brand-muted bg-white rounded-2xl border border-black/[0.08]">
                  <p>No audit events recorded yet for this participant.</p>
                  <p className="text-[10px] text-brand-charcoal/60 mt-1">
                    Initial status: {viewingAuditPlayer.payment_status} • Registered: {viewingAuditPlayer.created_at?.slice(0, 10)}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {viewingAuditPlayer.payment_audit_history.map((entry: any, i: number) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-white border border-black/[0.08] shadow-2xs space-y-1 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          entry.action === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : entry.action === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : entry.action === 'utr_submitted' || entry.action === 're_submitted'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-brand-offwhite text-brand-black'
                        }`}>
                          {entry.action.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-brand-muted">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>

                      {entry.note && (
                        <p className="text-brand-charcoal pt-0.5 font-medium">
                          {entry.note}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-brand-muted pt-1 border-t border-black/[0.04]">
                        <span>Actor: <strong className="text-brand-black capitalize">{entry.actor}</strong></span>
                        {entry.newStatus && <span>Status: <strong className="capitalize">{entry.newStatus}</strong></span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-white border-t border-black/[0.08] flex items-center justify-between">
              <span className="text-[10px] font-mono text-brand-muted">
                Audit trail immutable in current session
              </span>
              <button
                type="button"
                onClick={() => setViewingAuditPlayer(null)}
                className="px-4 py-1.5 rounded-xl bg-brand-black text-white text-xs font-mono uppercase tracking-wider font-semibold hover:bg-brand-charcoal transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Screenshot Preview Modal */}
      {viewingScreenshot && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-black/10 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-brand-black text-white flex items-center justify-between">
              <div>
                <h4 className="font-heading font-extrabold text-sm uppercase text-white">
                  Payment Screenshot
                </h4>
                <p className="text-[11px] font-mono text-white/70">
                  {viewingScreenshot.playerName} • {viewingScreenshot.regNo}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingScreenshot(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-black/5 overflow-auto flex items-center justify-center min-h-[300px]">
              <img
                src={viewingScreenshot.url}
                alt={`Payment receipt for ${viewingScreenshot.playerName}`}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-md border border-black/10"
              />
            </div>

            <div className="p-3 bg-brand-offwhite border-t border-black/[0.08] flex items-center justify-between">
              <span className="text-[11px] font-mono text-brand-muted">
                Uploaded by attendee during registration
              </span>
              <button
                type="button"
                onClick={() => setViewingScreenshot(null)}
                className="px-4 py-1.5 rounded-xl bg-brand-black text-white text-xs font-mono uppercase tracking-wider font-semibold hover:bg-brand-charcoal transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
