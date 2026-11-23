import React, { useState } from 'react';
import { 
  MapPin, 
  MessageCircle, 
  Mail, 
  Send, 
  CheckCircle2, 
  ExternalLink,
  Clock
} from 'lucide-react';
import { InstagramIcon } from '../ui/Icons';
import { BRAND_CONFIG } from '../../data/communityData';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { ContactFormData } from '../../types';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    whatsapp: '',
    email: '',
    subject: 'General Inquiry / Joining Sessions',
    message: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    if (!formData.name || !formData.whatsapp || !formData.message) {
      setErrorMessage('Please fill in your name, WhatsApp number, and message.');
      setSubmitting(false);
      return;
    }

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('contact_inquiries').insert({
          name: formData.name,
          whatsapp_or_phone: formData.whatsapp,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        });
        if (error) throw error;
      } else {
        const inquiries = JSON.parse(localStorage.getItem('naadansmash_inquiries') || '[]');
        inquiries.push({
          ...formData,
          id: `inq-${Date.now()}`,
          date: new Date().toISOString()
        });
        localStorage.setItem('naadansmash_inquiries', JSON.stringify(inquiries));
      }

      setSubmitted(true);
      setFormData({
        name: '',
        whatsapp: '',
        email: '',
        subject: 'General Inquiry / Joining Sessions',
        message: ''
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send message. Please connect on WhatsApp directly.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-16 sm:py-20 bg-white relative border-t border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-8 border-b border-black/[0.08] pb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-offwhite border border-black/[0.08] text-brand-black text-[11px] font-mono uppercase tracking-[0.2em] mb-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-teal" />
            <span>06 / GET IN TOUCH</span>
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tightest text-brand-black uppercase leading-[1.05]">
            CONNECT WITH <br />
            <span>NAADANSMASH.</span>
          </h2>
          <p className="text-xs sm:text-sm text-brand-charcoal/80 mt-2 leading-relaxed">
            Have questions about our sessions, skill levels, venues, or community collaborations in Kochi? Reach out directly via WhatsApp, Instagram, or send a note below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Location & Direct Contact Cards */}
          <div className="lg:col-span-5 space-y-6">
            {/* Primary Venue Location Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-brand-offwhite border border-black/[0.08] shadow-subtle">
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-11 h-11 rounded-xl bg-white border border-black/[0.08] text-brand-teal flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xl text-brand-black">
                    {BRAND_CONFIG.location.city}, {BRAND_CONFIG.location.state}
                  </h3>
                  <p className="text-xs font-mono uppercase tracking-wider text-brand-muted">India</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-brand-charcoal">
                <div className="p-4 rounded-xl bg-white border border-black/[0.06]">
                  <div className="font-semibold text-brand-black mb-1">
                    Session Venues Across Kochi
                  </div>
                  <div className="text-brand-charcoal/90 text-xs sm:text-sm">
                    {BRAND_CONFIG.location.address}
                  </div>
                  <div className="text-[11px] text-brand-muted mt-1.5 leading-relaxed font-mono">
                    Venues rotate between top Kochi badminton arenas based on coach scheduling (Session #1: Fitness Soul, Kakkanad • Session #2: Cochin Sports Arena, Edappally).
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs font-mono text-brand-muted">
                  <Clock className="w-4 h-4 text-brand-teal shrink-0" />
                  <span>Weekend Evening Sessions • Scheduled by Coach</span>
                </div>
              </div>
            </div>

            {/* Channels */}
            <div className="space-y-3">
              <a
                href={`https://wa.me/${BRAND_CONFIG.contacts.whatsapp}?text=Hi%20NAADANSMASH!%20I'm%20reaching%20out%20to%20learn%20more%20about%20weekend%20sessions.`}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 rounded-2xl bg-brand-offwhite hover:bg-white border border-black/[0.08] transition-all flex items-center justify-between shadow-xs hover:shadow-subtle"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-black/[0.08] text-brand-teal flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-brand-muted font-semibold">
                      WhatsApp Chat
                    </div>
                    <div className="font-heading font-bold text-sm sm:text-base text-brand-black">
                      {BRAND_CONFIG.contacts.whatsappFormatted}
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-brand-muted group-hover:text-brand-teal transition-colors" />
              </a>

              <a
                href={BRAND_CONFIG.contacts.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 rounded-2xl bg-brand-offwhite hover:bg-white border border-black/[0.08] transition-all flex items-center justify-between shadow-xs hover:shadow-subtle"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-black/[0.08] text-brand-teal flex items-center justify-center">
                    <InstagramIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-brand-muted font-semibold">
                      Instagram
                    </div>
                    <div className="font-heading font-bold text-sm sm:text-base text-brand-black">
                      @{BRAND_CONFIG.contacts.instagram}
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-brand-muted group-hover:text-brand-teal transition-colors" />
              </a>

              <a
                href={`mailto:${BRAND_CONFIG.contacts.email}`}
                className="group p-5 rounded-2xl bg-brand-offwhite hover:bg-white border border-black/[0.08] transition-all flex items-center justify-between shadow-xs hover:shadow-subtle"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-black/[0.08] text-brand-teal flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-brand-muted font-semibold">
                      Email Inquiries
                    </div>
                    <div className="font-heading font-bold text-sm sm:text-base text-brand-black">
                      {BRAND_CONFIG.contacts.email}
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-brand-muted group-hover:text-brand-teal transition-colors" />
              </a>
            </div>
          </div>

          {/* Right Column: Contact Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-12 rounded-3xl bg-brand-offwhite border border-black/[0.08] shadow-subtle">
              <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-brand-black uppercase mb-2">
                Send a Message to Organizers
              </h3>
              <p className="text-sm text-brand-charcoal/80 mb-8">
                Drop your details and our team will get back to you promptly on WhatsApp or email.
              </p>

              {submitted ? (
                <div className="p-8 rounded-2xl bg-white border border-black/[0.08] text-center animate-fade-in">
                  <div className="w-14 h-14 rounded-full bg-brand-teal text-white flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="font-heading font-extrabold text-xl text-brand-black mb-2 uppercase">
                    Message Received
                  </h4>
                  <p className="text-sm text-brand-charcoal/80 mb-6 max-w-md mx-auto">
                    Thanks for reaching out! We will connect with you via WhatsApp soon with upcoming session details.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 rounded-full bg-brand-black text-white text-xs font-mono uppercase tracking-wider hover:bg-brand-charcoal transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {errorMessage && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                      {errorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-2">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Arjun Nair"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-black/[0.08] text-sm focus:border-brand-teal transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-2">
                        WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleChange}
                        required
                        placeholder="+91 83048 83872"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-black/[0.08] text-sm focus:border-brand-teal transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-2">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@domain.com"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-black/[0.08] text-sm focus:border-brand-teal transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-2">
                        Inquiry Topic
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-black/[0.08] text-sm focus:border-brand-teal transition-all text-brand-charcoal"
                      >
                        <option value="General Inquiry / Joining Sessions">Joining Weekend Sessions</option>
                        <option value="Skill Level Question">Skill Level Question</option>
                        <option value="Venue & Logistics">Venue & Evening Timings</option>
                        <option value="Corporate / Group Play">Group Play / Collaborations</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      placeholder="Tell us about your badminton background or any questions you have..."
                      className="w-full px-4 py-3 rounded-xl bg-white border border-black/[0.08] text-sm focus:border-brand-teal transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-full bg-brand-teal hover:bg-[#126f8c] text-white font-heading font-semibold text-xs sm:text-sm uppercase tracking-widest transition-all duration-200 shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'SENDING MESSAGE...' : 'SEND MESSAGE'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
