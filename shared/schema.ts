import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["farmer", "buyer", "transporter", "admin"]);
export const categoryEnum = pgEnum("category", ["produce", "livestock", "grains", "processed"]);
export const listingStatusEnum = pgEnum("listing_status", ["active", "sold", "expired", "pending"]);
export const bidStatusEnum = pgEnum("bid_status", ["pending", "accepted", "rejected", "expired"]);
export const transportStatusEnum = pgEnum("transport_status", ["pending", "in_transit", "delivered", "cancelled"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "paid", "processing", "shipped", "delivered", "completed", "disputed", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method", ["bank_transfer", "airtel_money", "mtn_money", "zamtel_money", "debit_card"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "processing", "completed", "failed", "refunded"]);
export const aiDecisionTypeEnum = pgEnum("ai_decision_type", ["delivery_verification", "chat_monitoring", "dispute_analysis", "trust_score_update", "price_suggestion"]);
export const aiDecisionResultEnum = pgEnum("ai_decision_result", ["auto_approved", "flagged_for_review", "rejected", "warning_issued", "action_taken"]);

// Quality Grading System Enums
export const gradeEnum = pgEnum("grade", ["A", "B", "C"]);
export const gradeCategoryEnum = pgEnum("grade_category", ["produce", "livestock"]);
export const gradeConfirmationEnum = pgEnum("grade_confirmation", ["matches", "lower", "rejected"]);
export const gradeDisputeStatusEnum = pgEnum("grade_dispute_status", ["pending", "under_review", "resolved_buyer", "resolved_seller", "resolved_partial", "closed"]);
export const mediaTypeEnum = pgEnum("media_type", ["photo", "video"]);
export const verificationStatusEnum = pgEnum("verification_status", ["pending", "verified", "failed"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("farmer"),
  location: text("location").notNull(),
  phone: text("phone"),
  email: text("email"),
  avatar: text("avatar"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  verified: boolean("verified").default(false).notNull(),
  trustScore: integer("trust_score").default(50).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
  bids: many(bids),
  reviewsGiven: many(reviews, { relationName: "reviewer" }),
  reviewsReceived: many(reviews, { relationName: "reviewee" }),
  transportRequests: many(transportRequests),
}));

export const listings = pgTable("listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: categoryEnum("category").notNull(),
  price: integer("price").notNull(),
  unit: text("unit").notNull().default("kg"),
  quantity: integer("quantity").notNull(),
  minOrder: integer("min_order").notNull(),
  location: text("location").notNull(),
  harvestDate: text("harvest_date").notNull(),
  organic: boolean("organic").default(false).notNull(),
  grade: gradeEnum("grade").default("B").notNull(),
  images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
  status: listingStatusEnum("status").notNull().default("active"),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  featured: boolean("featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const listingsRelations = relations(listings, ({ one, many }) => ({
  seller: one(users, {
    fields: [listings.sellerId],
    references: [users.id],
  }),
  bids: many(bids),
}));

export const bids = pgTable("bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  quantity: integer("quantity").notNull(),
  message: text("message"),
  status: bidStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bidsRelations = relations(bids, ({ one }) => ({
  listing: one(listings, {
    fields: [bids.listingId],
    references: [listings.id],
  }),
  buyer: one(users, {
    fields: [bids.buyerId],
    references: [users.id],
  }),
}));

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id),
  revieweeId: varchar("reviewee_id").notNull().references(() => users.id),
  listingId: varchar("listing_id").references(() => listings.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewsRelations = relations(reviews, ({ one }) => ({
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
    relationName: "reviewer",
  }),
  reviewee: one(users, {
    fields: [reviews.revieweeId],
    references: [users.id],
    relationName: "reviewee",
  }),
  listing: one(listings, {
    fields: [reviews.listingId],
    references: [listings.id],
  }),
}));

export const transportRequests = pgTable("transport_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").references(() => listings.id),
  requesterId: varchar("requester_id").notNull().references(() => users.id),
  transporterId: varchar("transporter_id").references(() => users.id),
  pickupLocation: text("pickup_location").notNull(),
  deliveryLocation: text("delivery_location").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  cargoType: text("cargo_type").notNull(),
  preferredDate: text("preferred_date").notNull(),
  estimatedDistance: integer("estimated_distance"),
  estimatedCost: integer("estimated_cost"),
  status: transportStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transportRequestsRelations = relations(transportRequests, ({ one }) => ({
  listing: one(listings, {
    fields: [transportRequests.listingId],
    references: [listings.id],
  }),
  requester: one(users, {
    fields: [transportRequests.requesterId],
    references: [users.id],
  }),
  transporter: one(users, {
    fields: [transportRequests.transporterId],
    references: [users.id],
  }),
}));

export const priceHistory = pgTable("price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commodity: text("commodity").notNull(),
  category: categoryEnum("category").notNull(),
  region: text("region").notNull(),
  price: integer("price").notNull(),
  unit: text("unit").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const notificationTypeEnum = pgEnum("notification_type", ["bid", "order", "review", "system", "forecast_response", "response_accepted"]);

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  listingId: varchar("listing_id").notNull().references(() => listings.id),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  listing: one(listings, {
    fields: [cartItems.listingId],
    references: [listings.id],
  }),
}));

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  subtotal: integer("subtotal").notNull(),
  serviceFee: integer("service_fee").notNull(),
  total: integer("total").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryPhone: text("delivery_phone").notNull(),
  notes: text("notes"),
  paidAt: timestamp("paid_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  completedAt: timestamp("completed_at"),
  disputeDeadline: timestamp("dispute_deadline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, {
    fields: [orders.buyerId],
    references: [users.id],
    relationName: "buyer",
  }),
  seller: one(users, {
    fields: [orders.sellerId],
    references: [users.id],
    relationName: "seller",
  }),
  items: many(orderItems),
  payment: one(payments),
}));

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  listingId: varchar("listing_id").notNull().references(() => listings.id),
  quantity: integer("quantity").notNull(),
  pricePerUnit: integer("price_per_unit").notNull(),
  total: integer("total").notNull(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  listing: one(listings, {
    fields: [orderItems.listingId],
    references: [listings.id],
  }),
}));

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("ZMW"),
  providerReference: text("provider_reference"),
  phoneNumber: text("phone_number"),
  accountNumber: text("account_number"),
  escrowReleased: boolean("escrow_released").default(false).notNull(),
  releasedAt: timestamp("released_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  rating: true,
  verified: true,
}).extend({
  password: z.string().min(6),
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sellerId: true,
  featured: true,
});

export const insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  createdAt: true,
  buyerId: true,
  status: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  reviewerId: true,
});

export const insertTransportRequestSchema = createInsertSchema(transportRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  requesterId: true,
  transporterId: true,
  status: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bids.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertTransportRequest = z.infer<typeof insertTransportRequestSchema>;
export type TransportRequest = typeof transportRequests.$inferSelect;

export type PriceHistory = typeof priceHistory.$inferSelect;

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  read: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
  shippedAt: true,
  deliveredAt: true,
  completedAt: true,
  disputeDeadline: true,
  status: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  providerReference: true,
  escrowReleased: true,
  releasedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Chat/Conversation tables for AI support
export const conversations = pgTable("conversations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

// AI Decision Logs for audit trail
export const aiDecisionLogs = pgTable("ai_decision_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  decisionType: aiDecisionTypeEnum("decision_type").notNull(),
  result: aiDecisionResultEnum("result").notNull(),
  userId: varchar("user_id").references(() => users.id),
  orderId: varchar("order_id").references(() => orders.id),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  reasoning: text("reasoning").notNull(),
  inputData: text("input_data"),
  adminOverride: boolean("admin_override").default(false).notNull(),
  adminOverrideBy: varchar("admin_override_by").references(() => users.id),
  adminOverrideReason: text("admin_override_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AIDecisionLog = typeof aiDecisionLogs.$inferSelect;

// Flagged Deliveries for admin review
export const flaggedDeliveries = pgTable("flagged_deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  aiDecisionId: varchar("ai_decision_id").notNull().references(() => aiDecisionLogs.id),
  reason: text("reason").notNull(),
  photoUrl: text("photo_url"),
  buyerLocation: text("buyer_location"),
  sellerLocation: text("seller_location"),
  resolved: boolean("resolved").default(false).notNull(),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export type FlaggedDelivery = typeof flaggedDeliveries.$inferSelect;

// Favorites for tracking user's favorite listings
export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  listingId: varchar("listing_id").notNull().references(() => listings.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  listing: one(listings, {
    fields: [favorites.listingId],
    references: [listings.id],
  }),
}));

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

// ==========================================
// SUBSCRIPTION & CONTRACT SYSTEM
// ==========================================

export const subscriptionFrequencyEnum = pgEnum("subscription_frequency", ["weekly", "biweekly", "monthly"]);
export const contractStatusEnum = pgEnum("contract_status", ["pending", "active", "paused", "completed", "breached", "cancelled"]);
export const contractPricingModelEnum = pgEnum("contract_pricing_model", ["fixed_price", "price_range", "volume_commitment"]);
export const escrowScheduleTypeEnum = pgEnum("escrow_schedule_type", ["pay_per_delivery", "weekly", "monthly"]);
export const deliveryConfirmationEnum = pgEnum("delivery_confirmation", ["delivered_as_agreed", "delivered_with_issues", "not_delivered"]);
export const sellerBadgeTypeEnum = pgEnum("seller_badge_type", ["trusted_supplier", "contracted_seller", "preferred_supplier"]);

// Subscriptions - buyer subscribes to seller
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  frequency: subscriptionFrequencyEnum("frequency").notNull(),
  durationWeeks: integer("duration_weeks").notNull(),
  status: contractStatusEnum("status").notNull().default("pending"),
  message: text("message"),
  sellerResponse: text("seller_response"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  buyer: one(users, {
    fields: [subscriptions.buyerId],
    references: [users.id],
    relationName: "subscriptionBuyer",
  }),
  seller: one(users, {
    fields: [subscriptions.sellerId],
    references: [users.id],
    relationName: "subscriptionSeller",
  }),
  items: many(subscriptionItems),
  contract: one(contracts),
}));

// Subscription items - products in a subscription
export const subscriptionItems = pgTable("subscription_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: varchar("subscription_id").notNull().references(() => subscriptions.id),
  listingId: varchar("listing_id").notNull().references(() => listings.id),
  quantityPerDelivery: integer("quantity_per_delivery").notNull(),
  pricePerUnit: integer("price_per_unit").notNull(),
});

export const subscriptionItemsRelations = relations(subscriptionItems, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionItems.subscriptionId],
    references: [subscriptions.id],
  }),
  listing: one(listings, {
    fields: [subscriptionItems.listingId],
    references: [listings.id],
  }),
}));

// Contracts - active supply agreements
export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: varchar("subscription_id").notNull().references(() => subscriptions.id),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  pricingModel: contractPricingModelEnum("pricing_model").notNull(),
  escrowScheduleType: escrowScheduleTypeEnum("escrow_schedule_type").notNull().default("pay_per_delivery"),
  frequency: subscriptionFrequencyEnum("frequency").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: contractStatusEnum("status").notNull().default("active"),
  totalValue: integer("total_value").notNull(),
  completedDeliveries: integer("completed_deliveries").default(0).notNull(),
  totalDeliveries: integer("total_deliveries").notNull(),
  autoReleaseHours: integer("auto_release_hours").default(48).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  subscription: one(subscriptions, {
    fields: [contracts.subscriptionId],
    references: [subscriptions.id],
  }),
  buyer: one(users, {
    fields: [contracts.buyerId],
    references: [users.id],
    relationName: "contractBuyer",
  }),
  seller: one(users, {
    fields: [contracts.sellerId],
    references: [users.id],
    relationName: "contractSeller",
  }),
  items: many(contractItems),
  recurringOrders: many(recurringOrders),
  escrowReserves: many(escrowReserves),
}));

// Contract items - products with pricing terms
export const contractItems = pgTable("contract_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
  listingId: varchar("listing_id").notNull().references(() => listings.id),
  productName: text("product_name").notNull(),
  quantityPerDelivery: integer("quantity_per_delivery").notNull(),
  unit: text("unit").notNull(),
  fixedPrice: integer("fixed_price"),
  minPrice: integer("min_price"),
  maxPrice: integer("max_price"),
  minVolume: integer("min_volume"),
  reservedQuantity: integer("reserved_quantity").default(0).notNull(),
});

export const contractItemsRelations = relations(contractItems, ({ one }) => ({
  contract: one(contracts, {
    fields: [contractItems.contractId],
    references: [contracts.id],
  }),
  listing: one(listings, {
    fields: [contractItems.listingId],
    references: [listings.id],
  }),
}));

// Recurring orders - scheduled deliveries from contracts
export const recurringOrders = pgTable("recurring_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
  orderId: varchar("order_id").references(() => orders.id),
  scheduledDate: timestamp("scheduled_date").notNull(),
  deliveryNumber: integer("delivery_number").notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  escrowFunded: boolean("escrow_funded").default(false).notNull(),
  escrowAmount: integer("escrow_amount").notNull(),
  deliveryConfirmation: deliveryConfirmationEnum("delivery_confirmation"),
  confirmationNotes: text("confirmation_notes"),
  confirmedAt: timestamp("confirmed_at"),
  autoReleasedAt: timestamp("auto_released_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const recurringOrdersRelations = relations(recurringOrders, ({ one }) => ({
  contract: one(contracts, {
    fields: [recurringOrders.contractId],
    references: [contracts.id],
  }),
  order: one(orders, {
    fields: [recurringOrders.orderId],
    references: [orders.id],
  }),
}));

// Escrow reserves - funds reserved for contract payments
export const escrowReserves = pgTable("escrow_reserves", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => contracts.id),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  fundedAt: timestamp("funded_at"),
  releasedAt: timestamp("released_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const escrowReservesRelations = relations(escrowReserves, ({ one }) => ({
  contract: one(contracts, {
    fields: [escrowReserves.contractId],
    references: [contracts.id],
  }),
  buyer: one(users, {
    fields: [escrowReserves.buyerId],
    references: [users.id],
  }),
}));

// Trust events - events affecting seller trust scores
export const trustEvents = pgTable("trust_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventType: text("event_type").notNull(),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(),
  contractId: varchar("contract_id").references(() => contracts.id),
  orderId: varchar("order_id").references(() => orders.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trustEventsRelations = relations(trustEvents, ({ one }) => ({
  user: one(users, {
    fields: [trustEvents.userId],
    references: [users.id],
  }),
  contract: one(contracts, {
    fields: [trustEvents.contractId],
    references: [contracts.id],
  }),
  order: one(orders, {
    fields: [trustEvents.orderId],
    references: [orders.id],
  }),
}));

// Seller badges - earned badges for trusted sellers
export const sellerBadges = pgTable("seller_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  badgeType: sellerBadgeTypeEnum("badge_type").notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  active: boolean("active").default(true).notNull(),
});

export const sellerBadgesRelations = relations(sellerBadges, ({ one }) => ({
  seller: one(users, {
    fields: [sellerBadges.sellerId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  sellerResponse: true,
  respondedAt: true,
});

export const insertSubscriptionItemSchema = createInsertSchema(subscriptionItems).omit({
  id: true,
  subscriptionId: true,
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedDeliveries: true,
});

export const insertContractItemSchema = createInsertSchema(contractItems).omit({
  id: true,
  contractId: true,
});

export const insertRecurringOrderSchema = createInsertSchema(recurringOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  orderId: true,
  deliveryConfirmation: true,
  confirmationNotes: true,
  confirmedAt: true,
  autoReleasedAt: true,
});

export const insertEscrowReserveSchema = createInsertSchema(escrowReserves).omit({
  id: true,
  createdAt: true,
  fundedAt: true,
  releasedAt: true,
});

export const insertTrustEventSchema = createInsertSchema(trustEvents).omit({
  id: true,
  createdAt: true,
});

export const insertSellerBadgeSchema = createInsertSchema(sellerBadges).omit({
  id: true,
  earnedAt: true,
});

// Types
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export type InsertSubscriptionItem = z.infer<typeof insertSubscriptionItemSchema>;
export type SubscriptionItem = typeof subscriptionItems.$inferSelect;

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

export type InsertContractItem = z.infer<typeof insertContractItemSchema>;
export type ContractItem = typeof contractItems.$inferSelect;

export type InsertRecurringOrder = z.infer<typeof insertRecurringOrderSchema>;
export type RecurringOrder = typeof recurringOrders.$inferSelect;

export type InsertEscrowReserve = z.infer<typeof insertEscrowReserveSchema>;
export type EscrowReserve = typeof escrowReserves.$inferSelect;

export type InsertTrustEvent = z.infer<typeof insertTrustEventSchema>;
export type TrustEvent = typeof trustEvents.$inferSelect;

export type InsertSellerBadge = z.infer<typeof insertSellerBadgeSchema>;
export type SellerBadge = typeof sellerBadges.$inferSelect;

// ============ CO-OP (GROUP SUPPLY) SYSTEM ============

// Enums for Co-Op
export const coopStatusEnum = pgEnum("coop_status", ["recruiting", "active", "fulfilled", "cancelled"]);
export const coopMemberStatusEnum = pgEnum("coop_member_status", ["pending", "confirmed", "ready", "delivered", "failed"]);
export const coopOrderStatusEnum = pgEnum("coop_order_status", ["pending", "escrow_funded", "in_progress", "delivered", "disputed", "completed", "cancelled"]);
export const coopDisputeStatusEnum = pgEnum("coop_dispute_status", ["open", "under_review", "resolved", "escalated"]);

// Co-Op - Main group supply listing
export const coops = pgTable("coops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leaderId: varchar("leader_id").notNull().references(() => users.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  productType: categoryEnum("product_type").notNull(),
  targetQuantity: decimal("target_quantity", { precision: 12, scale: 2 }).notNull(),
  currentQuantity: decimal("current_quantity", { precision: 12, scale: 2 }).default("0").notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  pricePerUnit: decimal("price_per_unit", { precision: 12, scale: 2 }).notNull(),
  minPricePerUnit: decimal("min_price_per_unit", { precision: 12, scale: 2 }),
  maxPricePerUnit: decimal("max_price_per_unit", { precision: 12, scale: 2 }),
  qualityGrade: varchar("quality_grade", { length: 50 }),
  deliveryDate: timestamp("delivery_date").notNull(),
  deliveryLocation: varchar("delivery_location", { length: 200 }),
  status: coopStatusEnum("status").default("recruiting").notNull(),
  images: text("images").array().default([]),
  minContribution: decimal("min_contribution", { precision: 12, scale: 2 }),
  maxContribution: decimal("max_contribution", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const coopsRelations = relations(coops, ({ one, many }) => ({
  leader: one(users, {
    fields: [coops.leaderId],
    references: [users.id],
  }),
  members: many(coopMembers),
  orders: many(coopOrders),
}));

// Co-Op Members - Sellers who join a co-op
export const coopMembers = pgTable("coop_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coopId: varchar("coop_id").notNull().references(() => coops.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  committedQuantity: decimal("committed_quantity", { precision: 12, scale: 2 }).notNull(),
  deliveredQuantity: decimal("delivered_quantity", { precision: 12, scale: 2 }).default("0"),
  availabilityStart: timestamp("availability_start"),
  availabilityEnd: timestamp("availability_end"),
  status: coopMemberStatusEnum("status").default("pending").notNull(),
  readyAt: timestamp("ready_at"),
  deliveredAt: timestamp("delivered_at"),
  notes: text("notes"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const coopMembersRelations = relations(coopMembers, ({ one }) => ({
  coop: one(coops, {
    fields: [coopMembers.coopId],
    references: [coops.id],
  }),
  seller: one(users, {
    fields: [coopMembers.sellerId],
    references: [users.id],
  }),
}));

// Co-Op Orders - Buyer purchases from co-ops
export const coopOrders = pgTable("coop_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coopId: varchar("coop_id").notNull().references(() => coops.id),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  escrowAmount: decimal("escrow_amount", { precision: 12, scale: 2 }).notNull(),
  escrowFunded: boolean("escrow_funded").default(false).notNull(),
  status: coopOrderStatusEnum("status").default("pending").notNull(),
  deliveryAddress: text("delivery_address"),
  deliveryConfirmedAt: timestamp("delivery_confirmed_at"),
  deliveryPhoto: varchar("delivery_photo"),
  buyerNotes: text("buyer_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const coopOrdersRelations = relations(coopOrders, ({ one, many }) => ({
  coop: one(coops, {
    fields: [coopOrders.coopId],
    references: [coops.id],
  }),
  buyer: one(users, {
    fields: [coopOrders.buyerId],
    references: [users.id],
  }),
  contributions: many(sellerContributions),
  payoutSplits: many(payoutSplits),
}));

// Seller Contributions - Individual seller contributions to an order
export const sellerContributions = pgTable("seller_contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coopOrderId: varchar("coop_order_id").notNull().references(() => coopOrders.id),
  memberId: varchar("member_id").notNull().references(() => coopMembers.id),
  expectedQuantity: decimal("expected_quantity", { precision: 12, scale: 2 }).notNull(),
  actualQuantity: decimal("actual_quantity", { precision: 12, scale: 2 }),
  qualityApproved: boolean("quality_approved"),
  status: coopMemberStatusEnum("status").default("pending").notNull(),
  verificationPhoto: varchar("verification_photo"),
  verifiedAt: timestamp("verified_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sellerContributionsRelations = relations(sellerContributions, ({ one }) => ({
  coopOrder: one(coopOrders, {
    fields: [sellerContributions.coopOrderId],
    references: [coopOrders.id],
  }),
  member: one(coopMembers, {
    fields: [sellerContributions.memberId],
    references: [coopMembers.id],
  }),
}));

// Payout Splits - How funds are distributed to sellers
export const payoutSplits = pgTable("payout_splits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coopOrderId: varchar("coop_order_id").notNull().references(() => coopOrders.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  contributionId: varchar("contribution_id").references(() => sellerContributions.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  paidAt: timestamp("paid_at"),
  adjustedBy: varchar("adjusted_by").references(() => users.id),
  adjustmentReason: text("adjustment_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payoutSplitsRelations = relations(payoutSplits, ({ one }) => ({
  coopOrder: one(coopOrders, {
    fields: [payoutSplits.coopOrderId],
    references: [coopOrders.id],
  }),
  seller: one(users, {
    fields: [payoutSplits.sellerId],
    references: [users.id],
  }),
  contribution: one(sellerContributions, {
    fields: [payoutSplits.contributionId],
    references: [sellerContributions.id],
  }),
}));

// Co-Op Disputes
export const coopDisputes = pgTable("coop_disputes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coopOrderId: varchar("coop_order_id").notNull().references(() => coopOrders.id),
  raisedBy: varchar("raised_by").notNull().references(() => users.id),
  againstSellerId: varchar("against_seller_id").references(() => users.id),
  reason: text("reason").notNull(),
  evidence: text("evidence").array().default([]),
  status: coopDisputeStatusEnum("status").default("open").notNull(),
  resolution: text("resolution"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const coopDisputesRelations = relations(coopDisputes, ({ one }) => ({
  coopOrder: one(coopOrders, {
    fields: [coopDisputes.coopOrderId],
    references: [coopOrders.id],
  }),
  raiser: one(users, {
    fields: [coopDisputes.raisedBy],
    references: [users.id],
  }),
  againstSeller: one(users, {
    fields: [coopDisputes.againstSellerId],
    references: [users.id],
  }),
}));

// Insert schemas for Co-Op
export const insertCoopSchema = createInsertSchema(coops).omit({
  id: true,
  currentQuantity: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCoopMemberSchema = createInsertSchema(coopMembers).omit({
  id: true,
  deliveredQuantity: true,
  status: true,
  readyAt: true,
  deliveredAt: true,
  joinedAt: true,
});

export const insertCoopOrderSchema = createInsertSchema(coopOrders).omit({
  id: true,
  escrowFunded: true,
  status: true,
  deliveryConfirmedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSellerContributionSchema = createInsertSchema(sellerContributions).omit({
  id: true,
  actualQuantity: true,
  qualityApproved: true,
  status: true,
  verifiedAt: true,
  createdAt: true,
});

export const insertPayoutSplitSchema = createInsertSchema(payoutSplits).omit({
  id: true,
  status: true,
  paidAt: true,
  createdAt: true,
});

export const insertCoopDisputeSchema = createInsertSchema(coopDisputes).omit({
  id: true,
  status: true,
  resolution: true,
  resolvedBy: true,
  resolvedAt: true,
  createdAt: true,
});

// Types for Co-Op
export type InsertCoop = z.infer<typeof insertCoopSchema>;
export type Coop = typeof coops.$inferSelect;

export type InsertCoopMember = z.infer<typeof insertCoopMemberSchema>;
export type CoopMember = typeof coopMembers.$inferSelect;

export type InsertCoopOrder = z.infer<typeof insertCoopOrderSchema>;
export type CoopOrder = typeof coopOrders.$inferSelect;

export type InsertSellerContribution = z.infer<typeof insertSellerContributionSchema>;
export type SellerContribution = typeof sellerContributions.$inferSelect;

export type InsertPayoutSplit = z.infer<typeof insertPayoutSplitSchema>;
export type PayoutSplit = typeof payoutSplits.$inferSelect;

export type InsertCoopDispute = z.infer<typeof insertCoopDisputeSchema>;
export type CoopDispute = typeof coopDisputes.$inferSelect;

// ============ REAL-TIME CHAT SYSTEM (Buyer-Seller) ============

export const userChats = pgTable("user_chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participant1Id: varchar("participant1_id").notNull().references(() => users.id),
  participant2Id: varchar("participant2_id").notNull().references(() => users.id),
  listingId: varchar("listing_id").references(() => listings.id),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userChatsRelations = relations(userChats, ({ one, many }) => ({
  participant1: one(users, {
    fields: [userChats.participant1Id],
    references: [users.id],
    relationName: "chatParticipant1",
  }),
  participant2: one(users, {
    fields: [userChats.participant2Id],
    references: [users.id],
    relationName: "chatParticipant2",
  }),
  listing: one(listings, {
    fields: [userChats.listingId],
    references: [listings.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull().references(() => userChats.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  chat: one(userChats, {
    fields: [chatMessages.chatId],
    references: [userChats.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

// Insert schemas for Chat
export const insertUserChatSchema = createInsertSchema(userChats).omit({
  id: true,
  lastMessageAt: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  read: true,
  createdAt: true,
});

// Types for Chat
export type InsertUserChat = z.infer<typeof insertUserChatSchema>;
export type UserChat = typeof userChats.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// ============ QUALITY GRADING & VERIFICATION SYSTEM ============

// Grade Definitions - Standard grades for produce and livestock
export const gradeDefinitions = pgTable("grade_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: gradeCategoryEnum("category").notNull(),
  grade: gradeEnum("grade").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  criteria: text("criteria").array().notNull().default(sql`ARRAY[]::text[]`),
  suitableFor: text("suitable_for").array().notNull().default(sql`ARRAY[]::text[]`),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Media Evidence - Photos and videos for verification
export const mediaEvidence = pgTable("media_evidence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  listingId: varchar("listing_id").references(() => listings.id),
  coopOrderId: varchar("coop_order_id"),
  uploaderId: varchar("uploader_id").notNull().references(() => users.id),
  mediaType: mediaTypeEnum("media_type").notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  geoLatitude: decimal("geo_latitude", { precision: 10, scale: 8 }),
  geoLongitude: decimal("geo_longitude", { precision: 11, scale: 8 }),
  capturedAt: timestamp("captured_at").notNull(),
  purpose: varchar("purpose", { length: 50 }).notNull(), // listing, delivery, dispute
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mediaEvidenceRelations = relations(mediaEvidence, ({ one }) => ({
  order: one(orders, {
    fields: [mediaEvidence.orderId],
    references: [orders.id],
  }),
  listing: one(listings, {
    fields: [mediaEvidence.listingId],
    references: [listings.id],
  }),
  uploader: one(users, {
    fields: [mediaEvidence.uploaderId],
    references: [users.id],
  }),
}));

// Delivery Grades - Grade confirmation on delivery
export const deliveryGrades = pgTable("delivery_grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  expectedGrade: gradeEnum("expected_grade").notNull(),
  buyerConfirmation: gradeConfirmationEnum("buyer_confirmation"),
  buyerReportedGrade: gradeEnum("buyer_reported_grade"),
  buyerComment: text("buyer_comment"),
  sellerDeclaredGrade: gradeEnum("seller_declared_grade").notNull(),
  finalGrade: gradeEnum("final_grade"),
  verifiedBy: varchar("verified_by").references(() => users.id),
  verificationBadge: boolean("verification_badge").default(false),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const deliveryGradesRelations = relations(deliveryGrades, ({ one }) => ({
  order: one(orders, {
    fields: [deliveryGrades.orderId],
    references: [orders.id],
  }),
  verifier: one(users, {
    fields: [deliveryGrades.verifiedBy],
    references: [users.id],
  }),
}));

// Grade Disputes - Disputes specifically about grade mismatches
export const gradeDisputes = pgTable("grade_disputes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deliveryGradeId: varchar("delivery_grade_id").notNull().references(() => deliveryGrades.id),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  claimedGrade: gradeEnum("claimed_grade").notNull(),
  actualGrade: gradeEnum("actual_grade").notNull(),
  buyerReason: text("buyer_reason").notNull(),
  sellerResponse: text("seller_response"),
  status: gradeDisputeStatusEnum("status").default("pending").notNull(),
  resolution: text("resolution"),
  refundAmount: decimal("refund_amount", { precision: 12, scale: 2 }),
  refundPercentage: decimal("refund_percentage", { precision: 5, scale: 2 }),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  autoResolveAt: timestamp("auto_resolve_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gradeDisputesRelations = relations(gradeDisputes, ({ one }) => ({
  deliveryGrade: one(deliveryGrades, {
    fields: [gradeDisputes.deliveryGradeId],
    references: [deliveryGrades.id],
  }),
  order: one(orders, {
    fields: [gradeDisputes.orderId],
    references: [orders.id],
  }),
  buyer: one(users, {
    fields: [gradeDisputes.buyerId],
    references: [users.id],
  }),
  seller: one(users, {
    fields: [gradeDisputes.sellerId],
    references: [users.id],
  }),
  resolver: one(users, {
    fields: [gradeDisputes.resolvedBy],
    references: [users.id],
  }),
}));

// Verification Records - Platform verification for bulk/contract orders
export const verificationRecords = pgTable("verification_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  coopOrderId: varchar("coop_order_id"),
  contractId: varchar("contract_id"),
  verifierId: varchar("verifier_id").notNull().references(() => users.id),
  verifierType: varchar("verifier_type", { length: 50 }).notNull(), // admin, inspector, partner, agent
  verifiedGrade: gradeEnum("verified_grade").notNull(),
  status: verificationStatusEnum("status").default("pending").notNull(),
  notes: text("notes"),
  badgeIssued: boolean("badge_issued").default(false),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const verificationRecordsRelations = relations(verificationRecords, ({ one }) => ({
  order: one(orders, {
    fields: [verificationRecords.orderId],
    references: [orders.id],
  }),
  verifier: one(users, {
    fields: [verificationRecords.verifierId],
    references: [users.id],
  }),
}));

// Seller Trust Metrics - Track seller quality performance
export const sellerTrustMetrics = pgTable("seller_trust_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => users.id).unique(),
  totalDeliveries: integer("total_deliveries").default(0).notNull(),
  gradeMatchCount: integer("grade_match_count").default(0).notNull(),
  gradeLowerCount: integer("grade_lower_count").default(0).notNull(),
  gradeRejectedCount: integer("grade_rejected_count").default(0).notNull(),
  disputeCount: integer("dispute_count").default(0).notNull(),
  disputesWon: integer("disputes_won").default(0).notNull(),
  disputesLost: integer("disputes_lost").default(0).notNull(),
  gradeAccuracyRate: decimal("grade_accuracy_rate", { precision: 5, scale: 2 }).default("100"),
  deliveryConsistencyRate: decimal("delivery_consistency_rate", { precision: 5, scale: 2 }).default("100"),
  trustScore: integer("trust_score").default(50).notNull(),
  isContractEligible: boolean("is_contract_eligible").default(true).notNull(),
  isSubscriptionVisible: boolean("is_subscription_visible").default(true).notNull(),
  lastWarningAt: timestamp("last_warning_at"),
  suspendedUntil: timestamp("suspended_until"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sellerTrustMetricsRelations = relations(sellerTrustMetrics, ({ one }) => ({
  seller: one(users, {
    fields: [sellerTrustMetrics.sellerId],
    references: [users.id],
  }),
}));

// Admin Grade Settings - Configurable grading rules
export const adminGradeSettings = pgTable("admin_grade_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: varchar("setting_key", { length: 100 }).notNull().unique(),
  settingValue: text("setting_value").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert Schemas for Quality Grading
export const insertGradeDefinitionSchema = createInsertSchema(gradeDefinitions).omit({
  id: true,
  createdAt: true,
});

export const insertMediaEvidenceSchema = createInsertSchema(mediaEvidence).omit({
  id: true,
  createdAt: true,
});

export const insertDeliveryGradeSchema = createInsertSchema(deliveryGrades).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGradeDisputeSchema = createInsertSchema(gradeDisputes).omit({
  id: true,
  createdAt: true,
});

export const insertVerificationRecordSchema = createInsertSchema(verificationRecords).omit({
  id: true,
  createdAt: true,
});

export const insertSellerTrustMetricsSchema = createInsertSchema(sellerTrustMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminGradeSettingSchema = createInsertSchema(adminGradeSettings).omit({
  id: true,
  updatedAt: true,
});

// Types for Quality Grading
export type InsertGradeDefinition = z.infer<typeof insertGradeDefinitionSchema>;
export type GradeDefinition = typeof gradeDefinitions.$inferSelect;

export type InsertMediaEvidence = z.infer<typeof insertMediaEvidenceSchema>;
export type MediaEvidence = typeof mediaEvidence.$inferSelect;

export type InsertDeliveryGrade = z.infer<typeof insertDeliveryGradeSchema>;
export type DeliveryGrade = typeof deliveryGrades.$inferSelect;

export type InsertGradeDispute = z.infer<typeof insertGradeDisputeSchema>;
export type GradeDispute = typeof gradeDisputes.$inferSelect;

export type InsertVerificationRecord = z.infer<typeof insertVerificationRecordSchema>;
export type VerificationRecord = typeof verificationRecords.$inferSelect;

export type InsertSellerTrustMetrics = z.infer<typeof insertSellerTrustMetricsSchema>;
export type SellerTrustMetrics = typeof sellerTrustMetrics.$inferSelect;

export type InsertAdminGradeSetting = z.infer<typeof insertAdminGradeSettingSchema>;
export type AdminGradeSetting = typeof adminGradeSettings.$inferSelect;

// Demand Forecasting Enums
export const forecastFrequencyEnum = pgEnum("forecast_frequency", ["weekly", "monthly", "one_off"]);
export const forecastStatusEnum = pgEnum("forecast_status", ["active", "fulfilled", "expired", "cancelled"]);
export const forecastResponseStatusEnum = pgEnum("forecast_response_status", ["pending", "accepted", "rejected", "converted"]);
export const forecastConversionTypeEnum = pgEnum("forecast_conversion_type", ["subscription", "contract", "coop", "order"]);

// Demand Forecasts - Created by buyers to declare future demand
export const demandForecasts = pgTable("demand_forecasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  productName: text("product_name").notNull(),
  category: categoryEnum("category").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull().default("kg"),
  frequency: forecastFrequencyEnum("frequency").notNull().default("one_off"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  preferredGrade: gradeEnum("preferred_grade").default("B"),
  targetPrice: integer("target_price"),
  location: text("location").notNull(),
  notes: text("notes"),
  status: forecastStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const demandForecastsRelations = relations(demandForecasts, ({ one, many }) => ({
  buyer: one(users, {
    fields: [demandForecasts.buyerId],
    references: [users.id],
  }),
  responses: many(forecastResponses),
  conversions: many(forecastConversions),
}));

// Forecast Responses - Sellers expressing interest in a forecast
export const forecastResponses = pgTable("forecast_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  forecastId: varchar("forecast_id").notNull().references(() => demandForecasts.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  indicativeQuantity: integer("indicative_quantity").notNull(),
  proposedPrice: integer("proposed_price").notNull(),
  message: text("message"),
  status: forecastResponseStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const forecastResponsesRelations = relations(forecastResponses, ({ one }) => ({
  forecast: one(demandForecasts, {
    fields: [forecastResponses.forecastId],
    references: [demandForecasts.id],
  }),
  seller: one(users, {
    fields: [forecastResponses.sellerId],
    references: [users.id],
  }),
}));

// Forecast Conversions - Track when forecasts are converted to orders/contracts/subscriptions
export const forecastConversions = pgTable("forecast_conversions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  forecastId: varchar("forecast_id").notNull().references(() => demandForecasts.id),
  responseId: varchar("response_id").references(() => forecastResponses.id),
  conversionType: forecastConversionTypeEnum("conversion_type").notNull(),
  referenceId: varchar("reference_id").notNull(),
  convertedQuantity: integer("converted_quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const forecastConversionsRelations = relations(forecastConversions, ({ one }) => ({
  forecast: one(demandForecasts, {
    fields: [forecastConversions.forecastId],
    references: [demandForecasts.id],
  }),
  response: one(forecastResponses, {
    fields: [forecastConversions.responseId],
    references: [forecastResponses.id],
  }),
}));

// Insert Schemas for Demand Forecasting
export const insertDemandForecastSchema = createInsertSchema(demandForecasts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertForecastResponseSchema = createInsertSchema(forecastResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertForecastConversionSchema = createInsertSchema(forecastConversions).omit({
  id: true,
  createdAt: true,
});

// Types for Demand Forecasting
export type InsertDemandForecast = z.infer<typeof insertDemandForecastSchema>;
export type DemandForecast = typeof demandForecasts.$inferSelect;

export type InsertForecastResponse = z.infer<typeof insertForecastResponseSchema>;
export type ForecastResponse = typeof forecastResponses.$inferSelect;

export type InsertForecastConversion = z.infer<typeof insertForecastConversionSchema>;
export type ForecastConversion = typeof forecastConversions.$inferSelect;

// =====================================
// TRANSPORT SYSTEM - Enhanced Transport Management
// =====================================

// Transport Job Status Enum
export const transportJobStatusEnum = pgEnum("transport_job_status", [
  "open",           // Job created, waiting for transporter
  "assigned",       // Transporter assigned, pending pickup
  "pickup_pending", // Awaiting pickup
  "pickup_verified",// Pickup proof uploaded
  "in_transit",     // Goods in transit
  "delivered",      // Delivery proof uploaded
  "completed",      // Payment released, job done
  "disputed",       // Under dispute
  "cancelled"       // Cancelled
]);

// Transport Offer Status Enum
export const transportOfferStatusEnum = pgEnum("transport_offer_status", [
  "pending",   // Offer submitted
  "accepted",  // Offer accepted by buyer/seller
  "rejected",  // Offer rejected
  "withdrawn", // Transporter withdrew offer
  "expired"    // Offer expired
]);

// Transport Proof Type Enum
export const transportProofTypeEnum = pgEnum("transport_proof_type", [
  "pickup",   // Proof of pickup
  "delivery"  // Proof of delivery
]);

// Transport Dispute Status Enum
export const transportDisputeStatusEnum = pgEnum("transport_dispute_status", [
  "open",            // Dispute opened
  "under_review",    // Admin reviewing
  "resolved_transporter", // Resolved in transporter's favor
  "resolved_buyer",       // Resolved in buyer's favor
  "resolved_seller",      // Resolved in seller's favor
  "resolved_partial",     // Partial resolution
  "closed"                // Dispute closed
]);

// Transport Dispute Reason Enum
export const transportDisputeReasonEnum = pgEnum("transport_dispute_reason", [
  "late_delivery",
  "missing_proof",
  "damaged_goods",
  "no_show",
  "wrong_quantity",
  "wrong_location",
  "vehicle_breakdown",
  "other"
]);

// Transport Subscription Frequency Enum
export const transportSubscriptionFrequencyEnum = pgEnum("transport_subscription_frequency", [
  "weekly",
  "biweekly",
  "monthly"
]);

// Transport Escrow Status Enum
export const transportEscrowStatusEnum = pgEnum("transport_escrow_status", [
  "pending",     // Payment pending
  "held",        // Payment held in escrow
  "released",    // Payment released to transporter
  "refunded",    // Payment refunded
  "disputed"     // Payment under dispute
]);

// Transport Jobs - Core transport job linked to orders
export const transportJobs = pgTable("transport_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  
  // Parties involved
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  transporterId: varchar("transporter_id").references(() => users.id),
  
  // Locations
  pickupLocation: text("pickup_location").notNull(),
  pickupAddress: text("pickup_address"),
  deliveryLocation: text("delivery_location").notNull(),
  deliveryAddress: text("delivery_address"),
  
  // Cargo details
  productType: text("product_type").notNull(),
  productDescription: text("product_description"),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull().default("kg"),
  weight: integer("weight"), // in kg
  
  // Delivery window
  pickupDate: text("pickup_date").notNull(),
  deliveryDeadline: text("delivery_deadline").notNull(),
  
  // Pricing
  suggestedPrice: integer("suggested_price").notNull(),
  agreedPrice: integer("agreed_price"),
  
  // Distance and routing
  estimatedDistance: integer("estimated_distance"), // in km
  vehicleType: text("vehicle_type"),
  
  // Status tracking
  status: transportJobStatusEnum("status").notNull().default("open"),
  
  // Timestamps
  assignedAt: timestamp("assigned_at"),
  pickedUpAt: timestamp("picked_up_at"),
  deliveredAt: timestamp("delivered_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transportJobsRelations = relations(transportJobs, ({ one, many }) => ({
  order: one(orders, {
    fields: [transportJobs.orderId],
    references: [orders.id],
  }),
  buyer: one(users, {
    fields: [transportJobs.buyerId],
    references: [users.id],
    relationName: "jobBuyer",
  }),
  seller: one(users, {
    fields: [transportJobs.sellerId],
    references: [users.id],
    relationName: "jobSeller",
  }),
  transporter: one(users, {
    fields: [transportJobs.transporterId],
    references: [users.id],
    relationName: "jobTransporter",
  }),
  offers: many(transportOffers),
  proofs: many(transportProofs),
  escrow: one(transportEscrows),
  disputes: many(transportDisputes),
}));

// Transport Offers - Transporter bids/counter-offers on jobs
export const transportOffers = pgTable("transport_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => transportJobs.id),
  transporterId: varchar("transporter_id").notNull().references(() => users.id),
  
  offeredPrice: integer("offered_price").notNull(),
  message: text("message"),
  estimatedPickupTime: text("estimated_pickup_time"),
  vehicleType: text("vehicle_type"),
  
  status: transportOfferStatusEnum("status").notNull().default("pending"),
  
  respondedBy: varchar("responded_by").references(() => users.id),
  respondedAt: timestamp("responded_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const transportOffersRelations = relations(transportOffers, ({ one }) => ({
  job: one(transportJobs, {
    fields: [transportOffers.jobId],
    references: [transportJobs.id],
  }),
  transporter: one(users, {
    fields: [transportOffers.transporterId],
    references: [users.id],
  }),
  responder: one(users, {
    fields: [transportOffers.respondedBy],
    references: [users.id],
  }),
}));

// Transport Proofs - Pickup and delivery evidence
export const transportProofs = pgTable("transport_proofs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => transportJobs.id),
  transporterId: varchar("transporter_id").notNull().references(() => users.id),
  
  proofType: transportProofTypeEnum("proof_type").notNull(),
  
  // Evidence
  photos: text("photos").array().notNull().default(sql`ARRAY[]::text[]`),
  gpsLatitude: decimal("gps_latitude", { precision: 10, scale: 8 }),
  gpsLongitude: decimal("gps_longitude", { precision: 11, scale: 8 }),
  gpsAddress: text("gps_address"),
  
  // Signature
  signature: text("signature"), // Base64 encoded signature image
  signedBy: text("signed_by"),
  
  // Condition notes
  conditionNotes: text("condition_notes"),
  damageReported: boolean("damage_reported").default(false).notNull(),
  damageDescription: text("damage_description"),
  damagePhotos: text("damage_photos").array().default(sql`ARRAY[]::text[]`),
  
  // Verification
  verified: boolean("verified").default(false).notNull(),
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transportProofsRelations = relations(transportProofs, ({ one }) => ({
  job: one(transportJobs, {
    fields: [transportProofs.jobId],
    references: [transportJobs.id],
  }),
  transporter: one(users, {
    fields: [transportProofs.transporterId],
    references: [users.id],
  }),
  verifier: one(users, {
    fields: [transportProofs.verifiedBy],
    references: [users.id],
  }),
}));

// Transport Escrow - Payment holding for transport jobs
export const transportEscrows = pgTable("transport_escrows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => transportJobs.id),
  
  amount: integer("amount").notNull(),
  status: transportEscrowStatusEnum("status").notNull().default("pending"),
  
  // Payment tracking
  paidBy: varchar("paid_by").references(() => users.id),
  paidAt: timestamp("paid_at"),
  
  releasedTo: varchar("released_to").references(() => users.id),
  releasedAt: timestamp("released_at"),
  releaseReason: text("release_reason"),
  
  refundedTo: varchar("refunded_to").references(() => users.id),
  refundedAt: timestamp("refunded_at"),
  refundReason: text("refund_reason"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transportEscrowsRelations = relations(transportEscrows, ({ one }) => ({
  job: one(transportJobs, {
    fields: [transportEscrows.jobId],
    references: [transportJobs.id],
  }),
  payer: one(users, {
    fields: [transportEscrows.paidBy],
    references: [users.id],
  }),
}));

// Transport Disputes - Dispute handling
export const transportDisputes = pgTable("transport_disputes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => transportJobs.id),
  
  raisedBy: varchar("raised_by").notNull().references(() => users.id),
  againstUserId: varchar("against_user_id").notNull().references(() => users.id),
  
  reason: transportDisputeReasonEnum("reason").notNull(),
  description: text("description").notNull(),
  evidence: text("evidence").array().default(sql`ARRAY[]::text[]`),
  
  status: transportDisputeStatusEnum("status").notNull().default("open"),
  
  // Resolution
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolution: text("resolution"),
  penaltyAmount: integer("penalty_amount"),
  penaltyAppliedTo: varchar("penalty_applied_to").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const transportDisputesRelations = relations(transportDisputes, ({ one }) => ({
  job: one(transportJobs, {
    fields: [transportDisputes.jobId],
    references: [transportJobs.id],
  }),
  raiser: one(users, {
    fields: [transportDisputes.raisedBy],
    references: [users.id],
    relationName: "disputeRaiser",
  }),
  against: one(users, {
    fields: [transportDisputes.againstUserId],
    references: [users.id],
    relationName: "disputeAgainst",
  }),
  resolver: one(users, {
    fields: [transportDisputes.resolvedBy],
    references: [users.id],
  }),
}));

// Transport Ratings - Post-delivery ratings
export const transportRatings = pgTable("transport_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => transportJobs.id),
  transporterId: varchar("transporter_id").notNull().references(() => users.id),
  ratedBy: varchar("rated_by").notNull().references(() => users.id),
  
  rating: integer("rating").notNull(), // 1-5
  onTimeDelivery: boolean("on_time_delivery"),
  goodCondition: boolean("good_condition"),
  professionalService: boolean("professional_service"),
  
  comment: text("comment"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transportRatingsRelations = relations(transportRatings, ({ one }) => ({
  job: one(transportJobs, {
    fields: [transportRatings.jobId],
    references: [transportJobs.id],
  }),
  transporter: one(users, {
    fields: [transportRatings.transporterId],
    references: [users.id],
    relationName: "ratingTransporter",
  }),
  rater: one(users, {
    fields: [transportRatings.ratedBy],
    references: [users.id],
    relationName: "ratingRater",
  }),
}));

// Transporter Reliability - Aggregate reliability metrics
export const transporterReliability = pgTable("transporter_reliability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transporterId: varchar("transporter_id").notNull().references(() => users.id).unique(),
  
  // Job counts
  totalJobs: integer("total_jobs").default(0).notNull(),
  completedJobs: integer("completed_jobs").default(0).notNull(),
  cancelledJobs: integer("cancelled_jobs").default(0).notNull(),
  
  // Performance metrics
  onTimeDeliveryRate: decimal("on_time_delivery_rate", { precision: 5, scale: 2 }).default("0"),
  damageRate: decimal("damage_rate", { precision: 5, scale: 2 }).default("0"),
  disputeRate: decimal("dispute_rate", { precision: 5, scale: 2 }).default("0"),
  
  // Ratings
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  totalRatings: integer("total_ratings").default(0).notNull(),
  
  // Reliability score (0-100)
  reliabilityScore: integer("reliability_score").default(50).notNull(),
  
  // Eligibility
  subscriptionEligible: boolean("subscription_eligible").default(false).notNull(),
  temporaryBan: boolean("temporary_ban").default(false).notNull(),
  banUntil: timestamp("ban_until"),
  banReason: text("ban_reason"),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transporterReliabilityRelations = relations(transporterReliability, ({ one }) => ({
  transporter: one(users, {
    fields: [transporterReliability.transporterId],
    references: [users.id],
  }),
}));

// Transport Subscriptions - Repeat route contracts
export const transportSubscriptions = pgTable("transport_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Parties
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  sellerId: varchar("seller_id").references(() => users.id),
  transporterId: varchar("transporter_id").notNull().references(() => users.id),
  
  // Route details
  pickupLocation: text("pickup_location").notNull(),
  deliveryLocation: text("delivery_location").notNull(),
  
  // Schedule
  frequency: transportSubscriptionFrequencyEnum("frequency").notNull(),
  dayOfWeek: integer("day_of_week"), // 0-6 for weekly
  dayOfMonth: integer("day_of_month"), // 1-31 for monthly
  preferredTime: text("preferred_time"),
  
  // Cargo
  productType: text("product_type").notNull(),
  estimatedQuantity: integer("estimated_quantity"),
  unit: text("unit").default("kg"),
  
  // Pricing
  agreedPrice: integer("agreed_price").notNull(),
  
  // Duration
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  
  // Status
  active: boolean("active").default(true).notNull(),
  totalDeliveries: integer("total_deliveries").default(0).notNull(),
  nextScheduledDate: text("next_scheduled_date"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transportSubscriptionsRelations = relations(transportSubscriptions, ({ one }) => ({
  buyer: one(users, {
    fields: [transportSubscriptions.buyerId],
    references: [users.id],
    relationName: "subscriptionBuyer",
  }),
  seller: one(users, {
    fields: [transportSubscriptions.sellerId],
    references: [users.id],
    relationName: "subscriptionSeller",
  }),
  transporter: one(users, {
    fields: [transportSubscriptions.transporterId],
    references: [users.id],
    relationName: "subscriptionTransporter",
  }),
}));

// =====================================
// TRANSPORT SYSTEM - Insert Schemas
// =====================================

export const insertTransportJobSchema = createInsertSchema(transportJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  assignedAt: true,
  pickedUpAt: true,
  deliveredAt: true,
  completedAt: true,
});

export const insertTransportOfferSchema = createInsertSchema(transportOffers).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

export const insertTransportProofSchema = createInsertSchema(transportProofs).omit({
  id: true,
  createdAt: true,
  verified: true,
  verifiedBy: true,
  verifiedAt: true,
});

export const insertTransportEscrowSchema = createInsertSchema(transportEscrows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransportDisputeSchema = createInsertSchema(transportDisputes).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
  resolvedBy: true,
  resolution: true,
  penaltyAmount: true,
  penaltyAppliedTo: true,
});

export const insertTransportRatingSchema = createInsertSchema(transportRatings).omit({
  id: true,
  createdAt: true,
});

export const insertTransporterReliabilitySchema = createInsertSchema(transporterReliability).omit({
  id: true,
  updatedAt: true,
});

export const insertTransportSubscriptionSchema = createInsertSchema(transportSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalDeliveries: true,
});

// =====================================
// TRANSPORT SYSTEM - Types
// =====================================

export type InsertTransportJob = z.infer<typeof insertTransportJobSchema>;
export type TransportJob = typeof transportJobs.$inferSelect;

export type InsertTransportOffer = z.infer<typeof insertTransportOfferSchema>;
export type TransportOffer = typeof transportOffers.$inferSelect;

export type InsertTransportProof = z.infer<typeof insertTransportProofSchema>;
export type TransportProof = typeof transportProofs.$inferSelect;

export type InsertTransportEscrow = z.infer<typeof insertTransportEscrowSchema>;
export type TransportEscrow = typeof transportEscrows.$inferSelect;

export type InsertTransportDispute = z.infer<typeof insertTransportDisputeSchema>;
export type TransportDispute = typeof transportDisputes.$inferSelect;

export type InsertTransportRating = z.infer<typeof insertTransportRatingSchema>;
export type TransportRating = typeof transportRatings.$inferSelect;

export type InsertTransporterReliability = z.infer<typeof insertTransporterReliabilitySchema>;
export type TransporterReliability = typeof transporterReliability.$inferSelect;

export type InsertTransportSubscription = z.infer<typeof insertTransportSubscriptionSchema>;
export type TransportSubscription = typeof transportSubscriptions.$inferSelect;

// =====================================
// USER FAVOURITES SYSTEM
// =====================================

export const userFavourites = pgTable("user_favourites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  favouriteUserId: varchar("favourite_user_id").notNull().references(() => users.id),
  favouriteRole: userRoleEnum("favourite_role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userFavouritesRelations = relations(userFavourites, ({ one }) => ({
  user: one(users, {
    fields: [userFavourites.userId],
    references: [users.id],
    relationName: "favouriteOwner",
  }),
  favouriteUser: one(users, {
    fields: [userFavourites.favouriteUserId],
    references: [users.id],
    relationName: "favouritedUser",
  }),
}));

export const insertUserFavouriteSchema = createInsertSchema(userFavourites).omit({
  id: true,
  createdAt: true,
});

export type InsertUserFavourite = z.infer<typeof insertUserFavouriteSchema>;
export type UserFavourite = typeof userFavourites.$inferSelect;

// =====================================
// TRANSPORT COST SPLITTING
// =====================================

export const costSplitModeEnum = pgEnum("cost_split_mode", ["buyer_100", "farmer_100", "custom_split"]);

export const transportCostSplits = pgTable("transport_cost_splits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  jobId: varchar("job_id").references(() => transportJobs.id),
  
  // Split mode and percentages
  splitMode: costSplitModeEnum("split_mode").notNull().default("buyer_100"),
  buyerPercentage: integer("buyer_percentage").notNull().default(100),
  farmerPercentage: integer("farmer_percentage").notNull().default(0),
  
  // Calculated amounts (locked when order is placed)
  totalTransportCost: integer("total_transport_cost").notNull(),
  buyerAmount: integer("buyer_amount").notNull(),
  farmerAmount: integer("farmer_amount").notNull(),
  
  // Escrow tracking
  buyerFunded: boolean("buyer_funded").default(false).notNull(),
  farmerFunded: boolean("farmer_funded").default(false).notNull(),
  buyerFundedAt: timestamp("buyer_funded_at"),
  farmerFundedAt: timestamp("farmer_funded_at"),
  
  // Status
  lockedAt: timestamp("locked_at"),
  releasedAt: timestamp("released_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transportCostSplitsRelations = relations(transportCostSplits, ({ one }) => ({
  order: one(orders, {
    fields: [transportCostSplits.orderId],
    references: [orders.id],
  }),
  job: one(transportJobs, {
    fields: [transportCostSplits.jobId],
    references: [transportJobs.id],
  }),
}));

export const insertTransportCostSplitSchema = createInsertSchema(transportCostSplits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lockedAt: true,
  releasedAt: true,
  buyerFundedAt: true,
  farmerFundedAt: true,
});

export type InsertTransportCostSplit = z.infer<typeof insertTransportCostSplitSchema>;
export type TransportCostSplit = typeof transportCostSplits.$inferSelect;

// =====================================
// SUBSCRIPTION TIERS
// =====================================

export const subscriptionTierEnum = pgEnum("subscription_tier", ["starter", "growth", "pro", "enterprise"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "inactive", "trial", "expired"]);

export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tier: subscriptionTierEnum("tier").notNull().default("starter"),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
}));

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;

// =====================================
// MARKET INSIGHTS SYSTEM
// =====================================

export const insightTypeEnum = pgEnum("insight_type", [
  "price_trend", "supply_demand", "buy_signal", "sell_signal", "hold_signal",
  "volatility_alert", "opportunity", "risk_alert", "route_demand", 
  "route_profitability", "transport_peak", "contract_timing", "action_recommendation"
]);

export const insightCategoryEnum = pgEnum("insight_category", [
  "produce", "livestock", "grains", "processed", "transport", "contracts", "general"
]);

export const insightConfidenceEnum = pgEnum("insight_confidence", ["low", "medium", "high"]);
export const requiredTierEnum = pgEnum("required_tier", ["starter", "growth", "pro", "enterprise"]);

export const marketInsights = pgTable("market_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Targeting
  targetRole: userRoleEnum("target_role"), // null = all roles
  targetUserId: varchar("target_user_id").references(() => users.id), // null = all users of role
  
  // Insight content
  type: insightTypeEnum("type").notNull(),
  category: insightCategoryEnum("category").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  explanation: text("explanation").notNull(), // "Why this insight?"
  
  // Confidence and tier
  confidence: insightConfidenceEnum("confidence").notNull().default("medium"),
  requiredTier: requiredTierEnum("required_tier").notNull().default("starter"),
  
  // Data points
  dataPoints: jsonb("data_points"), // Flexible JSON for charts, values, etc.
  relatedProductId: varchar("related_product_id"),
  relatedLocation: text("related_location"),
  
  // Urgency and impact
  urgencyScore: integer("urgency_score").default(50), // 0-100
  financialImpact: text("financial_impact"), // Description of potential impact
  
  // Action
  actionLabel: text("action_label"), // "Buy Now", "Wait", "Lock Contract"
  actionType: text("action_type"), // buy, sell, hold, prepare, engage
  
  // Validity
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const marketInsightsRelations = relations(marketInsights, ({ one }) => ({
  targetUser: one(users, {
    fields: [marketInsights.targetUserId],
    references: [users.id],
  }),
}));

export const insertMarketInsightSchema = createInsertSchema(marketInsights).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMarketInsight = z.infer<typeof insertMarketInsightSchema>;
export type MarketInsight = typeof marketInsights.$inferSelect;

// =====================================
// PLATFORM FEES SYSTEM
// =====================================

export const feeTypeEnum = pgEnum("fee_type", ["transaction", "transport", "contract"]);
export const feeRoleEnum = pgEnum("fee_role", ["buyer", "farmer", "transporter"]);

// Platform configuration for fees (admin-configurable)
export const platformConfig = pgTable("platform_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Fee records for auditing
export const fees = pgTable("fees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id"), // order_id or transport_job_id
  transactionType: feeTypeEnum("transaction_type").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: feeRoleEnum("role").notNull(),
  subscriptionTier: varchar("subscription_tier", { length: 50 }).notNull(),
  
  // Fee calculation details
  basePercentage: decimal("base_percentage", { precision: 5, scale: 2 }).notNull(),
  effectivePercentage: decimal("effective_percentage", { precision: 5, scale: 2 }).notNull(),
  transactionAmount: integer("transaction_amount").notNull(), // in smallest currency unit
  feeAmount: integer("fee_amount").notNull(), // in smallest currency unit
  
  // Contract reference (for contract-based reduced fees)
  contractId: varchar("contract_id"),
  isContractFee: boolean("is_contract_fee").default(false),
  
  // Status
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, applied, refunded
  appliedAt: timestamp("applied_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feesRelations = relations(fees, ({ one }) => ({
  user: one(users, {
    fields: [fees.userId],
    references: [users.id],
  }),
}));

export const insertFeeSchema = createInsertSchema(fees).omit({
  id: true,
  createdAt: true,
});

export type InsertFee = z.infer<typeof insertFeeSchema>;
export type Fee = typeof fees.$inferSelect;

export const insertPlatformConfigSchema = createInsertSchema(platformConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPlatformConfig = z.infer<typeof insertPlatformConfigSchema>;
export type PlatformConfig = typeof platformConfig.$inferSelect;
