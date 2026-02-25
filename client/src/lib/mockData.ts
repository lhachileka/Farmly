import { LucideIcon, Leaf, Wheat, Truck, Sprout, Tractor, Package, MapPin, Star, ShieldCheck } from "lucide-react";
import vegImage from "@assets/generated_images/fresh_organic_vegetables_in_woven_basket.png";
import livestockImage from "@assets/generated_images/healthy_livestock_on_green_pasture.png";
import grainImage from "@assets/generated_images/grains_and_cereals_harvest_close-up.png";

export interface User {
  id: string;
  name: string;
  role: "farmer" | "buyer" | "transporter" | "admin";
  location: string;
  rating: number;
  verified: boolean;
  avatar?: string;
  joinedDate: string;
}

export interface Listing {
  id: string;
  title: string;
  category: "produce" | "livestock" | "grains" | "processed";
  price: number;
  unit: string;
  quantity: number;
  minOrder: number;
  description: string;
  sellerId: string;
  seller: User;
  images: string[];
  location: string;
  harvestDate: string;
  organic: boolean;
  featured?: boolean;
}

export const USERS: User[] = [
  {
    id: "u1",
    name: "Kwame Osei",
    role: "farmer",
    location: "Lusaka, Zambia",
    rating: 4.8,
    verified: true,
    joinedDate: "2023-01-15",
  },
  {
    id: "u2",
    name: "Sarah Mwangi",
    role: "buyer",
    location: "Ndola, Zambia",
    rating: 4.9,
    verified: true,
    joinedDate: "2023-03-22",
  },
  {
    id: "u3",
    name: "Green Valley Farms",
    role: "farmer",
    location: "Kitwe, Zambia",
    rating: 4.6,
    verified: true,
    joinedDate: "2023-05-10",
  },
];

export const CATEGORIES = [
  { id: "produce", name: "Fresh Produce", icon: Sprout, image: vegImage },
  { id: "livestock", name: "Livestock", icon: Tractor, image: livestockImage },
  { id: "grains", name: "Grains & Cereals", icon: Wheat, image: grainImage },
  { id: "logistics", name: "Transport", icon: Truck },
];

export const LISTINGS: Listing[] = [
  {
    id: "l1",
    title: "Organic Red Tomatoes",
    category: "produce",
    price: 450,
    unit: "crate",
    quantity: 50,
    minOrder: 5,
    description: "Freshly harvested organic tomatoes. Vine-ripened and perfect for sauces or salads. Grown without synthetic pesticides.",
    sellerId: "u1",
    seller: USERS[0],
    images: [vegImage],
    location: "Lusaka, Zambia",
    harvestDate: "2025-05-20",
    organic: true,
    featured: true,
  },
  {
    id: "l2",
    title: "Premium White Maize",
    category: "grains",
    price: 120,
    unit: "kg",
    quantity: 5000,
    minOrder: 100,
    description: "High-quality dried maize suitable for milling. Moisture content < 13%.",
    sellerId: "u3",
    seller: USERS[2],
    images: [grainImage],
    location: "Kitwe, Zambia",
    harvestDate: "2025-04-15",
    organic: false,
    featured: true,
  },
  {
    id: "l3",
    title: "Boer Goats (Live)",
    category: "livestock",
    price: 15000,
    unit: "head",
    quantity: 20,
    minOrder: 1,
    description: "Healthy Boer goats, vaccinated and vet-checked. Ideal for breeding or meat.",
    sellerId: "u1",
    seller: USERS[0],
    images: [livestockImage],
    location: "Lusaka, Zambia",
    harvestDate: "Available Now",
    organic: true,
  },
  {
    id: "l4",
    title: "Yellow Cassava Tubers",
    category: "produce",
    price: 80,
    unit: "kg",
    quantity: 2000,
    minOrder: 50,
    description: "Vitamin A fortified yellow cassava. Fresh from the farm.",
    sellerId: "u3",
    seller: USERS[2],
    images: ["https://images.unsplash.com/photo-1596450537702-86c00030560f?auto=format&fit=crop&q=80&w=800"],
    location: "Kitwe, Zambia",
    harvestDate: "2025-05-22",
    organic: true,
  },
  {
    id: "l5",
    title: "Local Rice (Polished)",
    category: "grains",
    price: 45000,
    unit: "50kg bag",
    quantity: 100,
    minOrder: 10,
    description: "Stone-free, polished local rice. Sweet aroma and great taste.",
    sellerId: "u3",
    seller: USERS[2],
    images: [grainImage],
    location: "Ndola, Zambia",
    harvestDate: "2025-03-10",
    organic: false,
  },
  {
    id: "l6",
    title: "Free Range Chickens",
    category: "livestock",
    price: 3500,
    unit: "bird",
    quantity: 200,
    minOrder: 20,
    description: "Healthy free-range chickens, fed with organic feed.",
    sellerId: "u1",
    seller: USERS[0],
    images: ["https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=800"],
    location: "Lusaka, Zambia",
    harvestDate: "Available Now",
    organic: true,
  },
];
