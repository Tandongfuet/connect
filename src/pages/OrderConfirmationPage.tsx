
import React from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import BrandIcon from '../components/BrandIcon';
import type { Order, CartItem, SellerOrder } from '../types';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';

const OrderConfirmationPage: React.FC = () => {
  const location = useLocation();
  const orderDetails = location.state?.order as Order | undefined;

  // If there are no order details, redirect to the homepage to prevent direct access
  if (!orderDetails) {
    return <Navigate to="/" replace />;
  }

  const { id, sellerOrders, totalPrice, deliveryMethod, deliveryCost, estimatedDeliveryDate } = orderDetails;

  const formatCurrency = (amount: number) => `XAF ${amount.toLocaleString('fr-CM')}`;

  return (
    <div className="max-w-2xl mx-auto text-center animate-fade-in">
      <BreadcrumbNavigation paths={[{ name: 'Marketplace', path: '/products' }, { name: 'Cart', path: '/cart' }, { name: 'Order Confirmation' }]} />
      <div className="bg-white dark:bg-dark-surface p-8 rounded-lg shadow-xl">
        <BrandIcon className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-slate-dark dark:text-white">Thank You for Your Order!</h1>
        <p className="text-gray-muted dark:text-dark-muted mt-2">
          Your order <span className="font-mono text-sm bg-secondary dark:bg-dark-border px-2 py-1 rounded">{id}</span> has been placed and is awaiting payment.
        </p>

        <div className="mt-8 text-left border-t dark:border-dark-border pt-6">
          <h2 className="text-xl font-semibold text-slate-dark dark:text-white mb-4">Order Summary</h2>
          {sellerOrders.map((sellerOrder: SellerOrder) => (
            <div key={sellerOrder.sellerId} className="mb-6 border-b dark:border-dark-border pb-4 last:border-b-0">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Items from {sellerOrder.sellerName}</h3>
                 <ul className="divide-y divide-gray-200 dark:divide-dark-border">
                    {sellerOrder.items.map((item: CartItem) => (
                      <li key={item.listing.id} className="flex py-4">
                        <img src={item.listing.image} alt={item.listing.title} className="h-16 w-16 rounded-md object-cover" />
                        <div className="ml-4 flex flex-1 justify-between">
                          <div>
                            <p className="font-medium text-slate-dark dark:text-dark-text">{item.listing.title}</p>
                            <p className="text-sm text-gray-muted dark:text-dark-muted">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-medium text-slate-dark dark:text-dark-text">{formatCurrency(item.listing.price * item.quantity)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="text-right font-semibold text-slate-dark dark:text-dark-text">Subtotal: {formatCurrency(sellerOrder.subTotal)}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-6 border-t dark:border-dark-border pt-6 text-left space-y-2">
            <h3 className="text-lg font-semibold text-slate-dark dark:text-white">Delivery Details</h3>
            <div className="flex justify-between text-sm">
                <span className="text-gray-muted dark:text-dark-muted">Method:</span>
                <span className="font-medium text-slate-dark dark:text-dark-text">{deliveryMethod}</span>
            </div>
             <div className="flex justify-between text-sm">
                <span className="text-gray-muted dark:text-dark-muted">Estimated Delivery:</span>
                <span className="font-medium text-slate-dark dark:text-dark-text">{estimatedDeliveryDate}</span>
            </div>
        </div>

        <div className="mt-6 border-t dark:border-dark-border pt-6 text-right space-y-2">
             <div className="flex justify-between text-sm text-slate-dark dark:text-dark-text">
                <span>Items Total:</span>
                <span>{formatCurrency(totalPrice - deliveryCost)}</span>
            </div>
             <div className="flex justify-between text-sm text-slate-dark dark:text-dark-text">
                <span>Delivery Fee:</span>
                <span>{formatCurrency(deliveryCost)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-slate-dark dark:text-white">
                <span>Grand Total:</span>
                <span>{formatCurrency(totalPrice)}</span>
            </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/products" className="btn btn-secondary">
            Continue Shopping
          </Link>
           <Link to="/dashboard" state={{ defaultTab: 'orders' }} className="btn btn-primary">
            Pay & View My Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
