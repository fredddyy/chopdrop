import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/admin/seed-products — populate products with real images
// Calling this again will UPDATE existing products with images
export async function POST() {
  const restaurants = await prisma.restaurant.findMany({ where: { isActive: true }, take: 5 });
  if (restaurants.length === 0) {
    return NextResponse.json({ success: false, error: "No active restaurants found" }, { status: 400 });
  }

  // Use first restaurant for food, assign others where available
  const foodVendor1 = restaurants[0].id;
  const foodVendor2 = restaurants[1]?.id || foodVendor1;
  const foodVendor3 = restaurants[2]?.id || foodVendor1;

  const products = [
    // ═══ FOOD ═══
    { vendorId: foodVendor1, name: "Jollof Rice & Chicken", description: "Smokey party jollof with grilled chicken drumstick, coleslaw, and plantain.", imageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80&fit=crop", category: "Food", subcategory: "Rice", retailPrice: 450000, groupPrice: 292500, minPoolSize: 10, tags: "trending,popular", sortOrder: 1 },
    { vendorId: foodVendor1, name: "Fried Rice & Turkey", description: "Special fried rice with seasoned turkey, mixed vegetables, and salad.", imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80&fit=crop", category: "Food", subcategory: "Rice", retailPrice: 500000, groupPrice: 325000, minPoolSize: 10, tags: "popular", sortOrder: 2 },
    { vendorId: foodVendor2, name: "Pounded Yam & Egusi", description: "Smooth pounded yam with rich egusi soup, assorted meat, and spinach.", imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80&fit=crop", category: "Food", subcategory: "Swallow", retailPrice: 550000, groupPrice: 385000, minPoolSize: 8, tags: "trending", sortOrder: 3 },
    { vendorId: foodVendor2, name: "Suya Platter", description: "Spicy grilled beef suya with onions, tomatoes, and yaji pepper.", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80&fit=crop", category: "Food", subcategory: "Grills", retailPrice: 350000, groupPrice: 227500, minPoolSize: 10, tags: "popular", sortOrder: 4 },
    { vendorId: foodVendor1, name: "Chicken Shawarma", description: "Loaded chicken shawarma wrap with coleslaw, mayo, and spicy sauce.", imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80&fit=crop", category: "Food", subcategory: "Wraps", retailPrice: 390000, groupPrice: 253500, minPoolSize: 10, tags: "trending", sortOrder: 5 },
    { vendorId: foodVendor3, name: "Veggie Power Bowl", description: "Brown rice, grilled vegetables, avocado, chickpeas, and tahini dressing.", imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80&fit=crop", category: "Food", subcategory: "Bowls", retailPrice: 400000, groupPrice: 280000, minPoolSize: 8, tags: "new,healthy", sortOrder: 6 },
    { vendorId: foodVendor3, name: "Pepper Soup", description: "Spicy goat meat pepper soup. Perfect comfort food.", imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80&fit=crop", category: "Food", subcategory: "Soup", retailPrice: 480000, groupPrice: 336000, minPoolSize: 8, tags: "popular", sortOrder: 7 },
    { vendorId: foodVendor2, name: "Grilled Fish & Plantain", description: "Whole grilled tilapia with fried plantain and pepper sauce.", imageUrl: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=600&q=80&fit=crop", category: "Food", subcategory: "Fish", retailPrice: 600000, groupPrice: 390000, minPoolSize: 10, tags: "trending", sortOrder: 8 },

    // ═══ ELECTRONICS — all from first vendor (acts as marketplace) ═══
    { vendorId: foodVendor1, name: "Samsung Galaxy Buds3", description: "Active noise cancellation, 30h battery, IP57 water resistant.", imageUrl: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&q=80&fit=crop", category: "Electronics", subcategory: "Audio", retailPrice: 4500000, groupPrice: 2925000, minPoolSize: 15, tags: "trending,new", sortOrder: 1 },
    { vendorId: foodVendor1, name: "Anker PowerBank 20K", description: "Fast charging, dual USB-C, slim design. Never run out of battery.", imageUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&q=80&fit=crop", category: "Electronics", subcategory: "Accessories", retailPrice: 1800000, groupPrice: 1170000, minPoolSize: 20, tags: "popular", sortOrder: 2 },
    { vendorId: foodVendor1, name: "Wireless Mouse", description: "Bluetooth, silent clicks, 18-month battery. Works on any surface.", imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80&fit=crop", category: "Electronics", subcategory: "Accessories", retailPrice: 1200000, groupPrice: 780000, minPoolSize: 15, tags: "new", sortOrder: 3 },
    { vendorId: foodVendor1, name: "USB-C Hub 7-in-1", description: "HDMI, USB 3.0, SD card, ethernet. Essential for laptops.", imageUrl: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=600&q=80&fit=crop", category: "Electronics", subcategory: "Accessories", retailPrice: 2500000, groupPrice: 1625000, minPoolSize: 20, tags: "popular", sortOrder: 4 },

    // ═══ FASHION ═══
    { vendorId: foodVendor2, name: "Ankara Print Shirt", description: "Premium cotton ankara. Modern slim fit. Multiple patterns.", imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80&fit=crop", category: "Fashion", subcategory: "Men", retailPrice: 800000, groupPrice: 520000, minPoolSize: 10, tags: "new,trending", sortOrder: 1 },
    { vendorId: foodVendor2, name: "Leather Office Belt", description: "Genuine leather, automatic buckle. Brown and black.", imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80&fit=crop", category: "Fashion", subcategory: "Accessories", retailPrice: 500000, groupPrice: 325000, minPoolSize: 15, tags: "popular", sortOrder: 2 },
    { vendorId: foodVendor2, name: "Canvas Tote Bag", description: "Durable canvas for work and weekends. Laptop compartment.", imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80&fit=crop", category: "Fashion", subcategory: "Bags", retailPrice: 600000, groupPrice: 390000, minPoolSize: 12, tags: "new", sortOrder: 3 },

    // ═══ GROCERIES ═══
    { vendorId: foodVendor3, name: "Office Snack Box", description: "Chin chin, plantain chips, peanuts, biscuits, juice. Feeds 4-5.", imageUrl: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&q=80&fit=crop", category: "Groceries", subcategory: "Snacks", retailPrice: 350000, groupPrice: 227500, minPoolSize: 10, tags: "popular,trending", sortOrder: 1 },
    { vendorId: foodVendor3, name: "Fresh Fruit Basket", description: "Seasonal fruits: oranges, bananas, apples, pineapple, watermelon.", imageUrl: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&q=80&fit=crop", category: "Groceries", subcategory: "Fresh", retailPrice: 450000, groupPrice: 315000, minPoolSize: 8, tags: "healthy,new", sortOrder: 2 },
    { vendorId: foodVendor3, name: "5L Groundnut Oil", description: "Pure Nigerian groundnut oil. Premium cold-pressed.", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80&fit=crop", category: "Groceries", subcategory: "Pantry", retailPrice: 700000, groupPrice: 490000, minPoolSize: 20, tags: "popular", sortOrder: 3 },
  ];

  let created = 0;
  let updated = 0;
  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: { imageUrl: p.imageUrl, vendorId: p.vendorId, description: p.description } });
      updated++;
    } else {
      await prisma.product.create({ data: p });
      created++;
    }
  }

  return NextResponse.json({ success: true, message: `Created ${created}, updated ${updated} products`, created, updated });
}
