import React, { useState } from 'react';
import DashboardWidget from './DashboardWidget';

interface DashboardGridProps {
    widgets: { [key: string]: { title: string; component: React.ReactNode } };
    layout: string[];
    onLayoutChange: (newLayout: string[]) => void;
    dashboardKey: string;
}

const DashboardGrid: React.FC<DashboardGridProps> = ({ widgets, layout, onLayoutChange }) => {
    const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
    const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, widgetId: string) => {
        setDraggedWidgetId(widgetId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, widgetId: string) => {
        e.preventDefault();
        if (draggedWidgetId !== widgetId) {
            setDragOverWidgetId(widgetId);
        }
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!draggedWidgetId || !dragOverWidgetId || draggedWidgetId === dragOverWidgetId) {
            setDraggedWidgetId(null);
            setDragOverWidgetId(null);
            return;
        }

        const newLayout = [...layout];
        const draggedIndex = newLayout.indexOf(draggedWidgetId);
        const targetIndex = newLayout.indexOf(dragOverWidgetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [removed] = newLayout.splice(draggedIndex, 1);
        newLayout.splice(targetIndex, 0, removed);
        
        onLayoutChange(newLayout);
        
        setDraggedWidgetId(null);
        setDragOverWidgetId(null);
    };
    
    const handleDragEnd = () => {
        setDraggedWidgetId(null);
        setDragOverWidgetId(null);
    };

    return (
        <div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            {layout.filter(id => widgets[id]).map(widgetId => (
                <div
                    key={widgetId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, widgetId)}
                    onDragEnter={(e) => handleDragEnter(e, widgetId)}
                    onDragEnd={handleDragEnd}
                    className={`relative transition-all duration-300 animate-pop-in ${draggedWidgetId === widgetId ? 'opacity-50 scale-95' : ''}`}
                >
                    <DashboardWidget
                        widgetId={widgetId}
                        title={widgets[widgetId].title}
                    >
                        {widgets[widgetId].component}
                    </DashboardWidget>
                    {dragOverWidgetId === widgetId && draggedWidgetId !== widgetId && (
                        <div className="absolute inset-0 border-2 border-dashed border-primary rounded-lg pointer-events-none -m-1" />
                    )}
                </div>
            ))}
        </div>
    );
};

export default DashboardGrid;