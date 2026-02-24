import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface PasswordStrengthIndicatorProps {
  password?: string;
}

export const checkPasswordStrength = (password: string): { level: 'Weak' | 'Medium' | 'Strong' | null } => {
    let score = 0;
    if (!password) return { level: null };
    if (password.length < 8) return { level: 'Weak' }; // Explicitly weak if too short

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    if (score < 2) return { level: 'Medium' };
    return { level: 'Strong' };
};

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password = '' }) => {
    const { t } = useLanguage();
    const { level } = checkPasswordStrength(password);

    if (!password) {
        return null;
    }

    const strengthConfig = {
        'Weak': { barColor: 'bg-red-500', width: 'w-1/3', textColor: 'text-red-500', textKey: 'passwordWeak' },
        'Medium': { barColor: 'bg-yellow-500', width: 'w-2/3', textColor: 'text-yellow-500', textKey: 'passwordMedium' },
        'Strong': { barColor: 'bg-green-500', width: 'w-full', textColor: 'text-green-500', textKey: 'passwordStrong' },
    };

    const config = level ? strengthConfig[level] : null;

    if (!config) {
        return null;
    }

    return (
        <div className="mt-2" aria-live="polite">
            <div className="bg-gray-200 dark:bg-dark-border rounded-full h-2 w-full">
                <div className={`h-2 rounded-full transition-all duration-300 ${config.width} ${config.barColor}`}></div>
            </div>
            <p className={`text-xs text-right mt-1 font-semibold ${config.textColor}`}>
                {t(config.textKey as any)}
            </p>
        </div>
    );
};

export default PasswordStrengthIndicator;