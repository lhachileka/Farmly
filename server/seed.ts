import { db } from "./db";
import { users, listings, bids, reviews, transportRequests, priceHistory } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  const sampleUsers = [
    {
      username: "farmer_john",
      password: "password123",
      name: "John Mwamba",
      role: "farmer" as const,
      location: "Lusaka",
      phone: "+260 977 123 456",
      email: "john@farmly.zm",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
      rating: "4.8",
      verified: true,
    },
    {
      username: "mary_buyer",
      password: "password123",
      name: "Mary Banda",
      role: "buyer" as const,
      location: "Ndola",
      phone: "+260 966 234 567",
      email: "mary@farmly.zm",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mary",
      rating: "4.5",
      verified: true,
    },
    {
      username: "transport_david",
      password: "password123",
      name: "David Phiri",
      role: "transporter" as const,
      location: "Kitwe",
      phone: "+260 955 345 678",
      email: "david@farmly.zm",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
      rating: "4.9",
      verified: true,
    },
    {
      username: "farmer_grace",
      password: "password123",
      name: "Grace Tembo",
      role: "farmer" as const,
      location: "Lusaka",
      phone: "+260 977 456 789",
      email: "grace@farmly.zm",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Grace",
      rating: "4.7",
      verified: true,
    },
    {
      username: "buyer_peter",
      password: "password123",
      name: "Peter Kasonde",
      role: "buyer" as const,
      location: "Kitwe",
      phone: "+260 966 567 890",
      email: "peter@farmly.zm",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Peter",
      rating: "4.6",
      verified: false,
    },
    {
      username: "admin_farmly",
      password: "password123",
      name: "Farmly Admin",
      role: "admin" as const,
      location: "Lusaka",
      phone: "+260 977 000 000",
      email: "admin@farmly.zm",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
      rating: "5.0",
      verified: true,
    },
  ];

  const insertedUsers = await db.insert(users).values(sampleUsers).returning();
  console.log(`✅ Created ${insertedUsers.length} users`);

  const farmer1 = insertedUsers[0];
  const buyer1 = insertedUsers[1];
  const transporter1 = insertedUsers[2];
  const farmer2 = insertedUsers[3];
  const buyer2 = insertedUsers[4];

  const sampleListings = [
    {
      title: "Fresh Tomatoes - Premium Quality",
      description: "Organically grown tomatoes, freshly harvested. Perfect for restaurants and retailers. Firm, ripe, and full of flavor.",
      category: "produce" as const,
      price: 25,
      unit: "kg",
      quantity: 500,
      minOrder: 20,
      location: "Lusaka",
      harvestDate: "2026-01-10",
      organic: true,
      images: [
        "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400",
        "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400"
      ],
      status: "active" as const,
      sellerId: farmer1.id,
      featured: true,
    },
    {
      title: "White Maize - Grade A",
      description: "High-quality white maize from our farms. Suitable for milling and commercial use. Well dried and stored.",
      category: "grains" as const,
      price: 3500,
      unit: "50kg bag",
      quantity: 200,
      minOrder: 10,
      location: "Lusaka",
      harvestDate: "2025-12-15",
      organic: false,
      images: [
        "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400"
      ],
      status: "active" as const,
      sellerId: farmer1.id,
      featured: true,
    },
    {
      title: "Live Chickens - Broilers",
      description: "Healthy broiler chickens ready for market. Well-fed and disease-free. Perfect weight for consumption.",
      category: "livestock" as const,
      price: 85,
      unit: "per chicken",
      quantity: 300,
      minOrder: 50,
      location: "Ndola",
      harvestDate: "2026-01-14",
      organic: false,
      images: [
        "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400"
      ],
      status: "active" as const,
      sellerId: farmer2.id,
      featured: true,
    },
    {
      title: "Fresh Cabbage - Green",
      description: "Crisp and fresh green cabbage. Great for salads and cooking. Grown without pesticides.",
      category: "produce" as const,
      price: 15,
      unit: "kg",
      quantity: 800,
      minOrder: 30,
      location: "Kitwe",
      harvestDate: "2026-01-12",
      organic: true,
      images: [
        "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400"
      ],
      status: "active" as const,
      sellerId: farmer2.id,
      featured: false,
    },
    {
      title: "Irish Potatoes - Medium Size",
      description: "Fresh Irish potatoes ideal for chips and cooking. Clean, washed and ready for market.",
      category: "produce" as const,
      price: 18,
      unit: "kg",
      quantity: 1000,
      minOrder: 50,
      location: "Lusaka",
      harvestDate: "2026-01-08",
      organic: false,
      images: [
        "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400"
      ],
      status: "active" as const,
      sellerId: farmer1.id,
      featured: false,
    },
    {
      title: "Honey - Pure & Natural",
      description: "100% pure natural honey from our bee farms. No additives, unprocessed and rich in nutrients.",
      category: "processed" as const,
      price: 120,
      unit: "1L bottle",
      quantity: 150,
      minOrder: 5,
      location: "Lusaka",
      harvestDate: "2025-12-20",
      organic: true,
      images: [
        "https://images.unsplash.com/photo-1587049352846-4a222e784720?w=400"
      ],
      status: "active" as const,
      sellerId: farmer2.id,
      featured: true,
    },
  ];

  const insertedListings = await db.insert(listings).values(sampleListings).returning();
  console.log(`✅ Created ${insertedListings.length} listings`);

  const sampleBids = [
    {
      listingId: insertedListings[0].id,
      buyerId: buyer1.id,
      amount: 24,
      quantity: 100,
      message: "Can we negotiate on bulk orders?",
      status: "pending" as const,
    },
    {
      listingId: insertedListings[0].id,
      buyerId: buyer2.id,
      amount: 25,
      quantity: 50,
      message: "I'll take 50kg at your asking price",
      status: "accepted" as const,
    },
    {
      listingId: insertedListings[1].id,
      buyerId: buyer1.id,
      amount: 3400,
      quantity: 20,
      message: "Interested in regular supply",
      status: "pending" as const,
    },
    {
      listingId: insertedListings[2].id,
      buyerId: buyer2.id,
      amount: 80,
      quantity: 100,
      message: "Need 100 chickens for my restaurant",
      status: "pending" as const,
    },
  ];

  const insertedBids = await db.insert(bids).values(sampleBids).returning();
  console.log(`✅ Created ${insertedBids.length} bids`);

  const sampleReviews = [
    {
      reviewerId: buyer1.id,
      revieweeId: farmer1.id,
      listingId: insertedListings[0].id,
      rating: 5,
      comment: "Excellent quality tomatoes! Very fresh and well packaged.",
    },
    {
      reviewerId: buyer2.id,
      revieweeId: farmer1.id,
      listingId: insertedListings[1].id,
      rating: 5,
      comment: "Good maize quality, delivery was on time.",
    },
    {
      reviewerId: buyer1.id,
      revieweeId: farmer2.id,
      listingId: insertedListings[2].id,
      rating: 4,
      comment: "Healthy chickens, slightly delayed delivery but worth the wait.",
    },
    {
      reviewerId: farmer1.id,
      revieweeId: buyer1.id,
      rating: 5,
      comment: "Professional buyer, quick payment and easy to work with.",
    },
  ];

  const insertedReviews = await db.insert(reviews).values(sampleReviews).returning();
  console.log(`✅ Created ${insertedReviews.length} reviews`);

  const sampleTransportRequests = [
    {
      listingId: insertedListings[0].id,
      requesterId: buyer1.id,
      transporterId: transporter1.id,
      pickupLocation: "Lusaka - Farm Area",
      deliveryLocation: "Ndola - City Market",
      vehicleType: "Pickup Truck",
      cargoType: "Fresh Produce",
      preferredDate: "2026-01-18",
      estimatedDistance: 320,
      estimatedCost: 1500,
      status: "in_transit" as const,
    },
    {
      listingId: insertedListings[1].id,
      requesterId: buyer2.id,
      pickupLocation: "Lusaka - Grain Storage",
      deliveryLocation: "Kitwe - Warehouse",
      vehicleType: "Lorry",
      cargoType: "Grains",
      preferredDate: "2026-01-20",
      estimatedDistance: 350,
      estimatedCost: 2500,
      status: "pending" as const,
    },
  ];

  const insertedTransport = await db.insert(transportRequests).values(sampleTransportRequests).returning();
  console.log(`✅ Created ${insertedTransport.length} transport requests`);

  const generatePriceHistory = (commodity: string, category: string, region: string, basePrice: number) => {
    const history = [];
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const variance = (Math.random() - 0.5) * 0.2;
      const price = Math.round(basePrice * (1 + variance));
      
      history.push({
        commodity,
        category: category as any,
        region,
        price,
        unit: "kg",
        recordedAt: date,
      });
    }
    
    return history;
  };

  const priceHistoryData = [
    ...generatePriceHistory("Tomatoes", "produce", "Lusaka", 25),
    ...generatePriceHistory("Tomatoes", "produce", "Ndola", 27),
    ...generatePriceHistory("Cabbage", "produce", "Lusaka", 15),
    ...generatePriceHistory("Cabbage", "produce", "Kitwe", 16),
    ...generatePriceHistory("Maize", "grains", "Lusaka", 70),
    ...generatePriceHistory("Maize", "grains", "Ndola", 72),
    ...generatePriceHistory("Potatoes", "produce", "Lusaka", 18),
    ...generatePriceHistory("Chicken", "livestock", "Ndola", 85),
  ];

  await db.insert(priceHistory).values(priceHistoryData);
  console.log(`✅ Created ${priceHistoryData.length} price history records`);

  console.log("✨ Database seeded successfully!");
}

seed()
  .catch((error) => {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
