import React, { createContext, useState, useContext, useCallback, ReactNode, useMemo } from 'react';

type Layouts = { [key: string]: string[] };

interface DashboardLayoutContextType {
    getLayout: (dashboardKey: string, defaultLayout: string[]) => string[];
    updateLayout: (dashboardKey: string, newLayout: string[]) => void;
}

const DashboardLayoutContext = createContext<DashboardLayoutContextType | undefined>(undefined);

const LAYOUT_STORAGE_KEY = 'agroconnect_dashboard_layouts';

export const DashboardLayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [layouts, setLayouts] = useState<Layouts>(() => {
        try {
            const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error("Failed to parse dashboard layouts from localStorage", e);
            return {};
        }
    });

    const getLayout = useCallback((dashboardKey: string, defaultLayout: string[]): string[] => {
        return layouts[dashboardKey] || defaultLayout;
    }, [layouts]);

    const updateLayout = useCallback((dashboardKey: string, newLayout: string[]) => {
        const newLayouts = { ...layouts, [dashboardKey]: newLayout };
        setLayouts(newLayouts);
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(newLayouts));
    }, [layouts]);

    const value = useMemo(() => ({ getLayout, updateLayout }), [getLayout, updateLayout]);

    return <DashboardLayoutContext.Provider value={value}>{children}</DashboardLayoutContext.Provider>;
};

export const useDashboardLayout = () => {
    const context = useContext(DashboardLayoutContext);
    if (!context) {
        throw new Error('useDashboardLayout must be used within a DashboardLayoutProvider');
    }
    return context;
};
