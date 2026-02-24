import mongoose from 'mongoose';
import { OrderStatus } from '../constants';

const cartItemSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String },
}, { _id: false });

const trackingEventSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    status: { type: String, required: true },
    location: { type: String, required: true },
}, { _id: false });

const sellerOrderSchema = new mongoose.Schema({
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerName: { type: String, required: true },
    items: [cartItemSchema],
    subTotal: { type: Number, required: true },
    status: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PendingPayment },
    trackingHistory: [trackingEventSchema],
    isReviewed: { type: Boolean, default: false },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  buyerInfo: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
  },
  sellerOrders: [sellerOrderSchema],
  totalPrice: { type: Number, required: true },
  deliveryMethod: { type: String, required: true },
  deliveryCost: { type: Number, required: true },
  estimatedDeliveryDate: { type: String, required: true },
}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

export default Order;