import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/admin/seed-products — populate dummy products for testing
export async function POST() {
  // Get existing restaurants to use as vendors
  const restaurants = await prisma.restaurant.findMany({ where: { isActive: true }, take: 5 });

  if (restaurants.length === 0) {
    return NextResponse.json({ success: false, error: "No active restaurants. Create at least one restaurant first." }, { status: 400 });
  }

  const v1 = restaurants[0].id;
  const v2 = restaurants[1]?.id || v1;
  const v3 = restaurants[2]?.id || v1;

  const products = [
    // Food
    { vendorId: v1, name: "Jollof Rice & Chicken", description: "Smokey party jollof rice with grilled chicken drumstick, coleslaw, and plantain. The lunch everyone orders.", category: "Food", subcategory: "Rice", retailPrice: 450000, groupPrice: 292500, minPoolSize: 10, tags: "trending,popular", sortOrder: 1 },
    { vendorId: v1, name: "Fried Rice & Turkey", description: "Special fried rice with seasoned turkey, mixed vegetables, and a side of salad.", category: "Food", subcategory: "Rice", retailPrice: 500000, groupPrice: 325000, minPoolSize: 10, tags: "popular", sortOrder: 2 },
    { vendorId: v2, name: "Pounded Yam & Egusi Soup", description: "Smooth pounded yam with rich egusi soup loaded with assorted meat, stockfish, and spinach.", category: "Food", subcategory: "Swallow", retailPrice: 550000, groupPrice: 385000, minPoolSize: 8, tags: "trending", sortOrder: 3 },
    { vendorId: v2, name: "Suya Platter", description: "Spicy grilled beef suya with onions, tomatoes, and yaji pepper. Served with bread.", category: "Food", subcategory: "Grills", retailPrice: 350000, groupPrice: 227500, minPoolSize: 10, tags: "popular", sortOrder: 4 },
    { vendorId: v1, name: "Chicken Shawarma", description: "Loaded chicken shawarma wrap with coleslaw, mayo, and spicy sauce. Large size.", category: "Food", subcategory: "Wraps", retailPrice: 390000, groupPrice: 253500, minPoolSize: 10, tags: "trending", sortOrder: 5 },
    { vendorId: v3, name: "Veggie Power Bowl", description: "Brown rice, grilled vegetables, avocado, chickpeas, and tahini dressing. Healthy and filling.", category: "Food", subcategory: "Bowls", retailPrice: 400000, groupPrice: 280000, minPoolSize: 8, tags: "new,healthy", sortOrder: 6 },
    { vendorId: v3, name: "Pepper Soup & Fufu", description: "Spicy goat meat pepper soup with soft fufu. Perfect for cold days.", category: "Food", subcategory: "Soup", retailPrice: 480000, groupPrice: 336000, minPoolSize: 8, tags: "popular", sortOrder: 7 },
    { vendorId: v2, name: "Grilled Tilapia & Plantain", description: "Whole grilled tilapia fish with fried plantain and pepper sauce.", category: "Food", subcategory: "Fish", retailPrice: 600000, groupPrice: 390000, minPoolSize: 10, tags: "trending", sortOrder: 8 },

    // Electronics
    { vendorId: v1, name: "Samsung Galaxy Buds3", description: "Active noise cancellation, 30h battery, IP57 water resistant. Perfect for office and gym.", category: "Electronics", subcategory: "Audio", retailPrice: 4500000, groupPrice: 2925000, minPoolSize: 15, tags: "trending,new", sortOrder: 1 },
    { vendorId: v1, name: "Anker PowerBank 20000mAh", description: "Fast charging, dual USB-C ports, slim design. Never run out of battery.", category: "Electronics", subcategory: "Accessories", retailPrice: 1800000, groupPrice: 1170000, minPoolSize: 20, tags: "popular", sortOrder: 2 },
    { vendorId: v1, name: "Logitech M240 Silent Mouse", description: "Bluetooth, silent clicks, 18-month battery. Works on any surface.", category: "Electronics", subcategory: "Accessories", retailPrice: 1200000, groupPrice: 780000, minPoolSize: 15, tags: "new", sortOrder: 3 },
    { vendorId: v1, name: "USB-C Hub 7-in-1", description: "HDMI, USB 3.0, SD card, ethernet, PD charging. Essential for MacBook users.", category: "Electronics", subcategory: "Accessories", retailPrice: 2500000, groupPrice: 1625000, minPoolSize: 20, tags: "popular", sortOrder: 4 },

    // Fashion
    { vendorId: v2, name: "Ankara Print Shirt", description: "Premium cotton ankara shirt. Modern slim fit. Available in multiple patterns.", category: "Fashion", subcategory: "Men", retailPrice: 800000, groupPrice: 520000, minPoolSize: 10, tags: "new,trending", sortOrder: 1 },
    { vendorId: v2, name: "Leather Office Belt", description: "Genuine leather, automatic buckle. Fits waist 30-42. Brown and black available.", category: "Fashion", subcategory: "Accessories", retailPrice: 500000, groupPrice: 325000, minPoolSize: 15, tags: "popular", sortOrder: 2 },
    { vendorId: v2, name: "Canvas Tote Bag", description: "Durable canvas tote for work and weekends. Laptop compartment. Made in Lagos.", category: "Fashion", subcategory: "Bags", retailPrice: 600000, groupPrice: 390000, minPoolSize: 12, tags: "new", sortOrder: 3 },

    // Groceries
    { vendorId: v3, name: "Office Snack Box", description: "Curated box: chin chin, plantain chips, peanuts, biscuits, juice. Feeds 4-5 people.", category: "Groceries", subcategory: "Snacks", retailPrice: 350000, groupPrice: 227500, minPoolSize: 10, tags: "popular,trending", sortOrder: 1 },
    { vendorId: v3, name: "Fresh Fruit Basket", description: "Seasonal fruits: oranges, bananas, apples, pineapple, watermelon. Delivered fresh.", category: "Groceries", subcategory: "Fresh", retailPrice: 450000, groupPrice: 315000, minPoolSize: 8, tags: "healthy,new", sortOrder: 2 },
    { vendorId: v3, name: "5L Groundnut Oil", description: "Pure Nigerian groundnut oil. Premium cold-pressed. Family size.", category: "Groceries", subcategory: "Pantry", retailPrice: 700000, groupPrice: 490000, minPoolSize: 20, tags: "popular", sortOrder: 3 },
  ];

  let created = 0;
  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name, vendorId: p.vendorId } });
    if (!existing) {
      await prisma.product.create({ data: p });
      created++;
    }
  }

  return NextResponse.json({ success: true, message: `Seeded ${created} products (${products.length - created} already existed)`, count: created });
}
