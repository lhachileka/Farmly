import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  username: string;
  name: string;
  role: "farmer" | "buyer" | "transporter" | "admin";
  location: string;
  phone?: string;
  email?: string;
  avatar?: string;
  rating: string;
  verified: boolean;
  createdAt: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: "produce" | "livestock" | "grains" | "processed";
  price: number;
  unit: string;
  quantity: number;
  minOrder: number;
  location: string;
  harvestDate: string;
  organic: boolean;
  images: string[];
  status: "active" | "sold" | "expired" | "pending";
  sellerId: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  seller?: User;
}

export interface Bid {
  id: string;
  listingId: string;
  buyerId: string;
  amount: number;
  quantity: number;
  message?: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  listingId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface TransportRequest {
  id: string;
  listingId?: string;
  requesterId: string;
  transporterId?: string;
  pickupLocation: string;
  deliveryLocation: string;
  vehicleType: string;
  cargoType: string;
  preferredDate: string;
  estimatedDistance?: number;
  estimatedCost?: number;
  status: "pending" | "in_transit" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface PriceHistory {
  id: string;
  commodity: string;
  category: "produce" | "livestock" | "grains" | "processed";
  region: string;
  price: number;
  unit: string;
  recordedAt: string;
}

export const authApi = {
  register: async (data: {
    username: string;
    password: string;
    name: string;
    role: "farmer" | "buyer" | "transporter";
    location: string;
    phone?: string;
    email?: string;
  }) => {
    const res = await apiRequest("POST", "/api/auth/register", data);
    return await res.json() as User;
  },

  login: async (username: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { username, password });
    return await res.json() as User;
  },

  logout: async () => {
    await apiRequest("POST", "/api/auth/logout");
  },

  getMe: async () => {
    const res = await apiRequest("GET", "/api/auth/me");
    return await res.json() as User;
  },

  getCurrentUser: async () => {
    const res = await apiRequest("GET", "/api/auth/me");
    return await res.json() as User;
  },
};

export const listingsApi = {
  getAll: async (filters?: { category?: string; location?: string; sellerId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.location) params.append("location", filters.location);
    if (filters?.sellerId) params.append("sellerId", filters.sellerId);
    
    const url = `/api/listings${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await apiRequest("GET", url);
    return await res.json() as Listing[];
  },

  getById: async (id: string) => {
    const res = await apiRequest("GET", `/api/listings/${id}`);
    return await res.json() as Listing & { seller: User };
  },

  create: async (data: Omit<Listing, "id" | "createdAt" | "updatedAt" | "sellerId" | "featured" | "status">) => {
    const res = await apiRequest("POST", "/api/listings", data);
    return await res.json() as Listing;
  },

  update: async (id: string, data: Partial<Listing>) => {
    const res = await apiRequest("PATCH", `/api/listings/${id}`, data);
    return await res.json() as Listing;
  },

  delete: async (id: string) => {
    await apiRequest("DELETE", `/api/listings/${id}`);
  },
};

export const bidsApi = {
  getForListing: async (listingId: string) => {
    const res = await apiRequest("GET", `/api/listings/${listingId}/bids`);
    return await res.json() as Bid[];
  },

  create: async (data: { listingId: string; amount: number; quantity: number; message?: string }) => {
    const res = await apiRequest("POST", "/api/bids", data);
    return await res.json() as Bid;
  },

  updateStatus: async (bidId: string, status: "accepted" | "rejected") => {
    const res = await apiRequest("PATCH", `/api/bids/${bidId}/status`, { status });
    return await res.json() as Bid;
  },
};

export const reviewsApi = {
  getForUser: async (userId: string) => {
    const res = await apiRequest("GET", `/api/users/${userId}/reviews`);
    return await res.json() as Review[];
  },

  create: async (data: { revieweeId: string; listingId?: string; rating: number; comment?: string }) => {
    const res = await apiRequest("POST", "/api/reviews", data);
    return await res.json() as Review;
  },
};

export const transportApi = {
  getAll: async (filters?: { requesterId?: string; transporterId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.requesterId) params.append("requesterId", filters.requesterId);
    if (filters?.transporterId) params.append("transporterId", filters.transporterId);
    
    const url = `/api/transport${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await apiRequest("GET", url);
    return await res.json() as TransportRequest[];
  },

  create: async (data: {
    listingId?: string;
    pickupLocation: string;
    deliveryLocation: string;
    vehicleType: string;
    cargoType: string;
    preferredDate: string;
    estimatedDistance?: number;
    estimatedCost?: number;
  }) => {
    const res = await apiRequest("POST", "/api/transport", data);
    return await res.json() as TransportRequest;
  },

  updateStatus: async (id: string, status: string, transporterId?: string) => {
    const res = await apiRequest("PATCH", `/api/transport/${id}/status`, { status, transporterId });
    return await res.json() as TransportRequest;
  },
};

export interface MarketInsight {
  id: string;
  targetRole?: string;
  targetUserId?: string;
  type: string;
  category: string;
  title: string;
  summary: string;
  explanation: string;
  confidence: 'low' | 'medium' | 'high';
  requiredTier: string;
  dataPoints?: Record<string, unknown>;
  relatedProductId?: string;
  relatedLocation?: string;
  urgencyScore: number;
  financialImpact?: string;
  actionLabel?: string;
  actionType?: string;
  expiresAt?: string;
  isActive: boolean;
  isLocked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: string;
  status: string;
  startDate: string;
  endDate?: string;
  trialEndsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const insightsApi = {
  getPriceHistory: async (commodity: string, region: string, days?: number) => {
    const params = new URLSearchParams({ commodity, region });
    if (days) params.append("days", days.toString());
    
    const res = await apiRequest("GET", `/api/insights/price-history?${params.toString()}`);
    return await res.json() as PriceHistory[];
  },

  recordPrice: async (data: {
    commodity: string;
    category: string;
    region: string;
    price: number;
    unit: string;
  }) => {
    await apiRequest("POST", "/api/insights/record-price", data);
  },

  getMarketInsights: async () => {
    const res = await apiRequest("GET", "/api/insights");
    return await res.json() as { insights: MarketInsight[]; userTier: string };
  },

  getInsightsByCategory: async (category: string) => {
    const res = await apiRequest("GET", `/api/insights/${category}`);
    return await res.json() as { insights: MarketInsight[]; userTier: string };
  },

  getSubscription: async () => {
    const res = await apiRequest("GET", "/api/subscription");
    return await res.json() as { subscription: UserSubscription | null; effectiveTier: string };
  },
};

// Fees API
export interface FeeCalculation {
  subtotal: number;
  transactionFees: {
    buyerFee: { percentage: number; amount: number };
    farmerFee: { percentage: number; amount: number };
    totalFee: number;
  };
  transportCost: number;
  transportFees: { percentage: number; amount: number } | null;
  buyerTier: string;
  sellerTier: string;
  totalBuyerPayable: number;
}

export interface FeeConfig {
  baseTransactionFee: number;
  transportFee: number;
  contractFeeMin: number;
  contractFeeMax: number;
  tierReductions: Record<string, number>;
  baseBuyerFeePercent?: number;
  baseFarmerFeePercent?: number;
  baseTransportFeePercent?: number;
  contractFeePercent?: number;
  starterDiscount?: number;
  growthDiscount?: number;
  proDiscount?: number;
  commercialDiscount?: number;
}

export const feesApi = {
  calculateFees: async (params: {
    amount: number;
    sellerId: string;
    isContract?: boolean;
    transportCost?: number;
    transporterId?: string;
  }) => {
    const res = await apiRequest("POST", "/api/fees/calculate", params);
    return await res.json() as FeeCalculation;
  },

  getConfig: async () => {
    const res = await apiRequest("GET", "/api/fees/config");
    return await res.json() as FeeConfig;
  },

  getHistory: async (limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    const res = await apiRequest("GET", `/api/fees/history${params}`);
    return await res.json();
  },

  updateConfig: async (config: {
    baseBuyerFeePercent?: number;
    baseFarmerFeePercent?: number;
    baseTransportFeePercent?: number;
    contractFeePercent?: number;
    starterDiscount?: number;
    growthDiscount?: number;
    proDiscount?: number;
    commercialDiscount?: number;
  }) => {
    const res = await apiRequest("PUT", "/api/fees/config", config);
    return await res.json() as FeeConfig;
  },
};

export interface Notification {
  id: string;
  userId: string;
  type: "bid" | "order" | "review" | "system";
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  userId: string;
  listingId: string;
  quantity: number;
  createdAt: string;
  listing: Listing;
}

export interface AdminStats {
  totalUsers: number;
  totalListings: number;
  totalBids: number;
  activeListings: number;
}

export const notificationsApi = {
  getAll: async () => {
    const res = await apiRequest("GET", "/api/notifications");
    return await res.json() as Notification[];
  },

  markRead: async (id: string) => {
    const res = await apiRequest("PATCH", `/api/notifications/${id}/read`);
    return await res.json() as Notification;
  },

  markAllRead: async () => {
    await apiRequest("POST", "/api/notifications/read-all");
  },
};

export const cartApi = {
  getItems: async () => {
    const res = await apiRequest("GET", "/api/cart");
    return await res.json() as CartItem[];
  },

  addItem: async (listingId: string, quantity: number) => {
    const res = await apiRequest("POST", "/api/cart", { listingId, quantity });
    return await res.json() as CartItem;
  },

  updateItem: async (id: string, quantity: number) => {
    const res = await apiRequest("PATCH", `/api/cart/${id}`, { quantity });
    return await res.json() as CartItem;
  },

  removeItem: async (id: string) => {
    await apiRequest("DELETE", `/api/cart/${id}`);
  },

  clear: async () => {
    await apiRequest("DELETE", "/api/cart");
  },
};

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "completed" | "disputed" | "cancelled";
  subtotal: number;
  serviceFee: number;
  total: number;
  deliveryAddress: string;
  deliveryPhone: string;
  notes?: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  disputeDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  listingId: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
  listing: Listing;
}

export interface Payment {
  id: string;
  orderId: string;
  method: "bank_transfer" | "airtel_money" | "mtn_money" | "zamtel_money" | "debit_card";
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  amount: number;
  currency: string;
  providerReference?: string;
  phoneNumber?: string;
  accountNumber?: string;
  escrowReleased: boolean;
  releasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetails extends Order {
  items: OrderItem[];
  payment: Payment | null;
  buyer: User;
  seller: User;
}

export const ordersApi = {
  checkout: async (data: {
    deliveryAddress: string;
    deliveryPhone: string;
    notes?: string;
    paymentMethod: "bank_transfer" | "airtel_money" | "mtn_money" | "zamtel_money" | "debit_card";
    phoneNumber?: string;
    accountNumber?: string;
  }) => {
    const res = await apiRequest("POST", "/api/checkout", data);
    return await res.json() as { orders: Order[]; paymentLink?: string };
  },

  getAll: async (role: "buyer" | "seller" = "buyer") => {
    const res = await apiRequest("GET", `/api/orders?role=${role}`);
    return await res.json() as Order[];
  },

  getById: async (id: string) => {
    const res = await apiRequest("GET", `/api/orders/${id}`);
    return await res.json() as OrderDetails;
  },

  confirmPayment: async (orderId: string, providerReference?: string) => {
    const res = await apiRequest("POST", `/api/orders/${orderId}/pay`, { providerReference });
    return await res.json() as Order;
  },

  markShipped: async (orderId: string) => {
    const res = await apiRequest("POST", `/api/orders/${orderId}/ship`);
    return await res.json() as Order;
  },

  confirmDelivery: async (orderId: string) => {
    const res = await apiRequest("POST", `/api/orders/${orderId}/deliver`);
    return await res.json() as Order;
  },

  complete: async (orderId: string) => {
    const res = await apiRequest("POST", `/api/orders/${orderId}/complete`);
    return await res.json() as Order;
  },

  dispute: async (orderId: string) => {
    const res = await apiRequest("POST", `/api/orders/${orderId}/dispute`);
    return await res.json() as Order;
  },
};

export const adminApi = {
  getStats: async () => {
    const res = await apiRequest("GET", "/api/admin/stats");
    return await res.json() as AdminStats;
  },

  getUsers: async () => {
    const res = await apiRequest("GET", "/api/admin/users");
    return await res.json() as User[];
  },

  getListings: async () => {
    const res = await apiRequest("GET", "/api/admin/listings");
    return await res.json() as Listing[];
  },

  updateUserVerification: async (userId: string, verified: boolean) => {
    const res = await apiRequest("PATCH", `/api/admin/users/${userId}/verify`, { verified });
    return await res.json() as User;
  },

  updateUserRole: async (userId: string, role: string) => {
    const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
    return await res.json() as User;
  },

  updateListingFeatured: async (listingId: string, featured: boolean) => {
    const res = await apiRequest("PATCH", `/api/admin/listings/${listingId}/featured`, { featured });
    return await res.json() as Listing;
  },

  updateListingStatus: async (listingId: string, status: string) => {
    const res = await apiRequest("PATCH", `/api/admin/listings/${listingId}/status`, { status });
    return await res.json() as Listing;
  },

  getContracts: async () => {
    const res = await apiRequest("GET", "/api/admin/contracts");
    return await res.json() as Contract[];
  },

  updateContractStatus: async (contractId: string, status: string) => {
    const res = await apiRequest("PATCH", `/api/admin/contracts/${contractId}`, { status });
    return await res.json() as Contract;
  },

  adjustTrustScore: async (userId: string, delta: number, reason: string) => {
    const res = await apiRequest("POST", `/api/admin/users/${userId}/trust-score`, { delta, reason });
    return await res.json() as User;
  },
};

export interface Subscription {
  id: string;
  buyerId: string;
  sellerId: string;
  frequency: "weekly" | "biweekly" | "monthly";
  durationWeeks: number;
  status: "pending" | "active" | "paused" | "completed" | "breached" | "cancelled";
  message?: string;
  sellerResponse?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionItem {
  id: string;
  subscriptionId: string;
  listingId: string;
  quantityPerDelivery: number;
  pricePerUnit: number;
  listing: Listing;
}

export interface Contract {
  id: string;
  subscriptionId: string;
  buyerId: string;
  sellerId: string;
  pricingModel: "fixed_price" | "price_range" | "volume_commitment";
  escrowScheduleType: "pay_per_delivery" | "weekly" | "monthly";
  frequency: "weekly" | "biweekly" | "monthly";
  startDate: string;
  endDate: string;
  status: "pending" | "active" | "paused" | "completed" | "breached" | "cancelled";
  totalValue: number;
  completedDeliveries: number;
  totalDeliveries: number;
  autoReleaseHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContractItem {
  id: string;
  contractId: string;
  listingId: string;
  productName: string;
  quantityPerDelivery: number;
  unit: string;
  fixedPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  minVolume?: number;
  reservedQuantity: number;
}

export interface RecurringOrder {
  id: string;
  contractId: string;
  orderId?: string;
  scheduledDate: string;
  deliveryNumber: number;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "completed" | "disputed" | "cancelled";
  escrowFunded: boolean;
  escrowAmount: number;
  deliveryConfirmation?: "delivered_as_agreed" | "delivered_with_issues" | "not_delivered";
  confirmationNotes?: string;
  confirmedAt?: string;
  autoReleasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerBadge {
  id: string;
  sellerId: string;
  badgeType: "trusted_supplier" | "contracted_seller" | "preferred_supplier";
  earnedAt: string;
  expiresAt?: string;
  active: boolean;
}

export interface SellerMetrics {
  fulfillmentRate: number;
  onTimeRate: number;
  completionRate: number;
  disputeCount: number;
}

export const subscriptionsApi = {
  create: async (data: {
    sellerId: string;
    frequency: "weekly" | "biweekly" | "monthly";
    durationWeeks: number;
    message?: string;
    items: { listingId: string; quantityPerDelivery: number; pricePerUnit: number }[];
  }) => {
    const res = await apiRequest("POST", "/api/subscriptions", data);
    return await res.json() as Subscription;
  },

  getAll: async () => {
    const res = await apiRequest("GET", "/api/subscriptions");
    return await res.json() as { asBuyer: Subscription[]; asSeller: Subscription[] };
  },

  getById: async (id: string) => {
    const res = await apiRequest("GET", `/api/subscriptions/${id}`);
    return await res.json() as Subscription & { items: SubscriptionItem[]; buyer: User; seller: User };
  },

  respond: async (id: string, data: {
    action: "accept" | "reject";
    response?: string;
    pricingModel?: "fixed_price" | "price_range" | "volume_commitment";
    escrowScheduleType?: "pay_per_delivery" | "weekly" | "monthly";
  }) => {
    const res = await apiRequest("PATCH", `/api/subscriptions/${id}/respond`, data);
    return await res.json() as { subscription: Subscription; contract?: Contract };
  },
};

export const contractsApi = {
  getAll: async () => {
    const res = await apiRequest("GET", "/api/contracts");
    return await res.json() as { asBuyer: Contract[]; asSeller: Contract[] };
  },

  getById: async (id: string) => {
    const res = await apiRequest("GET", `/api/contracts/${id}`);
    return await res.json() as Contract & { 
      items: ContractItem[]; 
      buyer: User; 
      seller: User; 
      subscription: Subscription;
      recurringOrders: RecurringOrder[];
    };
  },

  updateStatus: async (id: string, status: string) => {
    const res = await apiRequest("PATCH", `/api/contracts/${id}/status`, { status });
    return await res.json() as Contract;
  },
};

export const recurringOrdersApi = {
  getUpcoming: async () => {
    const res = await apiRequest("GET", "/api/recurring-orders/upcoming");
    return await res.json() as (RecurringOrder & { contract: Contract })[];
  },

  confirmDelivery: async (id: string, confirmation: "delivered_as_agreed" | "delivered_with_issues" | "not_delivered", notes?: string) => {
    const res = await apiRequest("POST", `/api/recurring-orders/${id}/confirm`, { confirmation, notes });
    return await res.json() as RecurringOrder;
  },

  fundEscrow: async (id: string) => {
    const res = await apiRequest("POST", `/api/recurring-orders/${id}/fund`);
    return await res.json() as RecurringOrder;
  },
};

export const sellersApi = {
  getBadges: async (sellerId: string) => {
    const res = await apiRequest("GET", `/api/users/${sellerId}/badges`);
    return await res.json() as SellerBadge[];
  },

  getMetrics: async (sellerId: string) => {
    const res = await apiRequest("GET", `/api/sellers/${sellerId}/metrics`);
    return await res.json() as SellerMetrics;
  },
};

// Co-Op (Group Supply) Types
export interface Coop {
  id: string;
  title: string;
  description: string;
  productType: "produce" | "livestock" | "grains" | "processed";
  productName: string;
  unit: string;
  pricePerUnit: string;
  targetQuantity: string;
  currentQuantity: string;
  minContribution?: string;
  maxContribution?: string;
  qualityStandards?: string;
  location: string;
  availableFrom?: string;
  availableUntil?: string;
  images: string[];
  leaderId: string;
  leader?: { id: string; name: string; location: string; verified: boolean; rating: string };
  status: "recruiting" | "active" | "order_placed" | "in_delivery" | "fulfilled" | "cancelled" | "failed";
  percentFilled?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CoopMember {
  id: string;
  coopId: string;
  sellerId: string;
  seller?: { id: string; name: string; location: string; verified: boolean };
  committedQuantity: string;
  deliveredQuantity?: string;
  status: "pending" | "ready" | "delivered" | "failed";
  availabilityStart?: string;
  availabilityEnd?: string;
  notes?: string;
  readyAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface CoopOrder {
  id: string;
  coopId: string;
  buyerId: string;
  quantity: string;
  totalAmount: string;
  escrowAmount: string;
  escrowFunded: boolean;
  deliveryAddress: string;
  buyerNotes?: string;
  status: "pending" | "escrow_funded" | "in_delivery" | "delivered" | "completed" | "disputed";
  deliveryConfirmedAt?: string;
  deliveryPhoto?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutSplit {
  id: string;
  coopOrderId: string;
  sellerId: string;
  contributionId: string;
  amount: string;
  percentage: string;
  status: "pending" | "paid" | "adjusted" | "disputed";
  paidAt?: string;
}

export interface CoopDispute {
  id: string;
  coopOrderId: string;
  raisedBy: string;
  againstSellerId?: string;
  reason: string;
  evidence: string[];
  status: "open" | "investigating" | "resolved" | "escalated";
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export const coopsApi = {
  getAll: async (filters?: { status?: string; productType?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.productType) params.append("productType", filters.productType);
    const res = await apiRequest("GET", `/api/coops?${params.toString()}`);
    return await res.json() as Coop[];
  },

  getById: async (id: string) => {
    const res = await apiRequest("GET", `/api/coops/${id}`);
    return await res.json() as Coop & { members: CoopMember[] };
  },

  create: async (data: {
    title: string;
    description: string;
    productType: string;
    productName: string;
    unit: string;
    pricePerUnit: string;
    targetQuantity: string;
    minContribution?: string;
    maxContribution?: string;
    qualityStandards?: string;
    location: string;
    availableFrom?: string;
    availableUntil?: string;
    images?: string[];
    leaderQuantity: string;
  }) => {
    const res = await apiRequest("POST", "/api/coops", data);
    return await res.json() as Coop;
  },

  join: async (coopId: string, data: {
    committedQuantity: string;
    availabilityStart?: string;
    availabilityEnd?: string;
    notes?: string;
  }) => {
    const res = await apiRequest("POST", `/api/coops/${coopId}/join`, data);
    return await res.json() as CoopMember;
  },

  markReady: async (coopId: string, memberId: string) => {
    const res = await apiRequest("POST", `/api/coops/${coopId}/members/${memberId}/ready`);
    return await res.json() as CoopMember;
  },

  placeOrder: async (coopId: string, data: {
    quantity: string;
    deliveryAddress: string;
    buyerNotes?: string;
  }) => {
    const res = await apiRequest("POST", `/api/coops/${coopId}/orders`, data);
    return await res.json() as CoopOrder;
  },

  fundEscrow: async (orderId: string) => {
    const res = await apiRequest("POST", `/api/coop-orders/${orderId}/fund-escrow`);
    return await res.json() as CoopOrder;
  },

  confirmDelivery: async (orderId: string, photo?: string) => {
    const res = await apiRequest("POST", `/api/coop-orders/${orderId}/confirm-delivery`, { photo });
    return await res.json() as { order: CoopOrder; payouts: PayoutSplit[] };
  },

  raiseDispute: async (orderId: string, data: {
    reason: string;
    againstSellerId?: string;
    evidence?: string[];
  }) => {
    const res = await apiRequest("POST", `/api/coop-orders/${orderId}/dispute`, data);
    return await res.json() as CoopDispute;
  },
};

export const adminCoopsApi = {
  getAll: async () => {
    const res = await apiRequest("GET", "/api/admin/coops");
    return await res.json() as Coop[];
  },

  updateStatus: async (id: string, status: string) => {
    const res = await apiRequest("PATCH", `/api/admin/coops/${id}`, { status });
    return await res.json() as Coop;
  },

  removeMember: async (coopId: string, memberId: string) => {
    const res = await apiRequest("DELETE", `/api/admin/coops/${coopId}/members/${memberId}`);
    return await res.json() as { success: boolean };
  },

  getDisputes: async (status?: string) => {
    const params = status ? `?status=${status}` : "";
    const res = await apiRequest("GET", `/api/admin/coop-disputes${params}`);
    return await res.json() as CoopDispute[];
  },

  resolveDispute: async (id: string, resolution: string) => {
    const res = await apiRequest("POST", `/api/admin/coop-disputes/${id}/resolve`, { resolution });
    return await res.json() as CoopDispute;
  },

  adjustPayout: async (payoutId: string, amount: string, reason: string) => {
    const res = await apiRequest("PATCH", `/api/admin/payouts/${payoutId}`, { amount, reason });
    return await res.json() as PayoutSplit;
  },
};

// ============ CHAT API ============

export interface UserChat {
  id: string;
  participant1Id: string;
  participant2Id: string;
  listingId?: string;
  lastMessageAt: string;
  createdAt: string;
  otherUser?: User;
  lastMessage?: ChatMessage;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender?: User;
}

export const chatApi = {
  getChats: async () => {
    const res = await apiRequest("GET", "/api/chats");
    return await res.json() as UserChat[];
  },

  createChat: async (recipientId: string, listingId?: string) => {
    const res = await apiRequest("POST", "/api/chats", { recipientId, listingId });
    return await res.json() as UserChat;
  },

  getMessages: async (chatId: string) => {
    const res = await apiRequest("GET", `/api/chats/${chatId}/messages`);
    return await res.json() as ChatMessage[];
  },

  sendMessage: async (chatId: string, content: string) => {
    const res = await apiRequest("POST", `/api/chats/${chatId}/messages`, { content });
    return await res.json() as ChatMessage;
  },

  getUnreadCount: async () => {
    const res = await apiRequest("GET", "/api/chats/unread-count");
    return await res.json() as { count: number };
  },
};

// ============ QUALITY GRADING API ============

export interface GradeDefinition {
  id: string;
  category: "produce" | "livestock";
  grade: "A" | "B" | "C";
  name: string;
  description: string;
  criteria: string[];
  suitableFor: string[];
  isActive: boolean;
  createdAt: string;
}

export interface MediaEvidence {
  id: string;
  orderId?: string;
  listingId?: string;
  coopOrderId?: string;
  uploaderId: string;
  mediaType: "photo" | "video";
  url: string;
  thumbnailUrl?: string;
  geoLatitude?: string;
  geoLongitude?: string;
  capturedAt: string;
  purpose: string;
  notes?: string;
  createdAt: string;
}

export interface DeliveryGrade {
  id: string;
  orderId: string;
  expectedGrade: "A" | "B" | "C";
  buyerConfirmation?: "matches" | "lower" | "rejected";
  buyerReportedGrade?: "A" | "B" | "C";
  buyerComment?: string;
  sellerDeclaredGrade: "A" | "B" | "C";
  finalGrade?: "A" | "B" | "C";
  verifiedBy?: string;
  verificationBadge: boolean;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GradeDispute {
  id: string;
  deliveryGradeId: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  claimedGrade: "A" | "B" | "C";
  actualGrade: "A" | "B" | "C";
  buyerReason: string;
  sellerResponse?: string;
  status: "pending" | "under_review" | "resolved_buyer" | "resolved_seller" | "resolved_partial" | "closed";
  resolution?: string;
  refundAmount?: string;
  refundPercentage?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  autoResolveAt?: string;
  createdAt: string;
}

export interface SellerTrustMetrics {
  id: string;
  sellerId: string;
  totalDeliveries: number;
  gradeMatchCount: number;
  gradeLowerCount: number;
  gradeRejectedCount: number;
  disputeCount: number;
  disputesWon: number;
  disputesLost: number;
  gradeAccuracyRate: string;
  deliveryConsistencyRate: string;
  trustScore: number;
  isContractEligible: boolean;
  isSubscriptionVisible: boolean;
  lastWarningAt?: string;
  suspendedUntil?: string;
  updatedAt: string;
  createdAt: string;
}

export const gradesApi = {
  getDefinitions: async (category?: string) => {
    const url = category ? `/api/grades/definitions?category=${category}` : "/api/grades/definitions";
    const res = await apiRequest("GET", url);
    return await res.json() as GradeDefinition[];
  },

  getDefinition: async (category: string, grade: string) => {
    const res = await apiRequest("GET", `/api/grades/definitions/${category}/${grade}`);
    return await res.json() as GradeDefinition;
  },

  uploadMediaEvidence: async (data: {
    orderId?: string;
    listingId?: string;
    coopOrderId?: string;
    mediaType: "photo" | "video";
    url: string;
    thumbnailUrl?: string;
    geoLatitude?: number;
    geoLongitude?: number;
    purpose: string;
    notes?: string;
  }) => {
    const res = await apiRequest("POST", "/api/grades/media", data);
    return await res.json() as MediaEvidence;
  },

  getMediaForOrder: async (orderId: string) => {
    const res = await apiRequest("GET", `/api/grades/media/order/${orderId}`);
    return await res.json() as MediaEvidence[];
  },

  checkMediaRequirements: async (orderId: string) => {
    const res = await apiRequest("GET", `/api/grades/media/check/${orderId}`);
    return await res.json() as { photos: number; videos: number; meetsRequirements: boolean };
  },

  createDeliveryGrade: async (orderId: string, expectedGrade: string, sellerDeclaredGrade: string) => {
    const res = await apiRequest("POST", "/api/grades/delivery", { orderId, expectedGrade, sellerDeclaredGrade });
    return await res.json() as DeliveryGrade;
  },

  getDeliveryGrade: async (orderId: string) => {
    const res = await apiRequest("GET", `/api/grades/delivery/${orderId}`);
    return await res.json() as DeliveryGrade;
  },

  confirmDeliveryGrade: async (id: string, confirmation: "matches" | "lower" | "rejected", reportedGrade?: string, comment?: string) => {
    const res = await apiRequest("POST", `/api/grades/delivery/${id}/confirm`, { confirmation, reportedGrade, comment });
    return await res.json() as DeliveryGrade;
  },

  createDispute: async (data: {
    deliveryGradeId: string;
    orderId: string;
    sellerId: string;
    claimedGrade: string;
    actualGrade: string;
    buyerReason: string;
  }) => {
    const res = await apiRequest("POST", "/api/grades/disputes", data);
    return await res.json() as GradeDispute;
  },

  getDisputesForOrder: async (orderId: string) => {
    const res = await apiRequest("GET", `/api/grades/disputes/order/${orderId}`);
    return await res.json() as GradeDispute[];
  },

  respondToDispute: async (id: string, response: string) => {
    const res = await apiRequest("POST", `/api/grades/disputes/${id}/respond`, { response });
    return await res.json() as GradeDispute;
  },

  getPendingDisputes: async () => {
    const res = await apiRequest("GET", "/api/grades/disputes/pending");
    return await res.json() as GradeDispute[];
  },

  resolveDispute: async (id: string, resolution: string, buyerWins: boolean, refundAmount?: string, refundPercentage?: string) => {
    const res = await apiRequest("POST", `/api/grades/disputes/${id}/resolve`, { resolution, buyerWins, refundAmount, refundPercentage });
    return await res.json() as GradeDispute;
  },

  getSellerTrustMetrics: async (sellerId: string) => {
    const res = await apiRequest("GET", `/api/grades/trust/${sellerId}`);
    return await res.json() as SellerTrustMetrics;
  },
};

// Demand Forecasting Types
export interface DemandForecast {
  id: string;
  buyerId: string;
  productName: string;
  category: "produce" | "livestock" | "grains" | "processed";
  quantity: number;
  unit: string;
  frequency: "weekly" | "monthly" | "one_off";
  startDate: string;
  endDate: string;
  preferredGrade: "A" | "B" | "C" | null;
  targetPrice: number | null;
  location: string;
  notes: string | null;
  status: "active" | "fulfilled" | "expired" | "cancelled";
  createdAt: string;
  updatedAt: string;
  buyer?: User;
  responses?: ForecastResponse[];
}

export interface ForecastResponse {
  id: string;
  forecastId: string;
  sellerId: string;
  indicativeQuantity: number;
  proposedPrice: number;
  message: string | null;
  status: "pending" | "accepted" | "rejected" | "converted";
  createdAt: string;
  updatedAt: string;
  seller?: User;
}

export interface ForecastConversion {
  id: string;
  forecastId: string;
  responseId: string | null;
  conversionType: "subscription" | "contract" | "coop" | "order";
  referenceId: string;
  convertedQuantity: number;
  createdAt: string;
}

export const forecastsApi = {
  create: async (data: {
    productName: string;
    category: string;
    quantity: number;
    unit: string;
    frequency: string;
    startDate: string;
    endDate: string;
    preferredGrade?: string;
    targetPrice?: number;
    location: string;
    notes?: string;
  }) => {
    const res = await apiRequest("POST", "/api/forecasts", data);
    return await res.json() as DemandForecast;
  },

  getMyForecasts: async () => {
    const res = await apiRequest("GET", "/api/forecasts/my");
    return await res.json() as (DemandForecast & { responses: ForecastResponse[] })[];
  },

  getAvailableForecasts: async () => {
    const res = await apiRequest("GET", "/api/forecasts/available");
    return await res.json() as (DemandForecast & { buyer: User; responses: ForecastResponse[] })[];
  },

  get: async (id: string) => {
    const res = await apiRequest("GET", `/api/forecasts/${id}`);
    return await res.json() as DemandForecast & { buyer: User; responses: (ForecastResponse & { seller: User })[]; conversions: ForecastConversion[] };
  },

  cancel: async (id: string) => {
    const res = await apiRequest("POST", `/api/forecasts/${id}/cancel`);
    return await res.json() as DemandForecast;
  },

  respond: async (id: string, data: {
    indicativeQuantity: number;
    proposedPrice: number;
    message?: string;
  }) => {
    const res = await apiRequest("POST", `/api/forecasts/${id}/respond`, data);
    return await res.json() as ForecastResponse;
  },

  acceptResponse: async (responseId: string) => {
    const res = await apiRequest("POST", `/api/forecast-responses/${responseId}/accept`);
    return await res.json() as ForecastResponse;
  },

  convert: async (id: string, data: {
    conversionType: string;
    responseId?: string;
    referenceId: string;
    quantity: number;
  }) => {
    const res = await apiRequest("POST", `/api/forecasts/${id}/convert`, data);
    return await res.json() as ForecastConversion;
  },

  getStats: async () => {
    const res = await apiRequest("GET", "/api/admin/forecast-stats");
    return await res.json() as {
      totalForecasts: number;
      activeForecasts: number;
      totalResponses: number;
      conversionRate: number;
      topProducts: { product: string; count: number }[];
    };
  },
};

// Transport Management System Types
export interface TransportJob {
  id: string;
  orderId?: string;
  listingId?: string;
  sellerId: string;
  buyerId: string;
  transporterId?: string;
  pickupLocation: string;
  deliveryLocation: string;
  pickupDate: string;
  deliveryDeadline?: string;
  productType: string;
  productDescription?: string;
  quantity?: number;
  unit?: string;
  weight?: number;
  vehicleType?: string;
  suggestedPrice: number;
  agreedPrice?: number;
  status: string;
  priority?: string;
  createdAt: string;
  updatedAt: string;
  seller?: User;
  buyer?: User;
  transporter?: User;
}

export interface TransportOffer {
  id: string;
  jobId: string;
  transporterId: string;
  proposedPrice: number;
  estimatedPickupTime?: string;
  estimatedDeliveryTime?: string;
  vehicleDetails?: string;
  message?: string;
  status: string;
  counterPrice?: number;
  counterMessage?: string;
  createdAt: string;
  updatedAt: string;
  transporter?: User;
}

export interface TransportProof {
  id: string;
  jobId: string;
  proofType: string;
  submittedBy: string;
  photoUrls: string[];
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAddress?: string;
  timestamp: string;
  notes?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface TransportEscrow {
  id: string;
  jobId: string;
  amount: number;
  platformFee: number;
  transporterAmount: number;
  status: string;
  fundedAt?: string;
  releasedAt?: string;
  createdAt: string;
}

export interface TransportDispute {
  id: string;
  jobId: string;
  raisedBy: string;
  disputeType: string;
  description: string;
  evidence?: string[];
  status: string;
  resolution?: string;
  resolvedBy?: string;
  refundAmount?: number;
  penaltyAmount?: number;
  createdAt: string;
  resolvedAt?: string;
}

export interface TransportRating {
  id: string;
  jobId: string;
  ratedBy: string;
  ratedUser: string;
  rating: number;
  onTimeDelivery: boolean;
  cargoCondition: string;
  communication: number;
  comment?: string;
  createdAt: string;
}

export interface TransporterReliability {
  id: string;
  transporterId: string;
  totalJobs: number;
  completedJobs: number;
  avgRating: number;
  onTimeRate: number;
  disputeRate: number;
  damageRate: number;
  reliabilityScore: number;
  subscriptionEligible: boolean;
  updatedAt: string;
}

export interface TransportSubscription {
  id: string;
  buyerId: string;
  transporterId: string;
  routeFrom: string;
  routeTo: string;
  frequency: string;
  vehicleType?: string;
  agreedRate: number;
  startDate: string;
  endDate?: string;
  status: string;
  createdAt: string;
}

export const transportJobsApi = {
  getOpen: async (filters?: { 
    cargoType?: string; 
    region?: string; 
    minPrice?: number; 
    maxPrice?: number;
    priority?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.cargoType) params.append("cargoType", filters.cargoType);
    if (filters?.region) params.append("region", filters.region);
    if (filters?.minPrice) params.append("minPrice", filters.minPrice.toString());
    if (filters?.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
    if (filters?.priority) params.append("priority", filters.priority);
    
    const url = `/api/transport-jobs${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await apiRequest("GET", url);
    return await res.json() as TransportJob[];
  },

  getMy: async (status?: string) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    
    const url = `/api/transport-jobs/my${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await apiRequest("GET", url);
    return await res.json() as TransportJob[];
  },

  getById: async (id: string) => {
    const res = await apiRequest("GET", `/api/transport-jobs/${id}`);
    return await res.json() as TransportJob & { 
      offers: TransportOffer[]; 
      proofs: TransportProof[];
      escrow?: TransportEscrow;
      disputes: TransportDispute[];
      ratings: TransportRating[];
    };
  },

  create: async (data: {
    orderId?: string;
    listingId?: string;
    buyerId: string;
    pickupLocation: string;
    deliveryLocation: string;
    pickupDate: string;
    deliveryDeadline?: string;
    cargoType: string;
    cargoWeight?: number;
    vehicleRequirement?: string;
    specialInstructions?: string;
    basePrice: number;
    priority?: string;
  }) => {
    const res = await apiRequest("POST", "/api/transport-jobs", data);
    return await res.json() as TransportJob;
  },

  updateStatus: async (id: string, data: { 
    status: string; 
    actualPickupTime?: string;
    actualDeliveryTime?: string;
  }) => {
    const res = await apiRequest("PATCH", `/api/transport-jobs/${id}/status`, data);
    return await res.json() as TransportJob;
  },

  // Offers
  getOffers: async (jobId: string) => {
    const res = await apiRequest("GET", `/api/transport-jobs/${jobId}/offers`);
    return await res.json() as TransportOffer[];
  },

  submitOffer: async (jobId: string, data: {
    proposedPrice: number;
    estimatedPickupTime?: string;
    estimatedDeliveryTime?: string;
    vehicleDetails?: string;
    message?: string;
  }) => {
    const res = await apiRequest("POST", `/api/transport-jobs/${jobId}/offers`, data);
    return await res.json() as TransportOffer;
  },

  acceptOffer: async (offerId: string) => {
    const res = await apiRequest("POST", `/api/transport-offers/${offerId}/accept`);
    return await res.json() as TransportOffer;
  },

  rejectOffer: async (offerId: string, counterOffer?: { price: number; message?: string }) => {
    const res = await apiRequest("POST", `/api/transport-offers/${offerId}/reject`, counterOffer || {});
    return await res.json() as TransportOffer;
  },

  // Proofs
  submitProof: async (jobId: string, data: {
    proofType: string;
    photoUrls: string[];
    gpsLatitude?: number;
    gpsLongitude?: number;
    gpsAddress?: string;
    notes?: string;
  }) => {
    const res = await apiRequest("POST", `/api/transport-jobs/${jobId}/proofs`, data);
    return await res.json() as TransportProof;
  },

  verifyProof: async (proofId: string, data: { verified: boolean; reason?: string }) => {
    const res = await apiRequest("POST", `/api/transport-proofs/${proofId}/verify`, data);
    return await res.json() as TransportProof;
  },

  // Escrow
  fundEscrow: async (jobId: string, data: { amount: number }) => {
    const res = await apiRequest("POST", `/api/transport-jobs/${jobId}/escrow/fund`, data);
    return await res.json() as TransportEscrow;
  },

  // Disputes
  createDispute: async (jobId: string, data: {
    disputeType: string;
    description: string;
    evidence?: string[];
  }) => {
    const res = await apiRequest("POST", `/api/transport-jobs/${jobId}/disputes`, data);
    return await res.json() as TransportDispute;
  },

  resolveDispute: async (disputeId: string, data: {
    resolution: string;
    refundAmount?: number;
    penaltyAmount?: number;
  }) => {
    const res = await apiRequest("POST", `/api/transport-disputes/${disputeId}/resolve`, data);
    return await res.json() as TransportDispute;
  },

  // Ratings
  submitRating: async (jobId: string, data: {
    ratedUser: string;
    rating: number;
    onTimeDelivery: boolean;
    cargoCondition: string;
    communication: number;
    comment?: string;
  }) => {
    const res = await apiRequest("POST", `/api/transport-jobs/${jobId}/ratings`, data);
    return await res.json() as TransportRating;
  },

  // Reliability
  getReliability: async (transporterId: string) => {
    const res = await apiRequest("GET", `/api/transporters/${transporterId}/reliability`);
    return await res.json() as TransporterReliability;
  },
};

export const transportSubscriptionsApi = {
  create: async (data: {
    transporterId: string;
    routeFrom: string;
    routeTo: string;
    frequency: string;
    vehicleType?: string;
    agreedRate: number;
    startDate: string;
    endDate?: string;
  }) => {
    const res = await apiRequest("POST", "/api/transport-subscriptions", data);
    return await res.json() as TransportSubscription;
  },

  getMy: async () => {
    const res = await apiRequest("GET", "/api/transport-subscriptions/my");
    return await res.json() as TransportSubscription[];
  },

  update: async (id: string, data: { status?: string; endDate?: string }) => {
    const res = await apiRequest("PATCH", `/api/transport-subscriptions/${id}`, data);
    return await res.json() as TransportSubscription;
  },
};

export const adminTransportApi = {
  getStats: async () => {
    const res = await apiRequest("GET", "/api/admin/transport-stats");
    return await res.json() as {
      totalJobs: number;
      activeJobs: number;
      completedJobs: number;
      totalDisputes: number;
      openDisputes: number;
      escrowBalance: number;
      avgDeliveryTime: number;
      reliableTransporters: number;
    };
  },
};

export const favouritesApi = {
  getAll: async () => {
    const res = await apiRequest("GET", "/api/favourites");
    return await res.json() as (User & { favouriteRole: string })[];
  },
  
  getTransporters: async () => {
    const res = await apiRequest("GET", "/api/favourites/transporters");
    return await res.json() as (User & { favouriteRole: string })[];
  },
  
  check: async (userId: string) => {
    const res = await apiRequest("GET", `/api/favourites/check/${userId}`);
    return await res.json() as { isFavourited: boolean };
  },
  
  add: async (userId: string) => {
    const res = await apiRequest("POST", `/api/favourites/${userId}`);
    return await res.json();
  },
  
  remove: async (userId: string) => {
    const res = await apiRequest("DELETE", `/api/favourites/${userId}`);
    return await res.json();
  },
};

export type TransportCostSplit = {
  id: string;
  orderId: string;
  jobId?: string;
  splitMode: string;
  buyerPercentage: number;
  farmerPercentage: number;
  totalTransportCost: number;
  buyerAmount: number;
  farmerAmount: number;
  buyerFunded: boolean;
  farmerFunded: boolean;
  buyerFundedAt?: string;
  farmerFundedAt?: string;
};

export const costSplitsApi = {
  getByOrder: async (orderId: string) => {
    const res = await apiRequest("GET", `/api/orders/${orderId}/cost-split`);
    return await res.json() as TransportCostSplit;
  },
  
  create: async (orderId: string, data: {
    splitMode: string;
    buyerPercentage: number;
    farmerPercentage: number;
    totalTransportCost: number;
  }) => {
    const res = await apiRequest("POST", `/api/orders/${orderId}/cost-split`, data);
    return await res.json() as TransportCostSplit;
  },
  
  fund: async (splitId: string) => {
    const res = await apiRequest("POST", `/api/cost-splits/${splitId}/fund`);
    return await res.json() as TransportCostSplit;
  },
  
  recalculate: async (splitId: string, newTotal: number) => {
    const res = await apiRequest("POST", `/api/cost-splits/${splitId}/recalculate`, { newTotal });
    return await res.json() as TransportCostSplit;
  },
};
