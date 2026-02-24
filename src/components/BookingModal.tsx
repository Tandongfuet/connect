import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { mockCreateBooking } from '../services/mockApi';
import Spinner from './Spinner';
import type { Listing } from '../types';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    listing: Listing | null;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, listing }) => {
    const [bookingDate, setBookingDate] = useState('');
    const { addToast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    if (!isOpen || !listing) return null;

    const handleConfirmBooking = async () => {
        if (!bookingDate) {
            addToast("Please select a date for the booking.", "error");
            return;
        }
        if (!user) {
            addToast("You must be logged in to book a service.", "info");
            return;
        }

        setLoading(true);
        try {
            // FIX: Corrected signature for mockCreateBooking.
            await mockCreateBooking(listing, user, bookingDate);
            addToast(`Booking request for "${listing.title}" sent successfully!`, "success");
            onClose();
        } catch (error: any) {
            addToast(error.message || 'Failed to send booking request.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl max-w-md w-full">
                <h2 className="text-2xl font-bold text-slate-dark dark:text-white mb-2">Book Service</h2>
                <p className="text-lg font-semibold text-primary mb-6">{listing.title}</p>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="booking-date" className="label">Select a Date</label>
                        <input
                            id="booking-date"
                            type="date"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="input"
                        />
                    </div>
                    <p className="text-sm text-gray-muted dark:text-dark-muted">The service provider will confirm the availability for your selected date.</p>
                </div>

                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={onClose} className="btn btn-secondary" disabled={loading}>Cancel</button>
                    <button onClick={handleConfirmBooking} className="btn btn-primary" disabled={loading}>
                        {loading ? <Spinner size="sm" /> : 'Confirm Booking'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingModal;