import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/admin/seed-products — seed or update products with correct images + vendors
export async function POST() {
  const restaurants = await prisma.restaurant.findMany({ where: { isActive: true }, take: 5 });
  if (restaurants.length === 0) {
    return NextResponse.json({ success: false, error: "No active restaurants found" }, { status: 400 });
  }

  // Create a marketplace vendor for non-food items if none exists
  let marketVendor = await prisma.restaurant.findFirst({ where: { name: "ChopDrop Market" } });
  if (!marketVendor) {
    marketVendor = await prisma.restaurant.create({
      data: { name: "ChopDrop Market", address: "Lagos, Nigeria", phone: "08000000000", isActive: true, sortOrder: 99 },
    });
  }

  const food1 = restaurants[0].id;
  const food2 = restaurants[1]?.id || food1;
  const food3 = restaurants[2]?.id || food1;
  const market = marketVendor.id;

  const products = [
    // ═══ FOOD — real Nigerian food photos ═══
    { vendorId: food1, name: "Jollof Rice & Chicken", description: "Smokey party jollof with grilled chicken, coleslaw, and fried plantain.", imageUrl: "https://images.unsplash.com/photo-1575299899797-a2abc99b0842?w=600&q=80&fit=crop", category: "Food", subcategory: "Rice", retailPrice: 450000, groupPrice: 337500, minPoolSize: 5, tags: "trending,popular", sortOrder: 1 },
    { vendorId: food1, name: "Fried Rice & Turkey", description: "Special fried rice with seasoned turkey and mixed vegetables.", imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80&fit=crop", category: "Food", subcategory: "Rice", retailPrice: 500000, groupPrice: 375000, minPoolSize: 5, tags: "popular", sortOrder: 2 },
    { vendorId: food2, name: "Pounded Yam & Egusi", description: "Smooth pounded yam with rich egusi soup, assorted meat, and spinach.", imageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80&fit=crop", category: "Food", subcategory: "Swallow", retailPrice: 550000, groupPrice: 412500, minPoolSize: 5, tags: "trending", sortOrder: 3 },
    { vendorId: food2, name: "Suya Platter", description: "Spicy grilled beef suya with onions, tomatoes, and yaji pepper.", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80&fit=crop", category: "Food", subcategory: "Grills", retailPrice: 350000, groupPrice: 262500, minPoolSize: 5, tags: "popular", sortOrder: 4 },
    { vendorId: food1, name: "Chicken Shawarma", description: "Loaded chicken shawarma wrap with coleslaw, mayo, and spicy sauce.", imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80&fit=crop", category: "Food", subcategory: "Wraps", retailPrice: 390000, groupPrice: 292500, minPoolSize: 5, tags: "trending", sortOrder: 5 },
    { vendorId: food3, name: "Veggie Power Bowl", description: "Brown rice, grilled vegetables, avocado, chickpeas, and tahini dressing.", imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80&fit=crop", category: "Food", subcategory: "Bowls", retailPrice: 400000, groupPrice: 300000, minPoolSize: 5, tags: "new,healthy", sortOrder: 6 },
    { vendorId: food3, name: "Pepper Soup", description: "Spicy goat meat pepper soup. The ultimate comfort food.", imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80&fit=crop", category: "Food", subcategory: "Soup", retailPrice: 480000, groupPrice: 360000, minPoolSize: 5, tags: "popular", sortOrder: 7 },
    { vendorId: food2, name: "Grilled Fish & Plantain", description: "Whole grilled tilapia with fried plantain and pepper sauce.", imageUrl: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=600&q=80&fit=crop", category: "Food", subcategory: "Fish", retailPrice: 600000, groupPrice: 450000, minPoolSize: 5, tags: "trending", sortOrder: 8 },

    // ═══ ELECTRONICS — from ChopDrop Market ═══
    { vendorId: market, name: "Samsung Galaxy Buds3", description: "Active noise cancellation, 30h battery life, IP57 water resistant.", imageUrl: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&q=80&fit=crop", category: "Electronics", subcategory: "Audio", retailPrice: 4500000, groupPrice: 2925000, minPoolSize: 15, tags: "trending,new", sortOrder: 1 },
    { vendorId: market, name: "Anker PowerBank 20K", description: "Fast charging, dual USB-C ports, slim design. Essential for Lagos.", imageUrl: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&q=80&fit=crop", category: "Electronics", subcategory: "Accessories", retailPrice: 1800000, groupPrice: 1170000, minPoolSize: 20, tags: "popular", sortOrder: 2 },
    { vendorId: market, name: "Wireless Mouse", description: "Bluetooth, silent clicks, 18-month battery. Works on any surface.", imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80&fit=crop", category: "Electronics", subcategory: "Accessories", retailPrice: 1200000, groupPrice: 780000, minPoolSize: 15, tags: "new", sortOrder: 3 },
    { vendorId: market, name: "USB-C Hub 7-in-1", description: "HDMI, USB 3.0, SD card, ethernet. Essential for laptop users.", imageUrl: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=600&q=80&fit=crop", category: "Electronics", subcategory: "Accessories", retailPrice: 2500000, groupPrice: 1625000, minPoolSize: 20, tags: "popular", sortOrder: 4 },

    // ═══ FASHION — from ChopDrop Market ═══
    { vendorId: market, name: "Ankara Print Shirt", description: "Premium cotton ankara. Modern slim fit. Multiple patterns available.", imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80&fit=crop", category: "Fashion", subcategory: "Men", retailPrice: 800000, groupPrice: 520000, minPoolSize: 10, tags: "new,trending", sortOrder: 1 },
    { vendorId: market, name: "Leather Office Belt", description: "Genuine leather belt, automatic buckle. Brown and black available.", imageUrl: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&q=80&fit=crop", category: "Fashion", subcategory: "Accessories", retailPrice: 500000, groupPrice: 325000, minPoolSize: 15, tags: "popular", sortOrder: 2 },
    { vendorId: market, name: "Canvas Tote Bag", description: "Durable canvas for work and weekends. Laptop compartment. Made in Lagos.", imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80&fit=crop", category: "Fashion", subcategory: "Bags", retailPrice: 600000, groupPrice: 390000, minPoolSize: 12, tags: "new", sortOrder: 3 },

    // ═══ GROCERIES — from food vendors ═══
    { vendorId: food3, name: "Office Snack Box", description: "Chin chin, plantain chips, peanuts, biscuits, juice. Feeds 4-5 people.", imageUrl: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&q=80&fit=crop", category: "Groceries", subcategory: "Snacks", retailPrice: 350000, groupPrice: 227500, minPoolSize: 10, tags: "popular,trending", sortOrder: 1 },
    { vendorId: food3, name: "Fresh Fruit Basket", description: "Seasonal fruits: oranges, bananas, apples, pineapple, watermelon.", imageUrl: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&q=80&fit=crop", category: "Groceries", subcategory: "Fresh", retailPrice: 450000, groupPrice: 315000, minPoolSize: 8, tags: "healthy,new", sortOrder: 2 },
    { vendorId: food3, name: "5L Groundnut Oil", description: "Pure Nigerian groundnut oil. Premium cold-pressed.", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80&fit=crop", category: "Groceries", subcategory: "Pantry", retailPrice: 700000, groupPrice: 490000, minPoolSize: 20, tags: "popular", sortOrder: 3 },
  ];

  // Delete ALL existing products and reseed cleanly
  await prisma.product.deleteMany({});

  let created = 0;
  for (const p of products) {
    await prisma.product.create({ data: p });
    created++;
  }

  return NextResponse.json({ success: true, message: `Reseeded ${created} products cleanly`, count: created });
}
