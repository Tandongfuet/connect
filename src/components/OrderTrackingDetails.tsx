import React from 'react';
import type { Order, TrackingEvent } from '../types';

interface OrderTrackingDetailsProps {
    order: Order;
}

const OrderTrackingDetails: React.FC<OrderTrackingDetailsProps> = ({ order }) => {

    const formatCurrency = (amount: number) => `XAF ${amount.toLocaleString('fr-CM')}`;

    const getIconForStatus = (status: string) => {
        if (status.toLowerCase().includes('placed')) return '📝';
        if (status.toLowerCase().includes('processing')) return '⚙️';
        if (status.toLowerCase().includes('shipped')) return '🚚';
        if (status.toLowerCase().includes('delivered')) return '✅';
        return '📦';
    };

    const allTrackingEvents = order.sellerOrders
        .flatMap(so => 
            so.trackingHistory.map(event => ({ ...event, sellerName: so.sellerName }))
        )
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    return (
        <div className="mt-4 pt-4 border-t dark:border-gray-600 animate-fade-in">
            <h4 className="font-semibold text-slate-dark dark:text-white mb-4">Order Details</h4>
            
            
            <div className="mb-6">
                <h5 className="text-sm font-semibold text-slate-dark dark:text-white mb-2">Items</h5>
                <ul className="space-y-2 text-sm">
                    {order.sellerOrders.flatMap(so => so.items).map(item => (
                        <li key={item.listing.id} className="flex justify-between">
                            <span className="text-gray-muted dark:text-gray-400">{item.listing.title} x {item.quantity}</span>
                            <span className="font-medium text-slate-dark dark:text-gray-300">{formatCurrency(item.listing.price * item.quantity)}</span>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div>
                <h5 className="text-sm font-semibold text-slate-dark dark:text-white mb-3">Tracking History</h5>
                <div className="relative pl-4">
                    {/* Vertical line */}
                    <div className="absolute top-0 left-[18px] h-full w-0.5 bg-gray-200 dark:bg-gray-600"></div>

                    <ul className="space-y-6">
                        {allTrackingEvents.map((event, index: number) => (
                            <li key={index} className="relative flex items-start">
                                <div className="absolute left-[-4px] top-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-gray-700">
                                    <span className="text-xl">{getIconForStatus(event.status)}</span>
                                </div>
                                <div className="ml-12 pt-1.5">
                                    <p className="font-semibold text-slate-dark dark:text-gray-200">{event.status}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        From: {event.sellerName}
                                    </p>
                                    <p className="text-xs text-gray-muted dark:text-gray-400">
                                        {new Date(event.date).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-slate-dark dark:text-gray-300 mt-1">{event.location}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default OrderTrackingDetails;