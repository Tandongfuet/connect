import React, { useState } from 'react';
import Modal from './Modal'; // assuming there is a generic Modal component already used elsewhere
import { submitTestimonial } from '../services/api';
import type { Testimonial } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (testimonial: Testimonial) => void;
}

const SubmitTestimonialModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [quote, setQuote] = useState('');
  const [rating, setRating] = useState(5);
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const newTesti = await submitTestimonial({ author, location, quote, rating, videoUrl });
      onSuccess && onSuccess(newTesti);
      onClose();
    } catch (err) {
      console.error('failed to submit testimonial', err);
      setError('Failed to submit. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Your Experience">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            type="text"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            required
            className="input w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Location</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            required
            className="input w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Quote / Message</label>
          <textarea
            value={quote}
            onChange={e => setQuote(e.target.value)}
            required
            className="textarea w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Rating (1–5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={e => setRating(Number(e.target.value))}
            className="input w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Video URL (optional)</label>
          <input
            type="url"
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            className="input w-full"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </Modal>
  );
};

export default SubmitTestimonialModal;
