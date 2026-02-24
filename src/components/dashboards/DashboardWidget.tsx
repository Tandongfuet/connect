import React from 'react';

interface DashboardWidgetProps {
    widgetId: string;
    title: string;
    children: React.ReactNode;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({ title, children }) => {
    return (
        <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md flex flex-col h-full">
            <header className="flex items-center justify-between pb-2 border-b dark:border-dark-border mb-4 cursor-move">
                <h3 className="font-semibold text-slate-dark dark:text-white flex-grow">{title}</h3>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </header>
            <div className="flex-grow">
                {children}
            </div>
        </div>
    );
};

export default DashboardWidget;
