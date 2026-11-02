import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/admin/seed-products — seed stores + products with cover photos
export async function POST() {
  // ═══ STORES — each with identity, banner, and logo ═══
  const storeData = [
    {
      name: "Mama Titi's Kitchen",
      address: "12 Allen Avenue, Ikeja, Lagos",
      phone: "08012345678",
      imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&q=80&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&fit=crop",
      sortOrder: 1,
    },
    {
      name: "Iya Basira Foods",
      address: "5 Opebi Road, Ikeja, Lagos",
      phone: "08023456789",
      imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80&fit=crop",
      sortOrder: 2,
    },
    {
      name: "The Grill Sergeant",
      address: "22 Adeola Odeku, VI, Lagos",
      phone: "08034567890",
      imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&q=80&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80&fit=crop",
      sortOrder: 3,
    },
    {
      name: "ChopDrop Market",
      address: "Online — Lagos, Nigeria",
      phone: "08000000000",
      imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&q=80&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80&fit=crop",
      sortOrder: 10,
    },
    {
      name: "Green Bowl Co.",
      address: "8 Admiralty Way, Lekki, Lagos",
      phone: "08045678901",
      imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=80&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&q=80&fit=crop",
      sortOrder: 4,
    },
  ];

  // Upsert stores by name — preserve IDs across re-seeds
  const stores: Record<string, string> = {};
  for (const s of storeData) {
    const existing = await prisma.restaurant.findFirst({ where: { name: s.name } });
    if (existing) {
      await prisma.restaurant.update({ where: { id: existing.id }, data: { ...s, isActive: true } });
      stores[s.name] = existing.id;
    } else {
      const created = await prisma.restaurant.create({ data: { ...s, isActive: true } });
      stores[s.name] = created.id;
    }
  }

  const mama = stores["Mama Titi's Kitchen"];
  const iya = stores["Iya Basira Foods"];
  const grill = stores["The Grill Sergeant"];
  const market = stores["ChopDrop Market"];
  const green = stores["Green Bowl Co."];

  const products = [
    // ═══ FOOD — Mama Titi's Kitchen ═══
    { vendorId: mama, name: "Jollof Rice & Chicken", description: "Smokey party jollof with grilled chicken, coleslaw, and fried plantain.", imageUrl: "https://images.unsplash.com/photo-1575299899797-a2abc99b0842?w=600&q=80&fit=crop", category: "Food", subcategory: "Rice", retailPrice: 450000, groupPrice: 337500, minPoolSize: 5, tags: "trending,popular", sortOrder: 1 },
    { vendorId: mama, name: "Fried Rice & Turkey", description: "Special fried rice with seasoned turkey and mixed vegetables.", imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80&fit=crop", category: "Food", subcategory: "Rice", retailPrice: 500000, groupPrice: 375000, minPoolSize: 5, tags: "popular", sortOrder: 2 },
    { vendorId: mama, name: "Chicken Shawarma", description: "Loaded chicken shawarma wrap with coleslaw, mayo, and spicy sauce.", imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80&fit=crop", category: "Food", subcategory: "Wraps", retailPrice: 390000, groupPrice: 292500, minPoolSize: 5, tags: "trending", sortOrder: 5 },

    // ═══ FOOD — Iya Basira Foods ═══
    { vendorId: iya, name: "Pounded Yam & Egusi", description: "Smooth pounded yam with rich egusi soup, assorted meat, and spinach.", imageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80&fit=crop", category: "Food", subcategory: "Swallow", retailPrice: 550000, groupPrice: 412500, minPoolSize: 5, tags: "trending", sortOrder: 3 },
    { vendorId: iya, name: "Suya Platter", description: "Spicy grilled beef suya with onions, tomatoes, and yaji pepper.", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80&fit=crop", category: "Food", subcategory: "Grills", retailPrice: 350000, groupPrice: 262500, minPoolSize: 5, tags: "popular", sortOrder: 4 },
    { vendorId: iya, name: "Grilled Fish & Plantain", description: "Whole grilled tilapia with fried plantain and pepper sauce.", imageUrl: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=600&q=80&fit=crop", category: "Food", subcategory: "Fish", retailPrice: 600000, groupPrice: 450000, minPoolSize: 5, tags: "trending", sortOrder: 8 },

    // ═══ FOOD — The Grill Sergeant ═══
    { vendorId: grill, name: "Smokey BBQ Wings", description: "12 crispy wings with smokey BBQ glaze, ranch dip, and fries.", imageUrl: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&q=80&fit=crop", category: "Food", subcategory: "Grills", retailPrice: 480000, groupPrice: 360000, minPoolSize: 5, tags: "new,trending", sortOrder: 1 },
    { vendorId: grill, name: "Grilled Steak Platter", description: "200g sirloin steak, grilled peppers, mashed potatoes, and pepper sauce.", imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80&fit=crop", category: "Food", subcategory: "Grills", retailPrice: 750000, groupPrice: 562500, minPoolSize: 5, tags: "popular", sortOrder: 2 },

    // ═══ FOOD — Green Bowl Co. ═══
    { vendorId: green, name: "Veggie Power Bowl", description: "Brown rice, grilled vegetables, avocado, chickpeas, and tahini dressing.", imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80&fit=crop", category: "Food", subcategory: "Bowls", retailPrice: 400000, groupPrice: 300000, minPoolSize: 5, tags: "new,healthy", sortOrder: 1 },
    { vendorId: green, name: "Pepper Soup", description: "Spicy goat meat pepper soup. The ultimate comfort food.", imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80&fit=crop", category: "Food", subcategory: "Soup", retailPrice: 480000, groupPrice: 360000, minPoolSize: 5, tags: "popular", sortOrder: 2 },
    { vendorId: green, name: "Smoothie Bowl", description: "Acai, banana, granola, coconut flakes, and fresh berries.", imageUrl: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&q=80&fit=crop", category: "Food", subcategory: "Bowls", retailPrice: 350000, groupPrice: 262500, minPoolSize: 5, tags: "healthy,new", sortOrder: 3 },

    // ═══ ELECTRONICS — ChopDrop Market ═══
    { vendorId: market, name: "Samsung Galaxy Buds3", description: "Active noise cancellation, 30h battery life, IP57 water resistant.", imageUrl: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&q=80&fit=crop", category: "Electronics", subcategory: "Audio", retailPrice: 4500000, groupPrice: 2925000, minPoolSize: 15, tags: "trending,new", sortOrder: 1 },
    { vendorId: market, name: "Anker PowerBank 20K", description: "Fast charging, dual USB-C ports, slim design. Essential for Lagos.", imageUrl: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&q=80&fit=crop", category: "Electronics", subcategory: "Accessories", retailPrice: 1800000, groupPrice: 1170000, minPoolSize: 20, tags: "popular", sortOrder: 2 },
    { vendorId: market, name: "Wireless Mouse", description: "Bluetooth, silent clicks, 18-month battery. Works on any surface.", imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80&fit=crop", category: "Electronics", subcategory: "Accessories", retailPrice: 1200000, groupPrice: 780000, minPoolSize: 15, tags: "new", sortOrder: 3 },
    { vendorId: market, name: "USB-C Hub 7-in-1", description: "HDMI, USB 3.0, SD card, ethernet. Essential for laptop users.", imageUrl: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=600&q=80&fit=crop", category: "Electronics", subcategory: "Accessories", retailPrice: 2500000, groupPrice: 1625000, minPoolSize: 20, tags: "popular", sortOrder: 4 },

    // ═══ FASHION — ChopDrop Market ═══
    { vendorId: market, name: "Ankara Print Shirt", description: "Premium cotton ankara. Modern slim fit. Multiple patterns available.", imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80&fit=crop", category: "Fashion", subcategory: "Men", retailPrice: 800000, groupPrice: 520000, minPoolSize: 10, tags: "new,trending", sortOrder: 1 },
    { vendorId: market, name: "Leather Office Belt", description: "Genuine leather belt, automatic buckle. Brown and black available.", imageUrl: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&q=80&fit=crop", category: "Fashion", subcategory: "Accessories", retailPrice: 500000, groupPrice: 325000, minPoolSize: 15, tags: "popular", sortOrder: 2 },
    { vendorId: market, name: "Canvas Tote Bag", description: "Durable canvas for work and weekends. Laptop compartment. Made in Lagos.", imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80&fit=crop", category: "Fashion", subcategory: "Bags", retailPrice: 600000, groupPrice: 390000, minPoolSize: 12, tags: "new", sortOrder: 3 },

    // ═══ GROCERIES — Green Bowl Co. ═══
    { vendorId: green, name: "Office Snack Box", description: "Chin chin, plantain chips, peanuts, biscuits, juice. Feeds 4-5 people.", imageUrl: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&q=80&fit=crop", category: "Groceries", subcategory: "Snacks", retailPrice: 350000, groupPrice: 227500, minPoolSize: 10, tags: "popular,trending", sortOrder: 1 },
    { vendorId: green, name: "Fresh Fruit Basket", description: "Seasonal fruits: oranges, bananas, apples, pineapple, watermelon.", imageUrl: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&q=80&fit=crop", category: "Groceries", subcategory: "Fresh", retailPrice: 450000, groupPrice: 315000, minPoolSize: 8, tags: "healthy,new", sortOrder: 2 },
    { vendorId: green, name: "5L Groundnut Oil", description: "Pure Nigerian groundnut oil. Premium cold-pressed.", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80&fit=crop", category: "Groceries", subcategory: "Pantry", retailPrice: 700000, groupPrice: 490000, minPoolSize: 20, tags: "popular", sortOrder: 3 },
  ];

  // Delete ALL existing products and reseed cleanly
  await prisma.product.deleteMany({});

  let created = 0;
  for (const p of products) {
    await prisma.product.create({ data: p });
    created++;
  }

  return NextResponse.json({
    success: true,
    message: `Seeded ${storeData.length} stores + ${created} products`,
    stores: storeData.length,
    products: created,
  });
}
