CREATE TYPE "public"."forecast_conversion_type" AS ENUM('subscription', 'contract', 'coop', 'order');--> statement-breakpoint
CREATE TYPE "public"."forecast_frequency" AS ENUM('weekly', 'monthly', 'one_off');--> statement-breakpoint
CREATE TYPE "public"."forecast_response_status" AS ENUM('pending', 'accepted', 'rejected', 'converted');--> statement-breakpoint
CREATE TYPE "public"."forecast_status" AS ENUM('active', 'fulfilled', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transport_dispute_reason" AS ENUM('late_delivery', 'missing_proof', 'damaged_goods', 'no_show', 'wrong_quantity', 'wrong_location', 'vehicle_breakdown', 'other');--> statement-breakpoint
CREATE TYPE "public"."transport_dispute_status" AS ENUM('open', 'under_review', 'resolved_transporter', 'resolved_buyer', 'resolved_seller', 'resolved_partial', 'closed');--> statement-breakpoint
CREATE TYPE "public"."transport_escrow_status" AS ENUM('pending', 'held', 'released', 'refunded', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."transport_job_status" AS ENUM('open', 'assigned', 'pickup_pending', 'pickup_verified', 'in_transit', 'delivered', 'completed', 'disputed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transport_offer_status" AS ENUM('pending', 'accepted', 'rejected', 'withdrawn', 'expired');--> statement-breakpoint
CREATE TYPE "public"."transport_proof_type" AS ENUM('pickup', 'delivery');--> statement-breakpoint
CREATE TYPE "public"."transport_subscription_frequency" AS ENUM('weekly', 'biweekly', 'monthly');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'forecast_response';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'response_accepted';--> statement-breakpoint
CREATE TABLE "demand_forecasts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" varchar NOT NULL,
	"product_name" text NOT NULL,
	"category" "category" NOT NULL,
	"quantity" integer NOT NULL,
	"unit" text DEFAULT 'kg' NOT NULL,
	"frequency" "forecast_frequency" DEFAULT 'one_off' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"preferred_grade" "grade" DEFAULT 'B',
	"target_price" integer,
	"location" text NOT NULL,
	"notes" text,
	"status" "forecast_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forecast_conversions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"forecast_id" varchar NOT NULL,
	"response_id" varchar,
	"conversion_type" "forecast_conversion_type" NOT NULL,
	"reference_id" varchar NOT NULL,
	"converted_quantity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forecast_responses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"forecast_id" varchar NOT NULL,
	"seller_id" varchar NOT NULL,
	"indicative_quantity" integer NOT NULL,
	"proposed_price" integer NOT NULL,
	"message" text,
	"status" "forecast_response_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transport_disputes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"raised_by" varchar NOT NULL,
	"against_user_id" varchar NOT NULL,
	"reason" "transport_dispute_reason" NOT NULL,
	"description" text NOT NULL,
	"evidence" text[] DEFAULT ARRAY[]::text[],
	"status" "transport_dispute_status" DEFAULT 'open' NOT NULL,
	"resolved_by" varchar,
	"resolution" text,
	"penalty_amount" integer,
	"penalty_applied_to" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "transport_escrows" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"amount" integer NOT NULL,
	"status" "transport_escrow_status" DEFAULT 'pending' NOT NULL,
	"paid_by" varchar,
	"paid_at" timestamp,
	"released_to" varchar,
	"released_at" timestamp,
	"release_reason" text,
	"refunded_to" varchar,
	"refunded_at" timestamp,
	"refund_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transport_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar,
	"buyer_id" varchar NOT NULL,
	"seller_id" varchar NOT NULL,
	"transporter_id" varchar,
	"pickup_location" text NOT NULL,
	"pickup_address" text,
	"delivery_location" text NOT NULL,
	"delivery_address" text,
	"product_type" text NOT NULL,
	"product_description" text,
	"quantity" integer NOT NULL,
	"unit" text DEFAULT 'kg' NOT NULL,
	"weight" integer,
	"pickup_date" text NOT NULL,
	"delivery_deadline" text NOT NULL,
	"suggested_price" integer NOT NULL,
	"agreed_price" integer,
	"estimated_distance" integer,
	"vehicle_type" text,
	"status" "transport_job_status" DEFAULT 'open' NOT NULL,
	"assigned_at" timestamp,
	"picked_up_at" timestamp,
	"delivered_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transport_offers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"transporter_id" varchar NOT NULL,
	"offered_price" integer NOT NULL,
	"message" text,
	"estimated_pickup_time" text,
	"vehicle_type" text,
	"status" "transport_offer_status" DEFAULT 'pending' NOT NULL,
	"responded_by" varchar,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "transport_proofs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"transporter_id" varchar NOT NULL,
	"proof_type" "transport_proof_type" NOT NULL,
	"photos" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"gps_latitude" numeric(10, 8),
	"gps_longitude" numeric(11, 8),
	"gps_address" text,
	"signature" text,
	"signed_by" text,
	"condition_notes" text,
	"damage_reported" boolean DEFAULT false NOT NULL,
	"damage_description" text,
	"damage_photos" text[] DEFAULT ARRAY[]::text[],
	"verified" boolean DEFAULT false NOT NULL,
	"verified_by" varchar,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transport_ratings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"transporter_id" varchar NOT NULL,
	"rated_by" varchar NOT NULL,
	"rating" integer NOT NULL,
	"on_time_delivery" boolean,
	"good_condition" boolean,
	"professional_service" boolean,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transport_subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" varchar NOT NULL,
	"seller_id" varchar,
	"transporter_id" varchar NOT NULL,
	"pickup_location" text NOT NULL,
	"delivery_location" text NOT NULL,
	"frequency" "transport_subscription_frequency" NOT NULL,
	"day_of_week" integer,
	"day_of_month" integer,
	"preferred_time" text,
	"product_type" text NOT NULL,
	"estimated_quantity" integer,
	"unit" text DEFAULT 'kg',
	"agreed_price" integer NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text,
	"active" boolean DEFAULT true NOT NULL,
	"total_deliveries" integer DEFAULT 0 NOT NULL,
	"next_scheduled_date" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transporter_reliability" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transporter_id" varchar NOT NULL,
	"total_jobs" integer DEFAULT 0 NOT NULL,
	"completed_jobs" integer DEFAULT 0 NOT NULL,
	"cancelled_jobs" integer DEFAULT 0 NOT NULL,
	"on_time_delivery_rate" numeric(5, 2) DEFAULT '0',
	"damage_rate" numeric(5, 2) DEFAULT '0',
	"dispute_rate" numeric(5, 2) DEFAULT '0',
	"average_rating" numeric(3, 2) DEFAULT '0',
	"total_ratings" integer DEFAULT 0 NOT NULL,
	"reliability_score" integer DEFAULT 50 NOT NULL,
	"subscription_eligible" boolean DEFAULT false NOT NULL,
	"temporary_ban" boolean DEFAULT false NOT NULL,
	"ban_until" timestamp,
	"ban_reason" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transporter_reliability_transporter_id_unique" UNIQUE("transporter_id")
);
--> statement-breakpoint
ALTER TABLE "demand_forecasts" ADD CONSTRAINT "demand_forecasts_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_conversions" ADD CONSTRAINT "forecast_conversions_forecast_id_demand_forecasts_id_fk" FOREIGN KEY ("forecast_id") REFERENCES "public"."demand_forecasts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_conversions" ADD CONSTRAINT "forecast_conversions_response_id_forecast_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."forecast_responses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_responses" ADD CONSTRAINT "forecast_responses_forecast_id_demand_forecasts_id_fk" FOREIGN KEY ("forecast_id") REFERENCES "public"."demand_forecasts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_responses" ADD CONSTRAINT "forecast_responses_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_disputes" ADD CONSTRAINT "transport_disputes_job_id_transport_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."transport_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_disputes" ADD CONSTRAINT "transport_disputes_raised_by_users_id_fk" FOREIGN KEY ("raised_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_disputes" ADD CONSTRAINT "transport_disputes_against_user_id_users_id_fk" FOREIGN KEY ("against_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_disputes" ADD CONSTRAINT "transport_disputes_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_disputes" ADD CONSTRAINT "transport_disputes_penalty_applied_to_users_id_fk" FOREIGN KEY ("penalty_applied_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_escrows" ADD CONSTRAINT "transport_escrows_job_id_transport_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."transport_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_escrows" ADD CONSTRAINT "transport_escrows_paid_by_users_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_escrows" ADD CONSTRAINT "transport_escrows_released_to_users_id_fk" FOREIGN KEY ("released_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_escrows" ADD CONSTRAINT "transport_escrows_refunded_to_users_id_fk" FOREIGN KEY ("refunded_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_jobs" ADD CONSTRAINT "transport_jobs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_jobs" ADD CONSTRAINT "transport_jobs_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_jobs" ADD CONSTRAINT "transport_jobs_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_jobs" ADD CONSTRAINT "transport_jobs_transporter_id_users_id_fk" FOREIGN KEY ("transporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_offers" ADD CONSTRAINT "transport_offers_job_id_transport_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."transport_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_offers" ADD CONSTRAINT "transport_offers_transporter_id_users_id_fk" FOREIGN KEY ("transporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_offers" ADD CONSTRAINT "transport_offers_responded_by_users_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_proofs" ADD CONSTRAINT "transport_proofs_job_id_transport_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."transport_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_proofs" ADD CONSTRAINT "transport_proofs_transporter_id_users_id_fk" FOREIGN KEY ("transporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_proofs" ADD CONSTRAINT "transport_proofs_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_ratings" ADD CONSTRAINT "transport_ratings_job_id_transport_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."transport_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_ratings" ADD CONSTRAINT "transport_ratings_transporter_id_users_id_fk" FOREIGN KEY ("transporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_ratings" ADD CONSTRAINT "transport_ratings_rated_by_users_id_fk" FOREIGN KEY ("rated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_subscriptions" ADD CONSTRAINT "transport_subscriptions_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_subscriptions" ADD CONSTRAINT "transport_subscriptions_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_subscriptions" ADD CONSTRAINT "transport_subscriptions_transporter_id_users_id_fk" FOREIGN KEY ("transporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transporter_reliability" ADD CONSTRAINT "transporter_reliability_transporter_id_users_id_fk" FOREIGN KEY ("transporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;