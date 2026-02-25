import { 
  users, 
  listings,
  bids,
  reviews,
  transportRequests,
  priceHistory,
  notifications,
  cartItems,
  orders,
  orderItems,
  payments,
  favorites,
  subscriptions,
  subscriptionItems,
  contracts,
  contractItems,
  recurringOrders,
  escrowReserves,
  trustEvents,
  sellerBadges,
  coops,
  coopMembers,
  coopOrders,
  sellerContributions,
  payoutSplits,
  coopDisputes,
  userChats,
  chatMessages,
  gradeDefinitions,
  mediaEvidence,
  deliveryGrades,
  gradeDisputes,
  verificationRecords,
  sellerTrustMetrics,
  adminGradeSettings,
  type User, 
  type InsertUser,
  type Listing,
  type InsertListing,
  type Bid,
  type InsertBid,
  type Review,
  type InsertReview,
  type TransportRequest,
  type InsertTransportRequest,
  type PriceHistory,
  type Notification,
  type InsertNotification,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Payment,
  type InsertPayment,
  type Favorite,
  type InsertFavorite,
  type Subscription,
  type InsertSubscription,
  type SubscriptionItem,
  type InsertSubscriptionItem,
  type Contract,
  type InsertContract,
  type ContractItem,
  type InsertContractItem,
  type RecurringOrder,
  type InsertRecurringOrder,
  type EscrowReserve,
  type InsertEscrowReserve,
  type TrustEvent,
  type InsertTrustEvent,
  type SellerBadge,
  type InsertSellerBadge,
  type Coop,
  type InsertCoop,
  type CoopMember,
  type InsertCoopMember,
  type CoopOrder,
  type InsertCoopOrder,
  type SellerContribution,
  type InsertSellerContribution,
  type PayoutSplit,
  type InsertPayoutSplit,
  type CoopDispute,
  type InsertCoopDispute,
  type UserChat,
  type InsertUserChat,
  type ChatMessage,
  type InsertChatMessage,
  type GradeDefinition,
  type InsertGradeDefinition,
  type MediaEvidence,
  type InsertMediaEvidence,
  type DeliveryGrade,
  type InsertDeliveryGrade,
  type GradeDispute,
  type InsertGradeDispute,
  type VerificationRecord,
  type InsertVerificationRecord,
  type SellerTrustMetrics,
  type InsertSellerTrustMetrics,
  type AdminGradeSetting,
  type InsertAdminGradeSetting,
  demandForecasts,
  forecastResponses,
  forecastConversions,
  type DemandForecast,
  type InsertDemandForecast,
  type ForecastResponse,
  type InsertForecastResponse,
  type ForecastConversion,
  type InsertForecastConversion,
  transportJobs,
  transportOffers,
  transportProofs,
  transportEscrows,
  transportDisputes,
  transportRatings,
  transporterReliability,
  transportSubscriptions,
  type TransportJob,
  type InsertTransportJob,
  type TransportOffer,
  type InsertTransportOffer,
  type TransportProof,
  type InsertTransportProof,
  type TransportEscrow,
  type InsertTransportEscrow,
  type TransportDispute,
  type InsertTransportDispute,
  type TransportRating,
  type InsertTransportRating,
  type TransporterReliability,
  type InsertTransporterReliability,
  type TransportSubscription,
  type InsertTransportSubscription,
  userFavourites,
  type UserFavourite,
  type InsertUserFavourite,
  transportCostSplits,
  type TransportCostSplit,
  type InsertTransportCostSplit,
  userSubscriptions,
  type UserSubscription,
  type InsertUserSubscription,
  marketInsights,
  type MarketInsight,
  type InsertMarketInsight,
  platformConfig,
  type PlatformConfig,
  type InsertPlatformConfig,
  fees,
  type Fee,
  type InsertFee,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  updateUserRating(userId: string, newRating: number): Promise<void>;
  
  getListings(filters?: { category?: string; location?: string; sellerId?: string }): Promise<Listing[]>;
  getListing(id: string): Promise<Listing | undefined>;
  createListing(listing: InsertListing, sellerId: string): Promise<Listing>;
  updateListing(id: string, updates: Partial<InsertListing>): Promise<Listing>;
  deleteListing(id: string): Promise<void>;
  
  getBidsForListing(listingId: string): Promise<Bid[]>;
  createBid(bid: InsertBid, buyerId: string): Promise<Bid>;
  updateBidStatus(bidId: string, status: "accepted" | "rejected"): Promise<Bid>;
  
  getReviewsForUser(userId: string): Promise<Review[]>;
  createReview(review: InsertReview, reviewerId: string): Promise<Review>;
  
  getTransportRequests(filters?: { requesterId?: string; transporterId?: string }): Promise<TransportRequest[]>;
  createTransportRequest(request: InsertTransportRequest, requesterId: string): Promise<TransportRequest>;
  updateTransportStatus(id: string, status: string, transporterId?: string): Promise<TransportRequest>;
  
  getPriceHistory(commodity: string, region: string, days?: number): Promise<PriceHistory[]>;
  recordPrice(commodity: string, category: string, region: string, price: number, unit: string): Promise<void>;
  
  // Admin methods
  getAllUsers(): Promise<User[]>;
  getAllListings(): Promise<Listing[]>;
  getTransporters(): Promise<User[]>;
  updateUserVerification(userId: string, verified: boolean): Promise<User>;
  updateUserRole(userId: string, role: string): Promise<User>;
  updateListingFeatured(listingId: string, featured: boolean): Promise<Listing>;
  updateListingStatus(listingId: string, status: string): Promise<Listing>;
  getStats(): Promise<{ totalUsers: number; totalListings: number; totalBids: number; activeListings: number }>;
  
  // Notifications
  getNotificationsForUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<Notification>;
  markAllNotificationsRead(userId: string): Promise<void>;
  
  // Cart
  getCartItems(userId: string): Promise<(CartItem & { listing: Listing })[]>;
  addToCart(userId: string, listingId: string, quantity: number): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem>;
  removeFromCart(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;
  
  // Orders
  createOrder(order: InsertOrder, items: { listingId: string; quantity: number; pricePerUnit: number; total: number }[]): Promise<Order>;
  getOrder(id: string): Promise<(Order & { items: (OrderItem & { listing: Listing })[]; payment: Payment | null; buyer: User; seller: User }) | undefined>;
  getOrdersForUser(userId: string, role: 'buyer' | 'seller'): Promise<Order[]>;
  updateOrderStatus(orderId: string, status: string, updates?: Partial<Order>): Promise<Order>;
  
  // Payments
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(orderId: string): Promise<Payment | undefined>;
  updatePaymentStatus(orderId: string, status: string, providerReference?: string): Promise<Payment>;
  releaseEscrow(orderId: string): Promise<Payment>;
  
  // Favorites
  getFavorites(userId: string): Promise<(Favorite & { listing: Listing })[]>;
  addFavorite(userId: string, listingId: string): Promise<Favorite>;
  removeFavorite(userId: string, listingId: string): Promise<void>;
  isFavorited(userId: string, listingId: string): Promise<boolean>;
  getUsersWhoFavorited(listingId: string): Promise<string[]>;
  getUsersWhoFavoritedSeller(sellerId: string): Promise<string[]>;
  
  // Subscriptions
  createSubscription(subscription: InsertSubscription, items: InsertSubscriptionItem[]): Promise<Subscription>;
  getSubscription(id: string): Promise<(Subscription & { items: (SubscriptionItem & { listing: Listing })[]; buyer: User; seller: User }) | undefined>;
  getSubscriptionsForBuyer(buyerId: string): Promise<Subscription[]>;
  getSubscriptionsForSeller(sellerId: string): Promise<Subscription[]>;
  updateSubscriptionStatus(id: string, status: string, sellerResponse?: string): Promise<Subscription>;
  
  // Contracts
  createContract(contract: InsertContract, items: InsertContractItem[]): Promise<Contract>;
  getContract(id: string): Promise<(Contract & { items: ContractItem[]; buyer: User; seller: User; subscription: Subscription }) | undefined>;
  getContractsForBuyer(buyerId: string): Promise<Contract[]>;
  getContractsForSeller(sellerId: string): Promise<Contract[]>;
  getAllContracts(): Promise<Contract[]>;
  updateContractStatus(id: string, status: string): Promise<Contract>;
  incrementCompletedDeliveries(contractId: string): Promise<Contract>;
  
  // Recurring Orders
  createRecurringOrder(recurringOrder: InsertRecurringOrder): Promise<RecurringOrder>;
  getRecurringOrdersForContract(contractId: string): Promise<RecurringOrder[]>;
  getUpcomingRecurringOrders(sellerId: string): Promise<(RecurringOrder & { contract: Contract })[]>;
  getPendingRecurringOrders(): Promise<RecurringOrder[]>;
  updateRecurringOrder(id: string, updates: Partial<RecurringOrder>): Promise<RecurringOrder>;
  confirmDelivery(id: string, confirmation: string, notes?: string): Promise<RecurringOrder>;
  
  // Escrow Reserves
  createEscrowReserve(reserve: InsertEscrowReserve): Promise<EscrowReserve>;
  getEscrowReservesForContract(contractId: string): Promise<EscrowReserve[]>;
  updateEscrowReserveStatus(id: string, status: string): Promise<EscrowReserve>;
  fundEscrowReserve(id: string): Promise<EscrowReserve>;
  releaseEscrowReserve(id: string): Promise<EscrowReserve>;
  
  // Trust Events & Badges
  createTrustEvent(event: InsertTrustEvent): Promise<TrustEvent>;
  getTrustEventsForUser(userId: string): Promise<TrustEvent[]>;
  updateUserTrustScore(userId: string, delta: number): Promise<User>;
  getSellerBadges(sellerId: string): Promise<SellerBadge[]>;
  awardBadge(sellerId: string, badgeType: string): Promise<SellerBadge>;
  getSellerMetrics(sellerId: string): Promise<{ fulfillmentRate: number; onTimeRate: number; completionRate: number; disputeCount: number }>;
  
  // Co-Op (Group Supply) Methods
  createCoop(coop: InsertCoop): Promise<Coop>;
  getCoop(id: string): Promise<Coop | undefined>;
  getCoops(filters?: { status?: string; productType?: string }): Promise<Coop[]>;
  updateCoop(id: string, updates: Partial<Coop>): Promise<Coop>;
  getCoopWithMembers(id: string): Promise<{ coop: Coop; members: (CoopMember & { seller: User })[] } | undefined>;
  
  // Co-Op Members
  joinCoop(member: InsertCoopMember): Promise<CoopMember>;
  updateCoopMember(id: string, updates: Partial<CoopMember>): Promise<CoopMember>;
  getCoopMembers(coopId: string): Promise<(CoopMember & { seller: User })[]>;
  markMemberReady(memberId: string): Promise<CoopMember>;
  markMemberDelivered(memberId: string, quantity: string): Promise<CoopMember>;
  
  // Co-Op Orders
  createCoopOrder(order: InsertCoopOrder): Promise<CoopOrder>;
  getCoopOrder(id: string): Promise<CoopOrder | undefined>;
  getCoopOrders(coopId: string): Promise<CoopOrder[]>;
  updateCoopOrder(id: string, updates: Partial<CoopOrder>): Promise<CoopOrder>;
  fundCoopEscrow(orderId: string): Promise<CoopOrder>;
  confirmCoopDelivery(orderId: string, photo?: string): Promise<CoopOrder>;
  
  // Seller Contributions
  createSellerContribution(contribution: InsertSellerContribution): Promise<SellerContribution>;
  updateSellerContribution(id: string, updates: Partial<SellerContribution>): Promise<SellerContribution>;
  getContributionsForOrder(orderId: string): Promise<(SellerContribution & { member: CoopMember & { seller: User } })[]>;
  
  // Payout Splits
  createPayoutSplit(payout: InsertPayoutSplit): Promise<PayoutSplit>;
  getPayoutsForOrder(orderId: string): Promise<PayoutSplit[]>;
  updatePayoutSplit(id: string, updates: Partial<PayoutSplit>): Promise<PayoutSplit>;
  processPayouts(orderId: string): Promise<PayoutSplit[]>;
  
  // Co-Op Disputes
  createCoopDispute(dispute: InsertCoopDispute): Promise<CoopDispute>;
  getCoopDispute(id: string): Promise<CoopDispute | undefined>;
  getCoopDisputes(filters?: { status?: string; orderId?: string }): Promise<CoopDispute[]>;
  resolveCoopDispute(id: string, resolution: string, resolvedBy: string): Promise<CoopDispute>;
  
  // Demand Forecasts
  createDemandForecast(forecast: InsertDemandForecast): Promise<DemandForecast>;
  getDemandForecast(id: string): Promise<DemandForecast | undefined>;
  getDemandForecastsForBuyer(buyerId: string): Promise<DemandForecast[]>;
  getDemandForecastsForSellers(sellerId: string, location?: string): Promise<(DemandForecast & { buyer: User; responses: ForecastResponse[] })[]>;
  updateDemandForecast(id: string, updates: Partial<DemandForecast>): Promise<DemandForecast>;
  cancelDemandForecast(id: string): Promise<DemandForecast>;
  
  // Forecast Responses
  createForecastResponse(response: InsertForecastResponse): Promise<ForecastResponse>;
  getForecastResponses(forecastId: string): Promise<(ForecastResponse & { seller: User })[]>;
  updateForecastResponse(id: string, updates: Partial<ForecastResponse>): Promise<ForecastResponse>;
  
  // Forecast Conversions
  createForecastConversion(conversion: InsertForecastConversion): Promise<ForecastConversion>;
  getForecastConversions(forecastId: string): Promise<ForecastConversion[]>;
  
  // Forecast Analytics (Admin only)
  getForecastStats(): Promise<{ totalForecasts: number; activeForecasts: number; totalResponses: number; conversionRate: number; topProducts: { product: string; count: number }[] }>;
  
  // User Favourites
  getUserFavourites(userId: string): Promise<(UserFavourite & { favouriteUser: User })[]>;
  addUserFavourite(userId: string, favouriteUserId: string, role: string): Promise<UserFavourite>;
  removeUserFavourite(userId: string, favouriteUserId: string): Promise<void>;
  isUserFavourited(userId: string, favouriteUserId: string): Promise<boolean>;
  hasCompletedTransaction(userId1: string, userId2: string): Promise<boolean>;
  getFavouriteTransporters(userId: string): Promise<(UserFavourite & { favouriteUser: User })[]>;
  
  // Transport Cost Splits
  createTransportCostSplit(split: InsertTransportCostSplit): Promise<TransportCostSplit>;
  getTransportCostSplit(orderId: string): Promise<TransportCostSplit | undefined>;
  getTransportCostSplitById(id: string): Promise<TransportCostSplit | undefined>;
  getTransportCostSplitByJob(jobId: string): Promise<TransportCostSplit | undefined>;
  updateTransportCostSplit(id: string, updates: Partial<TransportCostSplit>): Promise<TransportCostSplit>;
  fundTransportCostSplit(id: string, funder: 'buyer' | 'farmer'): Promise<TransportCostSplit>;
  recalculateCostSplit(id: string, newTotal: number): Promise<TransportCostSplit>;

  // User Subscriptions
  getUserSubscription(userId: string): Promise<UserSubscription | undefined>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: string, updates: Partial<UserSubscription>): Promise<UserSubscription>;
  getEffectiveUserTier(userId: string): Promise<string>;

  // Market Insights
  getMarketInsights(options: {
    targetRole?: string;
    targetUserId?: string;
    type?: string;
    category?: string;
    requiredTier?: string;
    activeOnly?: boolean;
    limit?: number;
  }): Promise<MarketInsight[]>;
  createMarketInsight(insight: InsertMarketInsight): Promise<MarketInsight>;
  updateMarketInsight(id: string, updates: Partial<MarketInsight>): Promise<MarketInsight>;
  getMarketInsightById(id: string): Promise<MarketInsight | undefined>;
  getFilteredInsightsForUser(userId: string, userRole: string, userTier: string): Promise<MarketInsight[]>;

  // Platform Config & Fees
  getPlatformConfig(key: string): Promise<PlatformConfig | undefined>;
  getAllPlatformConfig(): Promise<PlatformConfig[]>;
  setPlatformConfig(key: string, value: string, description?: string, updatedBy?: string): Promise<PlatformConfig>;
  
  createFee(fee: InsertFee): Promise<Fee>;
  getFeesByTransaction(transactionId: string): Promise<Fee[]>;
  getFeesByUser(userId: string, limit?: number): Promise<Fee[]>;
  updateFeeStatus(id: string, status: string, appliedAt?: Date): Promise<Fee>;
  getFeeAnalytics(startDate?: Date, endDate?: Date): Promise<{ totalFees: number; byType: Record<string, number>; byTier: Record<string, number> }>;
  
  // Fee calculation helpers
  calculateTransactionFee(amount: number, buyerTier: string, farmerTier: string, isContract: boolean): Promise<{
    buyerFee: { percentage: number; amount: number };
    farmerFee: { percentage: number; amount: number };
    totalFee: number;
  }>;
  calculateTransportFee(amount: number, transporterTier: string): Promise<{ percentage: number; amount: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserRating(userId: string, newRating: number): Promise<void> {
    await db.update(users)
      .set({ rating: newRating.toFixed(2) })
      .where(eq(users.id, userId));
  }

  async getListings(filters?: { category?: string; location?: string; sellerId?: string }): Promise<Listing[]> {
    const conditions = [eq(listings.status, "active")];
    
    if (filters?.category) {
      conditions.push(eq(listings.category, filters.category as any));
    }
    if (filters?.sellerId) {
      conditions.push(eq(listings.sellerId, filters.sellerId));
    }
    
    return await db.select().from(listings)
      .where(and(...conditions))
      .orderBy(desc(listings.createdAt));
  }

  async getListing(id: string): Promise<Listing | undefined> {
    const [listing] = await db.select().from(listings).where(eq(listings.id, id));
    return listing || undefined;
  }

  async createListing(listing: InsertListing, sellerId: string): Promise<Listing> {
    const [newListing] = await db
      .insert(listings)
      .values({ ...listing, sellerId })
      .returning();
    return newListing;
  }

  async updateListing(id: string, updates: Partial<InsertListing>): Promise<Listing> {
    const [updated] = await db
      .update(listings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();
    return updated;
  }

  async deleteListing(id: string): Promise<void> {
    await db.update(listings)
      .set({ status: "expired" })
      .where(eq(listings.id, id));
  }

  async getBidsForListing(listingId: string): Promise<Bid[]> {
    return await db.select().from(bids)
      .where(eq(bids.listingId, listingId))
      .orderBy(desc(bids.createdAt));
  }

  async createBid(bid: InsertBid, buyerId: string): Promise<Bid> {
    const [newBid] = await db
      .insert(bids)
      .values({ ...bid, buyerId })
      .returning();
    return newBid;
  }

  async updateBidStatus(bidId: string, status: "accepted" | "rejected"): Promise<Bid> {
    const [updated] = await db
      .update(bids)
      .set({ status })
      .where(eq(bids.id, bidId))
      .returning();
    return updated;
  }

  async getReviewsForUser(userId: string): Promise<Review[]> {
    return await db.select().from(reviews)
      .where(eq(reviews.revieweeId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview, reviewerId: string): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values({ ...review, reviewerId })
      .returning();
    
    const allReviews = await this.getReviewsForUser(review.revieweeId);
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await this.updateUserRating(review.revieweeId, avgRating);
    
    return newReview;
  }

  async getTransportRequests(filters?: { requesterId?: string; transporterId?: string }): Promise<TransportRequest[]> {
    const conditions = [];
    
    if (filters?.requesterId) {
      conditions.push(eq(transportRequests.requesterId, filters.requesterId));
    }
    if (filters?.transporterId && filters.transporterId !== "null") {
      conditions.push(eq(transportRequests.transporterId, filters.transporterId));
    }
    
    const query = db.select().from(transportRequests);
    const withConditions = conditions.length > 0 ? query.where(and(...conditions)) : query;
    
    return await withConditions.orderBy(desc(transportRequests.createdAt));
  }

  async createTransportRequest(request: InsertTransportRequest, requesterId: string): Promise<TransportRequest> {
    const [newRequest] = await db
      .insert(transportRequests)
      .values({ ...request, requesterId })
      .returning();
    return newRequest;
  }

  async updateTransportStatus(id: string, status: string, transporterId?: string): Promise<TransportRequest> {
    const updates: any = { status, updatedAt: new Date() };
    if (transporterId) {
      updates.transporterId = transporterId;
    }
    
    const [updated] = await db
      .update(transportRequests)
      .set(updates)
      .where(eq(transportRequests.id, id))
      .returning();
    return updated;
  }

  async getPriceHistory(commodity: string, region: string, days: number = 7): Promise<PriceHistory[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await db.select().from(priceHistory)
      .where(
        and(
          eq(priceHistory.commodity, commodity),
          eq(priceHistory.region, region),
          gte(priceHistory.recordedAt, startDate)
        )
      )
      .orderBy(priceHistory.recordedAt);
  }

  async recordPrice(commodity: string, category: string, region: string, price: number, unit: string): Promise<void> {
    await db.insert(priceHistory)
      .values({ commodity, category: category as any, region, price, unit });
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllListings(): Promise<Listing[]> {
    return await db.select().from(listings).orderBy(desc(listings.createdAt));
  }

  async getTransporters(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "transporter")).orderBy(desc(users.rating));
  }

  async updateUserVerification(userId: string, verified: boolean): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ verified })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ role: role as any })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateListingFeatured(listingId: string, featured: boolean): Promise<Listing> {
    const [updated] = await db
      .update(listings)
      .set({ featured, updatedAt: new Date() })
      .where(eq(listings.id, listingId))
      .returning();
    return updated;
  }

  async updateListingStatus(listingId: string, status: string): Promise<Listing> {
    const [updated] = await db
      .update(listings)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(listings.id, listingId))
      .returning();
    return updated;
  }

  async getStats(): Promise<{ totalUsers: number; totalListings: number; totalBids: number; activeListings: number }> {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [listingCount] = await db.select({ count: sql<number>`count(*)` }).from(listings);
    const [bidCount] = await db.select({ count: sql<number>`count(*)` }).from(bids);
    const [activeCount] = await db.select({ count: sql<number>`count(*)` }).from(listings).where(eq(listings.status, "active"));
    
    return {
      totalUsers: Number(userCount.count),
      totalListings: Number(listingCount.count),
      totalBids: Number(bidCount.count),
      activeListings: Number(activeCount.count),
    };
  }

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationRead(id: string): Promise<Notification> {
    const [updated] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async getCartItems(userId: string): Promise<(CartItem & { listing: Listing })[]> {
    const items = await db.select().from(cartItems)
      .where(eq(cartItems.userId, userId))
      .orderBy(desc(cartItems.createdAt));
    
    const result = [];
    for (const item of items) {
      const [listing] = await db.select().from(listings).where(eq(listings.id, item.listingId));
      if (listing) {
        result.push({ ...item, listing });
      }
    }
    return result;
  }

  async addToCart(userId: string, listingId: string, quantity: number): Promise<CartItem> {
    const existingItems = await db.select().from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.listingId, listingId)));
    
    if (existingItems.length > 0) {
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: existingItems[0].quantity + quantity })
        .where(eq(cartItems.id, existingItems[0].id))
        .returning();
      return updated;
    }
    
    const [newItem] = await db
      .insert(cartItems)
      .values({ userId, listingId, quantity })
      .returning();
    return newItem;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem> {
    const [updated] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updated;
  }

  async removeFromCart(id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  async createOrder(order: InsertOrder, items: { listingId: string; quantity: number; pricePerUnit: number; total: number }[]): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    
    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        listingId: item.listingId,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        total: item.total,
      });
    }
    
    return newOrder;
  }

  async getOrder(id: string): Promise<(Order & { items: (OrderItem & { listing: Listing })[]; payment: Payment | null; buyer: User; seller: User }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    const itemsWithListings = [];
    for (const item of items) {
      const [listing] = await db.select().from(listings).where(eq(listings.id, item.listingId));
      if (listing) {
        itemsWithListings.push({ ...item, listing });
      }
    }

    const [payment] = await db.select().from(payments).where(eq(payments.orderId, id));
    const [buyer] = await db.select().from(users).where(eq(users.id, order.buyerId));
    const [seller] = await db.select().from(users).where(eq(users.id, order.sellerId));

    return { ...order, items: itemsWithListings, payment: payment || null, buyer, seller };
  }

  async getOrdersForUser(userId: string, role: 'buyer' | 'seller'): Promise<Order[]> {
    const field = role === 'buyer' ? orders.buyerId : orders.sellerId;
    return await db.select().from(orders).where(eq(field, userId)).orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(orderId: string, status: string, updates?: Partial<Order>): Promise<Order> {
    const [updated] = await db.update(orders)
      .set({ status: status as any, ...updates, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return updated;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getPayment(orderId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.orderId, orderId));
    return payment || undefined;
  }

  async updatePaymentStatus(orderId: string, status: string, providerReference?: string): Promise<Payment> {
    const updateData: any = { status: status as any, updatedAt: new Date() };
    if (providerReference) updateData.providerReference = providerReference;
    
    const [updated] = await db.update(payments)
      .set(updateData)
      .where(eq(payments.orderId, orderId))
      .returning();
    return updated;
  }

  async releaseEscrow(orderId: string): Promise<Payment> {
    const [updated] = await db.update(payments)
      .set({ escrowReleased: true, releasedAt: new Date(), updatedAt: new Date() })
      .where(eq(payments.orderId, orderId))
      .returning();
    return updated;
  }

  async getFavorites(userId: string): Promise<(Favorite & { listing: Listing })[]> {
    const result = await db
      .select()
      .from(favorites)
      .innerJoin(listings, eq(favorites.listingId, listings.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
    
    return result.map(row => ({
      ...row.favorites,
      listing: row.listings,
    }));
  }

  async addFavorite(userId: string, listingId: string): Promise<Favorite> {
    const [favorite] = await db
      .insert(favorites)
      .values({ userId, listingId })
      .onConflictDoNothing()
      .returning();
    
    if (!favorite) {
      const [existing] = await db
        .select()
        .from(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)));
      return existing;
    }
    return favorite;
  }

  async removeFavorite(userId: string, listingId: string): Promise<void> {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)));
  }

  async isFavorited(userId: string, listingId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)));
    return !!result;
  }

  async getUsersWhoFavorited(listingId: string): Promise<string[]> {
    const result = await db
      .select({ userId: favorites.userId })
      .from(favorites)
      .where(eq(favorites.listingId, listingId));
    return result.map(r => r.userId);
  }

  async getUsersWhoFavoritedSeller(sellerId: string): Promise<string[]> {
    const result = await db
      .selectDistinct({ userId: favorites.userId })
      .from(favorites)
      .innerJoin(listings, eq(favorites.listingId, listings.id))
      .where(eq(listings.sellerId, sellerId));
    return result.map(r => r.userId);
  }

  // Subscriptions
  async createSubscription(subscription: InsertSubscription, items: InsertSubscriptionItem[]): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    
    for (const item of items) {
      await db.insert(subscriptionItems).values({
        ...item,
        subscriptionId: newSubscription.id,
      });
    }
    
    return newSubscription;
  }

  async getSubscription(id: string): Promise<(Subscription & { items: (SubscriptionItem & { listing: Listing })[]; buyer: User; seller: User }) | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    if (!subscription) return undefined;

    const items = await db.select().from(subscriptionItems).where(eq(subscriptionItems.subscriptionId, id));
    const itemsWithListings = [];
    for (const item of items) {
      const [listing] = await db.select().from(listings).where(eq(listings.id, item.listingId));
      if (listing) {
        itemsWithListings.push({ ...item, listing });
      }
    }

    const [buyer] = await db.select().from(users).where(eq(users.id, subscription.buyerId));
    const [seller] = await db.select().from(users).where(eq(users.id, subscription.sellerId));

    return { ...subscription, items: itemsWithListings, buyer, seller };
  }

  async getSubscriptionsForBuyer(buyerId: string): Promise<Subscription[]> {
    return await db.select().from(subscriptions)
      .where(eq(subscriptions.buyerId, buyerId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async getSubscriptionsForSeller(sellerId: string): Promise<Subscription[]> {
    return await db.select().from(subscriptions)
      .where(eq(subscriptions.sellerId, sellerId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async updateSubscriptionStatus(id: string, status: string, sellerResponse?: string): Promise<Subscription> {
    const updates: any = { status: status as any, updatedAt: new Date(), respondedAt: new Date() };
    if (sellerResponse) updates.sellerResponse = sellerResponse;
    
    const [updated] = await db.update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  // Contracts
  async createContract(contract: InsertContract, items: InsertContractItem[]): Promise<Contract> {
    const [newContract] = await db.insert(contracts).values(contract).returning();
    
    for (const item of items) {
      await db.insert(contractItems).values({
        ...item,
        contractId: newContract.id,
      });
    }
    
    return newContract;
  }

  async getContract(id: string): Promise<(Contract & { items: ContractItem[]; buyer: User; seller: User; subscription: Subscription }) | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    if (!contract) return undefined;

    const items = await db.select().from(contractItems).where(eq(contractItems.contractId, id));
    const [buyer] = await db.select().from(users).where(eq(users.id, contract.buyerId));
    const [seller] = await db.select().from(users).where(eq(users.id, contract.sellerId));
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, contract.subscriptionId));

    return { ...contract, items, buyer, seller, subscription };
  }

  async getContractsForBuyer(buyerId: string): Promise<Contract[]> {
    return await db.select().from(contracts)
      .where(eq(contracts.buyerId, buyerId))
      .orderBy(desc(contracts.createdAt));
  }

  async getContractsForSeller(sellerId: string): Promise<Contract[]> {
    return await db.select().from(contracts)
      .where(eq(contracts.sellerId, sellerId))
      .orderBy(desc(contracts.createdAt));
  }

  async getAllContracts(): Promise<Contract[]> {
    return await db.select().from(contracts).orderBy(desc(contracts.createdAt));
  }

  async updateContractStatus(id: string, status: string): Promise<Contract> {
    const [updated] = await db.update(contracts)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(contracts.id, id))
      .returning();
    return updated;
  }

  async incrementCompletedDeliveries(contractId: string): Promise<Contract> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, contractId));
    const [updated] = await db.update(contracts)
      .set({ 
        completedDeliveries: contract.completedDeliveries + 1,
        updatedAt: new Date() 
      })
      .where(eq(contracts.id, contractId))
      .returning();
    return updated;
  }

  // Recurring Orders
  async createRecurringOrder(recurringOrder: InsertRecurringOrder): Promise<RecurringOrder> {
    const [newOrder] = await db.insert(recurringOrders).values(recurringOrder).returning();
    return newOrder;
  }

  async getRecurringOrdersForContract(contractId: string): Promise<RecurringOrder[]> {
    return await db.select().from(recurringOrders)
      .where(eq(recurringOrders.contractId, contractId))
      .orderBy(recurringOrders.scheduledDate);
  }

  async getUpcomingRecurringOrders(sellerId: string): Promise<(RecurringOrder & { contract: Contract })[]> {
    const result = await db
      .select()
      .from(recurringOrders)
      .innerJoin(contracts, eq(recurringOrders.contractId, contracts.id))
      .where(and(
        eq(contracts.sellerId, sellerId),
        eq(recurringOrders.status, "pending")
      ))
      .orderBy(recurringOrders.scheduledDate);
    
    return result.map(row => ({
      ...row.recurring_orders,
      contract: row.contracts,
    }));
  }

  async getPendingRecurringOrders(): Promise<RecurringOrder[]> {
    return await db.select().from(recurringOrders)
      .where(eq(recurringOrders.status, "pending"))
      .orderBy(recurringOrders.scheduledDate);
  }

  async updateRecurringOrder(id: string, updates: Partial<RecurringOrder>): Promise<RecurringOrder> {
    const [updated] = await db.update(recurringOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(recurringOrders.id, id))
      .returning();
    return updated;
  }

  async confirmDelivery(id: string, confirmation: string, notes?: string): Promise<RecurringOrder> {
    const [updated] = await db.update(recurringOrders)
      .set({ 
        deliveryConfirmation: confirmation as any,
        confirmationNotes: notes,
        confirmedAt: new Date(),
        status: "completed" as any,
        updatedAt: new Date()
      })
      .where(eq(recurringOrders.id, id))
      .returning();
    return updated;
  }

  // Escrow Reserves
  async createEscrowReserve(reserve: InsertEscrowReserve): Promise<EscrowReserve> {
    const [newReserve] = await db.insert(escrowReserves).values(reserve).returning();
    return newReserve;
  }

  async getEscrowReservesForContract(contractId: string): Promise<EscrowReserve[]> {
    return await db.select().from(escrowReserves)
      .where(eq(escrowReserves.contractId, contractId))
      .orderBy(escrowReserves.periodStart);
  }

  async updateEscrowReserveStatus(id: string, status: string): Promise<EscrowReserve> {
    const [updated] = await db.update(escrowReserves)
      .set({ status: status as any })
      .where(eq(escrowReserves.id, id))
      .returning();
    return updated;
  }

  async fundEscrowReserve(id: string): Promise<EscrowReserve> {
    const [updated] = await db.update(escrowReserves)
      .set({ status: "completed" as any, fundedAt: new Date() })
      .where(eq(escrowReserves.id, id))
      .returning();
    return updated;
  }

  async releaseEscrowReserve(id: string): Promise<EscrowReserve> {
    const [updated] = await db.update(escrowReserves)
      .set({ status: "completed" as any, releasedAt: new Date() })
      .where(eq(escrowReserves.id, id))
      .returning();
    return updated;
  }

  // Trust Events & Badges
  async createTrustEvent(event: InsertTrustEvent): Promise<TrustEvent> {
    const [newEvent] = await db.insert(trustEvents).values(event).returning();
    await this.updateUserTrustScore(event.userId, event.delta);
    return newEvent;
  }

  async getTrustEventsForUser(userId: string): Promise<TrustEvent[]> {
    return await db.select().from(trustEvents)
      .where(eq(trustEvents.userId, userId))
      .orderBy(desc(trustEvents.createdAt));
  }

  async updateUserTrustScore(userId: string, delta: number): Promise<User> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const newScore = Math.max(0, Math.min(100, user.trustScore + delta));
    
    const [updated] = await db.update(users)
      .set({ trustScore: newScore })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getSellerBadges(sellerId: string): Promise<SellerBadge[]> {
    return await db.select().from(sellerBadges)
      .where(and(eq(sellerBadges.sellerId, sellerId), eq(sellerBadges.active, true)))
      .orderBy(desc(sellerBadges.earnedAt));
  }

  async awardBadge(sellerId: string, badgeType: string): Promise<SellerBadge> {
    const existing = await db.select().from(sellerBadges)
      .where(and(
        eq(sellerBadges.sellerId, sellerId), 
        eq(sellerBadges.badgeType, badgeType as any),
        eq(sellerBadges.active, true)
      ));
    
    if (existing.length > 0) return existing[0];
    
    const [newBadge] = await db.insert(sellerBadges)
      .values({ sellerId, badgeType: badgeType as any })
      .returning();
    return newBadge;
  }

  async getSellerMetrics(sellerId: string): Promise<{ fulfillmentRate: number; onTimeRate: number; completionRate: number; disputeCount: number }> {
    const sellerContracts = await db.select().from(contracts).where(eq(contracts.sellerId, sellerId));
    
    if (sellerContracts.length === 0) {
      return { fulfillmentRate: 100, onTimeRate: 100, completionRate: 100, disputeCount: 0 };
    }

    const completedContracts = sellerContracts.filter(c => c.status === "completed").length;
    const totalDeliveries = sellerContracts.reduce((sum, c) => sum + c.totalDeliveries, 0);
    const completedDeliveries = sellerContracts.reduce((sum, c) => sum + c.completedDeliveries, 0);
    
    const disputedOrders = await db.select().from(orders)
      .where(and(eq(orders.sellerId, sellerId), eq(orders.status, "disputed")));

    return {
      fulfillmentRate: totalDeliveries > 0 ? Math.round((completedDeliveries / totalDeliveries) * 100) : 100,
      onTimeRate: 95,
      completionRate: sellerContracts.length > 0 ? Math.round((completedContracts / sellerContracts.length) * 100) : 100,
      disputeCount: disputedOrders.length,
    };
  }

  // ============ CO-OP (GROUP SUPPLY) METHODS ============

  async createCoop(coop: InsertCoop): Promise<Coop> {
    const [newCoop] = await db.insert(coops).values(coop).returning();
    return newCoop;
  }

  async getCoop(id: string): Promise<Coop | undefined> {
    const [coop] = await db.select().from(coops).where(eq(coops.id, id));
    return coop || undefined;
  }

  async getCoops(filters?: { status?: string; productType?: string }): Promise<Coop[]> {
    const conditions: any[] = [];
    
    if (filters?.status) {
      conditions.push(eq(coops.status, filters.status as any));
    }
    if (filters?.productType) {
      conditions.push(eq(coops.productType, filters.productType as any));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(coops).where(and(...conditions)).orderBy(desc(coops.createdAt));
    }
    return await db.select().from(coops).orderBy(desc(coops.createdAt));
  }

  async updateCoop(id: string, updates: Partial<Coop>): Promise<Coop> {
    const [updated] = await db.update(coops)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(coops.id, id))
      .returning();
    return updated;
  }

  async getCoopWithMembers(id: string): Promise<{ coop: Coop; members: (CoopMember & { seller: User })[] } | undefined> {
    const [coop] = await db.select().from(coops).where(eq(coops.id, id));
    if (!coop) return undefined;
    
    const membersResult = await db.select()
      .from(coopMembers)
      .innerJoin(users, eq(coopMembers.sellerId, users.id))
      .where(eq(coopMembers.coopId, id));
    
    const members = membersResult.map(row => ({
      ...row.coop_members,
      seller: row.users,
    }));
    
    return { coop, members };
  }

  // Co-Op Members
  async joinCoop(member: InsertCoopMember): Promise<CoopMember> {
    const [newMember] = await db.insert(coopMembers).values(member).returning();
    
    // Update co-op current quantity
    const coop = await this.getCoop(member.coopId);
    if (coop) {
      const newQuantity = parseFloat(coop.currentQuantity) + parseFloat(member.committedQuantity);
      await this.updateCoop(member.coopId, { currentQuantity: newQuantity.toString() });
      
      // Check if target reached
      if (newQuantity >= parseFloat(coop.targetQuantity)) {
        await this.updateCoop(member.coopId, { status: "active" });
      }
    }
    
    return newMember;
  }

  async updateCoopMember(id: string, updates: Partial<CoopMember>): Promise<CoopMember> {
    const [updated] = await db.update(coopMembers)
      .set(updates)
      .where(eq(coopMembers.id, id))
      .returning();
    return updated;
  }

  async getCoopMembers(coopId: string): Promise<(CoopMember & { seller: User })[]> {
    const result = await db.select()
      .from(coopMembers)
      .innerJoin(users, eq(coopMembers.sellerId, users.id))
      .where(eq(coopMembers.coopId, coopId));
    
    return result.map(row => ({
      ...row.coop_members,
      seller: row.users,
    }));
  }

  async markMemberReady(memberId: string): Promise<CoopMember> {
    const [updated] = await db.update(coopMembers)
      .set({ status: "ready", readyAt: new Date() })
      .where(eq(coopMembers.id, memberId))
      .returning();
    return updated;
  }

  async markMemberDelivered(memberId: string, quantity: string): Promise<CoopMember> {
    const [updated] = await db.update(coopMembers)
      .set({ status: "delivered", deliveredQuantity: quantity, deliveredAt: new Date() })
      .where(eq(coopMembers.id, memberId))
      .returning();
    return updated;
  }

  // Co-Op Orders
  async createCoopOrder(order: InsertCoopOrder): Promise<CoopOrder> {
    const [newOrder] = await db.insert(coopOrders).values(order).returning();
    return newOrder;
  }

  async getCoopOrder(id: string): Promise<CoopOrder | undefined> {
    const [order] = await db.select().from(coopOrders).where(eq(coopOrders.id, id));
    return order || undefined;
  }

  async getCoopOrders(coopId: string): Promise<CoopOrder[]> {
    return await db.select().from(coopOrders)
      .where(eq(coopOrders.coopId, coopId))
      .orderBy(desc(coopOrders.createdAt));
  }

  async updateCoopOrder(id: string, updates: Partial<CoopOrder>): Promise<CoopOrder> {
    const [updated] = await db.update(coopOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(coopOrders.id, id))
      .returning();
    return updated;
  }

  async fundCoopEscrow(orderId: string): Promise<CoopOrder> {
    const [updated] = await db.update(coopOrders)
      .set({ escrowFunded: true, status: "escrow_funded", updatedAt: new Date() })
      .where(eq(coopOrders.id, orderId))
      .returning();
    return updated;
  }

  async confirmCoopDelivery(orderId: string, photo?: string): Promise<CoopOrder> {
    const [updated] = await db.update(coopOrders)
      .set({ 
        status: "delivered", 
        deliveryConfirmedAt: new Date(),
        deliveryPhoto: photo,
        updatedAt: new Date() 
      })
      .where(eq(coopOrders.id, orderId))
      .returning();
    return updated;
  }

  // Seller Contributions
  async createSellerContribution(contribution: InsertSellerContribution): Promise<SellerContribution> {
    const [newContribution] = await db.insert(sellerContributions).values(contribution).returning();
    return newContribution;
  }

  async updateSellerContribution(id: string, updates: Partial<SellerContribution>): Promise<SellerContribution> {
    const [updated] = await db.update(sellerContributions)
      .set(updates)
      .where(eq(sellerContributions.id, id))
      .returning();
    return updated;
  }

  async getContributionsForOrder(orderId: string): Promise<(SellerContribution & { member: CoopMember & { seller: User } })[]> {
    const result = await db.select()
      .from(sellerContributions)
      .innerJoin(coopMembers, eq(sellerContributions.memberId, coopMembers.id))
      .innerJoin(users, eq(coopMembers.sellerId, users.id))
      .where(eq(sellerContributions.coopOrderId, orderId));
    
    return result.map(row => ({
      ...row.seller_contributions,
      member: {
        ...row.coop_members,
        seller: row.users,
      },
    }));
  }

  // Payout Splits
  async createPayoutSplit(payout: InsertPayoutSplit): Promise<PayoutSplit> {
    const [newPayout] = await db.insert(payoutSplits).values(payout).returning();
    return newPayout;
  }

  async getPayoutsForOrder(orderId: string): Promise<PayoutSplit[]> {
    return await db.select().from(payoutSplits)
      .where(eq(payoutSplits.coopOrderId, orderId));
  }

  async updatePayoutSplit(id: string, updates: Partial<PayoutSplit>): Promise<PayoutSplit> {
    const [updated] = await db.update(payoutSplits)
      .set(updates)
      .where(eq(payoutSplits.id, id))
      .returning();
    return updated;
  }

  async processPayouts(orderId: string): Promise<PayoutSplit[]> {
    const order = await this.getCoopOrder(orderId);
    if (!order) throw new Error("Order not found");
    
    const contributions = await this.getContributionsForOrder(orderId);
    const totalEscrow = parseFloat(order.escrowAmount);
    
    // Calculate payouts based on actual contributions
    const payouts: PayoutSplit[] = [];
    for (const contribution of contributions) {
      if (contribution.status === "delivered" && contribution.actualQuantity) {
        const actualQty = parseFloat(contribution.actualQuantity);
        const expectedQty = parseFloat(contribution.expectedQuantity);
        const percentage = (actualQty / expectedQty) * 100;
        const amount = (actualQty / parseFloat(order.quantity)) * totalEscrow;
        
        const payout = await this.createPayoutSplit({
          coopOrderId: orderId,
          sellerId: contribution.member.sellerId,
          contributionId: contribution.id,
          amount: amount.toFixed(2),
          percentage: percentage.toFixed(2),
        });
        payouts.push(payout);
      }
    }
    
    // Update order status
    await this.updateCoopOrder(orderId, { status: "completed" });
    
    return payouts;
  }

  // Co-Op Disputes
  async createCoopDispute(dispute: InsertCoopDispute): Promise<CoopDispute> {
    const [newDispute] = await db.insert(coopDisputes).values(dispute).returning();
    
    // Update order status
    await this.updateCoopOrder(dispute.coopOrderId, { status: "disputed" });
    
    return newDispute;
  }

  async getCoopDispute(id: string): Promise<CoopDispute | undefined> {
    const [dispute] = await db.select().from(coopDisputes).where(eq(coopDisputes.id, id));
    return dispute || undefined;
  }

  async getCoopDisputes(filters?: { status?: string; orderId?: string }): Promise<CoopDispute[]> {
    const conditions: any[] = [];
    
    if (filters?.status) {
      conditions.push(eq(coopDisputes.status, filters.status as any));
    }
    if (filters?.orderId) {
      conditions.push(eq(coopDisputes.coopOrderId, filters.orderId));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(coopDisputes).where(and(...conditions)).orderBy(desc(coopDisputes.createdAt));
    }
    return await db.select().from(coopDisputes).orderBy(desc(coopDisputes.createdAt));
  }

  async resolveCoopDispute(id: string, resolution: string, resolvedBy: string): Promise<CoopDispute> {
    const [updated] = await db.update(coopDisputes)
      .set({ 
        status: "resolved", 
        resolution, 
        resolvedBy, 
        resolvedAt: new Date() 
      })
      .where(eq(coopDisputes.id, id))
      .returning();
    return updated;
  }

  // ============ CHAT METHODS ============

  async getOrCreateChat(participant1Id: string, participant2Id: string, listingId?: string): Promise<UserChat> {
    // Check if chat already exists between these two users
    const existing = await db.select().from(userChats)
      .where(
        sql`(${userChats.participant1Id} = ${participant1Id} AND ${userChats.participant2Id} = ${participant2Id})
        OR (${userChats.participant1Id} = ${participant2Id} AND ${userChats.participant2Id} = ${participant1Id})`
      );
    
    if (existing.length > 0) {
      return existing[0];
    }

    // Create new chat
    const [chat] = await db.insert(userChats).values({
      participant1Id,
      participant2Id,
      listingId: listingId || null,
    }).returning();
    return chat;
  }

  async getUserChats(userId: string): Promise<(UserChat & { otherUser: User; lastMessage?: ChatMessage })[]> {
    const chats = await db.select().from(userChats)
      .where(
        sql`${userChats.participant1Id} = ${userId} OR ${userChats.participant2Id} = ${userId}`
      )
      .orderBy(desc(userChats.lastMessageAt));
    
    // Enrich with other user info and last message
    const enrichedChats = await Promise.all(chats.map(async (chat) => {
      const otherUserId = chat.participant1Id === userId ? chat.participant2Id : chat.participant1Id;
      const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId));
      
      const [lastMessage] = await db.select().from(chatMessages)
        .where(eq(chatMessages.chatId, chat.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(1);
      
      return { ...chat, otherUser, lastMessage };
    }));
    
    return enrichedChats;
  }

  async getChat(chatId: string): Promise<UserChat | undefined> {
    const [chat] = await db.select().from(userChats).where(eq(userChats.id, chatId));
    return chat || undefined;
  }

  async getChatMessages(chatId: string): Promise<(ChatMessage & { sender: User })[]> {
    const msgs = await db.select().from(chatMessages)
      .where(eq(chatMessages.chatId, chatId))
      .orderBy(chatMessages.createdAt);
    
    // Enrich with sender info
    const enrichedMessages = await Promise.all(msgs.map(async (msg) => {
      const [sender] = await db.select().from(users).where(eq(users.id, msg.senderId));
      return { ...msg, sender };
    }));
    
    return enrichedMessages;
  }

  async sendMessage(chatId: string, senderId: string, content: string): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values({
      chatId,
      senderId,
      content,
    }).returning();
    
    // Update last message timestamp
    await db.update(userChats)
      .set({ lastMessageAt: new Date() })
      .where(eq(userChats.id, chatId));
    
    return message;
  }

  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    await db.update(chatMessages)
      .set({ read: true })
      .where(
        and(
          eq(chatMessages.chatId, chatId),
          sql`${chatMessages.senderId} != ${userId}`
        )
      );
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    // Get all chats for this user
    const chats = await db.select().from(userChats)
      .where(
        sql`${userChats.participant1Id} = ${userId} OR ${userChats.participant2Id} = ${userId}`
      );
    
    let count = 0;
    for (const chat of chats) {
      const unreadMessages = await db.select().from(chatMessages)
        .where(
          and(
            eq(chatMessages.chatId, chat.id),
            eq(chatMessages.read, false),
            sql`${chatMessages.senderId} != ${userId}`
          )
        );
      count += unreadMessages.length;
    }
    
    return count;
  }

  // ============ QUALITY GRADING SYSTEM ============

  // Grade Definitions
  async getGradeDefinitions(category?: string): Promise<GradeDefinition[]> {
    if (category) {
      return await db.select().from(gradeDefinitions)
        .where(and(
          eq(gradeDefinitions.category, category as any),
          eq(gradeDefinitions.isActive, true)
        ))
        .orderBy(gradeDefinitions.grade);
    }
    return await db.select().from(gradeDefinitions)
      .where(eq(gradeDefinitions.isActive, true))
      .orderBy(gradeDefinitions.category, gradeDefinitions.grade);
  }

  async getGradeDefinition(category: string, grade: string): Promise<GradeDefinition | undefined> {
    const [def] = await db.select().from(gradeDefinitions)
      .where(and(
        eq(gradeDefinitions.category, category as any),
        eq(gradeDefinitions.grade, grade as any)
      ));
    return def;
  }

  // Media Evidence
  async createMediaEvidence(evidence: InsertMediaEvidence): Promise<MediaEvidence> {
    const [newEvidence] = await db.insert(mediaEvidence).values(evidence).returning();
    return newEvidence;
  }

  async getMediaEvidenceForOrder(orderId: string): Promise<MediaEvidence[]> {
    return await db.select().from(mediaEvidence)
      .where(eq(mediaEvidence.orderId, orderId))
      .orderBy(desc(mediaEvidence.createdAt));
  }

  async getMediaEvidenceForListing(listingId: string): Promise<MediaEvidence[]> {
    return await db.select().from(mediaEvidence)
      .where(eq(mediaEvidence.listingId, listingId))
      .orderBy(desc(mediaEvidence.createdAt));
  }

  async countMediaByPurpose(orderId: string, purpose: string): Promise<{ photos: number; videos: number }> {
    const evidence = await db.select().from(mediaEvidence)
      .where(and(
        eq(mediaEvidence.orderId, orderId),
        eq(mediaEvidence.purpose, purpose)
      ));
    return {
      photos: evidence.filter(e => e.mediaType === 'photo').length,
      videos: evidence.filter(e => e.mediaType === 'video').length
    };
  }

  // Delivery Grades
  async createDeliveryGrade(grade: InsertDeliveryGrade): Promise<DeliveryGrade> {
    const [newGrade] = await db.insert(deliveryGrades).values(grade).returning();
    return newGrade;
  }

  async getDeliveryGrade(orderId: string): Promise<DeliveryGrade | undefined> {
    const [grade] = await db.select().from(deliveryGrades)
      .where(eq(deliveryGrades.orderId, orderId));
    return grade;
  }

  async confirmDeliveryGrade(id: string, confirmation: string, reportedGrade?: string, comment?: string): Promise<DeliveryGrade> {
    const [updated] = await db.update(deliveryGrades)
      .set({
        buyerConfirmation: confirmation as any,
        buyerReportedGrade: reportedGrade as any,
        buyerComment: comment,
        confirmedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(deliveryGrades.id, id))
      .returning();
    return updated;
  }

  async setFinalGrade(id: string, finalGrade: string, verifiedBy?: string): Promise<DeliveryGrade> {
    const [updated] = await db.update(deliveryGrades)
      .set({
        finalGrade: finalGrade as any,
        verifiedBy,
        verificationBadge: !!verifiedBy,
        updatedAt: new Date()
      })
      .where(eq(deliveryGrades.id, id))
      .returning();
    return updated;
  }

  // Grade Disputes
  async createGradeDispute(dispute: InsertGradeDispute): Promise<GradeDispute> {
    const [newDispute] = await db.insert(gradeDisputes).values({
      ...dispute,
      autoResolveAt: new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 hours from now
    }).returning();
    return newDispute;
  }

  async getGradeDispute(id: string): Promise<GradeDispute | undefined> {
    const [dispute] = await db.select().from(gradeDisputes)
      .where(eq(gradeDisputes.id, id));
    return dispute;
  }

  async getGradeDisputesByOrder(orderId: string): Promise<GradeDispute[]> {
    return await db.select().from(gradeDisputes)
      .where(eq(gradeDisputes.orderId, orderId))
      .orderBy(desc(gradeDisputes.createdAt));
  }

  async getPendingGradeDisputes(): Promise<GradeDispute[]> {
    return await db.select().from(gradeDisputes)
      .where(or(
        eq(gradeDisputes.status, 'pending'),
        eq(gradeDisputes.status, 'under_review')
      ))
      .orderBy(gradeDisputes.createdAt);
  }

  async resolveGradeDispute(id: string, resolution: string, refundAmount?: string, refundPercentage?: string, resolvedBy?: string): Promise<GradeDispute> {
    const [updated] = await db.update(gradeDisputes)
      .set({
        resolution,
        refundAmount,
        refundPercentage,
        resolvedBy,
        resolvedAt: new Date(),
        status: 'closed' as any
      })
      .where(eq(gradeDisputes.id, id))
      .returning();
    return updated;
  }

  async updateGradeDisputeStatus(id: string, status: string, sellerResponse?: string): Promise<GradeDispute> {
    const [updated] = await db.update(gradeDisputes)
      .set({
        status: status as any,
        sellerResponse
      })
      .where(eq(gradeDisputes.id, id))
      .returning();
    return updated;
  }

  // Verification Records
  async createVerificationRecord(record: InsertVerificationRecord): Promise<VerificationRecord> {
    const [newRecord] = await db.insert(verificationRecords).values(record).returning();
    return newRecord;
  }

  async getVerificationRecordsForOrder(orderId: string): Promise<VerificationRecord[]> {
    return await db.select().from(verificationRecords)
      .where(eq(verificationRecords.orderId, orderId))
      .orderBy(desc(verificationRecords.createdAt));
  }

  async completeVerification(id: string, verifiedGrade: string, notes?: string): Promise<VerificationRecord> {
    const [updated] = await db.update(verificationRecords)
      .set({
        verifiedGrade: verifiedGrade as any,
        status: 'verified' as any,
        notes,
        verifiedAt: new Date(),
        badgeIssued: true
      })
      .where(eq(verificationRecords.id, id))
      .returning();
    return updated;
  }

  // Seller Trust Metrics
  async getSellerTrustMetrics(sellerId: string): Promise<SellerTrustMetrics | undefined> {
    const [metrics] = await db.select().from(sellerTrustMetrics)
      .where(eq(sellerTrustMetrics.sellerId, sellerId));
    return metrics;
  }

  async upsertSellerTrustMetrics(sellerId: string, updates: Partial<InsertSellerTrustMetrics>): Promise<SellerTrustMetrics> {
    const existing = await this.getSellerTrustMetrics(sellerId);
    if (existing) {
      const [updated] = await db.update(sellerTrustMetrics)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(sellerTrustMetrics.sellerId, sellerId))
        .returning();
      return updated;
    } else {
      const [newMetrics] = await db.insert(sellerTrustMetrics)
        .values({ sellerId, ...updates })
        .returning();
      return newMetrics;
    }
  }

  async updateSellerGradeMetrics(sellerId: string, confirmationType: 'matches' | 'lower' | 'rejected'): Promise<void> {
    const metrics = await this.getSellerTrustMetrics(sellerId);
    const totalDeliveries = (metrics?.totalDeliveries || 0) + 1;
    const gradeMatchCount = (metrics?.gradeMatchCount || 0) + (confirmationType === 'matches' ? 1 : 0);
    const gradeLowerCount = (metrics?.gradeLowerCount || 0) + (confirmationType === 'lower' ? 1 : 0);
    const gradeRejectedCount = (metrics?.gradeRejectedCount || 0) + (confirmationType === 'rejected' ? 1 : 0);
    
    const gradeAccuracyRate = totalDeliveries > 0 
      ? ((gradeMatchCount / totalDeliveries) * 100).toFixed(2)
      : '100';
    
    // Calculate trust score based on grade accuracy
    let trustDelta = 0;
    if (confirmationType === 'matches') trustDelta = 2;
    else if (confirmationType === 'lower') trustDelta = -5;
    else if (confirmationType === 'rejected') trustDelta = -10;
    
    const currentTrustScore = metrics?.trustScore || 50;
    const newTrustScore = Math.max(0, Math.min(100, currentTrustScore + trustDelta));
    
    // Determine eligibility based on metrics
    const isContractEligible = newTrustScore >= 30 && gradeRejectedCount < 5;
    const isSubscriptionVisible = newTrustScore >= 20;
    
    await this.upsertSellerTrustMetrics(sellerId, {
      totalDeliveries,
      gradeMatchCount,
      gradeLowerCount,
      gradeRejectedCount,
      gradeAccuracyRate,
      trustScore: newTrustScore,
      isContractEligible,
      isSubscriptionVisible
    });
  }

  async recordGradeDisputeOutcome(sellerId: string, sellerWon: boolean): Promise<void> {
    const metrics = await this.getSellerTrustMetrics(sellerId);
    const disputeCount = (metrics?.disputeCount || 0) + 1;
    const disputesWon = (metrics?.disputesWon || 0) + (sellerWon ? 1 : 0);
    const disputesLost = (metrics?.disputesLost || 0) + (sellerWon ? 0 : 1);
    
    await this.upsertSellerTrustMetrics(sellerId, {
      disputeCount,
      disputesWon,
      disputesLost
    });
  }

  // Admin Grade Settings
  async getAdminGradeSetting(key: string): Promise<string | undefined> {
    const [setting] = await db.select().from(adminGradeSettings)
      .where(eq(adminGradeSettings.settingKey, key));
    return setting?.settingValue;
  }

  async setAdminGradeSetting(key: string, value: string, description?: string, updatedBy?: string): Promise<AdminGradeSetting> {
    const existing = await this.getAdminGradeSetting(key);
    if (existing !== undefined) {
      const [updated] = await db.update(adminGradeSettings)
        .set({ settingValue: value, description, updatedBy, updatedAt: new Date() })
        .where(eq(adminGradeSettings.settingKey, key))
        .returning();
      return updated;
    } else {
      const [newSetting] = await db.insert(adminGradeSettings)
        .values({ settingKey: key, settingValue: value, description, updatedBy })
        .returning();
      return newSetting;
    }
  }

  async getAllAdminGradeSettings(): Promise<AdminGradeSetting[]> {
    return await db.select().from(adminGradeSettings);
  }

  // Demand Forecasts
  async createDemandForecast(forecast: InsertDemandForecast): Promise<DemandForecast> {
    const [newForecast] = await db.insert(demandForecasts)
      .values(forecast)
      .returning();
    return newForecast;
  }

  async getDemandForecast(id: string): Promise<DemandForecast | undefined> {
    const [forecast] = await db.select().from(demandForecasts)
      .where(eq(demandForecasts.id, id));
    return forecast || undefined;
  }

  async getDemandForecastsForBuyer(buyerId: string): Promise<DemandForecast[]> {
    return await db.select().from(demandForecasts)
      .where(eq(demandForecasts.buyerId, buyerId))
      .orderBy(desc(demandForecasts.createdAt));
  }

  async getDemandForecastsForSellers(sellerId: string, location?: string): Promise<(DemandForecast & { buyer: User; responses: ForecastResponse[] })[]> {
    const activeForecasts = await db.select().from(demandForecasts)
      .where(and(
        eq(demandForecasts.status, 'active'),
        gte(demandForecasts.endDate, new Date())
      ))
      .orderBy(desc(demandForecasts.createdAt));
    
    const results: (DemandForecast & { buyer: User; responses: ForecastResponse[] })[] = [];
    
    for (const forecast of activeForecasts) {
      const [buyer] = await db.select().from(users).where(eq(users.id, forecast.buyerId));
      const responses = await db.select().from(forecastResponses)
        .where(eq(forecastResponses.forecastId, forecast.id));
      
      if (buyer) {
        results.push({ ...forecast, buyer, responses });
      }
    }
    
    return results;
  }

  async updateDemandForecast(id: string, updates: Partial<DemandForecast>): Promise<DemandForecast> {
    const [updated] = await db.update(demandForecasts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(demandForecasts.id, id))
      .returning();
    return updated;
  }

  async cancelDemandForecast(id: string): Promise<DemandForecast> {
    const [cancelled] = await db.update(demandForecasts)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(demandForecasts.id, id))
      .returning();
    return cancelled;
  }

  // Forecast Responses
  async createForecastResponse(response: InsertForecastResponse): Promise<ForecastResponse> {
    const [newResponse] = await db.insert(forecastResponses)
      .values(response)
      .returning();
    return newResponse;
  }

  async getForecastResponses(forecastId: string): Promise<(ForecastResponse & { seller: User })[]> {
    const responses = await db.select().from(forecastResponses)
      .where(eq(forecastResponses.forecastId, forecastId))
      .orderBy(desc(forecastResponses.createdAt));
    
    const results: (ForecastResponse & { seller: User })[] = [];
    for (const response of responses) {
      const [seller] = await db.select().from(users).where(eq(users.id, response.sellerId));
      if (seller) {
        results.push({ ...response, seller });
      }
    }
    return results;
  }

  async updateForecastResponse(id: string, updates: Partial<ForecastResponse>): Promise<ForecastResponse> {
    const [updated] = await db.update(forecastResponses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(forecastResponses.id, id))
      .returning();
    return updated;
  }

  // Forecast Conversions
  async createForecastConversion(conversion: InsertForecastConversion): Promise<ForecastConversion> {
    const [newConversion] = await db.insert(forecastConversions)
      .values(conversion)
      .returning();
    return newConversion;
  }

  async getForecastConversions(forecastId: string): Promise<ForecastConversion[]> {
    return await db.select().from(forecastConversions)
      .where(eq(forecastConversions.forecastId, forecastId))
      .orderBy(desc(forecastConversions.createdAt));
  }

  // Forecast Analytics (Admin only)
  async getForecastStats(): Promise<{ totalForecasts: number; activeForecasts: number; totalResponses: number; conversionRate: number; topProducts: { product: string; count: number }[] }> {
    const allForecasts = await db.select().from(demandForecasts);
    const activeForecasts = allForecasts.filter(f => f.status === 'active');
    const allResponses = await db.select().from(forecastResponses);
    const allConversions = await db.select().from(forecastConversions);
    
    const conversionRate = allForecasts.length > 0 
      ? (allConversions.length / allForecasts.length) * 100 
      : 0;
    
    const productCounts: Record<string, number> = {};
    for (const forecast of allForecasts) {
      productCounts[forecast.productName] = (productCounts[forecast.productName] || 0) + 1;
    }
    
    const topProducts = Object.entries(productCounts)
      .map(([product, count]) => ({ product, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalForecasts: allForecasts.length,
      activeForecasts: activeForecasts.length,
      totalResponses: allResponses.length,
      conversionRate: Math.round(conversionRate * 100) / 100,
      topProducts
    };
  }

  // =====================================
  // TRANSPORT JOBS
  // =====================================

  async createTransportJob(job: InsertTransportJob): Promise<TransportJob> {
    const [newJob] = await db.insert(transportJobs).values(job).returning();
    return newJob;
  }

  async getTransportJob(id: string): Promise<TransportJob | undefined> {
    const [job] = await db.select().from(transportJobs).where(eq(transportJobs.id, id));
    return job;
  }

  async getTransportJobWithDetails(id: string): Promise<(TransportJob & { buyer: User; seller: User; transporter?: User; offers: TransportOffer[]; proofs: TransportProof[]; escrow?: TransportEscrow }) | undefined> {
    const [job] = await db.select().from(transportJobs).where(eq(transportJobs.id, id));
    if (!job) return undefined;

    const [buyer] = await db.select().from(users).where(eq(users.id, job.buyerId));
    const [seller] = await db.select().from(users).where(eq(users.id, job.sellerId));
    
    let transporter: User | undefined;
    if (job.transporterId) {
      const [t] = await db.select().from(users).where(eq(users.id, job.transporterId));
      transporter = t;
    }

    const offers = await db.select().from(transportOffers).where(eq(transportOffers.jobId, id));
    const proofs = await db.select().from(transportProofs).where(eq(transportProofs.jobId, id));
    const [escrow] = await db.select().from(transportEscrows).where(eq(transportEscrows.jobId, id));

    return { ...job, buyer, seller, transporter, offers, proofs, escrow };
  }

  async getAvailableTransportJobs(filters?: { 
    location?: string; 
    maxDistance?: number;
    productType?: string;
    pickupDateFrom?: string;
    pickupDateTo?: string;
  }): Promise<(TransportJob & { seller: User; buyer: User })[]> {
    let query = db.select().from(transportJobs).where(eq(transportJobs.status, 'open'));
    const jobs = await query.orderBy(desc(transportJobs.createdAt));
    
    const results: (TransportJob & { seller: User; buyer: User })[] = [];
    for (const job of jobs) {
      // Apply filters
      if (filters?.location && !job.pickupLocation.toLowerCase().includes(filters.location.toLowerCase())) continue;
      if (filters?.productType && job.productType !== filters.productType) continue;
      
      const [seller] = await db.select().from(users).where(eq(users.id, job.sellerId));
      const [buyer] = await db.select().from(users).where(eq(users.id, job.buyerId));
      if (seller && buyer) {
        results.push({ ...job, seller, buyer });
      }
    }
    return results;
  }

  async getTransportJobsForUser(userId: string, role: 'buyer' | 'seller' | 'transporter'): Promise<TransportJob[]> {
    if (role === 'buyer') {
      return await db.select().from(transportJobs).where(eq(transportJobs.buyerId, userId)).orderBy(desc(transportJobs.createdAt));
    } else if (role === 'seller') {
      return await db.select().from(transportJobs).where(eq(transportJobs.sellerId, userId)).orderBy(desc(transportJobs.createdAt));
    } else {
      return await db.select().from(transportJobs).where(eq(transportJobs.transporterId, userId)).orderBy(desc(transportJobs.createdAt));
    }
  }

  async updateTransportJob(id: string, updates: Partial<TransportJob>): Promise<TransportJob> {
    const [updated] = await db.update(transportJobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transportJobs.id, id))
      .returning();
    return updated;
  }

  async assignTransporter(jobId: string, transporterId: string, agreedPrice: number): Promise<TransportJob> {
    const [updated] = await db.update(transportJobs)
      .set({ 
        transporterId,
        agreedPrice,
        status: 'assigned',
        assignedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(transportJobs.id, jobId))
      .returning();
    return updated;
  }

  // =====================================
  // TRANSPORT OFFERS
  // =====================================

  async createTransportOffer(offer: InsertTransportOffer): Promise<TransportOffer> {
    const [newOffer] = await db.insert(transportOffers).values(offer).returning();
    return newOffer;
  }

  async getTransportOffersForJob(jobId: string): Promise<(TransportOffer & { transporter: User })[]> {
    const offers = await db.select().from(transportOffers).where(eq(transportOffers.jobId, jobId)).orderBy(desc(transportOffers.createdAt));
    
    const results: (TransportOffer & { transporter: User })[] = [];
    for (const offer of offers) {
      const [transporter] = await db.select().from(users).where(eq(users.id, offer.transporterId));
      if (transporter) {
        results.push({ ...offer, transporter });
      }
    }
    return results;
  }

  async getTransportOffersForTransporter(transporterId: string): Promise<TransportOffer[]> {
    return await db.select().from(transportOffers).where(eq(transportOffers.transporterId, transporterId)).orderBy(desc(transportOffers.createdAt));
  }

  async updateTransportOffer(id: string, updates: Partial<TransportOffer>): Promise<TransportOffer> {
    const [updated] = await db.update(transportOffers)
      .set(updates)
      .where(eq(transportOffers.id, id))
      .returning();
    return updated;
  }

  async acceptTransportOffer(offerId: string, responderId: string): Promise<{ offer: TransportOffer; job: TransportJob }> {
    const [offer] = await db.select().from(transportOffers).where(eq(transportOffers.id, offerId));
    if (!offer) throw new Error("Offer not found");

    // Update the offer
    const [updatedOffer] = await db.update(transportOffers)
      .set({ status: 'accepted', respondedBy: responderId, respondedAt: new Date() })
      .where(eq(transportOffers.id, offerId))
      .returning();

    // Reject all other offers for this job
    await db.update(transportOffers)
      .set({ status: 'rejected', respondedBy: responderId, respondedAt: new Date() })
      .where(and(
        eq(transportOffers.jobId, offer.jobId),
        sql`${transportOffers.id} != ${offerId}`
      ));

    // Assign the transporter to the job
    const job = await this.assignTransporter(offer.jobId, offer.transporterId, offer.offeredPrice);

    return { offer: updatedOffer, job };
  }

  // =====================================
  // TRANSPORT PROOFS
  // =====================================

  async createTransportProof(proof: InsertTransportProof): Promise<TransportProof> {
    const [newProof] = await db.insert(transportProofs).values(proof).returning();
    return newProof;
  }

  async getTransportProofsForJob(jobId: string): Promise<TransportProof[]> {
    return await db.select().from(transportProofs).where(eq(transportProofs.jobId, jobId));
  }

  async verifyTransportProof(proofId: string, verifierId: string): Promise<TransportProof> {
    const [updated] = await db.update(transportProofs)
      .set({ verified: true, verifiedBy: verifierId, verifiedAt: new Date() })
      .where(eq(transportProofs.id, proofId))
      .returning();
    return updated;
  }

  // =====================================
  // TRANSPORT ESCROW
  // =====================================

  async createTransportEscrow(escrow: InsertTransportEscrow): Promise<TransportEscrow> {
    const [newEscrow] = await db.insert(transportEscrows).values(escrow).returning();
    return newEscrow;
  }

  async getTransportEscrow(jobId: string): Promise<TransportEscrow | undefined> {
    const [escrow] = await db.select().from(transportEscrows).where(eq(transportEscrows.jobId, jobId));
    return escrow;
  }

  async updateTransportEscrow(jobId: string, updates: Partial<TransportEscrow>): Promise<TransportEscrow> {
    const [updated] = await db.update(transportEscrows)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transportEscrows.jobId, jobId))
      .returning();
    return updated;
  }

  async releaseTransportEscrow(jobId: string, transporterId: string, reason: string): Promise<TransportEscrow> {
    const [updated] = await db.update(transportEscrows)
      .set({ 
        status: 'released',
        releasedTo: transporterId,
        releasedAt: new Date(),
        releaseReason: reason,
        updatedAt: new Date()
      })
      .where(eq(transportEscrows.jobId, jobId))
      .returning();
    return updated;
  }

  // =====================================
  // TRANSPORT DISPUTES
  // =====================================

  async createTransportDispute(dispute: InsertTransportDispute): Promise<TransportDispute> {
    const [newDispute] = await db.insert(transportDisputes).values(dispute).returning();
    return newDispute;
  }

  async getTransportDisputesForJob(jobId: string): Promise<TransportDispute[]> {
    return await db.select().from(transportDisputes).where(eq(transportDisputes.jobId, jobId));
  }

  async getAllTransportDisputes(): Promise<(TransportDispute & { job: TransportJob; raiser: User })[]> {
    const disputes = await db.select().from(transportDisputes).orderBy(desc(transportDisputes.createdAt));
    
    const results: (TransportDispute & { job: TransportJob; raiser: User })[] = [];
    for (const dispute of disputes) {
      const [job] = await db.select().from(transportJobs).where(eq(transportJobs.id, dispute.jobId));
      const [raiser] = await db.select().from(users).where(eq(users.id, dispute.raisedBy));
      if (job && raiser) {
        results.push({ ...dispute, job, raiser });
      }
    }
    return results;
  }

  async resolveTransportDispute(disputeId: string, resolverId: string, resolution: string, status: string, penaltyAmount?: number, penaltyAppliedTo?: string): Promise<TransportDispute> {
    const [updated] = await db.update(transportDisputes)
      .set({ 
        status: status as any,
        resolvedBy: resolverId,
        resolution,
        penaltyAmount,
        penaltyAppliedTo,
        resolvedAt: new Date()
      })
      .where(eq(transportDisputes.id, disputeId))
      .returning();
    return updated;
  }

  // =====================================
  // TRANSPORT RATINGS
  // =====================================

  async createTransportRating(rating: InsertTransportRating): Promise<TransportRating> {
    const [newRating] = await db.insert(transportRatings).values(rating).returning();
    
    // Update transporter reliability
    await this.updateTransporterReliability(rating.transporterId);
    
    return newRating;
  }

  async getTransportRatingsForTransporter(transporterId: string): Promise<TransportRating[]> {
    return await db.select().from(transportRatings).where(eq(transportRatings.transporterId, transporterId)).orderBy(desc(transportRatings.createdAt));
  }

  // =====================================
  // TRANSPORTER RELIABILITY
  // =====================================

  async getTransporterReliability(transporterId: string): Promise<TransporterReliability | undefined> {
    const [reliability] = await db.select().from(transporterReliability).where(eq(transporterReliability.transporterId, transporterId));
    return reliability;
  }

  async updateTransporterReliability(transporterId: string): Promise<TransporterReliability> {
    // Calculate reliability metrics from actual data
    const jobs = await db.select().from(transportJobs).where(eq(transportJobs.transporterId, transporterId));
    const ratings = await db.select().from(transportRatings).where(eq(transportRatings.transporterId, transporterId));
    const disputes = await db.select().from(transportDisputes).where(eq(transportDisputes.againstUserId, transporterId));
    
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const cancelledJobs = jobs.filter(j => j.status === 'cancelled').length;
    
    const onTimeCount = ratings.filter(r => r.onTimeDelivery).length;
    const onTimeRate = ratings.length > 0 ? (onTimeCount / ratings.length) * 100 : 0;
    
    const damageCount = jobs.filter(j => {
      // Check if any proof has damage reported
      return false; // Simplified - would need to join with proofs
    }).length;
    const damageRate = totalJobs > 0 ? (damageCount / totalJobs) * 100 : 0;
    
    const disputeRate = totalJobs > 0 ? (disputes.length / totalJobs) * 100 : 0;
    
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;
    
    // Calculate reliability score (0-100)
    let reliabilityScore = 50; // Base score
    reliabilityScore += (completedJobs * 2); // +2 for each completed job
    reliabilityScore += (onTimeRate * 0.2); // +20 for 100% on-time
    reliabilityScore += (avgRating * 5); // +25 for 5-star avg
    reliabilityScore -= (disputes.length * 10); // -10 for each dispute
    reliabilityScore -= (cancelledJobs * 5); // -5 for each cancellation
    reliabilityScore = Math.max(0, Math.min(100, reliabilityScore));
    
    const subscriptionEligible = reliabilityScore >= 70 && completedJobs >= 10;
    
    // Upsert reliability record
    const existing = await this.getTransporterReliability(transporterId);
    
    if (existing) {
      const [updated] = await db.update(transporterReliability)
        .set({
          totalJobs,
          completedJobs,
          cancelledJobs,
          onTimeDeliveryRate: onTimeRate.toFixed(2),
          damageRate: damageRate.toFixed(2),
          disputeRate: disputeRate.toFixed(2),
          averageRating: avgRating.toFixed(2),
          totalRatings: ratings.length,
          reliabilityScore: Math.round(reliabilityScore),
          subscriptionEligible,
          updatedAt: new Date()
        })
        .where(eq(transporterReliability.transporterId, transporterId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(transporterReliability)
        .values({
          transporterId,
          totalJobs,
          completedJobs,
          cancelledJobs,
          onTimeDeliveryRate: onTimeRate.toFixed(2),
          damageRate: damageRate.toFixed(2),
          disputeRate: disputeRate.toFixed(2),
          averageRating: avgRating.toFixed(2),
          totalRatings: ratings.length,
          reliabilityScore: Math.round(reliabilityScore),
          subscriptionEligible
        })
        .returning();
      return created;
    }
  }

  async banTransporter(transporterId: string, reason: string, banUntil: Date): Promise<TransporterReliability> {
    const [updated] = await db.update(transporterReliability)
      .set({
        temporaryBan: true,
        banUntil,
        banReason: reason,
        updatedAt: new Date()
      })
      .where(eq(transporterReliability.transporterId, transporterId))
      .returning();
    return updated;
  }

  // =====================================
  // TRANSPORT SUBSCRIPTIONS
  // =====================================

  async createTransportSubscription(subscription: InsertTransportSubscription): Promise<TransportSubscription> {
    const [newSub] = await db.insert(transportSubscriptions).values(subscription).returning();
    return newSub;
  }

  async getTransportSubscription(id: string): Promise<TransportSubscription | undefined> {
    const [sub] = await db.select().from(transportSubscriptions).where(eq(transportSubscriptions.id, id));
    return sub;
  }

  async getTransportSubscriptionsForUser(userId: string, role: 'buyer' | 'transporter'): Promise<TransportSubscription[]> {
    if (role === 'buyer') {
      return await db.select().from(transportSubscriptions).where(eq(transportSubscriptions.buyerId, userId)).orderBy(desc(transportSubscriptions.createdAt));
    } else {
      return await db.select().from(transportSubscriptions).where(eq(transportSubscriptions.transporterId, userId)).orderBy(desc(transportSubscriptions.createdAt));
    }
  }

  async updateTransportSubscription(id: string, updates: Partial<TransportSubscription>): Promise<TransportSubscription> {
    const [updated] = await db.update(transportSubscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transportSubscriptions.id, id))
      .returning();
    return updated;
  }

  // =====================================
  // TRANSPORT ADMIN STATS
  // =====================================

  async getTransportStats(): Promise<{
    totalJobs: number;
    openJobs: number;
    completedJobs: number;
    inProgressJobs: number;
    disputedJobs: number;
    totalTransporters: number;
    activeTransporters: number;
    totalEarnings: number;
    avgDeliveryTime: number;
    successRate: number;
  }> {
    const allJobs = await db.select().from(transportJobs);
    const openJobs = allJobs.filter(j => j.status === 'open').length;
    const completedJobs = allJobs.filter(j => j.status === 'completed').length;
    const inProgressJobs = allJobs.filter(j => ['assigned', 'pickup_pending', 'pickup_verified', 'in_transit', 'delivered'].includes(j.status)).length;
    const disputedJobs = allJobs.filter(j => j.status === 'disputed').length;
    
    const transporters = await db.select().from(users).where(eq(users.role, 'transporter'));
    const totalTransporters = transporters.length;
    
    const activeTransporterIds = new Set(allJobs.filter(j => j.transporterId).map(j => j.transporterId));
    const activeTransporters = activeTransporterIds.size;
    
    const escrows = await db.select().from(transportEscrows).where(eq(transportEscrows.status, 'released'));
    const totalEarnings = escrows.reduce((sum, e) => sum + e.amount, 0);
    
    const successRate = allJobs.length > 0 ? (completedJobs / allJobs.length) * 100 : 0;
    
    return {
      totalJobs: allJobs.length,
      openJobs,
      completedJobs,
      inProgressJobs,
      disputedJobs,
      totalTransporters,
      activeTransporters,
      totalEarnings,
      avgDeliveryTime: 0, // Would need delivery timestamps to calculate
      successRate: Math.round(successRate * 100) / 100
    };
  }

  // =====================================
  // USER FAVOURITES
  // =====================================

  async getUserFavourites(userId: string): Promise<(UserFavourite & { favouriteUser: User })[]> {
    const favs = await db.select().from(userFavourites).where(eq(userFavourites.userId, userId));
    const results: (UserFavourite & { favouriteUser: User })[] = [];
    
    for (const fav of favs) {
      const [favouriteUser] = await db.select().from(users).where(eq(users.id, fav.favouriteUserId));
      if (favouriteUser) {
        results.push({ ...fav, favouriteUser });
      }
    }
    return results;
  }

  async addUserFavourite(userId: string, favouriteUserId: string, role: string): Promise<UserFavourite> {
    const [favourite] = await db.insert(userFavourites).values({
      userId,
      favouriteUserId,
      favouriteRole: role as any,
    }).returning();
    return favourite;
  }

  async removeUserFavourite(userId: string, favouriteUserId: string): Promise<void> {
    await db.delete(userFavourites).where(
      and(
        eq(userFavourites.userId, userId),
        eq(userFavourites.favouriteUserId, favouriteUserId)
      )
    );
  }

  async isUserFavourited(userId: string, favouriteUserId: string): Promise<boolean> {
    const [existing] = await db.select().from(userFavourites).where(
      and(
        eq(userFavourites.userId, userId),
        eq(userFavourites.favouriteUserId, favouriteUserId)
      )
    );
    return !!existing;
  }

  async hasCompletedTransaction(userId1: string, userId2: string): Promise<boolean> {
    // Check if there's a completed order between these two users (as buyer/seller)
    const [orderAsBuyer] = await db.select().from(orders).where(
      and(
        eq(orders.buyerId, userId1),
        eq(orders.sellerId, userId2),
        eq(orders.status, 'completed')
      )
    );
    if (orderAsBuyer) return true;
    
    const [orderAsSeller] = await db.select().from(orders).where(
      and(
        eq(orders.buyerId, userId2),
        eq(orders.sellerId, userId1),
        eq(orders.status, 'completed')
      )
    );
    if (orderAsSeller) return true;
    
    // Check for completed transport jobs
    const [transportJob] = await db.select().from(transportJobs).where(
      and(
        or(
          and(eq(transportJobs.buyerId, userId1), eq(transportJobs.transporterId, userId2)),
          and(eq(transportJobs.buyerId, userId2), eq(transportJobs.transporterId, userId1)),
          and(eq(transportJobs.sellerId, userId1), eq(transportJobs.transporterId, userId2)),
          and(eq(transportJobs.sellerId, userId2), eq(transportJobs.transporterId, userId1))
        ),
        eq(transportJobs.status, 'completed')
      )
    );
    return !!transportJob;
  }

  async getFavouriteTransporters(userId: string): Promise<(UserFavourite & { favouriteUser: User })[]> {
    const favs = await db.select().from(userFavourites).where(
      and(
        eq(userFavourites.userId, userId),
        eq(userFavourites.favouriteRole, 'transporter')
      )
    );
    const results: (UserFavourite & { favouriteUser: User })[] = [];
    
    for (const fav of favs) {
      const [favouriteUser] = await db.select().from(users).where(eq(users.id, fav.favouriteUserId));
      if (favouriteUser) {
        results.push({ ...fav, favouriteUser });
      }
    }
    return results;
  }

  // =====================================
  // TRANSPORT COST SPLITS
  // =====================================

  async createTransportCostSplit(split: InsertTransportCostSplit): Promise<TransportCostSplit> {
    const [newSplit] = await db.insert(transportCostSplits).values(split).returning();
    return newSplit;
  }

  async getTransportCostSplit(orderId: string): Promise<TransportCostSplit | undefined> {
    const [split] = await db.select().from(transportCostSplits).where(eq(transportCostSplits.orderId, orderId));
    return split || undefined;
  }

  async getTransportCostSplitById(id: string): Promise<TransportCostSplit | undefined> {
    const [split] = await db.select().from(transportCostSplits).where(eq(transportCostSplits.id, id));
    return split || undefined;
  }

  async getTransportCostSplitByJob(jobId: string): Promise<TransportCostSplit | undefined> {
    const [split] = await db.select().from(transportCostSplits).where(eq(transportCostSplits.jobId, jobId));
    return split || undefined;
  }

  async updateTransportCostSplit(id: string, updates: Partial<TransportCostSplit>): Promise<TransportCostSplit> {
    const [updated] = await db.update(transportCostSplits)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transportCostSplits.id, id))
      .returning();
    return updated;
  }

  async fundTransportCostSplit(id: string, funder: 'buyer' | 'farmer'): Promise<TransportCostSplit> {
    const now = new Date();
    const updateData = funder === 'buyer'
      ? { buyerFunded: true, buyerFundedAt: now }
      : { farmerFunded: true, farmerFundedAt: now };
    
    const [updated] = await db.update(transportCostSplits)
      .set({ ...updateData, updatedAt: now })
      .where(eq(transportCostSplits.id, id))
      .returning();
    return updated;
  }

  async recalculateCostSplit(id: string, newTotal: number): Promise<TransportCostSplit> {
    const [split] = await db.select().from(transportCostSplits).where(eq(transportCostSplits.id, id));
    if (!split) throw new Error('Cost split not found');
    
    const buyerAmount = Math.round((newTotal * split.buyerPercentage) / 100);
    const farmerAmount = newTotal - buyerAmount;
    
    const [updated] = await db.update(transportCostSplits)
      .set({
        totalTransportCost: newTotal,
        buyerAmount,
        farmerAmount,
        updatedAt: new Date()
      })
      .where(eq(transportCostSplits.id, id))
      .returning();
    return updated;
  }

  // User Subscriptions
  async getUserSubscription(userId: string): Promise<UserSubscription | undefined> {
    const [subscription] = await db.select().from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));
    return subscription || undefined;
  }

  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const [created] = await db.insert(userSubscriptions).values(subscription).returning();
    return created;
  }

  async updateUserSubscription(id: string, updates: Partial<UserSubscription>): Promise<UserSubscription> {
    const [updated] = await db.update(userSubscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return updated;
  }

  async getEffectiveUserTier(userId: string): Promise<string> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription || subscription.status !== 'active') {
      return 'starter';
    }
    if (subscription.endDate && subscription.endDate < new Date()) {
      return 'starter';
    }
    return subscription.tier;
  }

  // Market Insights
  async getMarketInsights(options: {
    targetRole?: string;
    targetUserId?: string;
    type?: string;
    category?: string;
    requiredTier?: string;
    activeOnly?: boolean;
    limit?: number;
  }): Promise<MarketInsight[]> {
    const conditions = [];
    
    if (options.targetRole) {
      conditions.push(or(
        eq(marketInsights.targetRole, options.targetRole),
        sql`${marketInsights.targetRole} IS NULL`
      ));
    }
    if (options.targetUserId) {
      conditions.push(or(
        eq(marketInsights.targetUserId, options.targetUserId),
        sql`${marketInsights.targetUserId} IS NULL`
      ));
    }
    if (options.type) {
      conditions.push(eq(marketInsights.type, options.type));
    }
    if (options.category) {
      conditions.push(eq(marketInsights.category, options.category));
    }
    if (options.requiredTier) {
      conditions.push(eq(marketInsights.requiredTier, options.requiredTier));
    }
    if (options.activeOnly !== false) {
      conditions.push(eq(marketInsights.isActive, true));
    }
    
    let query = db.select().from(marketInsights);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    query = query.orderBy(desc(marketInsights.urgencyScore), desc(marketInsights.createdAt)) as any;
    
    if (options.limit) {
      query = query.limit(options.limit) as any;
    }
    
    return await query;
  }

  async createMarketInsight(insight: InsertMarketInsight): Promise<MarketInsight> {
    const [created] = await db.insert(marketInsights).values(insight).returning();
    return created;
  }

  async updateMarketInsight(id: string, updates: Partial<MarketInsight>): Promise<MarketInsight> {
    const [updated] = await db.update(marketInsights)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketInsights.id, id))
      .returning();
    return updated;
  }

  async getMarketInsightById(id: string): Promise<MarketInsight | undefined> {
    const [insight] = await db.select().from(marketInsights).where(eq(marketInsights.id, id));
    return insight || undefined;
  }

  async getFilteredInsightsForUser(userId: string, userRole: string, userTier: string): Promise<MarketInsight[]> {
    const tierOrder = ['starter', 'growth', 'professional', 'enterprise'];
    const userTierIndex = tierOrder.indexOf(userTier);
    const accessibleTiers = tierOrder.slice(0, userTierIndex + 1);
    
    const conditions = [
      eq(marketInsights.isActive, true),
      or(
        sql`${marketInsights.expiresAt} IS NULL`,
        gte(marketInsights.expiresAt, new Date())
      ),
      or(
        eq(marketInsights.targetRole, userRole),
        sql`${marketInsights.targetRole} IS NULL`
      ),
      or(
        eq(marketInsights.targetUserId, userId),
        sql`${marketInsights.targetUserId} IS NULL`
      )
    ];
    
    const insights = await db.select().from(marketInsights)
      .where(and(...conditions))
      .orderBy(desc(marketInsights.urgencyScore), desc(marketInsights.createdAt));
    
    return insights.map(insight => ({
      ...insight,
      isLocked: !accessibleTiers.includes(insight.requiredTier)
    })) as any;
  }

  // Platform Config & Fees
  async getPlatformConfig(key: string): Promise<PlatformConfig | undefined> {
    const [config] = await db.select().from(platformConfig).where(eq(platformConfig.key, key));
    return config || undefined;
  }

  async getAllPlatformConfig(): Promise<PlatformConfig[]> {
    return await db.select().from(platformConfig).orderBy(platformConfig.key);
  }

  async setPlatformConfig(key: string, value: string, description?: string, updatedBy?: string): Promise<PlatformConfig> {
    const existing = await this.getPlatformConfig(key);
    if (existing) {
      const [updated] = await db.update(platformConfig)
        .set({ value, description: description || existing.description, updatedBy, updatedAt: new Date() })
        .where(eq(platformConfig.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(platformConfig)
        .values({ key, value, description, updatedBy })
        .returning();
      return created;
    }
  }

  async createFee(fee: InsertFee): Promise<Fee> {
    const [created] = await db.insert(fees).values(fee).returning();
    return created;
  }

  async getFeesByTransaction(transactionId: string): Promise<Fee[]> {
    return await db.select().from(fees)
      .where(eq(fees.transactionId, transactionId))
      .orderBy(desc(fees.createdAt));
  }

  async getFeesByUser(userId: string, limit?: number): Promise<Fee[]> {
    let query = db.select().from(fees)
      .where(eq(fees.userId, userId))
      .orderBy(desc(fees.createdAt));
    
    if (limit) {
      query = query.limit(limit) as any;
    }
    
    return await query;
  }

  async updateFeeStatus(id: string, status: string, appliedAt?: Date): Promise<Fee> {
    const [updated] = await db.update(fees)
      .set({ status, appliedAt: appliedAt || (status === 'applied' ? new Date() : undefined) })
      .where(eq(fees.id, id))
      .returning();
    return updated;
  }

  async getFeeAnalytics(startDate?: Date, endDate?: Date): Promise<{ totalFees: number; byType: Record<string, number>; byTier: Record<string, number> }> {
    const conditions = [];
    if (startDate) conditions.push(gte(fees.createdAt, startDate));
    if (endDate) conditions.push(lte(fees.createdAt, endDate));
    
    let query = db.select().from(fees);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const allFees = await query;
    
    const totalFees = allFees.reduce((sum, f) => sum + f.feeAmount, 0);
    
    const byType: Record<string, number> = {};
    const byTier: Record<string, number> = {};
    
    for (const f of allFees) {
      byType[f.transactionType] = (byType[f.transactionType] || 0) + f.feeAmount;
      byTier[f.subscriptionTier] = (byTier[f.subscriptionTier] || 0) + f.feeAmount;
    }
    
    return { totalFees, byType, byTier };
  }

  private getTierReduction(tier: string): number {
    const reductions: Record<string, number> = {
      'starter': 0,
      'growth': 1,
      'pro': 2,
      'professional': 2,
      'commercial': 3,
      'enterprise': 3,
    };
    return reductions[tier.toLowerCase()] || 0;
  }

  async calculateTransactionFee(amount: number, buyerTier: string, farmerTier: string, isContract: boolean): Promise<{
    buyerFee: { percentage: number; amount: number };
    farmerFee: { percentage: number; amount: number };
    totalFee: number;
  }> {
    // Get base fee from config
    const baseFeeConfig = await this.getPlatformConfig('base_transaction_fee');
    const baseFee = parseFloat(baseFeeConfig?.value || '6');
    
    // For contracts, use reduced rate
    let contractMinConfig, contractMaxConfig;
    if (isContract) {
      contractMinConfig = await this.getPlatformConfig('contract_fee_min');
      contractMaxConfig = await this.getPlatformConfig('contract_fee_max');
    }
    
    const contractMin = parseFloat(contractMinConfig?.value || '2');
    const contractMax = parseFloat(contractMaxConfig?.value || '4');
    
    // Calculate effective fee per party (split 50/50)
    const basePerParty = isContract ? (contractMin + contractMax) / 2 / 2 : baseFee / 2;
    
    // Apply tier reductions
    const buyerReduction = this.getTierReduction(buyerTier);
    const farmerReduction = this.getTierReduction(farmerTier);
    
    const buyerPercentage = Math.max(0, basePerParty - (buyerReduction / 2));
    const farmerPercentage = Math.max(0, basePerParty - (farmerReduction / 2));
    
    // Calculate amounts (round to nearest integer - smallest currency unit)
    const buyerAmount = Math.round((amount * buyerPercentage) / 100);
    const farmerAmount = Math.round((amount * farmerPercentage) / 100);
    
    return {
      buyerFee: { percentage: buyerPercentage, amount: buyerAmount },
      farmerFee: { percentage: farmerPercentage, amount: farmerAmount },
      totalFee: buyerAmount + farmerAmount,
    };
  }

  async calculateTransportFee(amount: number, transporterTier: string): Promise<{ percentage: number; amount: number }> {
    const transportFeeConfig = await this.getPlatformConfig('transport_fee');
    const baseFee = parseFloat(transportFeeConfig?.value || '3.5');
    
    // Apply tier reduction for transporter
    const reduction = this.getTierReduction(transporterTier);
    const effectivePercentage = Math.max(0, baseFee - reduction);
    
    const feeAmount = Math.round((amount * effectivePercentage) / 100);
    
    return { percentage: effectivePercentage, amount: feeAmount };
  }
}

export const storage = new DatabaseStorage();
