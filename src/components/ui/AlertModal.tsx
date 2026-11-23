import React, { useState } from 'react';
import { X, Bell, CheckCircle2, MessageCircle, Mail } from 'lucide-react';
import { eventsService } from '../../services/eventsService';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose }) => {
  const [contact, setContact] = useState('');
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) {
      setErrorMsg('Please enter your WhatsApp number or email.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await eventsService.subscribeForAlerts(contact, channel);
      if (res.success) {
        setSuccess(true);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: unknown) {
      setErrorMsg('Subscription failed. Please connect with us directly on WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setContact('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="relative bg-brand-white rounded-3xl max-w-md w-full border border-brand-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-brand-offwhite border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-teal">
            <Bell className="w-4 h-4" />
            <span className="font-heading font-bold text-sm text-brand-black">
              Session Drop Alert
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-brand-muted hover:text-brand-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-brand-teal text-brand-white flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-heading font-bold text-lg text-brand-black mb-2">
                You're On The List!
              </h4>
              <p className="text-xs text-brand-charcoal/80 mb-6 leading-relaxed">
                We drop slots every Tuesday at 8:00 PM. You'll receive a direct ping the moment registration opens for next Sunday's session.
              </p>
              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-full bg-brand-black text-brand-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs text-brand-charcoal/80 mb-4 leading-relaxed">
                Slots for our Kochi sessions are limited to ensure generous court time. Be the first to know when the next game registration opens.
              </p>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs mb-3 border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setChannel('whatsapp')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        channel === 'whatsapp'
                          ? 'bg-brand-black text-brand-white border-brand-black'
                          : 'bg-brand-offwhite text-brand-charcoal border-brand-border'
                      }`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp (Fastest)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannel('email')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        channel === 'email'
                          ? 'bg-brand-black text-brand-white border-brand-black'
                          : 'bg-brand-offwhite text-brand-charcoal border-brand-border'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </button>
                  </div>

                  <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                    {channel === 'whatsapp' ? 'WhatsApp Number' : 'Email Address'} *
                  </label>
                  <input
                    type={channel === 'whatsapp' ? 'tel' : 'email'}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required
                    placeholder={channel === 'whatsapp' ? '+91 83048 83872' : 'you@example.com'}
                    className="w-full px-4 py-2.5 rounded-xl bg-brand-offwhite border border-brand-border text-sm focus:bg-brand-white focus:border-brand-teal"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full bg-brand-teal hover:bg-brand-teal-dark text-brand-white text-xs font-semibold uppercase tracking-wider shadow-sm transition-colors"
                >
                  {loading ? 'Subscribing...' : 'Notify Me First'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
