import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import BrandIcon from '../components/BrandIcon';

const ResetPasswordPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            addToast("Passwords do not match.", 'error');
            return;
        }
        if (!token) {
            addToast("Invalid or missing reset token.", 'error');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            addToast('Your password has been reset successfully!', 'success');
            navigate('/login');
        }, 1200);
    };

    return (
        <div className="max-w-md mx-auto mt-10">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="text-center">
                    <BrandIcon className="h-10 w-auto text-primary mx-auto" />
                    <h2 className="text-2xl font-bold text-slate-dark mt-4 mb-2">Reset Your Password</h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="password-input" className="label">New Password</label>
                        <input id="password-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className="label">Confirm New Password</label>
                        <input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;