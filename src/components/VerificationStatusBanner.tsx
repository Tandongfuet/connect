

import React from 'react';
import { VerificationStatus } from '../constants';

interface VerificationStatusBannerProps {
    status?: VerificationStatus;
    onVerifyClick: () => void;
}

const VerificationStatusBanner: React.FC<VerificationStatusBannerProps> = ({ status, onVerifyClick }) => {
    if (!status || status === 'Verified') {
        return null; // Don't show the banner if status is not applicable or already verified
    }

    const bannerConfig = {
        'Not Submitted': {
            icon: '🛡️',
            title: 'Verify Your Identity to Start Selling',
            message: 'To ensure a secure marketplace, please complete our identity verification process. Once verified, you will be able to post listings.',
            buttonText: 'Start Verification',
            color: 'blue',
        },
        'Pending': {
            icon: '⏳',
            title: 'Verification in Progress',
            message: 'Your documents have been submitted and are currently under review. This usually takes 1-2 business days. We will notify you once the review is complete.',
            buttonText: null,
            color: 'yellow',
        },
        'Rejected': {
            icon: '❌',
            title: 'Verification Required',
            message: 'Your verification submission was rejected. Please review your documents and information, then submit again. Contact support if you have questions.',
            buttonText: 'Re-submit Verification',
            color: 'red',
        }
    };

    const config = bannerConfig[status];
    if (!config) return null;

    const colorClasses = {
        blue: 'bg-blue-50 border-blue-500 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-200',
        yellow: 'bg-yellow-50 border-yellow-500 text-yellow-800 dark:bg-yellow-900/40 dark:border-yellow-700 dark:text-yellow-200',
        red: 'bg-red-50 border-red-500 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-200',
    };

    return (
        <div className={`p-4 border-l-4 rounded-r-lg ${colorClasses[config.color as keyof typeof colorClasses]}`}>
            <div className="flex">
                <div className="flex-shrink-0 text-2xl">
                    {config.icon}
                </div>
                <div className="ml-3">
                    <p className="font-bold">{config.title}</p>
                    <p className="text-sm mt-1">{config.message}</p>
                    {config.buttonText && (
                        <div className="mt-4">
                            <button onClick={onVerifyClick} className="btn btn-primary btn-sm">
                                {config.buttonText}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerificationStatusBanner;
