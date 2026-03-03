
import axios from 'axios';
import { Role } from '../constants';
import type { User, Listing, Order, CartItem, Booking, Notification, Message, Transaction, Dispute, SellerOrder, DisputeConversationItem, SellerReview, ProduceSubscription, ActivityLog, Session, SecurityAlert, CommissionPayout, FlaggedContent, Article, ForumPost, ForumReply, AgriculturalTask, WeatherData, Review, AITriagedContent, TieredPrice, Badge, Event, Testimonial } from '../types';

// fallback mock API - only used if real endpoints fail or are unavailable
import * as mock from './mockApi';

const http = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// helper wrapper that falls back to mock implementation when network request fails
async function withFallback<T>(
  promise: Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    console.warn('API call failed, falling back to mock:', err);
    return fallback();
  }
}


// Auth
export const apiLogin = (email: string, password: string) =>
  withFallback(
    http.post('/users/login', { email, password }).then(r => r.data),
    () => mock.mockLogin(email)
  );

export const apiRegister = (name: string, email: string, password: string, role: Role) =>
  withFallback(
    http.post('/users/register', { name, email, password, role }).then(r => r.data),
    () => mock.mockRegister(name, email, password, role)
  );

export const apiGetCurrentUser = () =>
  withFallback(
    http.get('/users/profile').then(r => r.data),
    () => mock.mockGetMe()
  );

export const apiUpdateUserProfile = (data: any) =>
  withFallback(
    http.put('/users/profile', data).then(r => r.data),
    () => mock.mockUpdateUserProfile((data.id || ''), data)
  );

export const apiVerifyPassword = (password: string) =>
  withFallback(
    http.post('/users/verify-password', { password }).then(r => r.data),
    () => mock.mockVerifyPassword('', password)
  );

export const socialLogin = (profile: any) =>
  // backend currently does not support social login, fallback to mock
  mock.mockLoginOrRegisterWithSocial(profile);

// Chat
export const getChatContacts = (userId: string) =>
  withFallback(http.get(`/chat/contacts/${userId}`).then(r => r.data), () => mock.mockGetChatContacts(userId));
export const getMessagesBetweenUsers = (userA: string, userB: string) =>
  withFallback(http.get(`/chat/messages`, { params: { userA, userB } }).then(r => r.data), () => mock.mockGetMessagesBetweenUsers(userA, userB));
export const sendMessage = (message: any) =>
  withFallback(http.post('/chat/messages', message).then(r => r.data), () => mock.mockSendMessage(message));

// Listings
export const getListings = () =>
  withFallback(http.get('/listings').then(r => r.data), () => mock.mockGetListings());

export const getListingById = (id: string) =>
  withFallback(http.get(`/listings/${id}`).then(r => r.data), () => mock.mockGetListingById(id));

export const getListingsBySeller = (sellerId: string) =>
  withFallback(http.get(`/listings/seller/${sellerId}`).then(r => r.data), () => mock.mockGetListingsBySeller(sellerId));

export const createListing = (listing: any) =>
  withFallback(http.post('/listings', listing).then(r => r.data), () => mock.mockCreateListing(listing, {} as User));

export const updateListing = (id: string, data: any) =>
  withFallback(http.put(`/listings/${id}`, data).then(r => r.data), () => mock.mockUpdateListing(id, data));

export const deleteListing = (id: string) =>
  withFallback(http.delete(`/listings/${id}`).then(r => r.data), () => mock.mockDeleteListing(id));

export const updateListingStatus = (id: string, status: string) =>
  withFallback(http.put(`/listings/${id}`, { status }).then(r => r.data), () => mock.mockUpdateListingStatus(id, status));

export const getListingReviews = (id: string) =>
  withFallback(http.get(`/listings/${id}/reviews`).then(r => r.data), () => mock.mockGetListingReviews(id));

export const submitListingReview = (id: string, review: any) =>
  withFallback(http.post(`/listings/${id}/reviews`, review).then(r => r.data), () => mock.mockSubmitListingReview(id, review));

// Wishlist / Favorites (wrapped with network fallback)
export const getWishlist = (userId: string) =>
  withFallback(http.get(`/users/${userId}/wishlist`).then(r => r.data), () => mock.mockGetWishlist(userId));
export const addToWishlist = (userId: string, listingId: string) =>
  withFallback(http.post(`/users/${userId}/wishlist`, { listingId }).then(r => r.data), () => mock.mockAddToWishlist(userId, listingId));
export const removeFromWishlist = (userId: string, listingId: string) =>
  withFallback(http.delete(`/users/${userId}/wishlist/${listingId}`).then(r => r.data), () => mock.mockRemoveFromWishlist(userId, listingId));

// Orders
export const createOrder = (order: any) =>
  withFallback(http.post('/orders', order).then(r => r.data), () => mock.mockCreateOrder(order));
export const getOrders = (userId?: string) =>
  withFallback(http.get('/orders', { params: { userId } }).then(r => r.data), () => mock.mockGetOrders());
export const getOrdersBySeller = (sellerId: string) =>
  withFallback(http.get(`/orders/seller/${sellerId}`).then(r => r.data), () => mock.mockGetOrdersBySeller(sellerId));
export const payForOrder = (orderId: string, paymentInfo: any) =>
  withFallback(http.post(`/orders/${orderId}/pay`, paymentInfo).then(r => r.data), () => mock.mockPayForOrder(orderId, paymentInfo));
export const updateOrderStatus = (orderId: string, status: string) =>
  withFallback(http.put(`/orders/${orderId}/status`, { status }).then(r => r.data), () => mock.mockUpdateOrderStatus(orderId, status));
export const cancelOrder = (orderId: string) =>
  withFallback(http.post(`/orders/${orderId}/cancel`).then(r => r.data), () => mock.mockCancelOrder(orderId));

// Bookings
export const createBooking = (booking: any) =>
  withFallback(http.post('/bookings', booking).then(r => r.data), () => mock.mockCreateBooking(booking));
export const getBookingsByUser = (userId: string) =>
  withFallback(http.get(`/bookings/user/${userId}`).then(r => r.data), () => mock.mockGetBookingsByUser(userId));
export const getBookingsByProvider = (providerId: string) =>
  withFallback(http.get(`/bookings/provider/${providerId}`).then(r => r.data), () => mock.mockGetBookingsByProvider(providerId));
export const updateBookingStatus = (bookingId: string, status: string) =>
  withFallback(http.put(`/bookings/${bookingId}/status`, { status }).then(r => r.data), () => mock.mockUpdateBookingStatus(bookingId, status));
export const payForBooking = (bookingId: string, payment: any) =>
  withFallback(http.post(`/bookings/${bookingId}/pay`, payment).then(r => r.data), () => mock.mockPayForBooking(bookingId, payment));
export const confirmServiceCompletion = (bookingId: string) =>
  withFallback(http.post(`/bookings/${bookingId}/complete`).then(r => r.data), () => mock.mockConfirmServiceCompletion(bookingId));
export const cancelBooking = (bookingId: string) =>
  withFallback(http.post(`/bookings/${bookingId}/cancel`).then(r => r.data), () => mock.mockCancelBooking(bookingId));

// Wallet & Transactions
export const getTransactions = (userId: string) =>
  withFallback(http.get(`/transactions/user/${userId}`).then(r => r.data), () => mock.mockGetTransactions(userId));
export const getAllTransactions = () =>
  withFallback(http.get('/transactions').then(r => r.data), () => mock.mockGetAllTransactions());
export const depositFunds = (userId: string, amount: number) =>
  withFallback(http.post('/transactions/deposit', { userId, amount }).then(r => r.data), () => mock.mockDepositFunds(userId, amount));
export const withdrawFunds = (userId: string, amount: number) =>
  withFallback(http.post('/transactions/withdraw', { userId, amount }).then(r => r.data), () => mock.mockWithdrawFunds(userId, amount));
export const transferFunds = (fromId: string, toId: string, amount: number) =>
  withFallback(http.post('/transactions/transfer', { fromId, toId, amount }).then(r => r.data), () => mock.mockTransferFunds(fromId, toId, amount));

// Disputes
export const getDisputesByUser = (userId: string) =>
  withFallback(http.get(`/disputes/user/${userId}`).then(r => r.data), () => mock.mockGetDisputesByUser(userId));
export const getDisputeById = (id: string) =>
  withFallback(http.get(`/disputes/${id}`).then(r => r.data), () => mock.mockGetDisputeById(id));
export const getAllDisputes = () =>
  withFallback(http.get('/disputes').then(r => r.data), () => mock.mockGetAllDisputes());
export const submitDispute = (dispute: any) =>
  withFallback(http.post('/disputes', dispute).then(r => r.data), () => mock.mockSubmitDispute(dispute));
export const submitDisputeForBooking = (bookingId: string, data: any) =>
  withFallback(http.post(`/disputes/booking/${bookingId}`, data).then(r => r.data), () => mock.mockSubmitDisputeForBooking(bookingId, data));
export const addMessageToDispute = (disputeId: string, message: any) =>
  withFallback(http.post(`/disputes/${disputeId}/message`, message).then(r => r.data), () => mock.mockAddMessageToDispute(disputeId, message));
export const addEvidenceToDispute = (disputeId: string, imageUrl: string) =>
  withFallback(http.post(`/disputes/${disputeId}/evidence`, { imageUrl }).then(r => r.data), () => mock.mockAddEvidenceToDispute(disputeId, '', imageUrl));
export const resolveDispute = (disputeId: string, resolution: any) =>
  withFallback(http.post(`/disputes/${disputeId}/resolve`, resolution).then(r => r.data), () => mock.mockResolveDispute(disputeId, resolution));
export const notifyDisputant = (disputeId: string, notification: any) =>
  withFallback(http.post(`/disputes/${disputeId}/notify`, notification).then(r => r.data), () => mock.mockNotifyDisputant(disputeId, notification));

// Notifications
export const getNotifications = (userId: string) =>
  withFallback(http.get(`/notifications/user/${userId}`).then(r => r.data), () => mock.mockGetNotifications(userId));
export const markAsRead = (notifId: string) =>
  withFallback(http.put(`/notifications/${notifId}/read`, {}).then(r => r.data), () => mock.mockMarkAsRead(notifId));
export const markAllAsRead = (userId: string) =>
  withFallback(http.put(`/notifications/user/${userId}/read-all`, {}).then(r => r.data), () => mock.mockMarkAllAsRead(userId));

// Community & Articles
export const getForumPosts = () =>
  withFallback(http.get('/community/forum').then(r => r.data), () => mock.mockGetForumPosts());
export const getForumPostById = (id: string) =>
  withFallback(http.get(`/community/forum/${id}`).then(r => r.data), () => mock.mockGetForumPostById(id));
export const createForumPost = (post: any) =>
  withFallback(http.post('/community/forum', post).then(r => r.data), () => mock.mockCreateForumPost(post));
export const createForumReply = (postId: string, reply: any) =>
  withFallback(http.post(`/community/forum/${postId}/replies`, reply).then(r => r.data), () => mock.mockCreateForumReply(postId, reply));
export const toggleLike = (postId: string) =>
  withFallback(http.post(`/community/forum/${postId}/like`).then(r => r.data), () => mock.mockToggleLike(postId));
export const flagContent = (contentId: string, reason: string) =>
  withFallback(http.post(`/moderation/flag`, { contentId, reason }).then(r => r.data), () => mock.mockFlagContent(contentId, reason));

export const getArticles = () =>
  withFallback(http.get('/community/articles').then(r => r.data), () => mock.mockGetArticles());
export const getArticleById = (id: string) =>
  withFallback(http.get(`/community/articles/${id}`).then(r => r.data), () => mock.mockGetArticleById(id));
export const createArticle = (article: any) =>
  withFallback(http.post('/community/articles', article).then(r => r.data), () => mock.mockCreateArticle(article));
export const updateArticle = (id: string, data: any) =>
  withFallback(http.put(`/community/articles/${id}`, data).then(r => r.data), () => mock.mockUpdateArticle(id, data));
export const deleteArticle = (id: string) =>
  withFallback(http.delete(`/community/articles/${id}`).then(r => r.data), () => mock.mockDeleteArticle(id));
export const toggleSaveArticle = (articleId: string) =>
  withFallback(http.post(`/articles/${articleId}/save`).then(r => r.data), () => mock.mockToggleSaveArticle(articleId));
export const getSavedArticles = (userId: string) =>
  withFallback(http.get(`/users/${userId}/saved-articles`).then(r => r.data), () => mock.mockGetSavedArticles(userId));

// AI Services
export const apiGenerateArticleContent = mock.mockGenerateArticleContent;
export const apiGetGrowthAdvice = mock.mockGetGrowthAdvice;
export const getSemanticKeywords = mock.mockGetSemanticKeywords;
export const getPriceSuggestion = mock.mockGetPriceSuggestion;
export const generateTags = mock.mockGenerateTags;
export const generateListingContentFromAI = mock.mockGenerateListingContentFromAI;
export const getAgroBotResponse = mock.mockGetAgroBotResponse;
export const getRecipeFromIngredients = mock.mockGetRecipeFromIngredients;
export const generateMarketingText = mock.mockGenerateMarketingText;
export const apiAskAboutArticle = mock.mockAskAboutArticle;
export const apiPerformOcr = mock.mockPerformOcrOnId;

// Dispute AI helpers (network w/ fallback)
export const generateDisputeSummary = (disputeId: string) =>
  withFallback(http.get(`/disputes/${disputeId}/summary`).then(r => r.data.summary), () => mock.mockGenerateDisputeSummary(disputeId));
export const generateDisputeAdvice = (disputeId: string) =>
  withFallback(http.get(`/disputes/${disputeId}/advice`).then(r => r.data.advice), () => mock.mockGenerateDisputeAdvice(disputeId));
export const generateSupportReply = (disputeId: string) =>
  withFallback(http.get(`/disputes/${disputeId}/support-reply`).then(r => r.data.reply), () => mock.mockGenerateSupportReply(disputeId));
export const generateDisputeReplySuggestion = (disputeId: string, message: string) =>
  withFallback(http.post(`/disputes/${disputeId}/reply-suggestion`, { message }).then(r => r.data.suggestion), () => mock.mockGenerateDisputeReplySuggestion(disputeId, message));

// Analytics & Public Info
export const getSellerAnalytics = mock.mockGetSellerAnalytics;
export const getServiceAnalytics = mock.mockGetServiceAnalytics;
export const getAgriculturalTasks = mock.mockGetAgriculturalTasks; // static; no network endpoint

// User-specific utilities
export const getProduceSubscriptions = (userId: string) =>
  withFallback(http.get(`/users/${userId}/subscriptions`).then(r => r.data), () => mock.mockGetProduceSubscriptions(userId));
export const toggleProduceSubscription = (userId: string, cropName: string, type: 'planting' | 'harvest') =>
  withFallback(http.put(`/users/subscriptions`, { userId, cropName, type }).then(r => r.data), () => mock.mockToggleProduceSubscription(userId, cropName, type));
export const updateTaskProgress = (userId: string, taskId: string, status: string) =>
  withFallback(http.put(`/users/tasks`, { userId, taskId, status }).then(r => r.data), () => mock.mockUpdateTaskProgress(userId, taskId, status));
export const clearTaskProgress = (userId: string, taskId: string) =>
  withFallback(http.delete(`/users/tasks/${taskId}`, { data: { userId } }).then(r => r.data), () => mock.mockClearTaskProgress(userId, taskId));
export const clearAllTaskProgress = (userId: string) =>
  withFallback(http.delete(`/users/tasks/all`, { data: { userId } }).then(r => r.data), () => mock.mockClearAllTaskProgress(userId));
export const getEvents = () =>
  withFallback(http.get('/public/events').then(r => r.data), () => mock.mockGetEvents());
export const getBadges = () =>
  withFallback(http.get('/public/badges').then(r => r.data), () => mock.mockGetBadges());
export const getTestimonials = () =>
  withFallback(http.get('/public/testimonials').then(r => r.data), () => mock.mockGetTestimonials());

// Contact & Search
export const submitContactForm = (data: any) =>
  withFallback(http.post('/public/contact', data).then(r => r.data), () => mock.mockSubmitContactForm(data));

export const globalSearch = (query: string) =>
  withFallback(http.get('/public/search', { params: { q: query } }).then(r => r.data), () => mock.mockGlobalSearch(query));

// Admin Endpoints
export const getAllUsers = () =>
  withFallback(http.get('/admin/users').then(r => r.data), () => mock.mockGetAllUsers());
export const getUserById = (id: string) =>
  withFallback(http.get(`/users/${id}`).then(r => r.data), () => mock.mockGetUserById(id));
export const getUserById_Admin = (id: string) =>
  withFallback(http.get(`/admin/users/${id}`).then(r => r.data), () => mock.mockGetUserById_Admin(id));
export const getPendingVerifications = () =>
  withFallback(http.get('/admin/verifications').then(r => r.data), () => mock.mockGetPendingVerifications());
export const updateUserStatus = (id: string, status: string) =>
  withFallback(http.put(`/admin/users/${id}/status`, { status }).then(r => r.data), () => mock.mockUpdateUserStatus(id, status));
export const updateUserRole = (id: string, role: string) =>
  withFallback(http.put(`/admin/users/${id}/role`, { role }).then(r => r.data), () => mock.mockUpdateUserRole(id, role));
export const deleteUser = (id: string) =>
  withFallback(http.delete(`/admin/users/${id}`).then(r => r.data), () => mock.mockDeleteUser(id));
export const getActivityLogs = (userId: string) =>
  withFallback(http.get(`/admin/activity/${userId}`).then(r => r.data), () => mock.mockGetActivityLogs(userId));
export const getSessionsForUser = (userId: string) =>
  withFallback(http.get(`/admin/sessions/${userId}`).then(r => r.data), () => mock.mockGetSessionsForUser(userId));
export const terminateSession = (sessionId: string) =>
  withFallback(http.delete(`/admin/sessions/${sessionId}`).then(r => r.data), () => mock.mockTerminateSession(sessionId));
export const getSecurityAlerts = (userId: string) =>
  withFallback(http.get(`/admin/alerts/${userId}`).then(r => r.data), () => mock.mockGetSecurityAlerts(userId));
export const dismissSecurityAlert = (alertId: string) =>
  withFallback(http.delete(`/admin/alerts/${alertId}`).then(r => r.data), () => mock.mockDismissSecurityAlert(alertId));
export const getPlatformFinancials = () =>
  withFallback(http.get('/admin/financials').then(r => r.data), () => mock.mockGetPlatformFinancials());
export const getFlaggedContent = () =>
  withFallback(http.get('/admin/flagged').then(r => r.data), () => mock.mockGetFlaggedContent());
export const getPlatformAnalytics = () =>
  withFallback(http.get('/admin/analytics').then(r => r.data), () => mock.mockGetPlatformAnalytics());
export const triageFlaggedContent = (id: string, action: string) =>
  withFallback(http.post(`/admin/flagged/${id}/triage`, { action }).then(r => r.data), () => mock.mockTriageFlaggedContent(id, action));
export const resolveFlaggedContent = (id: string, resolution: any) =>
  withFallback(http.post(`/admin/flagged/${id}/resolve`, resolution).then(r => r.data), () => mock.mockResolveFlaggedContent(id, resolution));
export const withdrawCommission = (amount: number) =>
  withFallback(http.post('/admin/commission/withdraw', { amount }).then(r => r.data), () => mock.mockWithdrawCommission(amount));
export const deleteForumContent = (id: string) =>
  withFallback(http.delete(`/admin/forum/${id}`).then(r => r.data), () => mock.mockDeleteForumContent(id));
export const getPlatformHealth = () =>
  withFallback(http.get('/admin/health').then(r => r.data), () => mock.mockGetPlatformHealth());

// Misc
export const toggleFollow = (userId: string, targetId: string) =>
  withFallback(http.put(`/users/follow/${targetId}`, { userId }).then(r => r.data), () => mock.mockToggleFollow(userId, targetId));

export const getFollowerUsers = (userId: string) =>
  withFallback(http.get(`/users/${userId}/followers`).then(r => r.data), () => mock.mockGetFollowerUsers(userId));
export const getFollowingUsers = (userId: string) =>
  withFallback(http.get(`/users/${userId}/following`).then(r => r.data), () => mock.mockGetFollowingUsers(userId));

export const getSellerReviews = (sellerId: string) =>
  withFallback(http.get(`/reviews/seller/${sellerId}`).then(r => r.data), () => mock.mockGetSellerReviews(sellerId));
export const submitSellerReview = (review: any) =>
  withFallback(http.post('/reviews/seller', review).then(r => r.data), () => mock.mockSubmitSellerReview(review));

// platform settings remain mock for now
export const getPlatformSettings = mock.mockGetPlatformSettings;
export const updatePlatformSettings = mock.mockUpdatePlatformSettings;

// Re-export mock helpers for components that import mock* helpers directly from api
export const mockGetPlatformSettings = mock.mockGetPlatformSettings;
export const mockUpdatePlatformSettings = mock.mockUpdatePlatformSettings;

// Re-export all mock helpers for compatibility with components that import them
export * from './mockApi';
