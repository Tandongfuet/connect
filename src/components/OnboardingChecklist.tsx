import React, { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';

interface Task {
    id: string;
    text: string;
    isCompleted: boolean;
}

interface OnboardingChecklistProps {
    tasks: Task[];
}

const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ tasks }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isConfirmingDismiss, setIsConfirmingDismiss] = useState(false);
    const completedTasks = tasks.filter(t => t.isCompleted).length;
    const progress = Math.round((completedTasks / tasks.length) * 100);
    
    const taskKey = `onboarding_dismissed_${tasks.map(t => t.id).join('_')}`;

    useEffect(() => {
        const isDismissed = localStorage.getItem(taskKey);
        if (isDismissed) {
            setIsVisible(false);
        }
    }, [taskKey]);

    if (!isVisible) {
        return null;
    }
    
    const handleDismissRequest = () => {
        setIsConfirmingDismiss(true);
    }

    const confirmDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(taskKey, 'true');
        setIsConfirmingDismiss(false);
    }

    return (
        <>
            <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md animate-fade-in relative">
                <button 
                    onClick={handleDismissRequest} 
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-white text-xl z-10 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Dismiss checklist"
                >
                    &times;
                </button>
                <h3 className="font-semibold text-slate-dark dark:text-white mb-3">
                    {progress === 100 ? "Setup Complete!" : "Getting Started"}
                </h3>
                
                {progress === 100 ? (
                    <div className="text-center animate-fade-in py-4">
                        <span className="text-4xl">🎉</span>
                        <p className="font-semibold mt-2 text-slate-dark dark:text-white">Well done! You're all set up.</p>
                        <p className="text-sm text-gray-muted dark:text-dark-muted mt-2">Here are some tips for what to do next:</p>
                        <ul className="text-sm text-left list-disc list-inside mt-3 space-y-1 text-slate-dark dark:text-dark-text">
                            <li>Check the <strong>Analytics</strong> tab to track your performance.</li>
                            <li>Engage with others in the <strong>Community</strong> hub.</li>
                            <li>Keep your listings fresh to attract more buyers.</li>
                        </ul>
                    </div>
                ) : (
                    <>
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-2.5 mb-4">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                        
                        <ul className="space-y-2">
                            {tasks.map(task => (
                                <li key={task.id} className={`flex items-center gap-3 text-sm ${task.isCompleted ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-slate-dark dark:text-dark-text'}`}>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${task.isCompleted ? 'bg-primary' : 'border-2 border-gray-300'}`}>
                                        {task.isCompleted && <span className="text-white">✓</span>}
                                    </div>
                                    <span>{task.text}</span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>

            <ConfirmationModal
                isOpen={isConfirmingDismiss}
                onClose={() => setIsConfirmingDismiss(false)}
                onConfirm={confirmDismiss}
                title="Dismiss Checklist"
                message="Are you sure you want to dismiss these tasks? You won't be able to see them again."
                confirmButtonText="Dismiss"
                confirmButtonClass="btn-secondary"
            />
        </>
    );
};

export default OnboardingChecklist;