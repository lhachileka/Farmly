import OpenAI from "openai";
import { db } from "./db";
import { 
  users, 
  orders, 
  aiDecisionLogs, 
  flaggedDeliveries,
  priceHistory,
  type User,
  type Order,
  type AIDecisionLog
} from "@shared/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

type AIDecisionType = "delivery_verification" | "chat_monitoring" | "dispute_analysis" | "trust_score_update" | "price_suggestion";
type AIDecisionResult = "auto_approved" | "flagged_for_review" | "rejected" | "warning_issued" | "action_taken";

interface DeliveryVerificationInput {
  orderId: string;
  photoUrl?: string;
  buyerLocation?: string;
  sellerLocation?: string;
  timestamp: Date;
  buyerTrustScore: number;
  sellerTrustScore: number;
}

interface DeliveryVerificationResult {
  result: "auto_approved" | "flagged_for_review" | "rejected";
  confidence: number;
  reasoning: string;
  flags: string[];
}

interface ChatMonitoringResult {
  containsOffPlatformAttempt: boolean;
  sanitizedMessage: string;
  detectedPatterns: string[];
  warningLevel: "none" | "warning" | "restriction";
  reasoning: string;
}

interface DisputeAnalysisResult {
  summary: string;
  recommendedOutcome: "buyer_refund" | "seller_payout" | "partial_refund" | "escalate_to_admin";
  confidence: number;
  reasoning: string;
  evidenceAnalysis: string;
}

interface PriceSuggestion {
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  marketTrend: "rising" | "stable" | "falling";
  reasoning: string;
  demandLevel: "high" | "medium" | "low";
}

async function logAIDecision(
  decisionType: AIDecisionType,
  result: AIDecisionResult,
  reasoning: string,
  confidence?: number,
  userId?: string,
  orderId?: string,
  inputData?: string
): Promise<AIDecisionLog> {
  const [log] = await db.insert(aiDecisionLogs).values({
    decisionType,
    result,
    reasoning,
    confidence: confidence?.toString(),
    userId,
    orderId,
    inputData,
  }).returning();
  return log;
}

export const aiService = {
  async verifyDelivery(input: DeliveryVerificationInput): Promise<DeliveryVerificationResult> {
    const prompt = `You are an AI delivery verification system for a farmer-to-buyer agricultural marketplace in Zambia called Farmly.

Analyze this delivery confirmation and determine if it should be auto-approved, flagged for review, or rejected.

Order ID: ${input.orderId}
Delivery Photo URL: ${input.photoUrl || "No photo provided"}
Buyer Location: ${input.buyerLocation || "Unknown"}
Seller Location: ${input.sellerLocation || "Unknown"}
Timestamp: ${input.timestamp.toISOString()}
Buyer Trust Score: ${input.buyerTrustScore}/100
Seller Trust Score: ${input.sellerTrustScore}/100

Verification Criteria:
1. If no photo is provided for high-value orders, flag for review
2. If trust scores are below 30, apply extra scrutiny
3. If locations are very far apart (suggesting location spoofing), flag
4. Check for timing consistency (delivery within reasonable timeframe)

Respond in JSON format:
{
  "result": "auto_approved" | "flagged_for_review" | "rejected",
  "confidence": 0-100,
  "reasoning": "brief explanation",
  "flags": ["list", "of", "concerns"]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content) as DeliveryVerificationResult;

      await logAIDecision(
        "delivery_verification",
        parsed.result,
        parsed.reasoning,
        parsed.confidence,
        undefined,
        input.orderId,
        JSON.stringify(input)
      );

      if (parsed.result === "flagged_for_review") {
        const [decision] = await db.select().from(aiDecisionLogs)
          .where(eq(aiDecisionLogs.orderId, input.orderId))
          .orderBy(desc(aiDecisionLogs.createdAt))
          .limit(1);

        if (decision) {
          await db.insert(flaggedDeliveries).values({
            orderId: input.orderId,
            aiDecisionId: decision.id,
            reason: parsed.reasoning,
            photoUrl: input.photoUrl,
            buyerLocation: input.buyerLocation,
            sellerLocation: input.sellerLocation,
          });
        }
      }

      return parsed;
    } catch (error) {
      console.error("AI delivery verification error:", error);
      return {
        result: "flagged_for_review",
        confidence: 0,
        reasoning: "AI verification failed, manual review required",
        flags: ["ai_error"],
      };
    }
  },

  async monitorChat(message: string, userId: string): Promise<ChatMonitoringResult> {
    const prompt = `You are an AI chat monitoring system for Farmly, a farmer-to-buyer marketplace.

Analyze this chat message for attempts to take transactions off-platform:

Message: "${message}"

Detect:
1. Phone numbers (Zambian format: +260, 097x, 096x, 095x, 077x, 076x, 075x)
2. WhatsApp/phone references
3. Email addresses
4. Social media handles
5. Phrases suggesting off-platform contact ("call me", "text me", "WhatsApp me", etc.)

If detected, provide a sanitized version with the sensitive info masked with [REDACTED].

Respond in JSON:
{
  "containsOffPlatformAttempt": boolean,
  "sanitizedMessage": "message with sensitive info masked",
  "detectedPatterns": ["list of what was detected"],
  "warningLevel": "none" | "warning" | "restriction",
  "reasoning": "brief explanation"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 400,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content) as ChatMonitoringResult;

      if (parsed.containsOffPlatformAttempt) {
        await logAIDecision(
          "chat_monitoring",
          parsed.warningLevel === "restriction" ? "action_taken" : "warning_issued",
          parsed.reasoning,
          undefined,
          userId,
          undefined,
          message
        );
      }

      return parsed;
    } catch (error) {
      console.error("AI chat monitoring error:", error);
      return {
        containsOffPlatformAttempt: false,
        sanitizedMessage: message,
        detectedPatterns: [],
        warningLevel: "none",
        reasoning: "AI monitoring unavailable",
      };
    }
  },

  async analyzeDispute(
    orderId: string,
    buyerClaim: string,
    sellerClaim: string,
    deliveryPhotoUrl?: string,
    orderDetails?: Partial<Order>
  ): Promise<DisputeAnalysisResult> {
    const prompt = `You are an AI dispute resolution assistant for Farmly agricultural marketplace.

Analyze this dispute and provide a recommendation:

Order ID: ${orderId}
Order Value: ${orderDetails?.total ? `K${(orderDetails.total / 100).toFixed(2)}` : "Unknown"}
Order Status: ${orderDetails?.status || "Unknown"}

BUYER'S CLAIM:
${buyerClaim}

SELLER'S CLAIM:
${sellerClaim}

Delivery Photo: ${deliveryPhotoUrl || "Not provided"}

Analyze the evidence and recommend an outcome. Consider:
1. Who has stronger evidence?
2. Are the claims consistent with typical dispute patterns?
3. What is fair for both parties?

Respond in JSON:
{
  "summary": "brief dispute summary",
  "recommendedOutcome": "buyer_refund" | "seller_payout" | "partial_refund" | "escalate_to_admin",
  "confidence": 0-100,
  "reasoning": "detailed reasoning",
  "evidenceAnalysis": "analysis of provided evidence"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 600,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content) as DisputeAnalysisResult;

      await logAIDecision(
        "dispute_analysis",
        parsed.recommendedOutcome === "escalate_to_admin" ? "flagged_for_review" : "auto_approved",
        parsed.reasoning,
        parsed.confidence,
        undefined,
        orderId,
        JSON.stringify({ buyerClaim, sellerClaim })
      );

      return parsed;
    } catch (error) {
      console.error("AI dispute analysis error:", error);
      return {
        summary: "Unable to analyze dispute automatically",
        recommendedOutcome: "escalate_to_admin",
        confidence: 0,
        reasoning: "AI analysis failed, manual review required",
        evidenceAnalysis: "Unable to analyze evidence",
      };
    }
  },

  async calculateTrustScore(userId: string): Promise<number> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return 50;

    const buyerOrders = await db.select().from(orders).where(eq(orders.buyerId, userId));
    const sellerOrders = await db.select().from(orders).where(eq(orders.sellerId, userId));
    const allOrders = [...buyerOrders, ...sellerOrders];

    const completedOrders = allOrders.filter(o => o.status === "completed").length;
    const disputedOrders = allOrders.filter(o => o.status === "disputed").length;
    const totalOrders = allOrders.length;

    if (totalOrders === 0) return 50;

    let score = 50;
    score += Math.min(completedOrders * 2, 30);
    score -= disputedOrders * 10;
    if (user.verified) score += 10;
    score = Math.max(0, Math.min(100, score));

    await db.update(users).set({ trustScore: score }).where(eq(users.id, userId));

    await logAIDecision(
      "trust_score_update",
      "action_taken",
      `Trust score updated to ${score}. Completed: ${completedOrders}, Disputed: ${disputedOrders}`,
      undefined,
      userId
    );

    return score;
  },

  async getPriceSuggestion(
    commodity: string,
    category: string,
    location: string
  ): Promise<PriceSuggestion> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historicalPrices = await db.select().from(priceHistory)
      .where(and(
        eq(priceHistory.commodity, commodity),
        gte(priceHistory.recordedAt, thirtyDaysAgo)
      ))
      .orderBy(desc(priceHistory.recordedAt))
      .limit(30);

    const prompt = `You are an AI pricing assistant for Farmly, a Zambian agricultural marketplace.

Suggest a price for this product:

Product: ${commodity}
Category: ${category}
Location: ${location}

Historical price data (last 30 days):
${historicalPrices.length > 0 
  ? historicalPrices.map(p => `${p.recordedAt.toLocaleDateString()}: K${p.price} per ${p.unit}`).join('\n')
  : "No historical data available"
}

Consider:
1. Seasonal factors (current month in Zambia)
2. Regional price variations
3. Supply and demand patterns for ${category}
4. Current market conditions

Respond in JSON (prices in Zambian Kwacha - ZMW):
{
  "suggestedPrice": number,
  "priceRange": { "min": number, "max": number },
  "marketTrend": "rising" | "stable" | "falling",
  "reasoning": "brief explanation",
  "demandLevel": "high" | "medium" | "low"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 400,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content) as PriceSuggestion;

      await logAIDecision(
        "price_suggestion",
        "auto_approved",
        parsed.reasoning,
        undefined,
        undefined,
        undefined,
        JSON.stringify({ commodity, category, location })
      );

      return parsed;
    } catch (error) {
      console.error("AI price suggestion error:", error);
      const avgPrice = historicalPrices.length > 0
        ? historicalPrices.reduce((sum, p) => sum + p.price, 0) / historicalPrices.length
        : 100;
      
      return {
        suggestedPrice: Math.round(avgPrice),
        priceRange: { min: Math.round(avgPrice * 0.8), max: Math.round(avgPrice * 1.2) },
        marketTrend: "stable",
        reasoning: "Based on historical average (AI unavailable)",
        demandLevel: "medium",
      };
    }
  },

  async getSupportResponse(userQuery: string, context?: string): Promise<string> {
    const prompt = `You are a helpful AI support assistant for Farmly, a farmer-to-buyer agricultural marketplace in Zambia.

Help the user with their question. Be concise, friendly, and mobile-friendly (short paragraphs).

Common topics you can help with:
- Escrow payments (how they work, when funds are released)
- Delivery process (how to confirm delivery, what to do if there's an issue)
- Disputes (how to file, what happens next)
- Trust scores (what they mean, how to improve)
- Platform fees (2.5% service fee on transactions)

${context ? `Context: ${context}` : ""}

User Question: ${userQuery}

Provide a helpful, clear response. If the question requires admin intervention, explain what to do. Keep responses under 200 words.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
      });

      return response.choices[0]?.message?.content || "I'm sorry, I couldn't process your request. Please contact support for assistance.";
    } catch (error) {
      console.error("AI support error:", error);
      return "I'm having trouble connecting right now. For immediate help, please contact our support team through the dashboard.";
    }
  },

  async getFlaggedDeliveries(): Promise<typeof flaggedDeliveries.$inferSelect[]> {
    return await db.select().from(flaggedDeliveries)
      .where(eq(flaggedDeliveries.resolved, false))
      .orderBy(desc(flaggedDeliveries.createdAt));
  },

  async resolveFlaggedDelivery(
    id: string,
    resolvedBy: string,
    resolution: string
  ): Promise<void> {
    await db.update(flaggedDeliveries).set({
      resolved: true,
      resolvedBy,
      resolution,
      resolvedAt: new Date(),
    }).where(eq(flaggedDeliveries.id, id));
  },

  async getAIDecisionLogs(limit = 50): Promise<AIDecisionLog[]> {
    return await db.select().from(aiDecisionLogs)
      .orderBy(desc(aiDecisionLogs.createdAt))
      .limit(limit);
  },

  async overrideAIDecision(
    decisionId: string,
    adminId: string,
    reason: string
  ): Promise<void> {
    await db.update(aiDecisionLogs).set({
      adminOverride: true,
      adminOverrideBy: adminId,
      adminOverrideReason: reason,
    }).where(eq(aiDecisionLogs.id, decisionId));
  },
};

export default aiService;
