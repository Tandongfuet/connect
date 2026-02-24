import React from 'react';
import { Link } from 'react-router-dom';
import type { Dispute } from '../types';
import { DisputeStatus } from '../constants';

interface DisputeListItemProps {
    dispute: Dispute;
}

const DisputeListItem: React.FC<DisputeListItemProps> = ({ dispute }) => {
    const subject = dispute.orderId 
        ? `Order #${dispute.orderId.slice(-6)}` 
        : `Booking: "${dispute.booking?.serviceTitle}"`;

    const getStatusChip = (status: DisputeStatus) => {
        const baseClass = "px-2 py-1 text-xs font-semibold rounded-full";
        const statusClasses: Record<DisputeStatus, string> = {
            [DisputeStatus.Open]: 'bg-yellow-100 text-yellow-800',
            [DisputeStatus.UnderReview]: 'bg-blue-100 text-blue-800',
            [DisputeStatus.Escalated]: 'bg-purple-100 text-purple-800',
            [DisputeStatus.Resolved]: 'bg-green-100 text-green-800',
            [DisputeStatus.Refunded]: 'bg-green-100 text-green-800',
        };
        return <span className={`${baseClass} ${statusClasses[status]}`}>{status}</span>;
    };

    return (
        <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
                <div className="text-3xl">⚖️</div>
                <div>
                    <h3 className="font-semibold text-slate-dark dark:text-dark-text">{subject}</h3>
                    <p className="text-sm text-gray-muted dark:text-dark-muted">
                        Reason: {dispute.reasonCategory}
                    </p>
                    <div className="mt-2">
                        {getStatusChip(dispute.status)}
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <Link to={`/disputes/${dispute.id}`} className="btn btn-sm btn-secondary">
                    View Details
                </Link>
            </div>
        </div>
    );
};

export default DisputeListItem;