
import React, { useState, useEffect, useCallback } from 'react';
import type { User, Session } from '../types';
import { mockGetSessionsForUser, mockTerminateSession } from '../services/mockApi';
import Spinner from './Spinner';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from './ConfirmationModal';

interface UserSessionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

const UserSessionsModal: React.FC<UserSessionsModalProps> = ({ isOpen, onClose, user }) => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const [sessionToTerminate, setSessionToTerminate] = useState<Session | null>(null);

    const fetchSessions = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await mockGetSessionsForUser(user.id);
            setSessions(data);
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (isOpen) {
            fetchSessions();
        }
    }, [isOpen, fetchSessions]);

    const handleConfirmTerminate = async () => {
        if (!sessionToTerminate) return;
        try {
            await mockTerminateSession(sessionToTerminate.id);
            addToast("Session terminated successfully.", 'success');
            fetchSessions(); // Refresh the list
        } catch (error: any) {
            addToast(error.message || "Failed to terminate session.", 'error');
        } finally {
            setSessionToTerminate(null);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in" onClick={onClose}>
                <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold text-slate-dark dark:text-white">Active Sessions</h2>
                    <p className="text-gray-muted dark:text-dark-muted mb-6">for {user.name}</p>

                    <div className="space-y-4 max-h-80 overflow-y-auto">
                        {loading ? <div className="flex justify-center"><Spinner /></div> : (
                            sessions.length > 0 ? sessions.map(session => (
                                <div key={session.id} className="bg-secondary dark:bg-dark-border p-4 rounded-md flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-slate-dark dark:text-dark-text">{session.ipAddress}</p>
                                        <p className="text-sm text-gray-muted dark:text-dark-muted truncate">{session.userAgent}</p>
                                        <p className="text-xs text-gray-muted dark:text-dark-muted">Logged in: {new Date(session.loginTime).toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => setSessionToTerminate(session)} className="btn btn-danger btn-sm">Terminate</button>
                                </div>
                            )) : (
                                <p className="text-center text-gray-muted dark:text-dark-muted py-8">No active sessions found.</p>
                            )
                        )}
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button onClick={onClose} className="btn btn-primary">Close</button>
                    </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={!!sessionToTerminate}
                onClose={() => setSessionToTerminate(null)}
                onConfirm={handleConfirmTerminate}
                title="Terminate Session"
                message={
                    <span>
                        Are you sure you want to terminate this session? The user will be logged out on this device.
                        <br />
                        <strong className="text-slate-dark dark:text-white">IP:</strong> {sessionToTerminate?.ipAddress}
                        <br />
                        <strong className="text-slate-dark dark:text-white">Device:</strong> {sessionToTerminate?.userAgent}
                    </span>
                }
                confirmButtonText="Yes, Terminate"
                confirmButtonClass="btn-danger"
            />
        </>
    );
};

export default UserSessionsModal;
