import React, { useState, useEffect, useCallback } from 'react';
import {
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
  Check,
  Download,
  PlusCircle as _PlusCircle,
  KeyRound,
  Trash2,
  Calendar,
  ArrowLeft,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ZoomIn,
  X,
  Phone,
  Edit3,
  Play
} from 'lucide-react';
import { DatabaseEvent, PaymentStatus, AttendanceStatus } from '../types';
import { eventsService } from '../services/eventsService';
import { emailService } from '../services/emailService';
import {
  getOrganiserWhatsAppNumber,
  saveOrganiserWhatsAppNumber
} from '../utils/whatsapp';

interface AdminPortalPageProps {
  onBackToPublicSite?: () => void;
  onEventUpdated?: () => void;
}

export const AdminPortalPage: React.FC<AdminPortalPageProps> = ({
  onBackToPublicSite,
  onEventUpdated
}) => {
  // Authentication State
  const [session, setSession] = useState<{
    userId: string;
    email?: string;
    phone?: string;
    username?: string;
    role: string;
    fullName: string;
  } | null>(null);

  const [identifier, setIdentifier] = useState('8304883872');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Stored admin credentials for viewing/updating in settings
  const [adminConfigPhone, setAdminConfigPhone] = useState('8304883872');
  const [adminConfigPassword, setAdminConfigPassword] = useState('naadansmash2026');
  const [adminCredSaved, setAdminCredSaved] = useState(false);
  const [showConfigPass, setShowConfigPass] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'roster' | 'payments' | 'schedule' | 'settings' | 'communications'>('payments');

  // Events & Session State
  const [allEvents, setAllEvents] = useState<DatabaseEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

  // Screenshot Lightbox State
  const [viewingScreenshot, setViewingScreenshot] = useState<{
    url: string;
    playerName: string;
    regNo: string;
    playerId: string;
    phone: string;
    utr?: string;
    paymentStatus?: string;
  } | null>(null);

  // Event schedule editing state
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [fee, setFee] = useState(0);
  const [maxParticipants, setMaxParticipants] = useState(24);
  const [status, setStatus] = useState('published');
  const [description, setDescription] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCreatingNewEvent, _setIsCreatingNewEvent] = useState(false);
  const [isStartEventModalOpen, setIsStartEventModalOpen] = useState(false);

  // Communications & Notifications
  const [resendApiKey, setResendApiKey] = useState('');
  const [resendFromEmail, setResendFromEmail] = useState('');
  const [organiserWhatsApp, setOrganiserWhatsApp] = useState('');
  const [commSaveSuccess, setCommSaveSuccess] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string; id?: string } | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Rejection Dialog State
  const [rejectingPlayer, setRejectingPlayer] = useState<{
    id: string;
    name: string;
    regNo: string;
    email?: string;
  } | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('12-digit UTR reference was not found in bank credits.');
  const [rejectionSubmitting, setRejectionSubmitting] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const populateEventForm = useCallback(async (evt: DatabaseEvent) => {
    setTitle(evt.title);
    setEventDate(evt.event_date);
    setStartTime(evt.start_time.slice(0, 5));
    setEndTime(evt.end_time.slice(0, 5));
    setVenue(evt.venue);
    setFee(evt.registration_fee);
    setMaxParticipants(evt.max_participants);
    setStatus(evt.status);
    setDescription(evt.description || '');

    try {
      const pSettings = await eventsService.getPaymentSettings();
      setUpiId(pSettings.upi_id);
      setAccountName(pSettings.account_display_name);
    } catch {}
  }, []);

  // Initialize data on mount
  useEffect(() => {
    const existing = eventsService.getAdminSession();
    if (existing) {
      setSession({
        userId: existing.userId || existing.id || 'organizer',
        email: existing.email || 'organizer@naadansmash.com',
        phone: existing.phone || '8304883872',
        username: existing.username || 'admin',
        role: existing.role || 'organizer',
        fullName: existing.fullName || 'Admin Organizer',
      });
    }

    const creds = eventsService.getStoredAdminCredentials();
    setAdminConfigPhone(creds.phone);
    setAdminConfigPassword(creds.password);

    const commConfig = emailService.getConfig();
    setResendApiKey(commConfig.apiKey);
    setResendFromEmail(commConfig.fromEmail);
    setOrganiserWhatsApp(getOrganiserWhatsAppNumber());
    setTestEmailRecipient(existing?.email || 'player.verify@naadansmash.com');

    const initList = async () => {
      try {
        const list = await eventsService.getEvents();
        setAllEvents(list);
        const activeEvent = list.find((e) => e.status === 'published') || list[0];
        if (activeEvent) {
          setSelectedEventId(activeEvent.id);
          populateEventForm(activeEvent);
          loadRoster(activeEvent.id, false);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    };
    initList();
  }, [populateEventForm]);

  const loadRoster = useCallback(async (evId: string, isSilent = false) => {
    if (!evId) return;
    if (!isSilent) setRosterLoading(true);
    try {
      const data = await eventsService.getEventRegistrations(evId);
      setRegistrations(data);
    } catch (e) {
      console.error('Failed to load roster:', e);
    } finally {
      if (!isSilent) setRosterLoading(false);
    }
  }, []);

  const syncAllFromCloud = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsSyncingCloud(true);
    try {
      // 1. Refresh events from cloud store
      const list = await eventsService.getEvents();
      let currentTargetId = selectedEventId;
      if (list && list.length > 0) {
        setAllEvents(list);
        currentTargetId = selectedEventId || list.find((e) => e.status === 'published')?.id || list[0].id;
        const targetEv = list.find((e) => e.id === currentTargetId) || list[0];

        if (targetEv) {
          if (!selectedEventId) {
            setSelectedEventId(targetEv.id);
          }
          // Only sync form state if user isn't actively on the schedule tab during background polling
          const isUserOnScheduleTab = activeTab === 'schedule';
          if (!isCreatingNewEvent && !savingEvent && (!isBackground || !isUserOnScheduleTab)) {
            setTitle(targetEv.title);
            setEventDate(targetEv.event_date);
            setStartTime(targetEv.start_time.slice(0, 5));
            setEndTime(targetEv.end_time.slice(0, 5));
            setVenue(targetEv.venue);
            setFee(targetEv.registration_fee);
            setMaxParticipants(targetEv.max_participants);
            setStatus(targetEv.status);
            setDescription(targetEv.description || '');
          }
        }
      }

      // 2. Refresh payment settings
      try {
        const pSettings = await eventsService.getPaymentSettings();
        if (pSettings?.upi_id) {
          const isUserOnSettingsTab = activeTab === 'settings';
          if (!isBackground || !isUserOnSettingsTab) {
            setUpiId(pSettings.upi_id);
            setAccountName(pSettings.account_display_name);
          }
        }
      } catch {}

      // 3. Refresh registrations roster
      const targetId = currentTargetId || selectedEventId;
      if (targetId) {
        await loadRoster(targetId, isBackground);
      }

      if (!isBackground) {
        setFeedbackBanner({
          message: '✓ Cloud synchronized: Event session, payment settings, and player roster are up to date.',
          type: 'success',
        });
        setTimeout(() => setFeedbackBanner(null), 3500);
      }
    } catch (err) {
      console.warn('Sync all from cloud error:', err);
    } finally {
      if (!isBackground) setIsSyncingCloud(false);
    }
  }, [selectedEventId, isCreatingNewEvent, savingEvent, loadRoster, activeTab]);

  useEffect(() => {
    if (session) {
      syncAllFromCloud(false);
      // Live cross-device sync: poll every 4 seconds for instant updates across devices
      const pollTimer = setInterval(() => {
        syncAllFromCloud(true);
      }, 4000);
      const handleVisChange = () => {
        if (document.visibilityState === 'visible') {
          syncAllFromCloud(true);
        }
      };
      const handleSyncEvent = () => {
        syncAllFromCloud(true);
      };

      document.addEventListener('visibilitychange', handleVisChange);
      window.addEventListener('focus', handleSyncEvent);
      window.addEventListener('naadansmash_event_updated', handleSyncEvent);
      window.addEventListener('naadansmash_payment_updated', handleSyncEvent);
      window.addEventListener('naadansmash_roster_updated', handleSyncEvent);

      return () => {
        clearInterval(pollTimer);
        document.removeEventListener('visibilitychange', handleVisChange);
        window.removeEventListener('focus', handleSyncEvent);
        window.removeEventListener('naadansmash_event_updated', handleSyncEvent);
        window.removeEventListener('naadansmash_payment_updated', handleSyncEvent);
        window.removeEventListener('naadansmash_roster_updated', handleSyncEvent);
      };
    }
  }, [session, selectedEventId, syncAllFromCloud]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccessMsg('');

    const res = await eventsService.adminPhonePasswordLogin(identifier, password);
    setAuthLoading(false);

    if (res.success && res.user) {
      setSession({
        userId: res.user.userId || res.user.id || 'organizer',
        email: res.user.email || 'organizer@naadansmash.com',
        phone: res.user.phone || identifier,
        username: res.user.username || 'admin',
        role: res.role || 'organizer',
        fullName: res.user.fullName || 'Admin Organizer',
      });
      setPassword('');
      setAuthError('');

      // Refresh all data from cloud immediately upon login
      syncAllFromCloud(false);
    } else {
      setAuthError(res.message);
    }
  };

  const handleUpdateAdminCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await eventsService.updateAdminCredentials(adminConfigPhone, adminConfigPassword);
    if (ok) {
      setAdminCredSaved(true);
      setTimeout(() => setAdminCredSaved(false), 3000);
    } else {
      alert('Please enter a valid 10-digit mobile number and a password of at least 6 characters.');
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
          : `✓ Payment verified! Participant confirmed with official Match Pass.`,
        type: 'success',
      });
      setTimeout(() => setFeedbackBanner(null), 4000);
    } else if (newStatus === 'rejected') {
      setFeedbackBanner({
        message: result.emailResult?.sent
          ? `Payment rejected. Notification email sent via Resend with organizer contact instructions.`
          : `Payment rejected. Reason stored and visible in participant ticket lookup.`,
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

  const handleDeleteRegistration = async (regId: string, playerName: string, playerPhone?: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${playerName}'s registration? This will permanently remove it from the roster and free phone number (${playerPhone}) so they can register again for future sessions.`
    );
    if (!confirmDelete) return;

    try {
      const ok = await eventsService.deleteRegistration(regId, playerPhone);
      if (ok) {
        setRegistrations((prev) => prev.filter((r) => r.id !== regId));
        setFeedbackBanner({
          message: `✓ Registration for ${playerName} removed. Phone ${playerPhone} can now register again.`,
          type: 'success',
        });
        setTimeout(() => setFeedbackBanner(null), 4000);
        if (onEventUpdated) onEventUpdated();
      } else {
        alert('Failed to delete registration');
      }
    } catch {
      alert('An error occurred while deleting the registration.');
    }
  };

  const handleClearSessionRegistrations = async () => {
    const targetId = selectedEventId || allEvents[0]?.id || 'all';
    const confirmClear = window.confirm(
      `⚠️ START FRESH / REMOVE ALL PAYMENT & REGISTRATION RECORDS:\n\nAre you sure you want to remove ALL ${registrations.length} payment and registration records for this event session?\n\n• All player records, payment approvals, receipts, and tickets will be cleared.\n• Court slots will be restored to maximum capacity.\n• Phone numbers will be freed so players can register afresh.\n• Changes will instantly sync to all admin devices.\n\nProceed to start fresh?`
    );
    if (!confirmClear) return;

    try {
      try {
        localStorage.removeItem('naadansmash_registrations_v2');
        localStorage.removeItem('naadansmash_registrations');
        localStorage.removeItem('naadansmash_my_tickets');
        localStorage.removeItem('naadansmash_ticket_format_map');
      } catch {}

      const ok = await eventsService.clearEventRegistrations(targetId);
      if (ok) {
        setRegistrations([]);
        setFeedbackBanner({
          message: `✓ All payment and registration records removed. You are now starting fresh with 0 registrations!`,
          type: 'success',
        });
        setTimeout(() => setFeedbackBanner(null), 5000);
        window.dispatchEvent(new CustomEvent('naadansmash_roster_updated'));
        window.dispatchEvent(new CustomEvent('naadansmash_event_updated'));
        if (onEventUpdated) onEventUpdated();
      } else {
        alert('Failed to clear session registrations');
      }
    } catch {
      alert('An error occurred while resetting the session roster.');
    }
  };

  const handleDeleteScreenshot = async (regId: string, playerName: string) => {
    const confirmDelete = window.confirm(
      `Remove payment screenshot image for ${playerName}?\n\nThis will delete the heavy image data from the database to save storage, while keeping the participant verified, their ticket, and attendance records intact.`
    );
    if (!confirmDelete) return;

    try {
      const ok = await eventsService.deleteRegistrationScreenshot(regId);
      if (ok) {
        setRegistrations((prev) =>
          prev.map((r) => (r.id === regId ? { ...r, payment_screenshot_path: null } : r))
        );
        if (viewingScreenshot?.playerId === regId) {
          setViewingScreenshot(null);
        }
        setFeedbackBanner({
          message: `✓ Payment screenshot for ${playerName} deleted. Storage freed.`,
          type: 'success',
        });
        setTimeout(() => setFeedbackBanner(null), 3500);
      }
    } catch {
      alert('Failed to delete screenshot image.');
    }
  };

  const handlePurgeSessionScreenshots = async () => {
    if (!selectedEventId) return;
    const screenshotCount = registrations.filter((r) => !!r.payment_screenshot_path).length;
    if (screenshotCount === 0) {
      alert('No screenshot images found to purge in this event session.');
      return;
    }

    const confirmPurge = window.confirm(
      `Clean Image Storage:\nAre you sure you want to delete all ${screenshotCount} payment screenshot images for this session?\n\n• Participant records, ticket numbers, attendance, and UTRs will remain completely saved in the database.\n• Only the heavy image blobs will be deleted to free database space.`
    );
    if (!confirmPurge) return;

    try {
      const res = await eventsService.purgeEventScreenshots(selectedEventId);
      if (res.success) {
        setRegistrations((prev) =>
          prev.map((r) => ({ ...r, payment_screenshot_path: null }))
        );
        setFeedbackBanner({
          message: `✓ Storage cleaned: Purged ${res.clearedCount} screenshot images. All participant data preserved.`,
          type: 'success',
        });
        setTimeout(() => setFeedbackBanner(null), 4000);
      }
    } catch {
      alert('Failed to purge screenshots.');
    }
  };

  // =========================================================================
  // 3 CORE ADMIN LIFECYCLE CONTROLS:
  // 1. Start Event (with event details) -> opens registrations on main page
  // 2. Registration Closed -> locks registrations on main page
  // 3. End Event -> completes session, main page shows "Next event will be notified soon"
  // =========================================================================

  // 1. START EVENT (OPEN REGISTRATIONS)
  const handleStartAndPublishEvent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingEvent(true);

    try {
      const targetId = selectedEventId || allEvents[0]?.id;
      const currentEvent = allEvents.find((ev) => ev.id === targetId) || allEvents[0] || ({} as DatabaseEvent);

      const updated: DatabaseEvent = {
        ...currentEvent,
        id: targetId || currentEvent.id,
        title: title.trim() || currentEvent.title,
        event_date: eventDate || currentEvent.event_date,
        start_time: startTime.length === 5 ? `${startTime}:00` : (startTime || currentEvent.start_time),
        end_time: endTime.length === 5 ? `${endTime}:00` : (endTime || currentEvent.end_time),
        venue: venue.trim() || currentEvent.venue,
        registration_fee: Number(fee) || currentEvent.registration_fee,
        max_participants: Number(maxParticipants) || currentEvent.max_participants,
        status: 'published',
        description: description.trim() || currentEvent.description,
      };

      await eventsService.updateEventManually(updated);
      setAllEvents((prev) => {
        return prev.map((ev) => (ev.id === updated.id ? updated : { ...ev, status: 'completed' as const }));
      });
      setSelectedEventId(updated.id);
      populateEventForm(updated);

      setStatus('published');
      setIsStartEventModalOpen(false);
      setFeedbackBanner({
        message: '✓ Event started! Registrations are now LIVE and OPEN on the public website.',
        type: 'success',
      });
      setTimeout(() => setFeedbackBanner(null), 5000);
      window.dispatchEvent(new CustomEvent('naadansmash_event_updated'));
      if (onEventUpdated) onEventUpdated();
    } catch (err) {
      console.error('Error starting event:', err);
      alert('Failed to start event.');
    } finally {
      setSavingEvent(false);
    }
  };

  // 2. REGISTRATION CLOSED
  const handleCloseRegistration = async () => {
    const targetId = selectedEventId || allEvents[0]?.id;
    if (!targetId) return;
    const currentEvent = allEvents.find((e) => e.id === targetId) || allEvents[0];

    const confirmClose = window.confirm(
      `Close Registrations for "${currentEvent?.title || 'Current Event'}"?\n\n• Public registration will be locked on the website.\n• Existing ${validRegistrations.length} registrations, tickets, and payment records remain safe.\n\nProceed to close registrations?`
    );
    if (!confirmClose) return;

    try {
      setSavingEvent(true);
      const updated: DatabaseEvent = {
        ...currentEvent,
        id: targetId,
        status: 'closed',
      };
      const ok = await eventsService.updateEventManually(updated);
      if (ok) {
        setStatus('closed');
        setAllEvents((prev) => prev.map((e) => (e.id === targetId ? updated : e)));
        setFeedbackBanner({
          message: '✓ Registrations closed! Public player registration is now locked on the website.',
          type: 'info',
        });
        setTimeout(() => setFeedbackBanner(null), 5000);
        window.dispatchEvent(new CustomEvent('naadansmash_event_updated'));
        if (onEventUpdated) onEventUpdated();
      } else {
        alert('Failed to close registration.');
      }
    } catch (e) {
      console.error('Error closing registration:', e);
      alert('An error occurred while closing registration.');
    } finally {
      setSavingEvent(false);
    }
  };

  // 3. END EVENT (CONCLUDE SESSION) -> Main page displays "Next event will be notified soon"
  const handleEndEvent = async () => {
    const targetId = selectedEventId || allEvents[0]?.id;
    if (!targetId) return;
    const currentEvent = allEvents.find((e) => e.id === targetId) || allEvents[0];

    const confirmEnd = window.confirm(
      `End Event Session: "${currentEvent?.title || 'Current Event'}"?\n\n• The session will be concluded and marked as 'completed'.\n• All player records, attendance, tickets, and payment history will remain safely stored.\n• The main website will immediately display "Next event will be notified soon".\n\nProceed to end event?`
    );
    if (!confirmEnd) return;

    try {
      setSavingEvent(true);
      const res = await eventsService.closeAndCompleteEvent(targetId, true);
      if (res.success) {
        setStatus('completed');
        setAllEvents((prev) =>
          prev.map((e) => (e.id === targetId ? { ...e, status: 'completed' } : e))
        );
        setRegistrations((prev) =>
          prev.map((r) => ({ ...r, payment_screenshot_path: null }))
        );
        setFeedbackBanner({
          message: '✓ Event ended! Main website now displays "Next event will be notified soon".',
          type: 'success',
        });
        setTimeout(() => setFeedbackBanner(null), 5000);
        window.dispatchEvent(new CustomEvent('naadansmash_event_updated'));
        if (onEventUpdated) onEventUpdated();
      } else {
        alert('Failed to end event.');
      }
    } catch (err) {
      console.error('Error ending event:', err);
      alert('Failed to end event.');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleReopenEvent = () => handleStartAndPublishEvent();

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEvent(true);
    setSaveSuccess(false);

    try {
      const targetId = selectedEventId || allEvents[0]?.id;
      const currentEvent = allEvents.find((ev) => ev.id === targetId) || allEvents[0] || {} as DatabaseEvent;

      const updated: DatabaseEvent = {
        ...currentEvent,
        id: targetId || currentEvent.id,
        title: title.trim(),
        event_date: eventDate,
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
        end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
        venue: venue.trim(),
        registration_fee: Number(fee),
        max_participants: Number(maxParticipants),
        status: status as any,
        description: description.trim(),
      };

      await eventsService.updateEventManually(updated);
      setAllEvents((prev) => {
        const exists = prev.some((ev) => ev.id === updated.id);
        return exists ? prev.map((ev) => (ev.id === updated.id ? updated : ev)) : [updated, ...prev];
      });
      setSelectedEventId(updated.id);
      populateEventForm(updated);

      if (upiId.trim()) {
        await eventsService.updatePaymentSettings({
          upi_id: upiId.trim(),
          account_display_name: accountName.trim() || 'NAADANSMASH Kochi Sports Club',
        });
      }

      setSaveSuccess(true);
      setFeedbackBanner({
        message: '✓ Match session schedule & settings successfully synced to cloud database!',
        type: 'success',
      });
      setTimeout(() => setFeedbackBanner(null), 4000);
      window.dispatchEvent(new CustomEvent('naadansmash_event_updated'));
      window.dispatchEvent(new CustomEvent('naadansmash_payment_updated'));
      if (onEventUpdated) onEventUpdated();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Error saving event schedule:', err);
      alert('Failed to save session changes to cloud database.');
    } finally {
      setSavingEvent(false);
    }
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

  const DUMMY_SEED_PHONES = new Set(['9998887776', '9847123456', '9447654321', '9846112233', '9876543210']);

  // Filter out any corrupted or nameless test registrations
  const validRegistrations = registrations.filter((r) => {
    if (!r) return false;
    const name = (r.full_name || '').trim();
    const phone = (r.phone || '').replace(/\D/g, '').slice(-10);
    if (!name && DUMMY_SEED_PHONES.has(phone)) return false;
    if (!name && phone.length < 10) return false;
    return true;
  });

  // Filter registrations by search query and payment filter
  const filteredRegistrations = validRegistrations.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      r.full_name?.toLowerCase().includes(q) ||
      r.phone?.includes(q) ||
      r.registration_number?.toLowerCase().includes(q) ||
      r.skill_level?.toLowerCase().includes(q) ||
      r.utr_reference?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (paymentFilter === 'pending') {
      return r.payment_status === 'submitted' || r.payment_status === 'pending';
    }
    if (paymentFilter === 'verified') {
      return r.payment_status === 'verified';
    }
    if (paymentFilter === 'rejected') {
      return r.payment_status === 'rejected';
    }
    return true;
  });

  const presentCount = validRegistrations.filter((r) => r.attendance_status === 'present').length;
  const verifiedCount = validRegistrations.filter((r) => r.payment_status === 'verified').length;
  const pendingCount = validRegistrations.filter((r) => r.payment_status === 'submitted' || r.payment_status === 'pending').length;
  const rejectedCount = validRegistrations.filter((r) => r.payment_status === 'rejected').length;
  const activeEvent = allEvents.find((e) => e.id === selectedEventId);
  const isEventClosed = activeEvent?.status === 'closed' || activeEvent?.status === 'completed';

  // Return to public participant website handler
  const handleGoToPublic = () => {
    if (onBackToPublicSite) {
      onBackToPublicSite();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-teal selection:text-brand-white">
      {/* 1. TOP APP BAR */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-700 shrink-0 shadow-sm">
              <img
                src="/images/naadansmash-logo.png"
                alt="NAADANSMASH"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-lg tracking-tight text-white uppercase">
                  NAADANSMASH
                </span>
                <span className="px-2 py-0.5 rounded-full bg-brand-teal/20 text-brand-teal border border-brand-teal/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Admin Command Center
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 hidden sm:block">
                Dedicated Match Control, Payment Approvals & Cloud Database Sync
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleGoToPublic}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-colors border border-slate-700"
              title="Return to Player Website"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Player Website</span>
            </button>

            {session ? (
              <>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>+91 {session.phone?.slice(-10)}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-mono transition-colors"
                  title="Log out of Admin Portal"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {/* FEEDBACK BANNER */}
      {feedbackBanner && (
        <div
          className={`px-4 py-3 text-center text-xs font-mono font-bold tracking-wide border-b ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              : feedbackBanner.type === 'error'
              ? 'bg-rose-950/80 text-rose-300 border-rose-800'
              : 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
          }`}
        >
          {feedbackBanner.message}
        </div>
      )}

      {/* MAIN VIEW: LOGIN OR COMMAND CENTER */}
      {!session ? (
        /* ========================================================================= */
        /* AUTHENTICATION VIEW                                                       */
        /* ========================================================================= */
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 text-brand-teal flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <h1 className="font-heading font-extrabold text-2xl text-white uppercase tracking-tight">
                Admin Control Portal
              </h1>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Universal management portal for NAADANSMASH organizers. Connects directly to cloud database to confirm payments and update match schedules.
              </p>
            </div>

            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{authSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Mobile Number or Username *
                </label>
                <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-950 focus-within:border-brand-teal transition-all">
                  <span className="inline-flex items-center px-3.5 bg-slate-800 text-xs font-mono font-bold text-slate-300 border-r border-slate-700">
                    🇮🇳 +91 / ID
                  </span>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder="8304883872 or admin"
                    className="w-full px-3.5 py-3 text-sm font-mono tracking-wider text-white bg-transparent outline-none placeholder:text-slate-600"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Admin Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-mono text-brand-teal hover:underline flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter admin password"
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm font-mono focus:border-brand-teal outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 rounded-xl bg-brand-teal text-brand-black hover:bg-brand-teal/90 font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Authenticating with Database...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Sign In to Admin Website</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <p className="text-[11px] font-mono text-slate-500 mb-2">
                Default Credentials: Phone <code className="text-slate-300">8304883872</code> or user <code className="text-slate-300">admin</code> · Password <code className="text-slate-300">naadansmash2026</code>
              </p>
              <button
                onClick={handleGoToPublic}
                className="text-xs font-mono text-slate-400 hover:text-white transition-colors underline"
              >
                ← Return to Public Badminton Website
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* AUTHENTICATED COMMAND CENTER VIEW                                         */
        /* ========================================================================= */
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
          {/* A. SESSION SELECTOR & STATS STRIP */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-xs font-mono uppercase text-slate-400 font-bold shrink-0">
                  Active Event Session:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedEventId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedEventId(newId);
                      const ev = allEvents.find((evt) => evt.id === newId);
                      if (ev) populateEventForm(ev);
                      loadRoster(newId, false);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-brand-teal outline-none"
                  >
                    {allEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} — {ev.event_date} ({ev.status.toUpperCase()})
                      </option>
                    ))}
                  </select>

                  {/* Prominent Live Status Badge */}
                  {activeEvent?.status === 'closed' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/50 text-xs font-mono font-bold shadow-xs">
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                      <span>CLOSED</span>
                    </span>
                  ) : activeEvent?.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/50 text-xs font-mono font-bold shadow-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>COMPLETED</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-xs font-mono font-bold shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>OPEN / LIVE</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => syncAllFromCloud(false)}
                  disabled={isSyncingCloud || rosterLoading}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors flex items-center gap-1.5 border border-slate-700 active:scale-95"
                  title="Reload event schedule, payment settings, and registrations from cloud database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud || rosterLoading ? 'animate-spin text-brand-teal' : ''}`} />
                  <span>{isSyncingCloud ? 'Syncing...' : 'Sync Cloud'}</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors flex items-center gap-1.5 border border-slate-700"
                  title="Export Roster as CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV Export</span>
                </button>
              </div>
            </div>

            {/* EVENT LIFECYCLE MANAGEMENT STRIP */}
            <div className="pt-4 pb-1 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Event Lifecycle Controls:
                  </span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    activeEvent?.status === 'published'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : activeEvent?.status === 'closed'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  }`}>
                    {activeEvent?.status === 'published'
                      ? '● Registrations Open on Website'
                      : activeEvent?.status === 'closed'
                      ? '● Registration Closed'
                      : '● Ended (Showing "Next Event Soon")'}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 mt-1">
                  {activeEvent?.status === 'published'
                    ? 'Session is live. Public players can reserve spots and submit payment proofs.'
                    : activeEvent?.status === 'closed'
                    ? 'Registration locked. Players see "Registration Closed" badge on the main page.'
                    : 'Session ended. Main page automatically displays "Next event will be notified soon".'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {/* 1. START EVENT (EVENT DETAILS ETC) */}
                <button
                  type="button"
                  onClick={() => setIsStartEventModalOpen(true)}
                  disabled={savingEvent}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Configure and start event with details (date, time, venue, fee, max slots, notes) to open registrations"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Event</span>
                </button>

                {/* 2. REGISTRATION CLOSED */}
                <button
                  type="button"
                  onClick={handleCloseRegistration}
                  disabled={savingEvent || activeEvent?.status === 'closed'}
                  className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 ${
                    activeEvent?.status === 'closed'
                      ? 'bg-rose-950/40 text-rose-400 border border-rose-800/60 opacity-60 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                  }`}
                  title="Lock player registrations on the public website"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Registration Closed</span>
                </button>

                {/* 3. END EVENT (CONCLUDE SESSION) */}
                <button
                  type="button"
                  onClick={handleEndEvent}
                  disabled={savingEvent || activeEvent?.status === 'completed'}
                  className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 ${
                    activeEvent?.status === 'completed'
                      ? 'bg-amber-950/40 text-amber-400 border border-amber-800/60 opacity-60 cursor-not-allowed'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/50 shadow-md'
                  }`}
                  title="Conclude event. Main page will immediately show 'Next event will be notified soon'."
                >
                  <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>End Event</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-5">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Registrations</span>
                  {isEventClosed ? (
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Users className="w-3.5 h-3.5 text-brand-teal" />
                  )}
                </div>
                <div className="text-xl sm:text-2xl font-heading font-extrabold text-white">
                  {validRegistrations.length} <span className="text-xs font-mono text-slate-500 font-normal">/ {activeEvent?.max_participants || 24}</span>
                </div>
                <div className="mt-1 text-[10px] font-mono">
                  {isEventClosed ? (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      Session Closed
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      {Math.max(0, (activeEvent?.max_participants || 24) - validRegistrations.length)} slots open
                    </span>
                  )}
                </div>
              </div>

              <div 
                onClick={() => { setActiveTab('payments'); setPaymentFilter('pending'); }}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-amber-500/50 transition-colors"
              >
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Pending Approvals</span>
                  <FileImage className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-xl sm:text-2xl font-heading font-extrabold text-amber-400">
                  {pendingCount}
                </div>
                <div className="mt-1 text-[10px] font-mono text-amber-400/80">
                  Needs screenshot verification
                </div>
              </div>

              <div 
                onClick={() => { setActiveTab('payments'); setPaymentFilter('verified'); }}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-emerald-500/50 transition-colors"
              >
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Verified & Paid</span>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-xl sm:text-2xl font-heading font-extrabold text-emerald-400">
                  {verifiedCount}
                </div>
                <div className="mt-1 text-[10px] font-mono text-emerald-400/80">
                  Official Match Passes issued
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('roster')}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-cyan-500/50 transition-colors"
              >
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Court Attendance</span>
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-xl sm:text-2xl font-heading font-extrabold text-cyan-400">
                  {presentCount}
                </div>
                <div className="mt-1 text-[10px] font-mono text-cyan-400/80">
                  Players checked in on court
                </div>
              </div>
            </div>
          </div>

          {/* PROMINENT EVENT CLOSED / COMPLETED WARNING BANNER */}
          {isEventClosed && (
            <div className="bg-gradient-to-r from-rose-950/80 via-rose-900/50 to-slate-900 border-2 border-rose-500/70 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center shrink-0 shadow-inner">
                  <Lock className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading font-black text-white text-base sm:text-lg tracking-wide uppercase">
                      THIS EVENT SESSION IS CLOSED
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase font-black bg-rose-500/30 text-rose-200 border border-rose-500/60">
                      {activeEvent?.status === 'completed' ? 'COMPLETED' : 'REGISTRATIONS LOCKED'}
                    </span>
                  </div>
                  <p className="text-xs text-rose-200/90 font-mono mt-1 leading-relaxed">
                    Public player registrations are currently <strong>disabled</strong> on the website. Existing {validRegistrations.length} registrations, tickets, and payment proofs remain safe.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleReopenEvent}
                  disabled={savingEvent}
                  className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 text-slate-950" />
                  <span>Reopen Registrations (Publish)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('schedule')}
                  className="w-full md:w-auto px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Schedule</span>
                </button>
              </div>
            </div>
          )}

          {/* B. TAB NAVIGATION BAR */}
          <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'payments'
                  ? 'bg-brand-teal text-brand-black shadow-md'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <FileImage className="w-4 h-4" />
              <span>Payment Approvals & Photos</span>
              {pendingCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'payments' ? 'bg-black text-amber-400' : 'bg-amber-500 text-black'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('roster')}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'roster'
                  ? 'bg-brand-teal text-brand-black shadow-md'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Court Roster & Check-ins</span>
              <span className="opacity-80">({registrations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'schedule'
                  ? 'bg-brand-teal text-brand-black shadow-md'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Event Schedule & Slots</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-brand-teal text-brand-black shadow-md'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Admin Credentials & UPI</span>
            </button>

            <button
              onClick={() => setActiveTab('communications')}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'communications'
                  ? 'bg-brand-teal text-brand-black shadow-md'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Broadcasts & WhatsApp</span>
            </button>
          </div>

          {/* C. TAB WORKSPACES */}

          {/* ========================================================================= */}
          {/* TAB 1: PAYMENT APPROVALS & PHOTO PROOFS                                    */}
          {/* ========================================================================= */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search player, phone, NS-00X, UTR..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono placeholder:text-slate-600 focus:border-brand-teal outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Filter:</span>
                  {(['all', 'pending', 'verified', 'rejected'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setPaymentFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                        paymentFilter === f
                          ? 'bg-slate-700 text-white font-bold'
                          : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {f === 'pending'
                        ? `Pending (${pendingCount})`
                        : f === 'verified'
                        ? `Verified (${verifiedCount})`
                        : f === 'rejected'
                        ? `Rejected (${rejectedCount})`
                        : `All (${validRegistrations.length})`}
                    </button>
                  ))}
                  <button
                    onClick={handlePurgeSessionScreenshots}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono flex items-center gap-1.5 ml-auto"
                    title="Purge all uploaded screenshots for this event to free cloud database space"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Clean Storage</span>
                  </button>
                  <button
                    onClick={handleClearSessionRegistrations}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700 text-xs font-mono flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
                    title="Remove all player payment and registration records to start a completely fresh session"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                    <span>Reset & Start Fresh</span>
                  </button>
                </div>
              </div>

              {isEventClosed && (
                <div className="px-4 py-3 rounded-2xl bg-rose-950/40 border border-rose-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2.5 text-rose-300">
                    <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      Active session is <strong>{activeEvent?.status.toUpperCase()}</strong>. Player registration is locked on the public website.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReopenEvent}
                    disabled={savingEvent}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shrink-0 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    Reopen Session
                  </button>
                </div>
              )}

              {/* Payments Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                {rosterLoading ? (
                  <div className="py-16 text-center text-slate-500 font-mono text-xs">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-teal" />
                    Loading registrations from database...
                  </div>
                ) : filteredRegistrations.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 font-mono text-xs">
                    No registrations found matching the current criteria.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Ticket ID</th>
                          <th className="py-3 px-4">Player Details (Name & Phone)</th>
                          <th className="py-3 px-4">Payment Proof</th>
                          <th className="py-3 px-4">12-Digit UTR</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Approval Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredRegistrations.map((player) => {
                          const hasScreenshot = !!player.payment_screenshot_path;
                          const isVerified = player.payment_status === 'verified';
                          const isRejected = player.payment_status === 'rejected';

                          return (
                            <tr key={player.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                                <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-brand-teal">
                                  {player.registration_number || 'NS-PEND'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-white text-sm">{player.full_name}</div>
                                <div className="text-slate-400 flex items-center gap-2 mt-0.5">
                                  <a
                                    href={`https://wa.me/91${player.phone?.replace(/\D/g, '').slice(-10)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-400 hover:underline flex items-center gap-1"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                    <span>+91 {player.phone?.slice(-10)}</span>
                                  </a>
                                  <span>·</span>
                                  <span className="text-slate-500 uppercase">{player.skill_level || 'Open'}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {hasScreenshot ? (
                                  <button
                                    onClick={() =>
                                      setViewingScreenshot({
                                        url: player.payment_screenshot_path,
                                        playerName: player.full_name,
                                        regNo: player.registration_number,
                                        playerId: player.id,
                                        phone: player.phone,
                                        utr: player.utr_reference,
                                        paymentStatus: player.payment_status,
                                      })
                                    }
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                                  >
                                    <FileImage className="w-3.5 h-3.5" />
                                    <span>View Proof Photo</span>
                                    <ZoomIn className="w-3 h-3 text-amber-400 ml-1" />
                                  </button>
                                ) : (
                                  <span className="text-slate-600 italic">No photo attached</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                {player.utr_reference ? (
                                  <code className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200">
                                    {player.utr_reference}
                                  </code>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {isVerified ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] uppercase">
                                    <Check className="w-3 h-3" /> Verified
                                  </span>
                                ) : isRejected ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-[10px] uppercase">
                                    <XCircle className="w-3 h-3" /> Rejected
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-[10px] uppercase">
                                    <Clock className="w-3 h-3" /> Pending Review
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5 justify-end">
                                  {!isVerified && (
                                    <button
                                      onClick={() => handlePaymentChange(player.id, 'verified')}
                                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-sm"
                                      title="Approve payment & confirm official match pass"
                                    >
                                      Approve
                                    </button>
                                  )}

                                  {!isRejected && (
                                    <button
                                      onClick={() => openRejectionDialog(player)}
                                      className="px-2.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors"
                                      title="Reject payment with reason"
                                    >
                                      Reject
                                    </button>
                                  )}

                                  {hasScreenshot && (
                                    <button
                                      onClick={() => handleDeleteScreenshot(player.id, player.full_name)}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                                      title="Delete payment screenshot to free database space"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: COURT ROSTER & CHECK-INS                                           */}
          {/* ========================================================================= */}
          {activeTab === 'roster' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search player name, phone, ticket ID..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono placeholder:text-slate-600 focus:border-brand-teal outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearSessionRegistrations}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 text-xs font-mono flex items-center gap-1.5"
                    title="Reset Roster: Removes all players and frees their phone numbers for next week's session"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Event Roster</span>
                  </button>
                </div>
              </div>

              {isEventClosed && (
                <div className="px-4 py-3 rounded-2xl bg-rose-950/40 border border-rose-800/70 flex items-center gap-2.5 text-xs font-mono text-rose-300">
                  <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    Session is <strong>{activeEvent?.status.toUpperCase()}</strong>. Court attendance and check-ins can still be performed for all registered players below.
                  </span>
                </div>
              )}

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Ticket</th>
                        <th className="py-3 px-4">Player & Phone</th>
                        <th className="py-3 px-4">Skill Level</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4">Court Attendance</th>
                        <th className="py-3 px-4 text-right">Roster Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredRegistrations.map((player) => {
                        const isPresent = player.attendance_status === 'present';

                        return (
                          <tr key={player.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-brand-teal">
                                {player.registration_number || 'NS-000'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-white text-sm">{player.full_name}</div>
                              <div className="text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-500" />
                                <span>+91 {player.phone?.slice(-10)}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 uppercase text-[11px]">
                                {player.skill_level || 'Intermediate'}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {player.payment_status === 'verified' ? (
                                <span className="text-emerald-400 font-bold">✓ Verified</span>
                              ) : player.payment_status === 'rejected' ? (
                                <span className="text-rose-400 font-bold">✕ Rejected</span>
                              ) : (
                                <span className="text-amber-400 font-bold">⏳ Pending</span>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <button
                                onClick={() => handleAttendanceChange(player.id, isPresent ? 'registered' : 'present')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                                  isPresent
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isPresent ? 'Present on Court' : 'Mark Present'}</span>
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleDeleteRegistration(player.id, player.full_name, player.phone)}
                                className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-800/50 transition-colors"
                                title="Delete registration and free up phone number"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SESSION DETAILS EDITOR                                             */}
          {/* ========================================================================= */}
          {activeTab === 'schedule' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
                <div>
                  <h3 className="font-heading font-extrabold text-xl text-white uppercase tracking-tight">
                    Session Details
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Edit the session details and save. Changes reflect immediately on the public website.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {status !== 'published' ? (
                    <button
                      type="button"
                      onClick={() => handleStartAndPublishEvent()}
                      disabled={savingEvent}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      title="Open registrations on public website"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Event</span>
                    </button>
                  ) : null}

                  {status === 'published' ? (
                    <button
                      type="button"
                      onClick={handleCloseRegistration}
                      disabled={savingEvent}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      title="Lock registrations on website"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Close Registration</span>
                    </button>
                  ) : null}

                  {status !== 'completed' ? (
                    <button
                      type="button"
                      onClick={handleEndEvent}
                      disabled={savingEvent}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/50 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      title="End session (main page shows 'Next event will be notified soon')"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>End Event</span>
                    </button>
                  ) : null}
                </div>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Session Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="Session title"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Venue Name & Address *
                    </label>
                    <input
                      type="text"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      required
                      placeholder="Venue name and address"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Fee (₹ INR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={fee}
                        onChange={(e) => setFee(Number(e.target.value))}
                        required
                        placeholder="0"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Max Capacity (Slots)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(Number(e.target.value))}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Registration Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                    >
                      <option value="published">Published (Open for Registration)</option>
                      <option value="closed">Closed (Full / Locked)</option>
                      <option value="completed">Completed (Archived Match)</option>
                      <option value="draft">Draft</option>
                    </select>

                    {status === 'closed' || status === 'completed' ? (
                      <div className="mt-2.5 p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 text-rose-300 text-xs font-mono">
                          <Lock className="w-4 h-4 shrink-0 text-rose-400" />
                          <span>Status is set to <strong>{status.toUpperCase()}</strong>. Players cannot register on the website.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStatus('published')}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-bold shrink-0 self-start sm:self-auto cursor-pointer"
                        >
                          Switch to Published
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span>Public registrations are <strong>OPEN</strong> on the website.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Match Notes & Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the session — court type, shuttles, footwear, etc."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={savingEvent}
                    className="px-6 py-3 rounded-xl bg-brand-teal hover:bg-brand-teal/90 text-brand-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {savingEvent ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Changes</span>
                  </button>

                  {saveSuccess && (
                    <span className="text-emerald-400 font-mono text-xs flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Changes saved to database!
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: ADMIN CREDENTIALS & PAYMENT SETTINGS                               */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Organizer Mobile & Password */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-brand-teal flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-heading font-extrabold text-base text-white uppercase">
                      Admin Credentials
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400">
                      Syncs to cloud database for universal phone & password login.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpdateAdminCredentials} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Organizer Mobile Number
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={adminConfigPhone}
                      onChange={(e) => setAdminConfigPhone(e.target.value.replace(/\D/g, ''))}
                      required
                      placeholder="8304883872"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                        Organizer Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowConfigPass(!showConfigPass)}
                        className="text-[11px] font-mono text-brand-teal hover:underline"
                      >
                        {showConfigPass ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showConfigPass ? 'text' : 'password'}
                      value={adminConfigPassword}
                      onChange={(e) => setAdminConfigPassword(e.target.value)}
                      required
                      placeholder="Min 6 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors border border-slate-700 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4 text-brand-teal" />
                    <span>Update Cloud Credentials</span>
                  </button>

                  {adminCredSaved && (
                    <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono text-center">
                      ✓ Credentials updated! You can now log in using these details from any device.
                    </div>
                  )}
                </form>
              </div>

              {/* UPI & Payment Settings */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-brand-teal flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-heading font-extrabold text-base text-white uppercase">
                      UPI Payment Configuration
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400">
                      Shown to participants on the payment and QR code step.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Active UPI ID *
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. naadan.smash@upi"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Account Display Name
                    </label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="NAADANSMASH Kochi Sports Club"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                    />
                  </div>

                  <button
                    onClick={async () => {
                      if (upiId.trim()) {
                        await eventsService.updatePaymentSettings({
                          upi_id: upiId.trim(),
                          account_display_name: accountName.trim() || 'NAADANSMASH Kochi Sports Club',
                        });
                        setFeedbackBanner({ message: '✓ UPI Settings updated successfully!', type: 'success' });
                        setTimeout(() => setFeedbackBanner(null), 3000);
                      }
                    }}
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors border border-slate-700 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4 text-brand-teal" />
                    <span>Save UPI Settings</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: BROADCASTS & NOTIFICATIONS                                         */}
          {/* ========================================================================= */}
          {activeTab === 'communications' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* WhatsApp Broadcast */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-heading font-extrabold text-base text-white uppercase">
                      WhatsApp Broadcast Group
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400">
                      Send match timings and reminders to confirmed players.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-mono text-slate-300 leading-relaxed">
                    Broadcast match day announcement to all {verifiedCount} verified players:
                  </p>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
                    <div className="font-bold text-brand-teal">Preview Message:</div>
                    <div className="text-[11px] text-slate-400">
                      🏸 *NAADANSMASH Match Day Alert!*<br />
                      Session: {activeEvent?.title}<br />
                      Date: {activeEvent?.event_date} ({activeEvent?.start_time.slice(0, 5)} - {activeEvent?.end_time.slice(0, 5)})<br />
                      Venue: {activeEvent?.venue}<br />
                      Please bring non-marking shoes & show your official Match Pass at court entry. See you on court!
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `🏸 *NAADANSMASH Match Alert!*\nSession: ${activeEvent?.title}\nDate: ${activeEvent?.event_date} (${activeEvent?.start_time.slice(0, 5)} - ${activeEvent?.end_time.slice(0, 5)})\nVenue: ${activeEvent?.venue}\nPlease carry non-marking badminton shoes. Official tickets will be checked at court entry!`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Broadcast on WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Resend Email Integration */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800 text-cyan-400 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-heading font-extrabold text-base text-white uppercase">
                      Email Automated Notifications
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400">
                      Powered by Resend API for automatic confirmation receipts.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveCommunications} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Resend API Key
                    </label>
                    <input
                      type="password"
                      value={resendApiKey}
                      onChange={(e) => setResendApiKey(e.target.value)}
                      placeholder="re_..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Verified Sender Email
                    </label>
                    <input
                      type="text"
                      value={resendFromEmail}
                      onChange={(e) => setResendFromEmail(e.target.value)}
                      placeholder="sessions@naadansmash.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold uppercase tracking-wider transition-colors border border-slate-700 flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5 text-brand-teal" />
                      <span>Save Config</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={sendingTestEmail}
                      className="flex-1 py-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                    >
                      {sendingTestEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Test Email</span>
                    </button>
                  </div>

                  {commSaveSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono text-center">
                      ✓ Notification credentials saved to local storage!
                    </div>
                  )}

                  {testEmailResult && (
                    <div
                      className={`p-3 rounded-xl border text-xs font-mono ${
                        testEmailResult.success
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                          : 'bg-rose-950/60 border-rose-800 text-rose-300'
                      }`}
                    >
                      {testEmailResult.message}
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ========================================================================= */}
      {/* SCREENSHOT LIGHTBOX MODAL                                                  */}
      {/* ========================================================================= */}
      {viewingScreenshot && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h4 className="font-heading font-extrabold text-lg text-white uppercase">
                  Payment Proof: {viewingScreenshot.playerName}
                </h4>
                <p className="text-xs font-mono text-slate-400">
                  Ticket {viewingScreenshot.regNo} · +91 {viewingScreenshot.phone?.slice(-10)} {viewingScreenshot.utr ? `· UTR: ${viewingScreenshot.utr}` : ''}
                </p>
              </div>
              <button
                onClick={() => setViewingScreenshot(null)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black/60 border border-slate-800 max-h-[60vh] flex items-center justify-center p-2 mb-5">
              <img
                src={viewingScreenshot.url}
                alt={`Payment proof for ${viewingScreenshot.playerName}`}
                className="max-h-[56vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => handleDeleteScreenshot(viewingScreenshot.playerId, viewingScreenshot.playerName)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 text-xs font-mono transition-colors flex items-center gap-1.5 border border-slate-700"
                title="Delete screenshot to free database storage"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Photo</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    openRejectionDialog({
                      id: viewingScreenshot.playerId,
                      full_name: viewingScreenshot.playerName,
                      registration_number: viewingScreenshot.regNo,
                    });
                    setViewingScreenshot(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-mono font-bold uppercase transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={async () => {
                    await handlePaymentChange(viewingScreenshot.playerId, 'verified');
                    setViewingScreenshot(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase transition-colors shadow-md"
                >
                  Approve Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REJECTION REASON MODAL                                                     */}
      {/* ========================================================================= */}
      {rejectingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h4 className="font-heading font-extrabold text-lg text-white uppercase mb-2">
              Reject Payment Proof
            </h4>
            <p className="text-xs font-mono text-slate-400 mb-4">
              Enter the reason for rejecting {rejectingPlayer.name}'s ({rejectingPlayer.regNo}) payment submission:
            </p>

            <div className="space-y-3 mb-5">
              {[
                '12-digit UTR reference was not found in bank credits.',
                'Screenshot is blurred or unreadable.',
                'Incorrect payment amount transferred.',
                'Payment was made to incorrect UPI handle.',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectionReasonInput(reason)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs font-mono transition-colors ${
                    rejectionReasonInput === reason
                      ? 'bg-rose-950/60 border-rose-700 text-rose-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {reason}
                </button>
              ))}

              <textarea
                rows={2}
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="Or type a custom reason..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRejectingPlayer(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejectionSubmitting || !rejectionReasonInput.trim()}
                onClick={handleConfirmRejection}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold uppercase disabled:opacity-50"
              >
                {rejectionSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* START EVENT MODAL (SESSION DETAILS & OPEN REGISTRATIONS)                   */}
      {/* ========================================================================= */}
      {isStartEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-inner">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-xl text-white uppercase tracking-tight">
                    Start Match Session
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Configure details & open player registrations on the public website.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsStartEventModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartAndPublishEvent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Session Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Sunday Evening Match Session - Smash Arena"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Match Date *
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Venue Name & Address *
                  </label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    required
                    placeholder="e.g. Smash Arena Badminton Club, Kochi"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Entry Fee (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Max Capacity (Slots)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Match Notes & Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Doubles rotations, fresh feather shuttles, court numbers..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-brand-teal outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2.5 text-xs font-mono text-emerald-300 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>
                  Clicking <strong>Start & Open Registrations</strong> sets status to <strong>published</strong> across cloud databases. Public player registrations will immediately open on the main website.
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStartEventModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingEvent}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {savingEvent ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>Start & Open Registrations</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
