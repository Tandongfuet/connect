
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import connectDB from './config/db';
import { notFound, errorHandler } from './middleware/errorMiddleware';
import { initSocket } from './socket';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import listingRoutes from './routes/listingRoutes';
import orderRoutes from './routes/orderRoutes';
import bookingRoutes from './routes/bookingRoutes';
import transactionRoutes from './routes/transactionRoutes';
import disputeRoutes from './routes/disputeRoutes';
import communityRoutes from './routes/communityRoutes';
import adminRoutes from './routes/adminRoutes';
import aiRoutes from './routes/aiRoutes';
import chatRoutes from './routes/chatRoutes';
import notificationRoutes from './routes/notificationRoutes';
import publicRoutes from './routes/publicRoutes';

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

const app = express();
const httpServer = http.createServer(app); // Create HTTP server

// Initialize Socket.io
initSocket(httpServer);

// --- Security Middleware ---

// Set security HTTP headers
app.use(helmet());

// Rate limiting: Limit requests from same API
const limiter = rateLimit({
  max: 1000, // Limit each IP to 1000 requests per windowMs
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests from this IP, please try again in 15 minutes'
});
app.use('/api', limiter);

// Enable Cross-Origin Resource Sharing
// In production, replace '*' with specific frontend domain
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10mb' })); 

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp());

// --- Routes ---

// simple health check / informational endpoints
app.get('/api', (req, res) => {
  res.send('AgroConnect API is running securely...');
});

// root route to prevent "Not Found - /" errors when someone hits backend directly
app.get('/', (req, res) => {
  res.send('AgroConnect backend active');
});

app.use('/api/users', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/public', publicRoutes);


// Custom Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Listen on httpServer instead of app
httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
