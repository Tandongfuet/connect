
import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { submitContactForm } from '../services/api';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitContactForm(formData);
      addToast('Your message has been sent successfully! Our team will get back to you shortly.', 'success');
      setFormData({ name: '', email: '', message: '' });
    } catch (error: any) {
      addToast(error.message || 'Failed to send message.', 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="animate-fade-in-left">
        <h1 className="text-3xl font-bold text-slate-dark dark:text-white mb-4">Get in Touch</h1>
        <p className="text-gray-muted dark:text-dark-muted mb-6">
          Have a question or feedback? We'd love to hear from you. Fill out the form, and we'll get back to you as soon as possible.
        </p>
        <div className="space-y-4 text-slate-dark dark:text-dark-text">
          <p><strong>Address:</strong> Buea, Molyko, Cameroon</p>
          <p><strong>Email:</strong> support@agroconnect.cm</p>
          <p><strong>Phone:</strong> +237 650985140</p>
        </div>
      </div>
      <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-md animate-fade-in-right">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="label">Full Name</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input mt-1"
            />
          </div>
          <div>
            <label htmlFor="email" className="label">Email Address</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input mt-1"
            />
          </div>
          <div>
            <label htmlFor="message" className="label">Message</label>
            <textarea
              name="message"
              id="message"
              rows={5}
              value={formData.message}
              onChange={handleChange}
              required
              className="input mt-1"
            ></textarea>
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactPage;
