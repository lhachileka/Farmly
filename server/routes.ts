import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService } from "./ai-service";
import { 
  insertUserSchema, 
  insertListingSchema,
  insertBidSchema,
  insertReviewSchema,
  insertTransportRequestSchema,
  insertOrderSchema,
  insertPaymentSchema,
  insertDemandForecastSchema,
  insertForecastResponseSchema,
  insertForecastConversionSchema,
  insertTransportJobSchema
} from "@shared/schema";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Auth middleware - defined at the top so it's available for all routes
  const requireAuth = async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    next();
  };

  // Admin middleware
  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  };
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(validatedData.username);
      
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const user = await storage.createUser(validatedData);
      const { password, ...userWithoutPassword } = user;
      
      if (req.session) {
        req.session.userId = user.id;
      }
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      if (req.session) {
        req.session.userId = user.id;
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    if (req.session) {
      req.session.destroy(() => {
        res.json({ success: true });
      });
    } else {
      res.json({ success: true });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.get("/api/listings", async (req, res) => {
    try {
      const { category, location, sellerId } = req.query;
      const listings = await storage.getListings({
        category: category as string,
        location: location as string,
        sellerId: sellerId as string,
      });
      res.json(listings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  app.get("/api/listings/:id", async (req, res) => {
    try {
      const listing = await storage.getListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }
      
      const seller = await storage.getUser(listing.sellerId);
      if (!seller) {
        return res.status(404).json({ error: "Seller not found" });
      }
      
      const { password, ...sellerWithoutPassword } = seller;
      res.json({ ...listing, seller: sellerWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch listing" });
    }
  });

  app.post("/api/listings", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const validatedData = insertListingSchema.parse(req.body);
      const listing = await storage.createListing(validatedData, req.session.userId);
      
      // Notify users who have favorited other listings from this seller
      const seller = await storage.getUser(req.session.userId);
      if (seller) {
        const userIds = await storage.getUsersWhoFavoritedSeller(req.session.userId);
        for (const userId of userIds) {
          if (userId !== req.session.userId) {
            await storage.createNotification({
              userId,
              type: "system",
              title: "New Listing from Favorite Seller",
              message: `${seller.name} just listed new ${listing.category}: ${listing.title} at K${listing.price}/${listing.unit}`,
              link: `/product/${listing.id}`,
            });
          }
        }
      }
      
      res.status(201).json(listing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create listing" });
    }
  });

  app.patch("/api/listings/:id", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const listing = await storage.getListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }
      
      if (listing.sellerId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const oldPrice = listing.price;
      const updated = await storage.updateListing(req.params.id, req.body);
      
      // Check for price drop and notify users who favorited this listing
      if (req.body.price && req.body.price < oldPrice) {
        const userIds = await storage.getUsersWhoFavorited(req.params.id);
        const priceDropPercent = Math.round(((oldPrice - req.body.price) / oldPrice) * 100);
        
        for (const userId of userIds) {
          await storage.createNotification({
            userId,
            type: "system",
            title: "Price Drop Alert!",
            message: `${listing.title} price dropped by ${priceDropPercent}%! Now K${req.body.price}/${listing.unit} (was K${oldPrice})`,
            link: `/product/${listing.id}`,
          });
        }
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update listing" });
    }
  });

  app.delete("/api/listings/:id", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const listing = await storage.getListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }
      
      if (listing.sellerId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      await storage.deleteListing(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete listing" });
    }
  });

  app.get("/api/listings/:id/bids", async (req, res) => {
    try {
      const bids = await storage.getBidsForListing(req.params.id);
      res.json(bids);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bids" });
    }
  });

  app.post("/api/bids", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const validatedData = insertBidSchema.parse(req.body);
      const bid = await storage.createBid(validatedData, req.session.userId);
      res.status(201).json(bid);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create bid" });
    }
  });

  app.patch("/api/bids/:id/status", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { status } = req.body;
      if (status !== "accepted" && status !== "rejected") {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const updated = await storage.updateBidStatus(req.params.id, status);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update bid" });
    }
  });

  app.get("/api/users/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviewsForUser(req.params.id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // Get seller badges
  app.get("/api/users/:id/badges", async (req, res) => {
    try {
      const badges = await storage.getSellerBadges(req.params.id);
      res.json(badges);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const validatedData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(validatedData, req.session.userId);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  app.get("/api/transport", async (req, res) => {
    try {
      const { requesterId, transporterId } = req.query;
      const requests = await storage.getTransportRequests({
        requesterId: requesterId as string,
        transporterId: transporterId as string,
      });
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transport requests" });
    }
  });

  app.post("/api/transport", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const validatedData = insertTransportRequestSchema.parse(req.body);
      const request = await storage.createTransportRequest(validatedData, req.session.userId);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create transport request" });
    }
  });

  app.patch("/api/transport/:id/status", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { status, transporterId } = req.body;
      const updated = await storage.updateTransportStatus(req.params.id, status, transporterId);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update transport status" });
    }
  });

  // =====================================
  // TRANSPORT JOBS - Enhanced Transport System
  // =====================================

  // Get available transport jobs (for transporters)
  app.get("/api/transport-jobs", async (req, res) => {
    try {
      const { location, productType, pickupDateFrom, pickupDateTo } = req.query;
      const jobs = await storage.getAvailableTransportJobs({
        location: location as string,
        productType: productType as string,
        pickupDateFrom: pickupDateFrom as string,
        pickupDateTo: pickupDateTo as string,
      });
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transport jobs" });
    }
  });

  // Get transport jobs for current user
  app.get("/api/transport-jobs/my", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const role = user.role as 'buyer' | 'seller' | 'transporter';
      const jobs = await storage.getTransportJobsForUser(userId!, role);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transport jobs" });
    }
  });

  // Get single transport job with details
  app.get("/api/transport-jobs/:id", async (req, res) => {
    try {
      const job = await storage.getTransportJobWithDetails(req.params.id);
      if (!job) return res.status(404).json({ error: "Job not found" });
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transport job" });
    }
  });

  // Create transport job (usually automatic from order)
  app.post("/api/transport-jobs", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const validatedData = insertTransportJobSchema.parse(req.body);
      const job = await storage.createTransportJob(validatedData);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create transport job" });
    }
  });

  // Update transport job status
  app.patch("/api/transport-jobs/:id/status", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      const job = await storage.getTransportJob(req.params.id);
      if (!job) return res.status(404).json({ error: "Job not found" });
      
      const updated = await storage.updateTransportJob(req.params.id, { status });
      
      // Create notification for status changes
      if (job.transporterId && status === 'completed') {
        await storage.createNotification({
          userId: job.buyerId,
          type: 'order',
          title: 'Delivery Complete',
          message: `Your delivery for ${job.productType} has been completed`,
          link: `/transport-jobs/${job.id}`
        });
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update job status" });
    }
  });

  // =====================================
  // TRANSPORT OFFERS
  // =====================================

  // Get offers for a job
  app.get("/api/transport-jobs/:id/offers", async (req, res) => {
    try {
      const offers = await storage.getTransportOffersForJob(req.params.id);
      res.json(offers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  // Create transport offer (transporter bids on job)
  app.post("/api/transport-jobs/:id/offers", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      if (!user || user.role !== 'transporter') {
        return res.status(403).json({ error: "Only transporters can make offers" });
      }
      
      // Check if transporter is banned
      const reliability = await storage.getTransporterReliability(userId!);
      if (reliability?.temporaryBan && reliability.banUntil && new Date(reliability.banUntil) > new Date()) {
        return res.status(403).json({ error: "You are temporarily banned from making offers" });
      }
      
      const job = await storage.getTransportJob(req.params.id);
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (job.status !== 'open') {
        return res.status(400).json({ error: "Job is no longer accepting offers" });
      }
      
      const offer = await storage.createTransportOffer({
        jobId: req.params.id,
        transporterId: userId!,
        offeredPrice: req.body.offeredPrice,
        message: req.body.message,
        estimatedPickupTime: req.body.estimatedPickupTime,
        vehicleType: req.body.vehicleType,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
      
      // Notify job owner
      await storage.createNotification({
        userId: job.buyerId,
        type: 'order',
        title: 'New Transport Offer',
        message: `${user.name} offered K${req.body.offeredPrice} for your transport job`,
        link: `/transport-jobs/${job.id}`
      });
      
      res.status(201).json(offer);
    } catch (error) {
      res.status(500).json({ error: "Failed to create offer" });
    }
  });

  // Accept transport offer
  app.post("/api/transport-offers/:id/accept", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const { offer, job } = await storage.acceptTransportOffer(req.params.id, userId!);
      
      // Create transport escrow
      await storage.createTransportEscrow({
        jobId: job.id,
        amount: offer.offeredPrice,
        status: 'pending',
        paidBy: job.buyerId
      });
      
      // Notify the transporter
      await storage.createNotification({
        userId: offer.transporterId,
        type: 'order',
        title: 'Offer Accepted!',
        message: `Your offer for the transport job has been accepted. Prepare for pickup on ${job.pickupDate}.`,
        link: `/transport-jobs/${job.id}`
      });
      
      res.json({ offer, job });
    } catch (error) {
      res.status(500).json({ error: "Failed to accept offer" });
    }
  });

  // Reject transport offer
  app.post("/api/transport-offers/:id/reject", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const offer = await storage.updateTransportOffer(req.params.id, {
        status: 'rejected',
        respondedBy: userId,
        respondedAt: new Date()
      });
      
      await storage.createNotification({
        userId: offer.transporterId,
        type: 'order',
        title: 'Offer Declined',
        message: 'Your transport offer was not accepted.',
        link: `/transport-jobs`
      });
      
      res.json(offer);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject offer" });
    }
  });

  // =====================================
  // TRANSPORT PROOFS
  // =====================================

  // Upload proof of pickup or delivery
  app.post("/api/transport-jobs/:id/proofs", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const job = await storage.getTransportJob(req.params.id);
      
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (job.transporterId !== userId) {
        return res.status(403).json({ error: "Only the assigned transporter can upload proofs" });
      }
      
      const proof = await storage.createTransportProof({
        jobId: req.params.id,
        transporterId: userId!,
        proofType: req.body.proofType,
        photos: req.body.photos || [],
        gpsLatitude: req.body.gpsLatitude,
        gpsLongitude: req.body.gpsLongitude,
        gpsAddress: req.body.gpsAddress,
        signature: req.body.signature,
        signedBy: req.body.signedBy,
        conditionNotes: req.body.conditionNotes,
        damageReported: req.body.damageReported || false,
        damageDescription: req.body.damageDescription,
        damagePhotos: req.body.damagePhotos || []
      });
      
      // Update job status based on proof type
      if (req.body.proofType === 'pickup') {
        await storage.updateTransportJob(req.params.id, { 
          status: 'pickup_verified',
          pickedUpAt: new Date()
        });
        
        await storage.createNotification({
          userId: job.buyerId,
          type: 'order',
          title: 'Pickup Confirmed',
          message: `Your order has been picked up and is on its way!`,
          link: `/transport-jobs/${job.id}`
        });
      } else if (req.body.proofType === 'delivery') {
        await storage.updateTransportJob(req.params.id, { 
          status: 'delivered',
          deliveredAt: new Date()
        });
        
        await storage.createNotification({
          userId: job.buyerId,
          type: 'order',
          title: 'Delivery Complete',
          message: `Your order has been delivered! Please confirm receipt.`,
          link: `/transport-jobs/${job.id}`
        });
      }
      
      res.status(201).json(proof);
    } catch (error) {
      res.status(500).json({ error: "Failed to upload proof" });
    }
  });

  // Get proofs for a job
  app.get("/api/transport-jobs/:id/proofs", async (req, res) => {
    try {
      const proofs = await storage.getTransportProofsForJob(req.params.id);
      res.json(proofs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch proofs" });
    }
  });

  // Verify proof (buyer confirms delivery)
  app.post("/api/transport-proofs/:id/verify", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const proof = await storage.verifyTransportProof(req.params.id, userId!);
      
      // If delivery proof is verified, release escrow and complete job
      if (proof.proofType === 'delivery') {
        const job = await storage.getTransportJob(proof.jobId);
        if (job) {
          await storage.releaseTransportEscrow(job.id, job.transporterId!, 'Delivery confirmed by buyer');
          await storage.updateTransportJob(job.id, { 
            status: 'completed',
            completedAt: new Date()
          });
          
          // Update transporter reliability
          await storage.updateTransporterReliability(job.transporterId!);
          
          await storage.createNotification({
            userId: job.transporterId!,
            type: 'order',
            title: 'Payment Released!',
            message: `Payment of K${job.agreedPrice} has been released for your delivery.`,
            link: `/transport-jobs/${job.id}`
          });
        }
      }
      
      res.json(proof);
    } catch (error) {
      res.status(500).json({ error: "Failed to verify proof" });
    }
  });

  // =====================================
  // TRANSPORT ESCROW
  // =====================================

  // Fund transport escrow
  app.post("/api/transport-jobs/:id/escrow/fund", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const job = await storage.getTransportJob(req.params.id);
      if (!job) return res.status(404).json({ error: "Job not found" });
      
      const escrow = await storage.updateTransportEscrow(req.params.id, {
        status: 'held',
        paidBy: userId,
        paidAt: new Date()
      });
      
      res.json(escrow);
    } catch (error) {
      res.status(500).json({ error: "Failed to fund escrow" });
    }
  });

  // Get transport escrow status
  app.get("/api/transport-jobs/:id/escrow", async (req, res) => {
    try {
      const escrow = await storage.getTransportEscrow(req.params.id);
      res.json(escrow || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch escrow" });
    }
  });

  // =====================================
  // TRANSPORT DISPUTES
  // =====================================

  // Create dispute
  app.post("/api/transport-jobs/:id/disputes", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const job = await storage.getTransportJob(req.params.id);
      if (!job) return res.status(404).json({ error: "Job not found" });
      
      const dispute = await storage.createTransportDispute({
        jobId: req.params.id,
        raisedBy: userId!,
        againstUserId: req.body.againstUserId,
        reason: req.body.reason,
        description: req.body.description,
        evidence: req.body.evidence || [],
        status: 'open'
      });
      
      // Update job status
      await storage.updateTransportJob(req.params.id, { status: 'disputed' });
      
      // Update escrow status
      await storage.updateTransportEscrow(req.params.id, { status: 'disputed' });
      
      // Notify admin
      const admins = await storage.getAllUsers();
      for (const admin of admins.filter(u => u.role === 'admin')) {
        await storage.createNotification({
          userId: admin.id,
          type: 'system',
          title: 'New Transport Dispute',
          message: `A dispute has been raised for transport job ${job.id}`,
          link: `/admin/transport-disputes/${dispute.id}`
        });
      }
      
      res.status(201).json(dispute);
    } catch (error) {
      res.status(500).json({ error: "Failed to create dispute" });
    }
  });

  // Get disputes for a job
  app.get("/api/transport-jobs/:id/disputes", async (req, res) => {
    try {
      const disputes = await storage.getTransportDisputesForJob(req.params.id);
      res.json(disputes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch disputes" });
    }
  });

  // Admin: Resolve dispute
  app.post("/api/transport-disputes/:id/resolve", requireAdmin, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const { resolution, status, penaltyAmount, penaltyAppliedTo } = req.body;
      
      const dispute = await storage.resolveTransportDispute(
        req.params.id,
        userId!,
        resolution,
        status,
        penaltyAmount,
        penaltyAppliedTo
      );
      
      // Apply penalty if applicable
      if (penaltyAmount && penaltyAppliedTo) {
        await storage.createTrustEvent({
          userId: penaltyAppliedTo,
          eventType: 'dispute_penalty',
          reason: `Penalty applied: K${penaltyAmount} - ${resolution}`,
          delta: -10,
        });
      }
      
      res.json(dispute);
    } catch (error) {
      res.status(500).json({ error: "Failed to resolve dispute" });
    }
  });

  // =====================================
  // TRANSPORT RATINGS
  // =====================================

  // Rate a transporter
  app.post("/api/transport-jobs/:id/ratings", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const job = await storage.getTransportJob(req.params.id);
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (job.status !== 'completed') {
        return res.status(400).json({ error: "Can only rate completed jobs" });
      }
      if (!job.transporterId) {
        return res.status(400).json({ error: "No transporter to rate" });
      }
      
      const rating = await storage.createTransportRating({
        jobId: req.params.id,
        transporterId: job.transporterId,
        ratedBy: userId!,
        rating: req.body.rating,
        onTimeDelivery: req.body.onTimeDelivery,
        goodCondition: req.body.goodCondition,
        professionalService: req.body.professionalService,
        comment: req.body.comment
      });
      
      await storage.createNotification({
        userId: job.transporterId,
        type: 'review',
        title: 'New Rating Received',
        message: `You received a ${req.body.rating}-star rating for your delivery`,
        link: `/transport-jobs/${job.id}`
      });
      
      res.status(201).json(rating);
    } catch (error) {
      res.status(500).json({ error: "Failed to create rating" });
    }
  });

  // Get transporter reliability
  app.get("/api/transporters/:id/reliability", async (req, res) => {
    try {
      const reliability = await storage.getTransporterReliability(req.params.id);
      const ratings = await storage.getTransportRatingsForTransporter(req.params.id);
      res.json({ reliability, ratings });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reliability" });
    }
  });

  // =====================================
  // TRANSPORT SUBSCRIPTIONS
  // =====================================

  // Create transport subscription
  app.post("/api/transport-subscriptions", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const subscription = await storage.createTransportSubscription({
        ...req.body,
        buyerId: userId
      });
      
      await storage.createNotification({
        userId: req.body.transporterId,
        type: 'order',
        title: 'New Transport Subscription',
        message: `You have been assigned a recurring transport route`,
        link: `/transport-subscriptions/${subscription.id}`
      });
      
      res.status(201).json(subscription);
    } catch (error) {
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Get transport subscriptions for user
  app.get("/api/transport-subscriptions/my", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      const role = user?.role === 'transporter' ? 'transporter' : 'buyer';
      const subscriptions = await storage.getTransportSubscriptionsForUser(userId!, role as 'buyer' | 'transporter');
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // Update transport subscription
  app.patch("/api/transport-subscriptions/:id", requireAuth, async (req, res) => {
    try {
      const subscription = await storage.updateTransportSubscription(req.params.id, req.body);
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ error: "Failed to update subscription" });
    }
  });

  // =====================================
  // TRANSPORT ADMIN STATS (Owner Only)
  // =====================================

  // Get transport statistics
  app.get("/api/admin/transport-stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getTransportStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transport stats" });
    }
  });

  // Get all transport disputes (admin)
  app.get("/api/admin/transport-disputes", requireAdmin, async (req, res) => {
    try {
      const disputes = await storage.getAllTransportDisputes();
      res.json(disputes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch disputes" });
    }
  });

  // Ban transporter (admin)
  app.post("/api/admin/transporters/:id/ban", requireAdmin, async (req, res) => {
    try {
      const { reason, banDays } = req.body;
      const banUntil = new Date();
      banUntil.setDate(banUntil.getDate() + (banDays || 7));
      
      const reliability = await storage.banTransporter(req.params.id, reason, banUntil);
      
      await storage.createNotification({
        userId: req.params.id,
        type: 'system',
        title: 'Account Temporarily Suspended',
        message: `Your transporter account has been temporarily suspended until ${banUntil.toDateString()}. Reason: ${reason}`,
        link: '/dashboard'
      });
      
      res.json(reliability);
    } catch (error) {
      res.status(500).json({ error: "Failed to ban transporter" });
    }
  });

  app.get("/api/insights/price-history", async (req, res) => {
    try {
      const { commodity, region, days } = req.query;
      const history = await storage.getPriceHistory(
        commodity as string,
        region as string,
        days ? parseInt(days as string) : undefined
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch price history" });
    }
  });

  app.post("/api/insights/record-price", async (req, res) => {
    try {
      const { commodity, category, region, price, unit } = req.body;
      await storage.recordPrice(commodity, category, region, price, unit);
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to record price" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const notifications = await storage.getNotificationsForUser(req.session.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const notification = await storage.markNotificationRead(req.params.id);
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/read-all", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      await storage.markAllNotificationsRead(req.session.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Cart routes
  app.get("/api/cart", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const items = await storage.getCartItems(req.session.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { listingId, quantity } = req.body;
      const item = await storage.addToCart(req.session.userId, listingId, quantity);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to add to cart" });
    }
  });

  app.patch("/api/cart/:id", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { quantity } = req.body;
      const item = await storage.updateCartItem(req.params.id, quantity);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      await storage.removeFromCart(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from cart" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      await storage.clearCart(req.session.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/listings", requireAdmin, async (req, res) => {
    try {
      const listings = await storage.getAllListings();
      res.json(listings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  const adminVerifySchema = z.object({ verified: z.boolean() });
  const adminRoleSchema = z.object({ role: z.enum(["farmer", "buyer", "transporter", "admin"]) });
  const adminFeaturedSchema = z.object({ featured: z.boolean() });
  const adminStatusSchema = z.object({ status: z.enum(["active", "pending", "sold", "expired"]) });

  app.patch("/api/admin/users/:id/verify", requireAdmin, async (req, res) => {
    try {
      const { verified } = adminVerifySchema.parse(req.body);
      const user = await storage.updateUserVerification(req.params.id, verified);
      const { password, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update user verification" });
    }
  });

  app.patch("/api/admin/users/:id/role", requireAdmin, async (req, res) => {
    try {
      const { role } = adminRoleSchema.parse(req.body);
      const user = await storage.updateUserRole(req.params.id, role);
      const { password, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  app.patch("/api/admin/listings/:id/featured", requireAdmin, async (req, res) => {
    try {
      const { featured } = adminFeaturedSchema.parse(req.body);
      const listing = await storage.updateListingFeatured(req.params.id, featured);
      res.json(listing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update listing" });
    }
  });

  app.patch("/api/admin/listings/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status } = adminStatusSchema.parse(req.body);
      const listing = await storage.updateListingStatus(req.params.id, status);
      res.json(listing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update listing status" });
    }
  });

  const checkoutSchema = z.object({
    deliveryAddress: z.string().min(1),
    deliveryPhone: z.string().min(1),
    notes: z.string().optional(),
    paymentMethod: z.enum(["bank_transfer", "airtel_money", "mtn_money", "zamtel_money", "debit_card"]),
    phoneNumber: z.string().optional(),
    accountNumber: z.string().optional(),
  });

  app.post("/api/checkout", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId as string;
      const validatedData = checkoutSchema.parse(req.body);
      
      const cartItems = await storage.getCartItems(userId);
      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      const sellerGroups: Record<string, typeof cartItems> = {};
      for (const item of cartItems) {
        const sellerId = item.listing.sellerId;
        if (!sellerGroups[sellerId]) {
          sellerGroups[sellerId] = [];
        }
        sellerGroups[sellerId].push(item);
      }

      const createdOrders = [];

      for (const [sellerId, items] of Object.entries(sellerGroups)) {
        const subtotal = items.reduce((sum, item) => sum + (item.listing.price * item.quantity), 0);
        const serviceFee = Math.round(subtotal * 0.025);
        const total = subtotal + serviceFee;

        const order = await storage.createOrder(
          {
            buyerId: userId,
            sellerId,
            subtotal,
            serviceFee,
            total,
            deliveryAddress: validatedData.deliveryAddress,
            deliveryPhone: validatedData.deliveryPhone,
            notes: validatedData.notes || null,
          },
          items.map(item => ({
            listingId: item.listingId,
            quantity: item.quantity,
            pricePerUnit: item.listing.price,
            total: item.listing.price * item.quantity,
          }))
        );

        await storage.createPayment({
          orderId: order.id,
          method: validatedData.paymentMethod,
          amount: total,
          currency: "ZMW",
          phoneNumber: validatedData.phoneNumber || null,
          accountNumber: validatedData.accountNumber || null,
        });

        const seller = await storage.getUser(sellerId);
        if (seller) {
          await storage.createNotification({
            userId: sellerId,
            type: "order",
            title: "New Order Received",
            message: `You have received a new order worth K${(total / 100).toLocaleString()}`,
            link: `/orders/${order.id}`,
          });
        }

        createdOrders.push(order);
      }

      await storage.clearCart(userId);

      res.status(201).json({ orders: createdOrders });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Checkout error:", error);
      res.status(500).json({ error: "Checkout failed" });
    }
  });

  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId as string;
      const { role } = req.query;
      const orders = await storage.getOrdersForUser(userId, (role as 'buyer' | 'seller') || 'buyer');
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.buyerId !== userId && order.sellerId !== userId) {
        return res.status(403).json({ error: "Not authorized to view this order" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  const paymentConfirmSchema = z.object({
    providerReference: z.string().optional(),
  });

  app.post("/api/orders/:id/pay", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.buyerId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      if (order.status !== "pending") {
        return res.status(400).json({ error: "Order already processed" });
      }

      const { providerReference } = paymentConfirmSchema.parse(req.body);

      await storage.updatePaymentStatus(order.id, "completed", providerReference);
      const updatedOrder = await storage.updateOrderStatus(order.id, "paid", { paidAt: new Date() });

      await storage.createNotification({
        userId: order.sellerId,
        type: "order",
        title: "Payment Received",
        message: `Payment of K${(order.total / 100).toLocaleString()} has been received and held in escrow`,
        link: `/orders/${order.id}`,
      });

      // Auto-create transport job for this order
      try {
        const seller = await storage.getUser(order.sellerId);
        // Get first listing from order items to determine cargo type
        const firstItem = order.items?.[0];
        const listing = firstItem?.listing;
        
        // Calculate estimated transport price (10% of order total, min K50)
        const baseTransportPrice = Math.max(50, Math.floor(order.total * 0.1));
        
        // Calculate total quantity from order items
        const totalQuantity = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
        
        const pickupDate = new Date();
        pickupDate.setDate(pickupDate.getDate() + 2); // 2 days from now
        
        const deliveryDeadline = new Date();
        deliveryDeadline.setDate(deliveryDeadline.getDate() + 7); // 7 days from now

        const transportJob = await storage.createTransportJob({
          orderId: order.id,
          sellerId: order.sellerId,
          buyerId: order.buyerId,
          pickupLocation: seller?.location || "Zambia",
          deliveryLocation: order.deliveryAddress,
          pickupDate: pickupDate.toISOString(),
          deliveryDeadline: deliveryDeadline.toISOString(),
          productType: listing?.category || "produce",
          quantity: totalQuantity > 0 ? totalQuantity : 1,
          suggestedPrice: baseTransportPrice,
        });

        // Notify transporters that a new job is available
        const transporters = await storage.getTransporters();
        for (const transporter of transporters.slice(0, 10)) {
          await storage.createNotification({
            userId: transporter.id,
            type: "order",
            title: "New Transport Job Available",
            message: `Transport job from ${seller?.location || "Zambia"} to ${order.deliveryAddress}. Base price: K${baseTransportPrice}`,
            link: `/dashboard`,
          });
        }
      } catch (transportError) {
        // Log error but don't fail the payment
        console.error("Failed to create transport job:", transportError);
      }

      res.json(updatedOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Payment confirmation failed" });
    }
  });

  app.post("/api/orders/:id/ship", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.sellerId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      if (order.status !== "paid") {
        return res.status(400).json({ error: "Order must be paid before shipping" });
      }

      const updatedOrder = await storage.updateOrderStatus(order.id, "shipped", { shippedAt: new Date() });

      await storage.createNotification({
        userId: order.buyerId,
        type: "order",
        title: "Order Shipped",
        message: `Your order has been shipped and is on its way`,
        link: `/orders/${order.id}`,
      });

      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  app.post("/api/orders/:id/deliver", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.buyerId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      if (order.status !== "shipped") {
        return res.status(400).json({ error: "Order must be shipped before confirming delivery" });
      }

      const disputeDeadline = new Date();
      disputeDeadline.setDate(disputeDeadline.getDate() + 7);

      const updatedOrder = await storage.updateOrderStatus(order.id, "delivered", {
        deliveredAt: new Date(),
        disputeDeadline,
      });

      await storage.createNotification({
        userId: order.sellerId,
        type: "order",
        title: "Delivery Confirmed",
        message: `Buyer has confirmed delivery. Funds will be released in 7 days if no dispute is raised.`,
        link: `/orders/${order.id}`,
      });

      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ error: "Failed to confirm delivery" });
    }
  });

  app.post("/api/orders/:id/complete", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.buyerId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      if (order.status !== "delivered") {
        return res.status(400).json({ error: "Order must be delivered first" });
      }

      await storage.releaseEscrow(order.id);
      const updatedOrder = await storage.updateOrderStatus(order.id, "completed", { completedAt: new Date() });

      await storage.createNotification({
        userId: order.sellerId,
        type: "order",
        title: "Payment Released",
        message: `Funds of K${(order.total / 100).toLocaleString()} have been released to your account`,
        link: `/orders/${order.id}`,
      });

      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete order" });
    }
  });

  app.post("/api/orders/:id/dispute", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.buyerId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      if (order.status !== "delivered") {
        return res.status(400).json({ error: "Can only dispute delivered orders" });
      }

      if (order.disputeDeadline && new Date() > order.disputeDeadline) {
        return res.status(400).json({ error: "Dispute period has ended" });
      }

      const updatedOrder = await storage.updateOrderStatus(order.id, "disputed");

      await storage.createNotification({
        userId: order.sellerId,
        type: "order",
        title: "Order Disputed",
        message: `The buyer has raised a dispute for order. Payment is on hold until resolved.`,
        link: `/orders/${order.id}`,
      });

      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ error: "Failed to dispute order" });
    }
  });

  // ============================================
  // AI FEATURES
  // ============================================

  // AI Support Assistant
  app.post("/api/ai/support", async (req, res) => {
    try {
      const { query, context } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }
      const response = await aiService.getSupportResponse(query, context);
      res.json({ response });
    } catch (error) {
      res.status(500).json({ error: "Failed to get AI support response" });
    }
  });

  // AI Price Suggestion
  app.get("/api/ai/price-suggestion", async (req, res) => {
    try {
      const { commodity, category, location } = req.query;
      if (!commodity || !category || !location) {
        return res.status(400).json({ error: "commodity, category, and location are required" });
      }
      const suggestion = await aiService.getPriceSuggestion(
        commodity as string,
        category as string,
        location as string
      );
      res.json(suggestion);
    } catch (error) {
      res.status(500).json({ error: "Failed to get price suggestion" });
    }
  });

  // AI Chat Monitoring (internal use - checks messages before saving)
  app.post("/api/ai/monitor-chat", requireAuth, async (req, res) => {
    try {
      const { message } = req.body;
      const userId = req.session!.userId!;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      const result = await aiService.monitorChat(message, userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to monitor chat" });
    }
  });

  // AI Delivery Verification
  app.post("/api/ai/verify-delivery", requireAuth, async (req, res) => {
    try {
      const { orderId, photoUrl, buyerLocation, sellerLocation } = req.body;
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const result = await aiService.verifyDelivery({
        orderId,
        photoUrl,
        buyerLocation,
        sellerLocation,
        timestamp: new Date(),
        buyerTrustScore: order.buyer.trustScore,
        sellerTrustScore: order.seller.trustScore,
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to verify delivery" });
    }
  });

  // AI Dispute Analysis
  app.post("/api/ai/analyze-dispute", requireAuth, async (req, res) => {
    try {
      const { orderId, buyerClaim, sellerClaim, photoUrl } = req.body;
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const result = await aiService.analyzeDispute(
        orderId,
        buyerClaim,
        sellerClaim,
        photoUrl,
        order
      );

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to analyze dispute" });
    }
  });

  // Calculate/Update Trust Score
  app.post("/api/ai/update-trust-score/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const newScore = await aiService.calculateTrustScore(req.params.userId);
      res.json({ trustScore: newScore });
    } catch (error) {
      res.status(500).json({ error: "Failed to update trust score" });
    }
  });

  // ============================================
  // ADMIN AI DASHBOARD
  // ============================================

  // Get flagged deliveries for admin review
  app.get("/api/admin/flagged-deliveries", requireAuth, requireAdmin, async (req, res) => {
    try {
      const flagged = await aiService.getFlaggedDeliveries();
      res.json(flagged);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flagged deliveries" });
    }
  });

  // Resolve a flagged delivery
  app.post("/api/admin/flagged-deliveries/:id/resolve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { resolution } = req.body;
      const adminId = req.session!.userId!;
      await aiService.resolveFlaggedDelivery(req.params.id, adminId, resolution);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to resolve flagged delivery" });
    }
  });

  // Get AI decision logs
  app.get("/api/admin/ai-logs", requireAuth, requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await aiService.getAIDecisionLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch AI logs" });
    }
  });

  // Override an AI decision
  app.post("/api/admin/ai-logs/:id/override", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { reason } = req.body;
      const adminId = req.session!.userId!;
      await aiService.overrideAIDecision(req.params.id, adminId, reason);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to override AI decision" });
    }
  });

  // Get users with trust scores for admin
  app.get("/api/admin/trust-scores", requireAuth, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithScores = users.map(u => ({
        id: u.id,
        name: u.name,
        username: u.username,
        role: u.role,
        trustScore: u.trustScore,
        verified: u.verified,
      }));
      res.json(usersWithScores);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trust scores" });
    }
  });

  // ============================================
  // FAVORITES
  // ============================================

  // Get user's favorites
  app.get("/api/favorites", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const favorites = await storage.getFavorites(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  });

  // Add to favorites
  app.post("/api/favorites/:listingId", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { listingId } = req.params;
      
      const listing = await storage.getListing(listingId);
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }
      
      const favorite = await storage.addFavorite(userId, listingId);
      res.status(201).json(favorite);
    } catch (error) {
      res.status(500).json({ error: "Failed to add to favorites" });
    }
  });

  // Remove from favorites
  app.delete("/api/favorites/:listingId", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { listingId } = req.params;
      
      await storage.removeFavorite(userId, listingId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from favorites" });
    }
  });

  // Check if listing is favorited
  app.get("/api/favorites/:listingId/check", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { listingId } = req.params;
      
      const isFavorited = await storage.isFavorited(userId, listingId);
      res.json({ isFavorited });
    } catch (error) {
      res.status(500).json({ error: "Failed to check favorite status" });
    }
  });

  // ============================================
  // SUBSCRIPTIONS & CONTRACTS
  // ============================================

  // Create subscription request (buyer)
  app.post("/api/subscriptions", requireAuth, async (req, res) => {
    try {
      const buyerId = req.session!.userId!;
      const { sellerId, frequency, durationWeeks, message, items } = req.body;
      
      if (!sellerId || !frequency || !durationWeeks || !items?.length) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const subscription = await storage.createSubscription(
        { buyerId, sellerId, frequency, durationWeeks, message },
        items
      );

      await storage.createNotification({
        userId: sellerId,
        type: "system",
        title: "New Subscription Request",
        message: "A buyer has requested a supply subscription with you.",
        link: `/contracts/${subscription.id}`,
      });

      res.status(201).json(subscription);
    } catch (error) {
      console.error("Create subscription error:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Get subscriptions for current user
  app.get("/api/subscriptions", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const asBuyer = await storage.getSubscriptionsForBuyer(userId);
      const asSeller = await storage.getSubscriptionsForSeller(userId);
      
      res.json({ asBuyer, asSeller });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // Get single subscription
  app.get("/api/subscriptions/:id", requireAuth, async (req, res) => {
    try {
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  // Accept/reject subscription (seller)
  app.patch("/api/subscriptions/:id/respond", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { id } = req.params;
      const { action, response, pricingModel, escrowScheduleType } = req.body;
      
      const subscription = await storage.getSubscription(id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      
      if (subscription.sellerId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      if (action === "accept") {
        const updatedSub = await storage.updateSubscriptionStatus(id, "active", response);
        
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + subscription.durationWeeks * 7);
        
        const frequencyDays = subscription.frequency === "weekly" ? 7 : 
                              subscription.frequency === "biweekly" ? 14 : 30;
        const totalDeliveries = Math.floor(subscription.durationWeeks * 7 / frequencyDays);
        
        const totalValue = subscription.items.reduce((sum, item) => 
          sum + (item.pricePerUnit * item.quantityPerDelivery * totalDeliveries), 0);
        
        const contract = await storage.createContract(
          {
            subscriptionId: id,
            buyerId: subscription.buyerId,
            sellerId: subscription.sellerId,
            pricingModel: pricingModel || "fixed_price",
            escrowScheduleType: escrowScheduleType || "pay_per_delivery",
            frequency: subscription.frequency,
            startDate,
            endDate,
            status: "active",
            totalValue,
            totalDeliveries,
            autoReleaseHours: 48,
          },
          subscription.items.map(item => ({
            listingId: item.listingId,
            productName: item.listing.title,
            quantityPerDelivery: item.quantityPerDelivery,
            unit: item.listing.unit,
            fixedPrice: item.pricePerUnit,
          }))
        );

        for (let i = 0; i < totalDeliveries; i++) {
          const scheduledDate = new Date(startDate);
          scheduledDate.setDate(scheduledDate.getDate() + (i * frequencyDays));
          
          const escrowAmount = subscription.items.reduce((sum, item) => 
            sum + (item.pricePerUnit * item.quantityPerDelivery), 0);
          
          await storage.createRecurringOrder({
            contractId: contract.id,
            scheduledDate,
            deliveryNumber: i + 1,
            status: "pending",
            escrowFunded: false,
            escrowAmount,
          });
        }

        await storage.createNotification({
          userId: subscription.buyerId,
          type: "system",
          title: "Subscription Accepted",
          message: "Your subscription request has been accepted!",
          link: `/contracts/${contract.id}`,
        });

        await storage.awardBadge(subscription.sellerId, "contracted_seller");
        
        res.json({ subscription: updatedSub, contract });
      } else {
        const updatedSub = await storage.updateSubscriptionStatus(id, "cancelled", response);
        
        await storage.createNotification({
          userId: subscription.buyerId,
          type: "system",
          title: "Subscription Declined",
          message: response || "Your subscription request was declined.",
          link: `/subscriptions/${id}`,
        });
        
        res.json({ subscription: updatedSub });
      }
    } catch (error) {
      console.error("Respond to subscription error:", error);
      res.status(500).json({ error: "Failed to respond to subscription" });
    }
  });

  // Get contracts for current user
  app.get("/api/contracts", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const asBuyer = await storage.getContractsForBuyer(userId);
      const asSeller = await storage.getContractsForSeller(userId);
      
      res.json({ asBuyer, asSeller });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  // Get single contract
  app.get("/api/contracts/:id", requireAuth, async (req, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      const recurringOrders = await storage.getRecurringOrdersForContract(contract.id);
      const escrowReserves = await storage.getEscrowReservesForContract(contract.id);
      
      res.json({ ...contract, recurringOrders, escrowReserves });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract" });
    }
  });

  // Update contract status
  app.patch("/api/contracts/:id/status", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { id } = req.params;
      const { status } = req.body;
      
      const contract = await storage.getContract(id);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      if (contract.buyerId !== userId && contract.sellerId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const updated = await storage.updateContractStatus(id, status);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update contract status" });
    }
  });

  // Get upcoming deliveries for seller
  app.get("/api/recurring-orders/upcoming", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const orders = await storage.getUpcomingRecurringOrders(userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch upcoming orders" });
    }
  });

  // Confirm delivery (buyer)
  app.post("/api/recurring-orders/:id/confirm", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { id } = req.params;
      const { confirmation, notes } = req.body;
      
      if (!["delivered_as_agreed", "delivered_with_issues", "not_delivered"].includes(confirmation)) {
        return res.status(400).json({ error: "Invalid confirmation status" });
      }
      
      const order = await storage.updateRecurringOrder(id, {});
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const contract = await storage.getContract(order.contractId);
      if (!contract || contract.buyerId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const confirmed = await storage.confirmDelivery(id, confirmation, notes);
      
      if (confirmation === "delivered_as_agreed") {
        await storage.incrementCompletedDeliveries(order.contractId);
        
        await storage.createTrustEvent({
          userId: contract.sellerId,
          eventType: "successful_delivery",
          delta: 2,
          reason: "Successful contract delivery",
          contractId: order.contractId,
        });

        await storage.createNotification({
          userId: contract.sellerId,
          type: "system",
          title: "Delivery Confirmed",
          message: "Your delivery has been confirmed by the buyer.",
          link: `/contracts/${order.contractId}`,
        });
      } else if (confirmation === "not_delivered") {
        await storage.createTrustEvent({
          userId: contract.sellerId,
          eventType: "failed_delivery",
          delta: -5,
          reason: "Failed to deliver as agreed",
          contractId: order.contractId,
        });

        await storage.createNotification({
          userId: contract.sellerId,
          type: "system",
          title: "Delivery Issue Reported",
          message: "The buyer reported your delivery was not received.",
          link: `/contracts/${order.contractId}`,
        });
      }
      
      res.json(confirmed);
    } catch (error) {
      console.error("Confirm delivery error:", error);
      res.status(500).json({ error: "Failed to confirm delivery" });
    }
  });

  // Fund escrow for recurring order (buyer)
  app.post("/api/recurring-orders/:id/fund", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { id } = req.params;
      
      const order = await storage.updateRecurringOrder(id, {});
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const contract = await storage.getContract(order.contractId);
      if (!contract || contract.buyerId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const updated = await storage.updateRecurringOrder(id, { escrowFunded: true });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to fund escrow" });
    }
  });

  // Get seller badges
  app.get("/api/sellers/:id/badges", async (req, res) => {
    try {
      const badges = await storage.getSellerBadges(req.params.id);
      res.json(badges);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  // Get seller metrics
  app.get("/api/sellers/:id/metrics", async (req, res) => {
    try {
      const metrics = await storage.getSellerMetrics(req.params.id);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // ============================================
  // ADMIN CONTRACT CONTROLS
  // ============================================

  // Get all contracts (admin)
  app.get("/api/admin/contracts", requireAdmin, async (req, res) => {
    try {
      const allContracts = await storage.getAllContracts();
      res.json(allContracts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  // Admin update contract status
  app.patch("/api/admin/contracts/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const updated = await storage.updateContractStatus(id, status);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update contract" });
    }
  });

  // Get trust events for user (admin)
  app.get("/api/admin/users/:id/trust-events", requireAdmin, async (req, res) => {
    try {
      const events = await storage.getTrustEventsForUser(req.params.id);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trust events" });
    }
  });

  // Manually adjust trust score (admin)
  app.post("/api/admin/users/:id/trust-score", requireAdmin, async (req, res) => {
    try {
      const { delta, reason } = req.body;
      
      await storage.createTrustEvent({
        userId: req.params.id,
        eventType: "admin_adjustment",
        delta,
        reason: reason || "Admin adjustment",
      });
      
      const user = await storage.getUser(req.params.id);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to adjust trust score" });
    }
  });

  // ============ CO-OP (GROUP SUPPLY) ENDPOINTS ============

  // Create a new co-op (seller only, must be verified)
  app.post("/api/coops", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== "farmer" && user.role !== "admin")) {
        return res.status(403).json({ error: "Only farmers can create co-ops" });
      }
      
      if (!user.verified) {
        return res.status(403).json({ error: "Only verified sellers can create co-ops" });
      }

      const coop = await storage.createCoop({
        ...req.body,
        leaderId: userId,
      });

      // Leader automatically joins as first member
      await storage.joinCoop({
        coopId: coop.id,
        sellerId: userId,
        committedQuantity: req.body.leaderQuantity || "0",
        availabilityStart: req.body.availabilityStart,
        availabilityEnd: req.body.availabilityEnd,
      });

      res.status(201).json(coop);
    } catch (error) {
      console.error("Create co-op error:", error);
      res.status(500).json({ error: "Failed to create co-op" });
    }
  });

  // Get all co-ops (with optional filters)
  app.get("/api/coops", async (req, res) => {
    try {
      const { status, productType } = req.query;
      const coops = await storage.getCoops({
        status: status as string,
        productType: productType as string,
      });

      // Get leader info for each co-op
      const coopsWithLeaders = await Promise.all(coops.map(async (coop) => {
        const leader = await storage.getUser(coop.leaderId);
        return {
          ...coop,
          leader: leader ? { id: leader.id, name: leader.name, location: leader.location, verified: leader.verified, rating: leader.rating } : null,
          percentFilled: Math.round((parseFloat(coop.currentQuantity) / parseFloat(coop.targetQuantity)) * 100),
        };
      }));

      res.json(coopsWithLeaders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch co-ops" });
    }
  });

  // Get single co-op with members
  app.get("/api/coops/:id", async (req, res) => {
    try {
      const result = await storage.getCoopWithMembers(req.params.id);
      if (!result) {
        return res.status(404).json({ error: "Co-op not found" });
      }

      const leader = await storage.getUser(result.coop.leaderId);
      
      res.json({
        ...result.coop,
        leader: leader ? { id: leader.id, name: leader.name, location: leader.location, verified: leader.verified, rating: leader.rating } : null,
        members: result.members.map(m => ({
          ...m,
          seller: { id: m.seller.id, name: m.seller.name, location: m.seller.location, verified: m.seller.verified },
        })),
        percentFilled: Math.round((parseFloat(result.coop.currentQuantity) / parseFloat(result.coop.targetQuantity)) * 100),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch co-op" });
    }
  });

  // Join a co-op (seller only)
  app.post("/api/coops/:id/join", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== "farmer" && user.role !== "admin")) {
        return res.status(403).json({ error: "Only farmers can join co-ops" });
      }

      const coop = await storage.getCoop(req.params.id);
      if (!coop) {
        return res.status(404).json({ error: "Co-op not found" });
      }

      if (coop.status !== "recruiting") {
        return res.status(400).json({ error: "This co-op is no longer accepting members" });
      }

      const { committedQuantity, availabilityStart, availabilityEnd, notes } = req.body;
      
      // Validate quantity doesn't exceed remaining space
      const remaining = parseFloat(coop.targetQuantity) - parseFloat(coop.currentQuantity);
      if (parseFloat(committedQuantity) > remaining) {
        return res.status(400).json({ error: `Maximum available quantity is ${remaining} ${coop.unit}` });
      }

      // Check min/max contribution limits
      if (coop.minContribution && parseFloat(committedQuantity) < parseFloat(coop.minContribution)) {
        return res.status(400).json({ error: `Minimum contribution is ${coop.minContribution} ${coop.unit}` });
      }
      if (coop.maxContribution && parseFloat(committedQuantity) > parseFloat(coop.maxContribution)) {
        return res.status(400).json({ error: `Maximum contribution is ${coop.maxContribution} ${coop.unit}` });
      }

      const member = await storage.joinCoop({
        coopId: req.params.id,
        sellerId: userId,
        committedQuantity,
        availabilityStart: availabilityStart ? new Date(availabilityStart) : undefined,
        availabilityEnd: availabilityEnd ? new Date(availabilityEnd) : undefined,
        notes,
      });

      // Notify co-op leader
      await storage.createNotification({
        userId: coop.leaderId,
        type: "system",
        title: "New Co-Op Member",
        message: `${user.name} has joined your co-op "${coop.title}" with ${committedQuantity} ${coop.unit}`,
        link: `/coops/${coop.id}`,
      });

      res.status(201).json(member);
    } catch (error) {
      console.error("Join co-op error:", error);
      res.status(500).json({ error: "Failed to join co-op" });
    }
  });

  // Mark produce as ready (seller)
  app.post("/api/coops/:coopId/members/:memberId/ready", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const result = await storage.getCoopWithMembers(req.params.coopId);
      
      if (!result) {
        return res.status(404).json({ error: "Co-op not found" });
      }

      const member = result.members.find(m => m.id === req.params.memberId);
      if (!member || member.sellerId !== userId) {
        return res.status(403).json({ error: "You can only mark your own contributions as ready" });
      }

      const updated = await storage.markMemberReady(req.params.memberId);
      
      // Notify co-op leader
      await storage.createNotification({
        userId: result.coop.leaderId,
        type: "system",
        title: "Produce Ready",
        message: `${member.seller.name}'s produce is ready for the co-op "${result.coop.title}"`,
        link: `/coops/${result.coop.id}`,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark as ready" });
    }
  });

  // Buyer purchase from co-op
  app.post("/api/coops/:id/orders", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "buyer") {
        return res.status(403).json({ error: "Only buyers can place orders" });
      }

      const coop = await storage.getCoop(req.params.id);
      if (!coop) {
        return res.status(404).json({ error: "Co-op not found" });
      }

      if (coop.status !== "active" && coop.status !== "recruiting") {
        return res.status(400).json({ error: "This co-op is not available for orders" });
      }

      const { quantity, deliveryAddress, buyerNotes } = req.body;
      const totalAmount = parseFloat(quantity) * parseFloat(coop.pricePerUnit);
      
      const order = await storage.createCoopOrder({
        coopId: coop.id,
        buyerId: userId,
        quantity,
        totalAmount: totalAmount.toFixed(2),
        escrowAmount: totalAmount.toFixed(2),
        deliveryAddress,
        buyerNotes,
      });

      // Create contribution allocations for each member
      const members = await storage.getCoopMembers(coop.id);
      const totalCommitted = members.reduce((sum, m) => sum + parseFloat(m.committedQuantity), 0);
      
      for (const member of members) {
        const memberPortion = (parseFloat(member.committedQuantity) / totalCommitted) * parseFloat(quantity);
        await storage.createSellerContribution({
          coopOrderId: order.id,
          memberId: member.id,
          expectedQuantity: memberPortion.toFixed(2),
        });
      }

      // Notify all members
      for (const member of members) {
        await storage.createNotification({
          userId: member.sellerId,
          type: "system",
          title: "New Co-Op Order",
          message: `A buyer has placed an order for the co-op "${coop.title}"`,
          link: `/coops/${coop.id}`,
        });
      }

      res.status(201).json(order);
    } catch (error) {
      console.error("Create co-op order error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Fund escrow for co-op order
  app.post("/api/coop-orders/:id/fund-escrow", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const order = await storage.getCoopOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.buyerId !== userId) {
        return res.status(403).json({ error: "Only the buyer can fund escrow" });
      }

      const updated = await storage.fundCoopEscrow(order.id);
      
      // Notify all members that escrow is funded
      const coop = await storage.getCoop(order.coopId);
      const members = await storage.getCoopMembers(order.coopId);
      
      for (const member of members) {
        await storage.createNotification({
          userId: member.sellerId,
          type: "system",
          title: "Escrow Funded",
          message: `The buyer has funded escrow for co-op order. Please prepare your produce.`,
          link: `/coops/${order.coopId}`,
        });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to fund escrow" });
    }
  });

  // Confirm delivery (buyer)
  app.post("/api/coop-orders/:id/confirm-delivery", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const order = await storage.getCoopOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.buyerId !== userId) {
        return res.status(403).json({ error: "Only the buyer can confirm delivery" });
      }

      const { photo } = req.body;
      const updated = await storage.confirmCoopDelivery(order.id, photo);
      
      // Process payouts automatically
      const payouts = await storage.processPayouts(order.id);
      
      // Mark payout as paid (in real system, this would be actual payment)
      for (const payout of payouts) {
        await storage.updatePayoutSplit(payout.id, { status: "paid", paidAt: new Date() });
        
        // Notify sellers of payment
        await storage.createNotification({
          userId: payout.sellerId,
          type: "system",
          title: "Payment Received",
          message: `You received K${payout.amount} for your co-op contribution!`,
          link: `/coops/${order.coopId}`,
        });

        // Award badge for first successful co-op delivery
        await storage.awardBadge(payout.sellerId, "trusted_supplier");
      }

      res.json({ order: updated, payouts });
    } catch (error) {
      console.error("Confirm delivery error:", error);
      res.status(500).json({ error: "Failed to confirm delivery" });
    }
  });

  // Raise dispute on co-op order
  app.post("/api/coop-orders/:id/dispute", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const order = await storage.getCoopOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const { reason, againstSellerId, evidence } = req.body;
      
      const dispute = await storage.createCoopDispute({
        coopOrderId: order.id,
        raisedBy: userId,
        againstSellerId,
        reason,
        evidence: evidence || [],
      });

      res.status(201).json(dispute);
    } catch (error) {
      res.status(500).json({ error: "Failed to raise dispute" });
    }
  });

  // ============ ADMIN CO-OP CONTROLS ============

  // Get all co-ops (admin)
  app.get("/api/admin/coops", requireAdmin, async (req, res) => {
    try {
      const coops = await storage.getCoops();
      res.json(coops);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch co-ops" });
    }
  });

  // Update co-op status (admin)
  app.patch("/api/admin/coops/:id", requireAdmin, async (req, res) => {
    try {
      const { status, notes } = req.body;
      const updated = await storage.updateCoop(req.params.id, { status });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update co-op" });
    }
  });

  // Remove member from co-op (admin)
  app.delete("/api/admin/coops/:coopId/members/:memberId", requireAdmin, async (req, res) => {
    try {
      const member = await storage.updateCoopMember(req.params.memberId, { status: "failed" });
      
      // Reduce co-op quantity
      const coop = await storage.getCoop(req.params.coopId);
      if (coop) {
        const newQuantity = Math.max(0, parseFloat(coop.currentQuantity) - parseFloat(member.committedQuantity));
        await storage.updateCoop(coop.id, { currentQuantity: newQuantity.toString() });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove member" });
    }
  });

  // Get all co-op disputes (admin)
  app.get("/api/admin/coop-disputes", requireAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      const disputes = await storage.getCoopDisputes({ status: status as string });
      res.json(disputes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch disputes" });
    }
  });

  // Resolve co-op dispute (admin)
  app.post("/api/admin/coop-disputes/:id/resolve", requireAdmin, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { resolution } = req.body;
      
      const dispute = await storage.resolveCoopDispute(req.params.id, resolution, userId);
      res.json(dispute);
    } catch (error) {
      res.status(500).json({ error: "Failed to resolve dispute" });
    }
  });

  // Adjust payout (admin)
  app.patch("/api/admin/payouts/:id", requireAdmin, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { amount, reason } = req.body;
      
      const updated = await storage.updatePayoutSplit(req.params.id, {
        amount,
        adjustedBy: userId,
        adjustmentReason: reason,
      });
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to adjust payout" });
    }
  });

  // ============ CHAT ENDPOINTS ============

  // Get all chats for current user
  app.get("/api/chats", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const chats = await storage.getUserChats(userId);
      res.json(chats);
    } catch (error) {
      console.error("Get chats error:", error);
      res.status(500).json({ error: "Failed to get chats" });
    }
  });

  // Get or create chat with another user
  app.post("/api/chats", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { recipientId, listingId } = req.body;
      
      if (!recipientId) {
        return res.status(400).json({ error: "Recipient ID is required" });
      }
      
      if (recipientId === userId) {
        return res.status(400).json({ error: "Cannot chat with yourself" });
      }
      
      const chat = await storage.getOrCreateChat(userId, recipientId, listingId);
      res.json(chat);
    } catch (error) {
      console.error("Create chat error:", error);
      res.status(500).json({ error: "Failed to create chat" });
    }
  });

  // Get chat messages
  app.get("/api/chats/:chatId/messages", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const chat = await storage.getChat(req.params.chatId);
      
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }
      
      // Verify user is a participant
      if (chat.participant1Id !== userId && chat.participant2Id !== userId) {
        return res.status(403).json({ error: "Not authorized to view this chat" });
      }
      
      // Mark messages as read
      await storage.markMessagesAsRead(req.params.chatId, userId);
      
      const messages = await storage.getChatMessages(req.params.chatId);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // Send a message
  app.post("/api/chats/:chatId/messages", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { content } = req.body;
      
      if (!content || content.trim() === "") {
        return res.status(400).json({ error: "Message content is required" });
      }
      
      const chat = await storage.getChat(req.params.chatId);
      
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }
      
      // Verify user is a participant
      if (chat.participant1Id !== userId && chat.participant2Id !== userId) {
        return res.status(403).json({ error: "Not authorized to send messages in this chat" });
      }
      
      const message = await storage.sendMessage(req.params.chatId, userId, content.trim());
      
      // Create notification for recipient
      const recipientId = chat.participant1Id === userId ? chat.participant2Id : chat.participant1Id;
      const sender = await storage.getUser(userId);
      
      await storage.createNotification({
        userId: recipientId,
        type: "system",
        title: "New Message",
        message: `${sender?.name || "Someone"} sent you a message`,
        link: `/messages/${chat.id}`,
      });
      
      res.json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Get unread message count
  app.get("/api/chats/unread-count", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  // ============ QUALITY GRADING SYSTEM ROUTES ============

  // Get grade definitions (public)
  app.get("/api/grades/definitions", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const definitions = await storage.getGradeDefinitions(category);
      res.json(definitions);
    } catch (error) {
      console.error("Get grade definitions error:", error);
      res.status(500).json({ error: "Failed to get grade definitions" });
    }
  });

  // Get specific grade definition
  app.get("/api/grades/definitions/:category/:grade", async (req, res) => {
    try {
      const { category, grade } = req.params;
      const definition = await storage.getGradeDefinition(category, grade);
      if (!definition) {
        return res.status(404).json({ error: "Grade definition not found" });
      }
      res.json(definition);
    } catch (error) {
      console.error("Get grade definition error:", error);
      res.status(500).json({ error: "Failed to get grade definition" });
    }
  });

  // Upload media evidence
  app.post("/api/grades/media", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { orderId, listingId, coopOrderId, mediaType, url, thumbnailUrl, geoLatitude, geoLongitude, purpose, notes } = req.body;
      
      if (!mediaType || !url || !purpose) {
        return res.status(400).json({ error: "Media type, URL, and purpose are required" });
      }
      
      const evidence = await storage.createMediaEvidence({
        orderId,
        listingId,
        coopOrderId,
        uploaderId: userId,
        mediaType,
        url,
        thumbnailUrl,
        geoLatitude,
        geoLongitude,
        capturedAt: new Date(),
        purpose,
        notes
      });
      
      res.json(evidence);
    } catch (error) {
      console.error("Upload media evidence error:", error);
      res.status(500).json({ error: "Failed to upload media evidence" });
    }
  });

  // Get media evidence for order
  app.get("/api/grades/media/order/:orderId", requireAuth, async (req, res) => {
    try {
      const evidence = await storage.getMediaEvidenceForOrder(req.params.orderId);
      res.json(evidence);
    } catch (error) {
      console.error("Get media evidence error:", error);
      res.status(500).json({ error: "Failed to get media evidence" });
    }
  });

  // Check media requirements for order delivery
  app.get("/api/grades/media/check/:orderId", requireAuth, async (req, res) => {
    try {
      const counts = await storage.countMediaByPurpose(req.params.orderId, "delivery");
      const meetsRequirements = counts.photos >= 3 && counts.videos >= 1;
      res.json({ ...counts, meetsRequirements });
    } catch (error) {
      console.error("Check media requirements error:", error);
      res.status(500).json({ error: "Failed to check media requirements" });
    }
  });

  // Create delivery grade record when order ships
  app.post("/api/grades/delivery", requireAuth, async (req, res) => {
    try {
      const { orderId, expectedGrade, sellerDeclaredGrade } = req.body;
      
      if (!orderId || !expectedGrade || !sellerDeclaredGrade) {
        return res.status(400).json({ error: "Order ID, expected grade, and seller declared grade are required" });
      }
      
      const deliveryGrade = await storage.createDeliveryGrade({
        orderId,
        expectedGrade,
        sellerDeclaredGrade
      });
      
      res.json(deliveryGrade);
    } catch (error) {
      console.error("Create delivery grade error:", error);
      res.status(500).json({ error: "Failed to create delivery grade" });
    }
  });

  // Get delivery grade for order
  app.get("/api/grades/delivery/:orderId", requireAuth, async (req, res) => {
    try {
      const grade = await storage.getDeliveryGrade(req.params.orderId);
      if (!grade) {
        return res.status(404).json({ error: "Delivery grade not found" });
      }
      res.json(grade);
    } catch (error) {
      console.error("Get delivery grade error:", error);
      res.status(500).json({ error: "Failed to get delivery grade" });
    }
  });

  // Buyer confirms grade (matches, lower, rejected)
  app.post("/api/grades/delivery/:id/confirm", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { confirmation, reportedGrade, comment } = req.body;
      
      if (!confirmation) {
        return res.status(400).json({ error: "Confirmation type is required" });
      }
      
      if (confirmation === 'rejected' && !comment) {
        return res.status(400).json({ error: "Comment is required when rejecting delivery" });
      }
      
      const deliveryGrade = await storage.confirmDeliveryGrade(
        req.params.id,
        confirmation,
        reportedGrade,
        comment
      );
      
      // Get order to find seller
      const order = await storage.getOrder(deliveryGrade.orderId);
      if (order) {
        // Update seller trust metrics
        await storage.updateSellerGradeMetrics(order.sellerId, confirmation);
        
        // If grade matches, release escrow immediately
        if (confirmation === 'matches') {
          await storage.setFinalGrade(req.params.id, deliveryGrade.sellerDeclaredGrade);
          // Update order status to completed
          await storage.updateOrderStatus(order.id, 'completed');
        }
        
        // Notify seller of confirmation
        await storage.createNotification({
          userId: order.sellerId,
          type: "system",
          title: confirmation === 'matches' ? "Grade Confirmed" : confirmation === 'lower' ? "Grade Issue Reported" : "Delivery Rejected",
          message: confirmation === 'matches' 
            ? `Buyer confirmed Grade ${deliveryGrade.sellerDeclaredGrade} on order #${order.id.slice(0, 8)}`
            : `Buyer reported grade issue on order #${order.id.slice(0, 8)}`,
          link: `/orders/${order.id}`,
        });
      }
      
      res.json(deliveryGrade);
    } catch (error) {
      console.error("Confirm delivery grade error:", error);
      res.status(500).json({ error: "Failed to confirm delivery grade" });
    }
  });

  // Create grade dispute
  app.post("/api/grades/disputes", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { deliveryGradeId, orderId, sellerId, claimedGrade, actualGrade, buyerReason } = req.body;
      
      if (!deliveryGradeId || !orderId || !sellerId || !claimedGrade || !actualGrade || !buyerReason) {
        return res.status(400).json({ error: "All dispute fields are required" });
      }
      
      const dispute = await storage.createGradeDispute({
        deliveryGradeId,
        orderId,
        buyerId: userId,
        sellerId,
        claimedGrade,
        actualGrade,
        buyerReason
      });
      
      // Notify seller of dispute
      await storage.createNotification({
        userId: sellerId,
        type: "system",
        title: "Grade Dispute Filed",
        message: `A buyer has disputed the grade on order #${orderId.slice(0, 8)}. Please respond within 72 hours.`,
        link: `/orders/${orderId}`,
      });
      
      res.json(dispute);
    } catch (error) {
      console.error("Create grade dispute error:", error);
      res.status(500).json({ error: "Failed to create grade dispute" });
    }
  });

  // Get grade disputes for order
  app.get("/api/grades/disputes/order/:orderId", requireAuth, async (req, res) => {
    try {
      const disputes = await storage.getGradeDisputesByOrder(req.params.orderId);
      res.json(disputes);
    } catch (error) {
      console.error("Get grade disputes error:", error);
      res.status(500).json({ error: "Failed to get grade disputes" });
    }
  });

  // Seller responds to dispute
  app.post("/api/grades/disputes/:id/respond", requireAuth, async (req, res) => {
    try {
      const { response } = req.body;
      
      if (!response) {
        return res.status(400).json({ error: "Response is required" });
      }
      
      const dispute = await storage.updateGradeDisputeStatus(req.params.id, 'under_review', response);
      
      // Notify buyer
      await storage.createNotification({
        userId: dispute.buyerId,
        type: "system",
        title: "Seller Responded to Dispute",
        message: `The seller has responded to your grade dispute.`,
        link: `/orders/${dispute.orderId}`,
      });
      
      res.json(dispute);
    } catch (error) {
      console.error("Respond to dispute error:", error);
      res.status(500).json({ error: "Failed to respond to dispute" });
    }
  });

  // Admin: Get pending disputes
  app.get("/api/grades/disputes/pending", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session!.userId!);
      if (user?.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const disputes = await storage.getPendingGradeDisputes();
      res.json(disputes);
    } catch (error) {
      console.error("Get pending disputes error:", error);
      res.status(500).json({ error: "Failed to get pending disputes" });
    }
  });

  // Admin: Resolve dispute
  app.post("/api/grades/disputes/:id/resolve", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { resolution, refundAmount, refundPercentage, buyerWins } = req.body;
      
      if (!resolution) {
        return res.status(400).json({ error: "Resolution is required" });
      }
      
      const dispute = await storage.resolveGradeDispute(
        req.params.id,
        resolution,
        refundAmount,
        refundPercentage,
        userId
      );
      
      // Record dispute outcome for seller metrics
      await storage.recordGradeDisputeOutcome(dispute.sellerId, !buyerWins);
      
      // Notify both parties
      await storage.createNotification({
        userId: dispute.buyerId,
        type: "system",
        title: "Dispute Resolved",
        message: resolution,
        link: `/orders/${dispute.orderId}`,
      });
      
      await storage.createNotification({
        userId: dispute.sellerId,
        type: "system",
        title: "Dispute Resolved",
        message: resolution,
        link: `/orders/${dispute.orderId}`,
      });
      
      res.json(dispute);
    } catch (error) {
      console.error("Resolve dispute error:", error);
      res.status(500).json({ error: "Failed to resolve dispute" });
    }
  });

  // Get seller trust metrics
  app.get("/api/grades/trust/:sellerId", async (req, res) => {
    try {
      const metrics = await storage.getSellerTrustMetrics(req.params.sellerId);
      if (!metrics) {
        // Return default metrics if none exist
        return res.json({
          sellerId: req.params.sellerId,
          totalDeliveries: 0,
          gradeAccuracyRate: "100",
          trustScore: 50,
          isContractEligible: true,
          isSubscriptionVisible: true
        });
      }
      res.json(metrics);
    } catch (error) {
      console.error("Get trust metrics error:", error);
      res.status(500).json({ error: "Failed to get trust metrics" });
    }
  });

  // Admin: Get/Set grade settings
  app.get("/api/grades/settings", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session!.userId!);
      if (user?.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const settings = await storage.getAllAdminGradeSettings();
      res.json(settings);
    } catch (error) {
      console.error("Get grade settings error:", error);
      res.status(500).json({ error: "Failed to get grade settings" });
    }
  });

  app.post("/api/grades/settings", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { key, value, description } = req.body;
      
      if (!key || !value) {
        return res.status(400).json({ error: "Key and value are required" });
      }
      
      const setting = await storage.setAdminGradeSetting(key, value, description, userId);
      res.json(setting);
    } catch (error) {
      console.error("Set grade setting error:", error);
      res.status(500).json({ error: "Failed to set grade setting" });
    }
  });

  // ============= Demand Forecasting Routes =============

  // Create a demand forecast (buyer only)
  app.post("/api/forecasts", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user || user.role !== "buyer") {
        return res.status(403).json({ error: "Only buyers can create demand forecasts" });
      }
      
      const validatedData = insertDemandForecastSchema.parse({
        ...req.body,
        buyerId: userId,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
      });
      
      const forecast = await storage.createDemandForecast(validatedData);
      res.status(201).json(forecast);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create forecast error:", error);
      res.status(500).json({ error: "Failed to create forecast" });
    }
  });

  // Get forecasts for the logged-in buyer
  app.get("/api/forecasts/my", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const forecasts = await storage.getDemandForecastsForBuyer(userId!);
      
      // Get responses for each forecast
      const forecastsWithResponses = await Promise.all(
        forecasts.map(async (forecast) => {
          const responses = await storage.getForecastResponses(forecast.id);
          return { ...forecast, responses };
        })
      );
      
      res.json(forecastsWithResponses);
    } catch (error) {
      console.error("Get my forecasts error:", error);
      res.status(500).json({ error: "Failed to get forecasts" });
    }
  });

  // Get forecasts available to sellers
  app.get("/api/forecasts/available", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user || (user.role !== "farmer" && user.role !== "admin")) {
        return res.status(403).json({ error: "Only sellers can view available forecasts" });
      }
      
      const forecasts = await storage.getDemandForecastsForSellers(userId!, user.location);
      res.json(forecasts);
    } catch (error) {
      console.error("Get available forecasts error:", error);
      res.status(500).json({ error: "Failed to get forecasts" });
    }
  });

  // Get a single forecast
  app.get("/api/forecasts/:id", requireAuth, async (req, res) => {
    try {
      const forecast = await storage.getDemandForecast(req.params.id);
      if (!forecast) {
        return res.status(404).json({ error: "Forecast not found" });
      }
      
      const responses = await storage.getForecastResponses(forecast.id);
      const buyer = await storage.getUser(forecast.buyerId);
      const conversions = await storage.getForecastConversions(forecast.id);
      
      res.json({ ...forecast, buyer, responses, conversions });
    } catch (error) {
      console.error("Get forecast error:", error);
      res.status(500).json({ error: "Failed to get forecast" });
    }
  });

  // Cancel a forecast (buyer only, must own it)
  app.post("/api/forecasts/:id/cancel", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const forecast = await storage.getDemandForecast(req.params.id);
      
      if (!forecast) {
        return res.status(404).json({ error: "Forecast not found" });
      }
      
      if (forecast.buyerId !== userId) {
        return res.status(403).json({ error: "You can only cancel your own forecasts" });
      }
      
      const cancelled = await storage.cancelDemandForecast(req.params.id);
      res.json(cancelled);
    } catch (error) {
      console.error("Cancel forecast error:", error);
      res.status(500).json({ error: "Failed to cancel forecast" });
    }
  });

  // Respond to a forecast (seller only)
  app.post("/api/forecasts/:id/respond", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId!);
      
      if (!user || (user.role !== "farmer" && user.role !== "admin")) {
        return res.status(403).json({ error: "Only sellers can respond to forecasts" });
      }
      
      const forecast = await storage.getDemandForecast(req.params.id);
      if (!forecast) {
        return res.status(404).json({ error: "Forecast not found" });
      }
      
      if (forecast.status !== "active") {
        return res.status(400).json({ error: "Forecast is no longer active" });
      }
      
      const validatedData = insertForecastResponseSchema.parse({
        forecastId: req.params.id,
        sellerId: userId,
        indicativeQuantity: req.body.indicativeQuantity,
        proposedPrice: req.body.proposedPrice,
        message: req.body.message
      });
      
      const response = await storage.createForecastResponse(validatedData);
      
      // Notify buyer
      await storage.createNotification({
        userId: forecast.buyerId,
        type: "forecast_response",
        title: "New Seller Response",
        message: `${user.name} has responded to your demand forecast for ${forecast.productName}`,
        link: `/dashboard?tab=forecasts&id=${forecast.id}`
      });
      
      res.status(201).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Respond to forecast error:", error);
      res.status(500).json({ error: "Failed to respond to forecast" });
    }
  });

  // Accept a response (buyer only)
  app.post("/api/forecast-responses/:id/accept", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const responses = await storage.getForecastResponses("");
      
      // Find the response to get its forecast
      const allForecasts = await storage.getDemandForecastsForBuyer(userId!);
      let targetResponse = null;
      let targetForecast = null;
      
      for (const forecast of allForecasts) {
        const fResponses = await storage.getForecastResponses(forecast.id);
        const found = fResponses.find(r => r.id === req.params.id);
        if (found) {
          targetResponse = found;
          targetForecast = forecast;
          break;
        }
      }
      
      if (!targetResponse || !targetForecast) {
        return res.status(404).json({ error: "Response not found" });
      }
      
      if (targetForecast.buyerId !== userId) {
        return res.status(403).json({ error: "You can only accept responses to your own forecasts" });
      }
      
      const accepted = await storage.updateForecastResponse(req.params.id, { status: "accepted" });
      
      // Notify seller
      await storage.createNotification({
        userId: targetResponse.sellerId,
        type: "response_accepted",
        title: "Response Accepted",
        message: `Your response to demand forecast for ${targetForecast.productName} has been accepted`,
        link: `/dashboard?tab=forecasts`
      });
      
      res.json(accepted);
    } catch (error) {
      console.error("Accept response error:", error);
      res.status(500).json({ error: "Failed to accept response" });
    }
  });

  // Convert forecast to subscription/contract (buyer only)
  app.post("/api/forecasts/:id/convert", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const forecast = await storage.getDemandForecast(req.params.id);
      
      if (!forecast) {
        return res.status(404).json({ error: "Forecast not found" });
      }
      
      if (forecast.buyerId !== userId) {
        return res.status(403).json({ error: "You can only convert your own forecasts" });
      }
      
      const { conversionType, responseId, referenceId, quantity } = req.body;
      
      if (!conversionType || !referenceId || !quantity) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const validatedData = insertForecastConversionSchema.parse({
        forecastId: req.params.id,
        responseId: responseId || null,
        conversionType,
        referenceId,
        convertedQuantity: quantity
      });
      
      const conversion = await storage.createForecastConversion(validatedData);
      
      // Update response status if provided
      if (responseId) {
        await storage.updateForecastResponse(responseId, { status: "converted" });
      }
      
      // Check if forecast is fully fulfilled
      const conversions = await storage.getForecastConversions(forecast.id);
      const totalConverted = conversions.reduce((sum, c) => sum + c.convertedQuantity, 0);
      
      if (totalConverted >= forecast.quantity) {
        await storage.updateDemandForecast(forecast.id, { status: "fulfilled" });
      }
      
      res.status(201).json(conversion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Convert forecast error:", error);
      res.status(500).json({ error: "Failed to convert forecast" });
    }
  });

  // Admin: Get forecast stats (owner monitoring)
  app.get("/api/admin/forecast-stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getForecastStats();
      res.json(stats);
    } catch (error) {
      console.error("Get forecast stats error:", error);
      res.status(500).json({ error: "Failed to get forecast stats" });
    }
  });

  // =====================================
  // USER FAVOURITES SYSTEM
  // =====================================

  // Get user's favourites
  app.get("/api/favourites", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const favourites = await storage.getUserFavourites(userId);
      res.json(favourites);
    } catch (error) {
      console.error("Get favourites error:", error);
      res.status(500).json({ error: "Failed to get favourites" });
    }
  });

  // Get favourite transporters only
  app.get("/api/favourites/transporters", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const favourites = await storage.getFavouriteTransporters(userId);
      res.json(favourites);
    } catch (error) {
      console.error("Get favourite transporters error:", error);
      res.status(500).json({ error: "Failed to get favourite transporters" });
    }
  });

  // Check if user is favourited
  app.get("/api/favourites/check/:userId", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      const targetUserId = req.params.userId;
      const isFavourited = await storage.isUserFavourited(currentUserId, targetUserId);
      res.json({ isFavourited });
    } catch (error) {
      console.error("Check favourite error:", error);
      res.status(500).json({ error: "Failed to check favourite status" });
    }
  });

  // Add user to favourites
  app.post("/api/favourites/:userId", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      const targetUserId = req.params.userId;
      
      // Cannot favourite yourself
      if (currentUserId === targetUserId) {
        return res.status(400).json({ error: "Cannot favourite yourself" });
      }
      
      // Get target user to get their role
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check for completed transaction
      const hasTransaction = await storage.hasCompletedTransaction(currentUserId, targetUserId);
      if (!hasTransaction) {
        return res.status(400).json({ error: "You can only favourite users you have completed a transaction with" });
      }
      
      // Check if already favourited
      const alreadyFavourited = await storage.isUserFavourited(currentUserId, targetUserId);
      if (alreadyFavourited) {
        return res.status(400).json({ error: "User already in favourites" });
      }
      
      const favourite = await storage.addUserFavourite(currentUserId, targetUserId, targetUser.role);
      res.status(201).json(favourite);
    } catch (error) {
      console.error("Add favourite error:", error);
      res.status(500).json({ error: "Failed to add favourite" });
    }
  });

  // Remove user from favourites
  app.delete("/api/favourites/:userId", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      const targetUserId = req.params.userId;
      
      await storage.removeUserFavourite(currentUserId, targetUserId);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove favourite error:", error);
      res.status(500).json({ error: "Failed to remove favourite" });
    }
  });

  // =====================================
  // TRANSPORT COST SPLITS
  // =====================================

  // Get cost split for an order
  app.get("/api/orders/:orderId/cost-split", requireAuth, async (req, res) => {
    try {
      const split = await storage.getTransportCostSplit(req.params.orderId);
      if (!split) {
        return res.status(404).json({ error: "Cost split not found" });
      }
      res.json(split);
    } catch (error) {
      console.error("Get cost split error:", error);
      res.status(500).json({ error: "Failed to get cost split" });
    }
  });

  // Create cost split for an order (at checkout)
  app.post("/api/orders/:orderId/cost-split", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { splitMode, buyerPercentage, farmerPercentage, totalTransportCost } = req.body;
      
      // Verify order exists and user is the buyer
      const order = await storage.getOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (order.buyerId !== userId) {
        return res.status(403).json({ error: "Only the buyer can create a transport cost split" });
      }
      
      // Validate percentages
      if (typeof buyerPercentage !== 'number' || typeof farmerPercentage !== 'number') {
        return res.status(400).json({ error: "Percentages must be numbers" });
      }
      if (buyerPercentage < 0 || farmerPercentage < 0) {
        return res.status(400).json({ error: "Percentages cannot be negative" });
      }
      if (buyerPercentage + farmerPercentage !== 100) {
        return res.status(400).json({ error: "Percentages must total 100%" });
      }
      if (typeof totalTransportCost !== 'number' || totalTransportCost <= 0) {
        return res.status(400).json({ error: "Transport cost must be a positive number" });
      }
      
      // Check if cost split already exists for this order
      const existingSplit = await storage.getTransportCostSplit(req.params.orderId);
      if (existingSplit) {
        return res.status(400).json({ error: "Cost split already exists for this order" });
      }
      
      const buyerAmount = Math.round((totalTransportCost * buyerPercentage) / 100);
      const farmerAmount = totalTransportCost - buyerAmount;
      
      const split = await storage.createTransportCostSplit({
        orderId: req.params.orderId,
        splitMode,
        buyerPercentage,
        farmerPercentage,
        totalTransportCost,
        buyerAmount,
        farmerAmount,
        buyerFunded: false,
        farmerFunded: false,
      });
      
      res.status(201).json(split);
    } catch (error) {
      console.error("Create cost split error:", error);
      res.status(500).json({ error: "Failed to create cost split" });
    }
  });

  // Fund cost split (buyer or farmer pays their portion)
  app.post("/api/cost-splits/:id/fund", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const split = await storage.getTransportCostSplitById(req.params.id);
      
      if (!split) {
        return res.status(404).json({ error: "Cost split not found" });
      }
      
      // Get the order to determine if user is buyer or seller (farmer)
      const order = await storage.getOrder(split.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      let funder: 'buyer' | 'farmer';
      if (order.buyerId === userId) {
        funder = 'buyer';
      } else if (order.sellerId === userId) {
        funder = 'farmer';
      } else {
        return res.status(403).json({ error: "You are not a party to this order" });
      }
      
      const updated = await storage.fundTransportCostSplit(req.params.id, funder);
      res.json(updated);
    } catch (error) {
      console.error("Fund cost split error:", error);
      res.status(500).json({ error: "Failed to fund cost split" });
    }
  });

  // Recalculate cost split (when transporter counter-offers)
  app.post("/api/cost-splits/:id/recalculate", requireAuth, async (req, res) => {
    try {
      const { newTotal } = req.body;
      
      if (typeof newTotal !== 'number' || newTotal <= 0) {
        return res.status(400).json({ error: "Invalid new total" });
      }
      
      const updated = await storage.recalculateCostSplit(req.params.id, newTotal);
      res.json(updated);
    } catch (error) {
      console.error("Recalculate cost split error:", error);
      res.status(500).json({ error: "Failed to recalculate cost split" });
    }
  });

  // =====================================
  // USER SUBSCRIPTIONS & MARKET INSIGHTS
  // =====================================

  // Get user's subscription info
  app.get("/api/subscription", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const subscription = await storage.getUserSubscription(userId);
      const tier = await storage.getEffectiveUserTier(userId);
      res.json({ subscription, effectiveTier: tier });
    } catch (error) {
      console.error("Get subscription error:", error);
      res.status(500).json({ error: "Failed to get subscription" });
    }
  });

  // Get insights filtered for user's role and tier
  app.get("/api/insights", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const tier = await storage.getEffectiveUserTier(userId);
      const insights = await storage.getFilteredInsightsForUser(userId, user.role, tier);
      
      res.json({ insights, userTier: tier });
    } catch (error) {
      console.error("Get insights error:", error);
      res.status(500).json({ error: "Failed to get insights" });
    }
  });

  // Get insights by category
  app.get("/api/insights/:category", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const tier = await storage.getEffectiveUserTier(userId);
      const allInsights = await storage.getFilteredInsightsForUser(userId, user.role, tier);
      
      const categoryInsights = allInsights.filter(i => i.category === req.params.category);
      res.json({ insights: categoryInsights, userTier: tier });
    } catch (error) {
      console.error("Get insights by category error:", error);
      res.status(500).json({ error: "Failed to get insights" });
    }
  });

  // =====================================
  // PLATFORM FEES SYSTEM
  // =====================================

  // Calculate fees for a transaction (preview before checkout)
  app.post("/api/fees/calculate", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { amount, sellerId, isContract, transportCost, transporterId } = req.body;
      
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      
      // Get buyer and seller tiers
      const buyer = await storage.getUser(userId);
      const seller = await storage.getUser(sellerId);
      
      if (!buyer || !seller) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const buyerTier = await storage.getEffectiveUserTier(userId);
      const sellerTier = await storage.getEffectiveUserTier(sellerId);
      
      // Calculate transaction fees
      const transactionFees = await storage.calculateTransactionFee(amount, buyerTier, sellerTier, isContract || false);
      
      // Calculate transport fees if applicable
      let transportFees = null;
      if (transportCost && transportCost > 0) {
        const transporterTier = transporterId 
          ? await storage.getEffectiveUserTier(transporterId)
          : 'starter';
        transportFees = await storage.calculateTransportFee(transportCost, transporterTier);
      }
      
      res.json({
        subtotal: amount,
        transactionFees,
        transportCost: transportCost || 0,
        transportFees,
        buyerTier,
        sellerTier,
        totalBuyerPayable: amount + transactionFees.buyerFee.amount + (transportCost || 0) + (transportFees?.amount || 0),
      });
    } catch (error) {
      console.error("Calculate fees error:", error);
      res.status(500).json({ error: "Failed to calculate fees" });
    }
  });

  // Get current fee configuration (public for transparency)
  app.get("/api/fees/config", async (req, res) => {
    try {
      const configs = await storage.getAllPlatformConfig();
      const feeConfigs = configs.filter(c => 
        c.key.includes('fee') || c.key.includes('tier') || c.key.includes('contract')
      );
      
      const configMap: Record<string, string> = {};
      for (const c of feeConfigs) {
        configMap[c.key] = c.value;
      }
      
      res.json({
        baseTransactionFee: parseFloat(configMap['base_transaction_fee'] || '6'),
        transportFee: parseFloat(configMap['transport_fee'] || '3.5'),
        contractFeeMin: parseFloat(configMap['contract_fee_min'] || '2'),
        contractFeeMax: parseFloat(configMap['contract_fee_max'] || '4'),
        tierReductions: {
          starter: 0,
          growth: 1,
          pro: 2,
          commercial: 3,
        },
      });
    } catch (error) {
      console.error("Get fee config error:", error);
      res.status(500).json({ error: "Failed to get fee configuration" });
    }
  });

  // Admin: Update fee configuration
  app.put("/api/admin/fees/config", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { key, value, description } = req.body;
      
      if (!key || value === undefined) {
        return res.status(400).json({ error: "Key and value are required" });
      }
      
      // Validate value is a valid number for fee configs
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        return res.status(400).json({ error: "Value must be a non-negative number" });
      }
      
      const updated = await storage.setPlatformConfig(key, value.toString(), description, userId);
      res.json(updated);
    } catch (error) {
      console.error("Update fee config error:", error);
      res.status(500).json({ error: "Failed to update fee configuration" });
    }
  });

  // Admin: Get all platform config
  app.get("/api/admin/fees/config", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const configs = await storage.getAllPlatformConfig();
      res.json(configs);
    } catch (error) {
      console.error("Get admin config error:", error);
      res.status(500).json({ error: "Failed to get configuration" });
    }
  });

  // Admin: Get fee analytics
  app.get("/api/admin/fees/analytics", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { startDate, endDate } = req.query;
      const analytics = await storage.getFeeAnalytics(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(analytics);
    } catch (error) {
      console.error("Get fee analytics error:", error);
      res.status(500).json({ error: "Failed to get fee analytics" });
    }
  });

  // Get user's fee history
  app.get("/api/fees/history", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const fees = await storage.getFeesByUser(userId, limit);
      res.json(fees);
    } catch (error) {
      console.error("Get fee history error:", error);
      res.status(500).json({ error: "Failed to get fee history" });
    }
  });

  return httpServer;
}
