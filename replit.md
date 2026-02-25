# Farmly - Agricultural Marketplace Platform

## Overview

Farmly is a digital agricultural marketplace that connects verified farmers directly with bulk buyers, eliminating middlemen. The platform supports trading of produce, livestock, and grains with features including secure escrow payments, logistics coordination, real-time price insights, and a bidding system.

The application is built as a full-stack TypeScript project with a React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state management and caching
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Theming**: next-themes for dark/light mode support
- **Charts**: Recharts for data visualization on the insights page

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints under `/api` prefix
- **Session Management**: Express sessions with connect-pg-simple for PostgreSQL session storage

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all database table definitions
- **Migrations**: Drizzle Kit for database migrations (`drizzle-kit push`)
- **Validation**: Zod schemas generated from Drizzle schemas using drizzle-zod

### Key Data Models
- **Users**: Supports roles (farmer, buyer, transporter, admin) with verification status
- **Listings**: Product listings with categories (produce, livestock, grains, processed)
- **Bids**: Buyer bids on listings with status tracking
- **Reviews**: User-to-user review system
- **Transport Requests**: Logistics coordination between users
- **Price History**: Historical price tracking for market insights
- **Demand Forecasts**: Buyer-created future demand declarations with frequency (weekly/monthly/one-off), quality grade preferences, target pricing, and date ranges
- **Forecast Responses**: Seller responses to forecasts with indicative quantities and proposed prices
- **Forecast Conversions**: Records of accepted responses converted to subscriptions or contracts
- **User Favourites**: Trusted trading partners system - users can add farmers, buyers, or transporters as favourites after completing a transaction
- **Transport Cost Splits**: Cost sharing system for transport between buyer and farmer with configurable percentages and escrow funding tracking

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # UI components including shadcn/ui
│   │   ├── pages/        # Route page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities and API client
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database access layer
│   └── db.ts         # Database connection
├── shared/           # Shared code between client/server
│   └── schema.ts     # Drizzle database schema
└── migrations/       # Database migrations
```

### Build System
- Development uses Vite dev server with HMR
- Production build uses esbuild for server bundling and Vite for client
- Server dependencies are selectively bundled to optimize cold start times

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### UI Components
- **Radix UI**: Headless UI primitives for accessible components
- **shadcn/ui**: Pre-built component library built on Radix
- **Lucide React**: Icon library

### Data Fetching
- **TanStack Query**: Server state management with caching and refetching

### Development Tools
- **Vite**: Frontend build tool and dev server
- **esbuild**: Server bundling for production
- **TypeScript**: Type checking across the entire codebase

### Replit-Specific
- Custom Vite plugins for Replit integration (dev banner, cartographer, runtime error overlay)
- Meta images plugin for OpenGraph image handling