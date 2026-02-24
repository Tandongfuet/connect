
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import EmptyState from '../components/EmptyState';
import { createOrder } from '../services/api';
import { Role } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';

type DeliveryOption = 'delivery' | 'pickup' | 'courier';

const DELIVERY_OPTIONS: Record<DeliveryOption, { label: string; cost: number; days: number }> = {
  delivery: { label: 'Home Delivery', cost: 5000, days: 3 },
  pickup: { label: 'Pickup from Seller', cost: 0, days: 1 },
  courier: { label: 'Third-party Courier', cost: 7500, days: 2 },
};

const CartPage: React.FC = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, itemCount, totalPrice } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('delivery');

  const deliveryCost = useMemo(() => DELIVERY_OPTIONS[deliveryOption].cost, [deliveryOption]);
  const finalTotal = totalPrice + deliveryCost;
  
  const estimatedDeliveryDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + DELIVERY_OPTIONS[deliveryOption].days);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }, [deliveryOption]);
  
  const formatCurrency = (amount: number) => `XAF ${amount.toLocaleString('fr-CM')}`;

  const handleCheckout = async () => {
    if (!isAuthenticated || !user) {
      addToast('Please log in to proceed to checkout.', 'info');
      navigate('/login');
      return;
    }
    
    try {
        const order = await createOrder({
          userId: user.id,
          items: cartItems,
          total: finalTotal,
          deliveryOption: DELIVERY_OPTIONS[deliveryOption].label,
          deliveryCost,
          estimatedDeliveryDate,
        });
        
        addToast('Order placed successfully! Please proceed to payment.', 'success');
        navigate('/order-confirmation', { state: { order } });
        clearCart();
    } catch (error: any) {
        addToast(error.message || 'Failed to place order.', 'error');
    }
  };

  if (itemCount === 0) {
    return (
      <>
        <BreadcrumbNavigation paths={[{ name: 'Marketplace', path: '/products' }, { name: 'Your Cart' }]} />
        <EmptyState
          icon="🛒"
          title="Your Cart is Empty"
          message="Looks like you haven't added any items to your cart yet. Explore the marketplace to find something you'll love."
          actionText={t('continueShopping')}
          actionTo="/products"
        />
      </>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <BreadcrumbNavigation paths={[{ name: 'Marketplace', path: '/products' }, { name: 'Your Cart' }]} />
      <h1 className="text-3xl font-bold text-slate-dark dark:text-white mb-8">{t('cartTitle')}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-dark-surface p-6 rounded-lg shadow-md">
          <ul className="divide-y divide-gray-200 dark:divide-dark-border">
            {cartItems.map(item => (
              <li key={item.listing.id} className="flex py-6">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-dark-border">
                  <img src={item.listing.image} alt={item.listing.title} className="h-full w-full object-cover object-center" />
                </div>
                <div className="ml-4 flex flex-1 flex-col">
                  <div>
                    <div className="flex justify-between text-base font-medium text-slate-dark dark:text-dark-text">
                      <h3>
                        <Link to={`/products/${item.listing.id}`}>{item.listing.title}</Link>
                      </h3>
                      <p className="ml-4">{formatCurrency(item.listing.price * item.quantity)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-muted dark:text-dark-muted">{formatCurrency(item.listing.price)} each</p>
                  </div>
                  <div className="flex flex-1 items-end justify-between text-sm">
                    <div className="flex items-center">
                      <label htmlFor={`quantity-${item.listing.id}`} className="sr-only">Quantity</label>
                      <input
                        id={`quantity-${item.listing.id}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.listing.id, parseInt(e.target.value, 10))}
                        className="w-20 text-center"
                      />
                    </div>
                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.listing.id)}
                        className="font-medium text-primary hover:text-primary-dark"
                      >
                        {t('removeItem')}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-md sticky top-24 space-y-4">
            <div>
                <h2 className="text-lg font-medium text-slate-dark dark:text-white mb-4">{t('deliveryOptionsTitle')}</h2>
                <div className="space-y-3">
                  {Object.entries(DELIVERY_OPTIONS).map(([key, { label, cost, days }]) => {
                    const isSelected = deliveryOption === key;
                    return (
                      <div
                        key={key}
                        onClick={() => setDeliveryOption(key as DeliveryOption)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-primary-light border-primary ring-2 ring-primary dark:bg-primary/30'
                            : 'bg-white hover:border-olive-light dark:bg-dark-surface dark:border-dark-border dark:hover:border-primary-light'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="delivery-option"
                              value={key}
                              checked={isSelected}
                              readOnly
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:bg-dark-surface"
                            />
                            <span className={`ml-3 font-medium ${isSelected ? 'text-primary-dark' : 'text-slate-dark dark:text-dark-text'}`}>{label}</span>
                          </div>
                          <span className={`font-semibold ${isSelected ? 'text-primary-dark' : 'text-slate-dark dark:text-dark-text'}`}>
                            {formatCurrency(cost)}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ml-7 ${isSelected ? 'text-primary-dark/80' : 'text-gray-muted dark:text-dark-muted'}`}>
                          Est. delivery: {days} {days === 1 ? 'day' : 'days'}
                        </p>
                      </div>
                    );
                  })}
                </div>
            </div>

            <div>
                <h2 className="text-lg font-medium text-slate-dark dark:text-white">{t('orderSummaryTitle')}</h2>
                 {(user?.role === Role.Buyer || user?.role === Role.Farmer) && (
                    <div className="mt-2 text-sm text-center bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 p-2 rounded-md">
                        {t('walletBalance')}: <strong>{formatCurrency(user.accountBalance)}</strong>
                    </div>
                )}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-muted dark:text-dark-muted">{t('subtotal')}</p>
                    <p className="text-sm font-medium text-slate-dark dark:text-dark-text">{formatCurrency(totalPrice)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-muted dark:text-dark-muted">{t('deliveryFee')} ({DELIVERY_OPTIONS[deliveryOption].label})</p>
                    <p className="text-sm font-medium text-slate-dark dark:text-dark-text">{formatCurrency(deliveryCost)}</p>
                  </div>
                   <div className="flex items-center justify-between border-t border-gray-200 dark:border-dark-border pt-2">
                    <p className="text-base font-medium text-slate-dark dark:text-white">{t('orderTotal')}</p>
                    <p className="text-base font-medium text-slate-dark dark:text-white">{formatCurrency(finalTotal)}</p>
                  </div>
                  <p className="text-xs text-center text-gray-muted dark:text-dark-muted pt-2">
                    {t('estDelivery')}: <span className="font-semibold">{estimatedDeliveryDate}</span>
                  </p>
                </div>
            </div>
            
            <div>
              <button onClick={handleCheckout} className="btn btn-primary w-full">
                {t('placeOrderButton')}
              </button>
            </div>
            <div className="text-center text-sm text-gray-muted dark:text-dark-muted">
              <p>
                or{' '}
                <Link to="/products" className="font-medium text-primary hover:text-primary-dark">
                  {t('continueShopping')}<span aria-hidden="true"> &rarr;</span>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
