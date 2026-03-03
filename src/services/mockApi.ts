
import { Role, ListingStatus, DisputeStatus, VerificationTier, OrderStatus, TransactionType, TransactionStatus, BookingStatus, ImageStatus, VerificationStatus } from '../constants';
import type { User, Listing, Order, CartItem, Booking, Notification, Message, Transaction, Dispute, SellerOrder, DisputeConversationItem, SellerReview, ProduceSubscription, ActivityLog, Session, SecurityAlert, CommissionPayout, FlaggedContent, Article, ForumPost, ForumReply, AgriculturalTask, WeatherData, Review, AITriagedContent, TieredPrice, Badge, Event, Testimonial } from '../types';
import { ADMIN_USER, SEED_USERS } from './mockData';
import { agriculturalTasks } from './taskData';
import { seasonalProduceData } from './seasonalData';
import { regions, getRegionFromCity } from './locationData';
import { requestPayment } from './momoApi';
import { GoogleGenAI, Type } from '@google/genai';

// initialize AI client only when an API key is available. `process` may not
// exist in the browser environment, so we fallback to Vite's import.meta.env.
const _apiKey =
    (typeof process !== 'undefined' && process.env && process.env.API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_KEY) ||
    '';
const ai = _apiKey
    ? new GoogleGenAI({ apiKey: _apiKey })
    : ({
          // stubbed client for environments without an API key; avoids runtime errors
          models: {
              generateContent: async (_opts: any) => {
                  console.warn('AI request skipped; API key not set');
                  return { text: '' } as any;
              },
          },
      } as any);

const DB_STORAGE_KEY = 'agroconnect_in_memory_db';

const getInitialDbState = () => {
    const efuetAmin = SEED_USERS.find(u => u.email === 'efuetg@gmail.com')!;

    const seedListings: Listing[] = [
        {
            id: 'listing_potatoes_1',
            title: "Fresh Irish Potatoes (10kg Bag)",
            description: "High-quality Irish potatoes, freshly harvested from the highlands of Bamenda. Perfect for boiling, frying, or making fufu. Grown with organic practices.",
            price: 4500,
            category: 'Vegetables',
            stock: 150,
            isService: false,
            isBulk: true,
            images: [{ url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=2070&auto=format&fit=crop', status: ImageStatus.Approved }],
            seller: {
                id: efuetAmin.id,
                name: efuetAmin.name,
                profileImage: efuetAmin.profileImage,
                location: efuetAmin.location,
                verificationTier: efuetAmin.verificationTier,
                averageSellerRating: efuetAmin.averageSellerRating,
                sellerReviewCount: efuetAmin.sellerReviewCount,
            },
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: ListingStatus.Active,
            tieredPricing: [{ quantity: 5, price: 4200 }, { quantity: 10, price: 4000 }],
            averageRating: 4.7,
            reviewCount: 23,
            reviews: []
        },
        {
            id: 'listing_plantains_1',
            title: "Sweet Ripe Plantains (Bunch)",
            description: "A large bunch of sweet, ripe plantains, ready for frying or roasting. Sourced from the fertile volcanic soils of Buea.",
            price: 2000,
            category: 'Fruits',
            stock: 80,
            isService: false,
            images: [{ url: 'https://images.unsplash.com/photo-1603531883333-e317282a725e?q=80&w=1974&auto=format&fit=crop', status: ImageStatus.Approved }],
            seller: {
                id: efuetAmin.id,
                name: efuetAmin.name,
                profileImage: efuetAmin.profileImage,
                location: efuetAmin.location,
                verificationTier: efuetAmin.verificationTier,
                averageSellerRating: efuetAmin.averageSellerRating,
                sellerReviewCount: efuetAmin.sellerReviewCount,
            },
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            status: ListingStatus.Active,
            averageRating: 4.9,
            reviewCount: 41,
            reviews: []
        }
    ];

    return ({
        users: [ADMIN_USER, ...SEED_USERS],
        listings: seedListings,
        orders: [] as Order[],
        bookings: [] as Booking[],
        disputes: [] as Dispute[],
        notifications: [] as Notification[],
        messages: [] as Message[],
        sessions: [{ id: 'session_admin_1', userId: ADMIN_USER.id, ipAddress: '127.0.0.1', userAgent: 'Initial Session', loginTime: new Date().toISOString() }] as Session[],
        securityAlerts: [] as SecurityAlert[],
        platformFinancials: { escrowBalance: 0, commissionBalance: 0, payouts: [] as CommissionPayout[] },
        platformSettings: { logoUrl: '' },
        flaggedContent: [] as FlaggedContent[],
        articles: [] as Article[],
        forumPosts: [] as ForumPost[],
        activityLogs: [] as ActivityLog[],
        transactions: [] as Transaction[],
        sellerReviews: [] as SellerReview[],
        testimonials: [
            {
                id: 'testi1',
                author: 'Fatima Ngassa',
                location: 'Bamenda',
                quote: 'AgroConnect helped me sell my cassava quickly and reach buyers across regions!',
                rating: 5
            },
            {
                id: 'testi2',
                author: 'Samuel Eko',
                location: 'Douala',
                quote: 'The platform makes it easy to connect with buyers and the escrow system gives me peace of mind.',
                rating: 4
            },
            {
                id: 'testi3',
                author: 'Lydia T',
                location: 'Yaoundé',
                quote: 'I love how simple and reliable AgroConnect is. My produce moves faster now.',
                rating: 5,
                videoUrl: 'https://example.com/video/testimonial3.mp4'
            }
        ] as Testimonial[],
        badges: [] as Badge[],
        events: [] as Event[],
    });
};

let db: ReturnType<typeof getInitialDbState> & {
    produceSubscriptions: Map<string, ProduceSubscription>;
};

const saveDb = () => {
    try {
        const serializableDb = {
            ...db,
            produceSubscriptions: Array.from(db.produceSubscriptions.entries()),
        };
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(serializableDb));
        window.dispatchEvent(new CustomEvent('agroconnect_settings_updated', { detail: db.platformSettings }));
    } catch (error) {
        console.error("Failed to save DB", error);
    }
};

const loadDb = () => {
    try {
        const savedDbString = localStorage.getItem(DB_STORAGE_KEY);
        if (savedDbString) {
            const parsedDb = JSON.parse(savedDbString);
            db = {
                ...getInitialDbState(),
                ...parsedDb,
                produceSubscriptions: new Map(parsedDb.produceSubscriptions || []),
            };
            return;
        }
    } catch (error) {
        console.error("Failed to load DB", error);
    }
    db = {
        ...getInitialDbState(),
        produceSubscriptions: new Map(),
    };
    saveDb();
};

loadDb();

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const createNotification = (userId: string, message: string, type: Notification['type'], link: string, isAI: boolean = false): Notification => {
    const newNotif: Notification = {
        id: `notif_${Date.now()}_${Math.random()}`,
        userId,
        message,
        type,
        link,
        isRead: false,
        timestamp: new Date().toISOString(),
        isAI
    };
    db.notifications.unshift(newNotif);
    saveDb();
    return newNotif;
};

// --- AUTH & USER ---

export const mockLogin = async (email: string): Promise<{ token: string, user: User }> => {
    await delay(500);
    const user = db.users.find(u => u.email === email);
    if (user && user.status === 'Active') {
        const token = `mock_token_${user.id}`;
        return { token, user: JSON.parse(JSON.stringify(user)) };
    }
    throw new Error('Invalid credentials');
};

export const mockRegister = async (name: string, email: string, p: string, role: Role): Promise<User> => {
    await delay(500);
    const newUser: User = {
        id: `u_${Date.now()}`, name, email, role, createdAt: new Date().toISOString(), accountBalance: role === Role.Farmer ? 500000 : 0,
        pendingBalance: 0, totalEarnings: 0, status: 'Active', 
        verificationStatus: VerificationStatus.NotSubmitted, verificationTier: VerificationTier.None,
        sellerReviewCount: 0, averageSellerRating: 0, followers: [], followerCount: 0, following: [], savedArticleIds: [],
        badges: [], wishlist: [], isFirstLogin: true,
    };
    db.users.push(newUser);
    saveDb();
    return newUser;
};

export const mockGetMe = async (): Promise<User> => {
    await delay(100);
    const stored = localStorage.getItem('authUser');
    if (!stored) throw new Error("Unauthorized");
    return JSON.parse(stored);
};

export const mockVerifyPassword = async (userId: string, pass: string): Promise<boolean> => {
    await delay(200);
    return true;
};

export const mockUpdateUserProfile = async (id: string, data: any) => {
    const u = db.users.find(user => user.id === id);
    if (u) {
        Object.assign(u, data);
        if (data.verificationStatus === VerificationStatus.Verified) {
            createNotification(id, "Your account has been verified!", 'General', '/dashboard');
        }
    }
    saveDb();
    return u;
};

export const mockLoginOrRegisterWithSocial = async (profile: any) => {
    await delay(500);
    let user = db.users.find(u => u.email === profile.email);
    if (!user) user = await mockRegister(profile.name, profile.email, '', Role.Buyer);
    return { user, token: `social_${user.id}` };
};

export const mockChangePassword = async (userId: string, current: string, next: string) => {
    await delay(1000);
    return true;
};

// --- LISTINGS ---

export const mockGetListings = async () => db.listings;
export const mockGetListingById = async (id: string) => db.listings.find(l => l.id === id);
export const mockGetListingsBySeller = async (id: string) => db.listings.filter(l => l.seller.id === id);
export const mockCreateListing = async (data: any, user: User) => {
    const newL = { ...data, id: `l_${Date.now()}`, seller: { ...user }, createdAt: new Date().toISOString(), status: ListingStatus.Active };
    db.listings.push(newL);
    saveDb();
    return newL;
};
export const mockUpdateListing = async (id: string, data: any) => {
    const l = db.listings.find(item => item.id === id);
    if (l) Object.assign(l, data);
    saveDb();
    return l;
};
export const mockDeleteListing = async (id: string) => {
    db.listings = db.listings.filter(l => l.id !== id);
    saveDb();
};
export const mockUpdateListingStatus = async (id: string, s: ListingStatus) => {
    const l = db.listings.find(item => item.id === id);
    if (l) {
        l.status = s;
        createNotification(l.seller.id, `Your listing "${l.title}" status has been updated to ${s}.`, 'Listing Approved', '/dashboard');
    }
    saveDb();
};

// --- ADMIN & ANALYTICS ---

export const mockGetAllUsers = async () => db.users;
export const mockGetUserById = async (id: string) => db.users.find(u => u.id === id);
export const mockDeleteUser = async (id: string) => {
    db.users = db.users.filter(u => u.id !== id);
    saveDb();
};
export const mockUpdateUserStatus = async (id: string, s: any) => {
    const u = db.users.find(user => user.id === id);
    if (u) u.status = s;
    saveDb();
};
export const mockUpdateUserRole = async (id: string, r: Role) => {
    const u = db.users.find(user => user.id === id);
    if (u) u.role = r;
    saveDb();
};

export const mockGetPlatformAnalytics = async () => ({
    totalUsers: db.users.length,
    totalListings: db.listings.length,
    totalOrders: db.orders.length,
    totalRevenue: db.platformFinancials.commissionBalance,
    usersByRegion: {},
    avgDisputeResolutionHours: 12
});

export const mockGetPlatformFinancials = async () => db.platformFinancials;
export const mockGetActivityLogs = async () => db.activityLogs;
export const mockGetSecurityAlerts = async () => db.securityAlerts;
export const mockDismissSecurityAlert = async (id: string) => {
    const a = db.securityAlerts.find(item => item.id === id);
    if (a) a.isRead = true;
    saveDb();
};
export const mockGetSessionsForUser = async (id: string) => db.sessions.filter(s => s.userId === id);
export const mockTerminateSession = async (id: string) => {
    db.sessions = db.sessions.filter(s => s.id !== id);
    saveDb();
};

// --- AI SERVICES ---

export const mockGetAgroBotResponse = async (message: string, context: string, useWebSearch: boolean) => {
    await delay(1000);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Context: ${context}. User asks: ${message}`,
        config: useWebSearch ? { tools: [{ googleSearch: {} }] } : {}
    });
    return { text: response.text, sources: [] };
};

export const mockGetPriceSuggestion = async (title: string, category: string, imageUrl: string) => {
    await delay(1000);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Suggest price for ${title} in ${category} for Cameroon market.`
    });
    return response.text;
};

export const mockGenerateTags = async (title: string, desc: string, cat: string) => {
    await delay(800);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate 5 comma tags for ${title}.`
    });
    return response.text;
};

export const mockGenerateArticleContent = async (prompt: string) => {
    await delay(1500);
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Write article: ${prompt}`
    });
    return response.text;
};

export const mockAskAboutArticle = async (content: string, question: string) => {
    await delay(800);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Article: ${content}. Question: ${question}`
    });
    return response.text;
};

export const mockGetGrowthAdvice = async () => {
    await delay(1000);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Provide growth advice for a Cameroon farmer."
    });
    return response.text;
};

export const mockGetSemanticKeywords = async (q: string) => {
    await delay(500);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Keywords for ${q}`
    });
    return response.text.split(',').map(s => s.trim());
};

export const mockGetRecipeFromIngredients = async (i: string[]) => {
    await delay(1200);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Recipe with ${i.join(', ')}`
    });
    return response.text;
};

export const mockGenerateMarketingText = async (p: string, t: string) => {
    await delay(1000);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Marketing text for ${p} as ${t}`
    });
    return response.text;
};

export const mockGenerateListingContentFromAI = async (imageUrl: string, tags: string) => {
    await delay(1500);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate JSON title and description for image ${imageUrl} with tags ${tags}.`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text);
};

// --- DISPUTES ---

export const mockGetPendingVerifications = async () => db.users.filter(u => u.verificationStatus === VerificationStatus.Pending);
export const mockGetAllDisputes = async () => db.disputes;
export const mockGetDisputeById = async (id: string) => db.disputes.find(d => d.id === id);
export const mockGetDisputesByUser = async (id: string) => db.disputes.filter(d => d.buyerId === id || d.sellerId === id);

export const mockAddMessageToDispute = async (id: string, userId: string, message: string) => {
    const disp = db.disputes.find(d => d.id === id);
    const u = db.users.find(it => it.id === userId);
    if (disp && u) {
        disp.conversation.push({ userId, userName: u.name, userRole: u.role, message, timestamp: new Date().toISOString() });
    }
    saveDb();
    return disp!;
};

export const mockAddEvidenceToDispute = async (id: string, userId: string, imageUrl: string) => {
    const disp = db.disputes.find(d => d.id === id);
    const u = db.users.find(it => it.id === userId);
    if (disp && u) {
        disp.evidence.push({ userId, userName: u.name, userRole: u.role, imageUrl, timestamp: new Date().toISOString() });
    }
    saveDb();
    return disp!;
};

export const mockNotifyDisputant = async (dispute: Dispute, sender: User, recipientId: string, recipientName: string): Promise<Dispute> => {
    const systemMessage = `[SYSTEM] ${sender.name} sent a notification to ${recipientName} to respond to the dispute.`;
    dispute.conversation.push({ userId: sender.id, userName: "System", userRole: Role.Admin, message: systemMessage, timestamp: new Date().toISOString() });
    createNotification(recipientId, `Action required in dispute #${dispute.id.slice(-6)}.`, 'Security Alert', `/disputes/${dispute.id}`);
    saveDb();
    return dispute;
};

export const mockSubmitDispute = async (order: Order, sellerId: string, reasonCategory: string, reasonMessage: string, user: User) => {
    const newD: Dispute = {
        id: `d_${Date.now()}`,
        orderId: order.id,
        buyerId: user.id,
        buyerName: user.name,
        sellerId,
        reason: reasonMessage,
        reasonCategory,
        status: DisputeStatus.Open,
        orderTotal: order.totalPrice,
        createdAt: new Date().toISOString(),
        conversation: [{ userId: user.id, userName: user.name, userRole: user.role, message: reasonMessage, timestamp: new Date().toISOString() }],
        evidence: []
    };
    db.disputes.push(newD);
    saveDb();
    return newD;
};
export const mockSubmitDisputeForBooking = async (booking: Booking, reasonCategory: string, reasonMessage: string, user: User) => {
    const newD: Dispute = {
        id: `db_${Date.now()}`,
        bookingId: booking.id,
        buyerId: user.id,
        buyerName: user.name,
        sellerId: booking.providerId,
        reason: reasonMessage,
        reasonCategory,
        status: DisputeStatus.Open,
        orderTotal: booking.price,
        createdAt: new Date().toISOString(),
        conversation: [{ userId: user.id, userName: user.name, userRole: user.role, message: reasonMessage, timestamp: new Date().toISOString() }],
        evidence: []
    };
    db.disputes.push(newD);
    saveDb();
    return newD;
};

export const mockResolveDispute = async (id: string, r: string, d: string, admin: User) => {
    const disp = db.disputes.find(item => item.id === id);
    if (!disp) throw new Error("Dispute not found");
    
    disp.status = DisputeStatus.Resolved;
    disp.resolutionDetails = d;

    const buyer = db.users.find(u => u.id === disp.buyerId);
    const seller = db.users.find(u => u.id === disp.sellerId);
    const amount = disp.orderTotal;

    if (r === 'Refund Buyer' && buyer) {
        buyer.accountBalance += amount;
        db.platformFinancials.escrowBalance -= amount;
        if (seller) seller.pendingBalance -= amount;
        db.transactions.push({
            id: `txn_ref_${Date.now()}`,
            userId: buyer.id,
            userName: buyer.name,
            type: TransactionType.Refund,
            amount: amount,
            status: TransactionStatus.Completed,
            description: `Refund for Dispute #${disp.id.slice(-6)}`,
            date: new Date().toISOString()
        });
    } else if (r === 'Release to Seller' && seller) {
        const comm = amount * 0.05;
        const payout = amount - comm;
        seller.pendingBalance -= amount;
        seller.accountBalance += payout;
        seller.totalEarnings += payout;
        db.platformFinancials.escrowBalance -= amount;
        db.platformFinancials.commissionBalance += comm;
        db.transactions.push({
            id: `txn_sale_${Date.now()}`,
            userId: seller.id,
            userName: seller.name,
            type: TransactionType.Sale,
            amount: payout,
            status: TransactionStatus.Completed,
            description: `Payout for Dispute #${disp.id.slice(-6)}`,
            date: new Date().toISOString()
        });
    }

    saveDb();
    return disp;
};

export const mockGenerateDisputeSummary = async (id: string) => {
    await delay(1000);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Summarize this dispute."
    });
    return response.text;
};
export const mockGenerateDisputeAdvice = async (id: string) => {
    await delay(1000);
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: "Provide neutral mediation advice for this dispute."
    });
    return response.text;
};
export const mockGenerateSupportReply = async (id: string) => "Reply";
export const mockGenerateDisputeReplySuggestion = async (id: string, m: string) => "Suggestion";

// --- COMMUNITY ---

export const mockGetArticles = async () => db.articles;
export const mockGetArticleById = async (id: string) => db.articles.find(a => a.id === id);
export const mockCreateArticle = async (user: User, articleData: any): Promise<Article> => {
    const newArticle: Article = { id: `article_${Date.now()}`, authorId: user.id, authorName: user.name, createdAt: new Date().toISOString(), ...articleData };
    db.articles.unshift(newArticle);
    saveDb();
    return newArticle;
};
export const mockUpdateArticle = async (id: string, articleData: Partial<Article>): Promise<Article> => {
    const article = db.articles.find(a => a.id === id);
    if (!article) throw new Error("Article not found");
    Object.assign(article, articleData);
    saveDb();
    return article;
};
export const mockDeleteArticle = async (id: string): Promise<void> => {
    db.articles = db.articles.filter(a => a.id !== id);
    saveDb();
};

export const mockGetForumPosts = async () => db.forumPosts;
export const mockGetForumPostById = async (id: string) => db.forumPosts.find(p => p.id === id);
export const mockCreateForumPost = async (user: User, title: string, content: string, category: string): Promise<ForumPost> => {
    const newPost: ForumPost = { id: `post_${Date.now()}`, title, category, authorId: user.id, authorName: user.name, authorProfileImage: user.profileImage, createdAt: new Date().toISOString(), content, likes: [], replies: [], isFlagged: false };
    db.forumPosts.unshift(newPost);
    saveDb();
    return newPost;
};
export const mockCreateForumReply = async (user: User, postId: string, content: string): Promise<ForumPost> => {
    const post = db.forumPosts.find(p => p.id === postId);
    if (!post) throw new Error("Post not found");
    const newReply: ForumReply = { id: `reply_${Date.now()}`, authorId: user.id, authorName: user.name, authorProfileImage: user.profileImage, content, createdAt: new Date().toISOString(), likes: [], isFlagged: false };
    post.replies.push(newReply);
    saveDb();
    return post;
};
export const mockToggleLike = async (userId: string, contentId: string, type: 'post' | 'reply') => {};
export const mockToggleSaveArticle = async (userId: string, articleId: string) => {
    const u = db.users.find(it => it.id === userId);
    if (u) {
        if (u.savedArticleIds.includes(articleId)) {
            u.savedArticleIds = u.savedArticleIds.filter(id => id !== articleId);
        } else {
            u.savedArticleIds.push(articleId);
        }
    }
    saveDb();
};
export const mockFlagContent = async (u: User, id: string, type: string, r: string) => {
    db.flaggedContent.push({ id: `f_${Date.now()}`, contentType: type as any, contentId: id, contentPreview: "...", reason: r, reportedBy: { id: u.id, name: u.name }, timestamp: new Date().toISOString(), isResolved: false });
    saveDb();
};

// --- ORDERS & BOOKINGS ---

export const mockCreateOrder = async (u: User, items: any, totalPrice: number, deliveryMethod: string, deliveryCost: number, estimatedDeliveryDate: string) => {
    const newO: Order = { 
        id: `o_${Date.now()}`, 
        buyerInfo: { id: u.id, name: u.name }, 
        totalPrice, 
        createdAt: new Date().toISOString(), 
        deliveryMethod, 
        deliveryCost, 
        estimatedDeliveryDate,
        sellerOrders: items.reduce((acc: any, item: any) => {
            const sellerId = item.listing.seller.id;
            let so = acc.find((s: any) => s.sellerId === sellerId);
            if (!so) {
                so = {
                    sellerId,
                    sellerName: item.listing.seller.name,
                    items: [],
                    subTotal: 0,
                    status: OrderStatus.PendingPayment,
                    trackingHistory: [{ date: new Date().toISOString(), status: 'Order Placed', location: 'Platform' }],
                    isReviewed: false
                };
                acc.push(so);
            }
            so.items.push(item);
            so.subTotal += item.listing.price * item.quantity;
            return acc;
        }, [])
    };
    db.orders.unshift(newO);
    saveDb();
    return newO;
};

export const mockGetOrders = async (id: string) => {
    if (id === 'all') return db.orders;
    return db.orders.filter(o => o.buyerInfo.id === id);
};

// Added mockGetAllOrders to satisfy AdminDashboard requirements
export const mockGetAllOrders = async () => {
    await delay(200);
    return db.orders;
};

export const mockGetOrdersBySeller = async (id: string) => {
    return db.orders.filter(o => o.sellerOrders.some(so => so.sellerId === id));
};

export const mockPayForOrder = async (orderId: string, user: User) => {
    await delay(1000);
    const order = db.orders.find(o => o.id === orderId);
    const buyer = db.users.find(u => u.id === user.id);
    if (!order || !buyer) throw new Error("Order or buyer not found");
    
    if (buyer.accountBalance < order.totalPrice) throw new Error("Insufficient funds");

    buyer.accountBalance -= order.totalPrice;
    db.platformFinancials.escrowBalance += order.totalPrice;

    db.transactions.push({
        id: `txn_pay_${Date.now()}`,
        userId: buyer.id,
        userName: buyer.name,
        type: TransactionType.Purchase,
        amount: -order.totalPrice,
        status: TransactionStatus.Completed,
        description: `Payment for Order #${order.id.slice(-6)}`,
        date: new Date().toISOString(),
        metadata: { orderId: order.id }
    });

    order.sellerOrders.forEach(so => {
        so.status = OrderStatus.Processing;
        so.trackingHistory.push({ date: new Date().toISOString(), status: 'Paid', location: 'Platform' });
        const seller = db.users.find(u => u.id === so.sellerId);
        if (seller) {
            seller.pendingBalance += so.subTotal;
            createNotification(seller.id, `Payment received for Order #${order.id.slice(-6)}.`, 'General', '/dashboard');
        }
        so.items.forEach(item => {
            const l = db.listings.find(listing => listing.id === item.listing.id);
            if (l && !l.isService && l.stock !== undefined) {
                l.stock -= item.quantity;
            }
        });
    });

    saveDb();
};

export const mockUpdateOrderStatus = async (orderId: string, sellerId: string, status: OrderStatus) => {
    await delay(400);
    const order = db.orders.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found");

    const sellerOrder = order.sellerOrders.find(so => so.sellerId === sellerId);
    if (!sellerOrder) throw new Error("Seller sub-order not found");

    sellerOrder.status = status;
    sellerOrder.trackingHistory.push({
        date: new Date().toISOString(),
        status: `Status updated to ${status}`,
        location: 'Platform'
    });

    if (status === OrderStatus.Completed) {
        const seller = db.users.find(u => u.id === sellerId);
        const subTotal = sellerOrder.subTotal;
        const comm = subTotal * 0.05;
        const payout = subTotal - comm;

        if (seller) {
            seller.pendingBalance -= subTotal;
            seller.accountBalance += payout;
            seller.totalEarnings += payout;

            db.transactions.push({
                id: `txn_sale_${Date.now()}`,
                userId: seller.id,
                userName: seller.name,
                type: TransactionType.Sale,
                amount: payout,
                status: TransactionStatus.Completed,
                description: `Payout for Order #${order.id.slice(-6)}`,
                date: new Date().toISOString(),
                metadata: { orderId: order.id }
            });
        }
        db.platformFinancials.escrowBalance -= subTotal;
        db.platformFinancials.commissionBalance += comm;
    }

    saveDb();
    return order;
};

export const mockCreateBooking = async (listing: Listing, user: User, date: string) => {
    const newB: Booking = { 
        id: `b_${Date.now()}`, 
        serviceId: listing.id,
        serviceTitle: listing.title,
        providerId: listing.seller.id,
        userId: user.id,
        userName: user.name,
        bookingDate: date,
        status: BookingStatus.Pending,
        createdAt: new Date().toISOString(),
        price: listing.price,
        isReviewed: false,
        category: listing.category
    };
    db.bookings.push(newB);
    createNotification(listing.seller.id, `New booking request for ${listing.title} from ${user.name}.`, 'New Booking', '/dashboard');
    saveDb();
    return newB;
};

export const mockGetBookingsByUser = async (userId: string) => db.bookings.filter(b => b.userId === userId);
export const mockGetBookingsByProvider = async (providerId: string) => db.bookings.filter(b => b.providerId === providerId);

export const mockUpdateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    const b = db.bookings.find(item => item.id === bookingId);
    if (b) {
        b.status = status;
        createNotification(b.userId, `Booking for ${b.serviceTitle} updated to ${status}.`, 'General', '/dashboard');
    }
    saveDb();
};

export const mockPayForBooking = async (bookingId: string, user: User) => {
    await delay(1000);
    const b = db.bookings.find(item => item.id === bookingId);
    const buyer = db.users.find(u => u.id === user.id);
    if (!b || !buyer) throw new Error("Booking or buyer not found");
    if (buyer.accountBalance < b.price) throw new Error("Insufficient funds");

    buyer.accountBalance -= b.price;
    db.platformFinancials.escrowBalance += b.price;
    b.status = BookingStatus.Processing;

    const provider = db.users.find(u => u.id === b.providerId);
    if (provider) provider.pendingBalance += b.price;

    db.transactions.push({
        id: `txn_pay_${Date.now()}`,
        userId: buyer.id,
        userName: buyer.name,
        type: TransactionType.Purchase,
        amount: -b.price,
        status: TransactionStatus.Completed,
        description: `Payment for service: "${b.serviceTitle}"`,
        date: new Date().toISOString(),
        metadata: { bookingId: b.id }
    });

    saveDb();
};

export const mockConfirmServiceCompletion = async (bookingId: string, user: User) => {
    const b = db.bookings.find(item => item.id === bookingId);
    if (!b) throw new Error("Booking not found");

    b.status = BookingStatus.Completed;
    const provider = db.users.find(u => u.id === b.providerId);
    const amount = b.price;
    const comm = amount * 0.05;
    const payout = amount - comm;

    if (provider) {
        provider.pendingBalance -= amount;
        provider.accountBalance += payout;
        provider.totalEarnings += payout;
        db.transactions.push({
            id: `txn_sale_${Date.now()}`,
            userId: provider.id,
            userName: provider.name,
            type: TransactionType.Sale,
            amount: payout,
            status: TransactionStatus.Completed,
            description: `Payout for service: "${b.serviceTitle}"`,
            date: new Date().toISOString(),
            metadata: { bookingId: b.id }
        });
    }
    db.platformFinancials.escrowBalance -= amount;
    db.platformFinancials.commissionBalance += comm;

    saveDb();
    return b;
};

// --- FINANCE ---

export const mockGetTransactions = async (userId: string) => db.transactions.filter(t => t.userId === userId);
export const mockGetAllTransactions = async () => db.transactions;
export const mockDepositFunds = async (user: User, amount: number, provider?: string, phoneNumber?: string) => { 
    const u = db.users.find(it => it.id === user.id);
    if (u) {
        u.accountBalance += amount;
        db.transactions.push({
            id: `txn_dep_${Date.now()}`,
            userId: u.id,
            userName: u.name,
            type: TransactionType.Deposit,
            amount: amount,
            status: TransactionStatus.Completed,
            description: `Deposit via ${provider || 'MoMo'}`,
            date: new Date().toISOString()
        });
    }
    saveDb(); 
    return u!; 
};
export const mockWithdrawFunds = async (user: User, amount: number, provider?: string, phoneNumber?: string, verifiedAccountHolder?: string) => { 
    const u = db.users.find(it => it.id === user.id);
    if (!u || u.accountBalance < amount) throw new Error("Insufficient funds");
    u.accountBalance -= amount;
    const txn: Transaction = { id: `txn_wd_${Date.now()}`, userId: u.id, userName: u.name, type: TransactionType.Withdrawal, amount: -amount, status: TransactionStatus.Completed, description: `Withdrawal via ${provider || 'MoMo'}`, date: new Date().toISOString(), metadata: { verifiedAccountHolder, phoneNumber } };
    db.transactions.push(txn);
    saveDb();
    return { updatedUser: u, transaction: txn }; 
};
export const mockTransferFunds = async (s: User, re: string, a: number) => {
    const sender = db.users.find(it => it.id === s.id);
    const recipient = db.users.find(it => it.email === re);
    if (!sender || !recipient || sender.accountBalance < a) throw new Error("Invalid transfer");
    
    sender.accountBalance -= a;
    recipient.accountBalance += a;

    db.transactions.push({
        id: `txn_tr_out_${Date.now()}`,
        userId: sender.id,
        userName: sender.name,
        type: TransactionType.Transfer,
        amount: -a,
        status: TransactionStatus.Completed,
        description: `Transfer to ${recipient.name}`,
        date: new Date().toISOString()
    });

    db.transactions.push({
        id: `txn_tr_in_${Date.now()}`,
        userId: recipient.id,
        userName: recipient.name,
        type: TransactionType.Transfer,
        amount: a,
        status: TransactionStatus.Completed,
        description: `Transfer from ${sender.name}`,
        date: new Date().toISOString()
    });

    saveDb(); 
    return sender; 
};

// --- MISC ---

export const mockGetNotifications = async (userId: string) => db.notifications.filter(n => n.userId === userId);
export const mockMarkAsRead = async (userId: string, notifId: string) => {
    const n = db.notifications.find(item => item.id === notifId);
    if (n) n.isRead = true; saveDb();
};
export const mockMarkAllAsRead = async (userId: string) => {
    db.notifications.forEach(n => { if (n.userId === userId) n.isRead = true; }); saveDb();
    return db.notifications.filter(n => n.userId === userId);
};

export const mockGetFlaggedContent = async () => db.flaggedContent;
export const mockResolveFlaggedContent = async (id: string) => {
    const f = db.flaggedContent.find(item => item.id === id);
    if (f) f.isResolved = true; saveDb();
};

export const mockWithdrawCommission = async (adminId: string, amount: number, dest: string) => {
    if (db.platformFinancials.commissionBalance < amount) throw new Error("Insufficient commission funds");
    db.platformFinancials.commissionBalance -= amount;
    db.platformFinancials.payouts.push({
        id: `payout_${Date.now()}`,
        amount,
        date: new Date().toISOString(),
        destination: dest,
        transactionId: `payout_tx_${Date.now()}`,
        adminId
    });
    saveDb();
};
export const mockDeleteForumContent = async (id: string, type: 'post' | 'reply') => {
    if (type === 'post') {
        db.forumPosts = db.forumPosts.filter(p => p.id !== id);
    } else {
        db.forumPosts.forEach(p => {
            p.replies = p.replies.filter(r => r.id !== id);
        });
    }
    saveDb();
};

// Added mockSubmitContactForm to satisfy ContactPage requirements
export const mockSubmitContactForm = async (data: any) => {
    await delay(1000);
    console.log("Contact form submission:", data);
    return true;
};

// FIX: Corrected missing/broken exports needed by AdminDashboard
export const mockGetPlatformHealth = async () => {
    await delay(1000);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Summarize platform health."
    });
    return { weeklySignups: 10, weeklyTransactions: 25, flaggedContent: 2, aiSummary: response.text };
};

export const mockTriageFlaggedContent = async (id: string) => {
    await delay(800);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Triage this flag.",
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text);
};

export const mockGetFeedForUser = async (userId: string) => [];
export const mockGenerateListingVideo = async (id: string, prompt: string) => 'video_url';
export const mockGetAgriculturalTasks = async (filters: any) => agriculturalTasks;
export const mockPerformOcrOnId = async (id: string) => ({ nameMatch: true, idMatch: true, summary: 'OK' });
export const mockGetServiceAnalytics = async (id: string) => ({ totalEarnings: 0, totalBookings: 0, topServices: [], bookingsLast30Days: {} });
export const mockGetSellerAnalytics = async (id: string) => ({ totalOrders: 0, totalRevenue: 0, topProducts: [], salesLast30Days: {} });
export const mockGetSellerReviews = async (id: string) => [];
export const mockSubmitSellerReview = async (o: string, s: string, u: User, r: number, c: string) => ({ id: 'sr1' } as any);
export const mockSubmitListingReview = async (id: string, user: User, r: number, c: string) => ({ id: 'rev1' } as any);
export const mockGetListingReviews = async (id: string) => [];
export const mockGetFollowerUsers = async (id: string) => [];
export const mockGetFollowingUsers = async (id: string) => [];
export const mockGetWishlist = async (id: string) => [];
export const mockAddToWishlist = async (uid: string, lid: string) => {
    const u = db.users.find(it => it.id === uid);
    if (u && !u.wishlist.includes(lid)) u.wishlist.push(lid);
    saveDb();
};
export const mockRemoveFromWishlist = async (uid: string, lid: string) => {
    const u = db.users.find(it => it.id === uid);
    if (u) u.wishlist = u.wishlist.filter(id => id !== lid);
    saveDb();
};
export const mockGetSavedArticles = async (id: string) => db.articles.filter(a => {
    const u = db.users.find(it => it.id === id);
    return u?.savedArticleIds.includes(a.id);
});
export const mockToggleFollow = async (c: string, t: string) => {
    const cur = db.users.find(it => it.id === c);
    const tar = db.users.find(it => it.id === t);
    if (cur && tar) {
        if (cur.following.includes(t)) {
            cur.following = cur.following.filter(id => id !== t);
            tar.followers = tar.followers.filter(id => id !== c);
        } else {
            cur.following.push(t);
            tar.followers.push(c);
        }
        tar.followerCount = tar.followers.length;
    }
    saveDb();
};
export const mockGetEvents = async () => db.events;
export const mockGetBadges = async () => db.badges;
export const mockGetTestimonials = async () => db.testimonials;

export const mockSubmitTestimonial = async (t: Partial<Testimonial>) => {
    const newTestimonial = { ...t, id: `testi_${Date.now()}` } as Testimonial;
    db.testimonials.push(newTestimonial);
    saveDb();
    return newTestimonial;
};
export const mockGetChatContacts = async (userId: string) => [];
export const mockGetMessagesBetweenUsers = async (userId1: string, userId2: string) => [];
export const mockSendMessage = async (sender: User, receiverId: string, content: string) => ({ id: 'm1', content: 'sent' });
export const mockGetWeather = async (r: string) => ({ region: r, temperature: 25, precipitationChance: 10, conditions: 'Sunny' as any });
export const mockGetProduceSubscriptions = async (u: string) => ({ planting: [], harvest: [] });
export const mockToggleProduceSubscription = async (u: string, c: string, t: any) => {};

// Added comment: Fix type error by using object instead of Map
export const mockUpdateTaskProgress = async (u: string, t: string, s: any) => { 
    const user = db.users.find(it => it.id === u); 
    if(user) { 
        if(!user.taskProgress) user.taskProgress = {}; 
        user.taskProgress[t] = s; 
        saveDb(); 
        return user; 
    } 
    return null; 
};

// Added comment: Fix type error by using object instead of Map
export const mockClearTaskProgress = async (u: string, t: string) => { 
    const user = db.users.find(it => it.id === u); 
    if(user) { 
        if(user.taskProgress) delete user.taskProgress[t]; 
        saveDb(); 
        return user; 
    } 
    return null; 
};

// Added comment: Fix type error by using object instead of Map
export const mockClearAllTaskProgress = async (u: string) => { 
    const user = db.users.find(it => it.id === u); 
    if(user) { 
        user.taskProgress = {}; 
        saveDb(); 
        return user; 
    } 
    return null; 
};
export const mockSetTaskReminder = async (u: string, t: any) => {};
export const mockGetPersonalizedRecommendations = async (u: User | null) => db.listings;
export const mockGlobalSearch = async (q: string) => ({ listings: [], articles: [], users: [] });
export const mockGetPlatformSettings = async () => db.platformSettings;
export const mockUpdatePlatformSettings = async (s: any) => { db.platformSettings = s; saveDb(); };
export const mockSubmitVerification = async (u: string, d: any) => { 
    const user = db.users.find(it => it.id === u); 
    if(user) {
        user.verificationStatus = VerificationStatus.Pending;
        user.nationalIdNumber = d.idNumber;
        user.businessRegistrationNumber = d.businessNumber;
        user.location = d.location;
        user.name = d.name;
        user.nationalIdImages = d.idImages;
        saveDb();
    }
    return user!; 
};

export const mockCancelOrder = async (orderId: string, userId: string, sellerId?: string) => {
    await delay(600);
    const order = db.orders.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found");

    const buyer = db.users.find(u => u.id === order.buyerInfo.id);

    if (sellerId) {
        const so = order.sellerOrders.find(s => s.sellerId === sellerId);
        if (so) {
            if (so.status === OrderStatus.Processing) {
                if (buyer) buyer.accountBalance += so.subTotal;
                db.platformFinancials.escrowBalance -= so.subTotal;
                so.items.forEach(item => {
                    const l = db.listings.find(listing => listing.id === item.listing.id);
                    if (l && !l.isService && l.stock !== undefined) l.stock += item.quantity;
                });
                const seller = db.users.find(u => u.id === sellerId);
                if (seller) seller.pendingBalance -= so.subTotal;
            }
            so.status = OrderStatus.Cancelled;
        }
    } else {
        order.sellerOrders.forEach(so => {
            if (so.status === OrderStatus.Processing || so.status === OrderStatus.PendingPayment) {
                if (buyer && so.status === OrderStatus.Processing) buyer.accountBalance += so.subTotal;
                if (so.status === OrderStatus.Processing) db.platformFinancials.escrowBalance -= so.subTotal;
                so.items.forEach(item => {
                    const l = db.listings.find(listing => listing.id === item.listing.id);
                    if (l && !l.isService && l.stock !== undefined) l.stock += item.quantity;
                });
                const seller = db.users.find(u => u.id === so.sellerId);
                if (seller && so.status === OrderStatus.Processing) seller.pendingBalance -= so.subTotal;
            }
            so.status = OrderStatus.Cancelled;
        });
    }
    saveDb();
    return order;
};

export const mockCancelBooking = async (bookingId: string, userId: string) => {
    await delay(500);
    const booking = db.bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.status === BookingStatus.Processing) {
        const buyer = db.users.find(u => u.id === booking.userId);
        if (buyer) buyer.accountBalance += booking.price;
        db.platformFinancials.escrowBalance -= booking.price;
        const provider = db.users.find(u => u.id === booking.providerId);
        if (provider) provider.pendingBalance -= booking.price;
    }
    booking.status = BookingStatus.Cancelled;
    saveDb();
    return booking;
};

export const mockWsConnect = (clientId: string, onMessage: (message: any) => void) => {};
export const mockWsDisconnect = (clientId: string) => {};
export const mockWsSubscribe = (clientId: string, topic: string) => {};
export const mockWsUnsubscribe = (clientId: string, topic: string) => {};

export const mockGetArticleById_Admin = async (id: string) => db.articles.find(a => a.id === id);
export const mockGetUserById_Admin = async (id: string) => db.users.find(u => u.id === id);
