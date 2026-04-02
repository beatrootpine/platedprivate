export const SPECIALITIES = [
  "Fine Dining", "African Cuisine", "Asian Fusion", "Mediterranean",
  "BBQ & Braai", "Vegan & Plant-Based", "French Classical", "Italian",
  "Pastry & Desserts", "Seafood", "Indian", "Mexican & Latin",
  "Farm-to-Table", "Molecular Gastronomy", "Comfort Food"
]

export const SA_AREAS = [
  "Sandton", "Rosebank", "Fourways", "Bryanston", "Houghton",
  "Waterfall", "Midrand", "Centurion", "Pretoria East", "Menlyn",
  "Stellenbosch", "Camps Bay", "Constantia", "Umhlanga", "Ballito",
  "Bedfordview", "Benoni", "Boksburg", "Kempton Park", "Alberton"
]

export const MOCK_CHEFS = [
  {
    id: 1, name: "Thabo Molefe", photo: null,
    speciality: ["African Cuisine", "Fine Dining"], rate: 650,
    minHours: 3, areas: ["Sandton", "Rosebank", "Houghton", "Fourways"],
    rating: 4.9, reviews: 47, qualified: true,
    qualType: "Prue Leith Chef's Academy",
    bio: "Award-winning chef blending traditional African flavours with modern fine dining techniques. 12 years of experience in top Johannesburg restaurants.",
    verified: true, available: true
  },
  {
    id: 2, name: "Lerato Dlamini", photo: null,
    speciality: ["Vegan & Plant-Based", "Farm-to-Table"], rate: 500,
    minHours: 2, areas: ["Pretoria East", "Menlyn", "Centurion", "Midrand"],
    rating: 4.7, reviews: 31, qualified: true,
    qualType: "Capsicum Culinary Studio",
    bio: "Passionate about sustainable, plant-forward cooking. Every dish tells a story of the land it came from.",
    verified: true, available: true
  },
  {
    id: 3, name: "Marco van der Berg", photo: null,
    speciality: ["French Classical", "Mediterranean"], rate: 800,
    minHours: 4, areas: ["Constantia", "Camps Bay", "Stellenbosch"],
    rating: 4.8, reviews: 63, qualified: true,
    qualType: "Le Cordon Bleu (Paris)",
    bio: "Classically trained in Paris, now bringing European elegance to South African tables. Specialising in intimate dinner parties.",
    verified: true, available: true
  },
  {
    id: 4, name: "Nomsa Khumalo", photo: null,
    speciality: ["Comfort Food", "BBQ & Braai"], rate: 400,
    minHours: 2, areas: ["Bedfordview", "Benoni", "Boksburg", "Alberton", "Kempton Park"],
    rating: 4.6, reviews: 22, qualified: false,
    qualType: "Self-Taught · 8 years exp",
    bio: "Self-taught cook with 8 years of private chef experience. My food is made with love and tastes like home.",
    verified: true, available: true
  },
  {
    id: 5, name: "Priya Naidoo", photo: null,
    speciality: ["Indian", "Asian Fusion"], rate: 550,
    minHours: 3, areas: ["Umhlanga", "Ballito", "Sandton", "Fourways"],
    rating: 4.9, reviews: 55, qualified: true,
    qualType: "International Hotel School",
    bio: "Bringing the rich spice traditions of India with a modern South African twist. From street food to silver service.",
    verified: true, available: true
  },
  {
    id: 6, name: "James Okafor", photo: null,
    speciality: ["Seafood", "Mediterranean"], rate: 700,
    minHours: 3, areas: ["Camps Bay", "Constantia", "Stellenbosch", "Rosebank"],
    rating: 4.5, reviews: 18, qualified: true,
    qualType: "SA Chefs Academy",
    bio: "Fresh-catch specialist with deep roots in West African and Mediterranean coastal cuisines.",
    verified: true, available: false
  },
  {
    id: 7, name: "Zanele Mthembu", photo: null,
    speciality: ["Pastry & Desserts", "Fine Dining"], rate: 600,
    minHours: 3, areas: ["Sandton", "Houghton", "Rosebank", "Bryanston"],
    rating: 4.8, reviews: 39, qualified: true,
    qualType: "Cape Town Hotel School",
    bio: "Pastry is my love language. From show-stopping wedding cakes to delicate petit fours, I create edible art.",
    verified: true, available: true
  },
  {
    id: 8, name: "Ruan Botha", photo: null,
    speciality: ["BBQ & Braai", "Comfort Food"], rate: 450,
    minHours: 2, areas: ["Centurion", "Pretoria East", "Midrand", "Waterfall"],
    rating: 4.4, reviews: 15, qualified: false,
    qualType: "Self-Taught · 5 years exp",
    bio: "Born and raised at the braai. I bring the authentic South African fire-cooking experience to your backyard.",
    verified: true, available: true
  }
]

export const MOCK_BOOKINGS = [
  { id: "PP-001", client: "Sarah M.", chef: "Thabo Molefe", date: "2026-04-10", hours: 4, rate: 650, guests: 8, status: "confirmed", total: 2600, commission: 390 },
  { id: "PP-002", client: "David K.", chef: "Priya Naidoo", date: "2026-04-12", hours: 3, rate: 550, guests: 6, status: "pending", total: 1650, commission: 247.5 },
  { id: "PP-003", client: "Linda V.", chef: "Marco van der Berg", date: "2026-04-08", hours: 5, rate: 800, guests: 12, status: "completed", total: 4000, commission: 600 },
  { id: "PP-004", client: "Sipho N.", chef: "Nomsa Khumalo", date: "2026-04-15", hours: 3, rate: 400, guests: 4, status: "confirmed", total: 1200, commission: 180 },
  { id: "PP-005", client: "Emma R.", chef: "Lerato Dlamini", date: "2026-04-05", hours: 4, rate: 500, guests: 10, status: "completed", total: 2000, commission: 300 },
  { id: "PP-006", client: "Andile M.", chef: "Zanele Mthembu", date: "2026-04-18", hours: 4, rate: 600, guests: 6, status: "pending", total: 2400, commission: 360 },
  { id: "PP-007", client: "Gerhard T.", chef: "Ruan Botha", date: "2026-04-20", hours: 3, rate: 450, guests: 15, status: "confirmed", total: 1350, commission: 202.5 },
]

export const PLATFORM_FEE = 0.15
