import type { Order, Booking, Dispute, User } from '../types';

/**
 * Simulates sending an email. In a real application, this would use a service like Nodemailer or an API like SendGrid.
 * For this project, we log the email content to the console.
 * @param to Recipient's email address.
 * @param subject The subject line of the email.
 * @param html The HTML body of the email.
 */
const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
    console.log('--- SIMULATING EMAIL ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('Body (HTML):');
    console.log(html);
    console.log('------------------------');
    // In a real app, you wouldn't need a delay, but we add it to simulate network latency.
    await new Promise(resolve => setTimeout(resolve, 500));
};

const formatCurrency = (amount: number) => `XAF ${amount.toLocaleString('fr-CM')}`;

// --- Email Templates ---

export const sendNewOrderConfirmationEmail = async (userEmail: string, userName: string, order: any) => {
    const subject = `✅ Your AgroConnect Order #${order._id.toString().slice(-6)} is Confirmed!`;
    const html = `
        <h1>Hi ${userName},</h1>
        <p>Thank you for your order! We've received it and the seller(s) have been notified.</p>
        <p><strong>Order ID:</strong> ${order._id.toString().slice(-6)}</p>
        <p><strong>Total Amount:</strong> ${formatCurrency(order.totalPrice)}</p>
        <p>You can view your order details and track its status from your dashboard.</p>
        <a href="[YOUR_APP_URL]/#/dashboard">Go to Dashboard</a>
    `;
    await sendEmail(userEmail, subject, html);
};

export const sendNewOrderNotificationForSeller = async (sellerEmail: string, sellerName: string, order: any, sellerOrder: any) => {
    const subject = `🎉 New Sale on AgroConnect! Order #${order._id.toString().slice(-6)}`;
    const html = `
        <h1>Hi ${sellerName},</h1>
        <p>Great news! You have a new order from ${order.buyerInfo.name}.</p>
        <p><strong>Order ID:</strong> ${order._id.toString().slice(-6)}</p>
        <p><strong>Your Subtotal:</strong> ${formatCurrency(sellerOrder.subTotal)}</p>
        <p>Please prepare the items for shipment. You can manage this order from your dashboard.</p>
        <a href="[YOUR_APP_URL]/#/dashboard">Go to Your Dashboard</a>
    `;
    await sendEmail(sellerEmail, subject, html);
};

export const sendNewBookingRequestEmail = async (providerEmail: string, providerName: string, booking: any) => {
    const subject = `📅 New Booking Request for "${booking.serviceTitle}"`;
    const html = `
        <h1>Hi ${providerName},</h1>
        <p>You have a new booking request from <strong>${booking.userName}</strong> for your service: "${booking.serviceTitle}".</p>
        <p><strong>Requested Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
        <p>Please log in to your dashboard to confirm or reject this booking.</p>
        <a href="[YOUR_APP_URL]/#/dashboard">Go to Your Dashboard</a>
    `;
    await sendEmail(providerEmail, subject, html);
};

export const sendDisputeUpdateEmail = async (userEmail: string, userName: string, dispute: any, message: string) => {
    const subject = `⚖️ Update on Dispute #${dispute._id.toString().slice(-6)}`;
    const html = `
        <h1>Hi ${userName},</h1>
        <p>${message}</p>
        <p>You can view the full dispute thread and respond by clicking the link below.</p>
        <a href="[YOUR_APP_URL]/#/disputes/${dispute._id}">View Dispute</a>
    `;
    await sendEmail(userEmail, subject, html);
};


export const sendSecurityAlertEmail = async (userEmail: string, alertMessage: string) => {
    const subject = '⚠️ Security Alert for Your AgroConnect Account';
    const html = `
        <h1>Security Alert</h1>
        <p>${alertMessage}</p>
        <p>If this was not you, please change your password immediately and contact support.</p>
        <a href="[YOUR_APP_URL]/#/settings">Go to Settings</a>
    `;
    await sendEmail(userEmail, subject, html);
};