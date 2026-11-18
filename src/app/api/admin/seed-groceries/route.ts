import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/admin/seed-groceries — seed grocery items from PricePally-style catalog
export async function POST() {
  // Create or find the grocery store
  let store = await prisma.restaurant.findFirst({ where: { name: "ChopDrop Market" } });
  if (!store) {
    store = await prisma.restaurant.create({
      data: {
        name: "ChopDrop Market",
        address: "Lagos, Nigeria",
        phone: "08000000000",
        isActive: true,
        sortOrder: 100,
        deliveryFee: 50000,
        freeDeliveryMin: 500000,
        groupDeliveryPct: 25,
        groupTarget: 10,
        groupDiscount: 20,
        groupWindowMins: 120,
      },
    });
  }

  const items: Array<{ name: string; description: string; category: string; subcategory: string; retailPrice: number; groupPrice: number; imageUrl: string | null }> = [
    // ═══ VEGETABLES ═══
    { name: "Tomatoes (basket)", description: "Fresh ripe tomatoes, perfect for stew and jollof. 1 paint bucket.", category: "Groceries", subcategory: "Vegetables", retailPrice: 350000, groupPrice: 280000, imageUrl: null },
    { name: "Pepper (Rodo)", description: "Fresh scotch bonnet peppers. 1 paint bucket.", category: "Groceries", subcategory: "Vegetables", retailPrice: 250000, groupPrice: 200000, imageUrl: null },
    { name: "Onions (bag)", description: "Red onions, 5kg bag. Essential for Nigerian cooking.", category: "Groceries", subcategory: "Vegetables", retailPrice: 450000, groupPrice: 360000, imageUrl: null },
    { name: "Fresh Spinach (ugu)", description: "Fresh pumpkin leaves (ugu) for soup. Large bunch.", category: "Groceries", subcategory: "Vegetables", retailPrice: 100000, groupPrice: 80000, imageUrl: null },
    { name: "Okra (1kg)", description: "Fresh okra for draw soup. Cleaned and ready to use.", category: "Groceries", subcategory: "Vegetables", retailPrice: 150000, groupPrice: 120000, imageUrl: null },
    { name: "Fresh Pepper Mix", description: "Blended tomato, pepper and onion mix. Ready for cooking. 2L.", category: "Groceries", subcategory: "Vegetables", retailPrice: 200000, groupPrice: 160000, imageUrl: null },
    { name: "Cabbage (whole)", description: "Fresh green cabbage for coleslaw and salads.", category: "Groceries", subcategory: "Vegetables", retailPrice: 80000, groupPrice: 65000, imageUrl: null },
    { name: "Carrots (1kg)", description: "Fresh orange carrots for fried rice and salads.", category: "Groceries", subcategory: "Vegetables", retailPrice: 120000, groupPrice: 95000, imageUrl: null },

    // ═══ PROTEINS ═══
    { name: "Frozen Chicken (whole)", description: "Whole frozen chicken, approximately 1.5kg.", category: "Groceries", subcategory: "Proteins", retailPrice: 650000, groupPrice: 520000, imageUrl: null },
    { name: "Beef (1kg)", description: "Fresh beef cuts, bone-in. Perfect for stew or pepper soup.", category: "Groceries", subcategory: "Proteins", retailPrice: 500000, groupPrice: 400000, imageUrl: null },
    { name: "Goat Meat (1kg)", description: "Fresh goat meat, cut to size. Ideal for pepper soup or stew.", category: "Groceries", subcategory: "Proteins", retailPrice: 600000, groupPrice: 480000, imageUrl: null },
    { name: "Catfish (1kg)", description: "Fresh catfish, cleaned and cut. Ready for pepper soup or frying.", category: "Groceries", subcategory: "Proteins", retailPrice: 400000, groupPrice: 320000, imageUrl: null },
    { name: "Turkey (whole)", description: "Frozen whole turkey, approximately 4kg.", category: "Groceries", subcategory: "Proteins", retailPrice: 1500000, groupPrice: 1200000, imageUrl: null },
    { name: "Eggs (crate of 30)", description: "Fresh eggs, full crate of 30 pieces.", category: "Groceries", subcategory: "Proteins", retailPrice: 350000, groupPrice: 280000, imageUrl: null },
    { name: "Stockfish (medium)", description: "Dried stockfish, medium size. For egusi and ogbono soup.", category: "Groceries", subcategory: "Proteins", retailPrice: 300000, groupPrice: 240000, imageUrl: null },
    { name: "Prawns (500g)", description: "Fresh jumbo prawns, cleaned and deveined.", category: "Groceries", subcategory: "Proteins", retailPrice: 450000, groupPrice: 360000, imageUrl: null },

    // ═══ GRAINS & TUBERS ═══
    { name: "Rice (5kg)", description: "Premium long grain parboiled rice. 5kg bag.", category: "Groceries", subcategory: "Grains & Tubers", retailPrice: 650000, groupPrice: 520000, imageUrl: null },
    { name: "Rice (25kg)", description: "Royal Stallion or similar premium rice. 25kg bag.", category: "Groceries", subcategory: "Grains & Tubers", retailPrice: 2800000, groupPrice: 2240000, imageUrl: null },
    { name: "Beans (5kg)", description: "Honey beans (oloyin) or brown beans. 5kg bag.", category: "Groceries", subcategory: "Grains & Tubers", retailPrice: 500000, groupPrice: 400000, imageUrl: null },
    { name: "Garri (5kg)", description: "White garri (ijebu) for eba. 5kg bag.", category: "Groceries", subcategory: "Grains & Tubers", retailPrice: 300000, groupPrice: 240000, imageUrl: null },
    { name: "Yam (tuber)", description: "Fresh yam tuber, approximately 3-4kg.", category: "Groceries", subcategory: "Grains & Tubers", retailPrice: 350000, groupPrice: 280000, imageUrl: null },
    { name: "Plantain (bunch)", description: "Ripe or unripe plantain, bunch of 8-10 fingers.", category: "Groceries", subcategory: "Grains & Tubers", retailPrice: 200000, groupPrice: 160000, imageUrl: null },
    { name: "Semovita (2kg)", description: "Golden Penny semovita flour. 2kg pack.", category: "Groceries", subcategory: "Grains & Tubers", retailPrice: 180000, groupPrice: 145000, imageUrl: null },
    { name: "Wheat Flour (2kg)", description: "Honeywell wheat flour for baking and swallow.", category: "Groceries", subcategory: "Grains & Tubers", retailPrice: 200000, groupPrice: 160000, imageUrl: null },

    // ═══ COOKING ESSENTIALS ═══
    { name: "Palm Oil (4L)", description: "Fresh red palm oil for soups and stews. 4 litre gallon.", category: "Groceries", subcategory: "Cooking Essentials", retailPrice: 500000, groupPrice: 400000, imageUrl: null },
    { name: "Vegetable Oil (5L)", description: "Kings or Power vegetable oil. 5 litre gallon.", category: "Groceries", subcategory: "Cooking Essentials", retailPrice: 700000, groupPrice: 560000, imageUrl: null },
    { name: "Groundnut Oil (4L)", description: "Pure groundnut oil for frying. 4 litre gallon.", category: "Groceries", subcategory: "Cooking Essentials", retailPrice: 600000, groupPrice: 480000, imageUrl: null },
    { name: "Crayfish (500g)", description: "Dried crayfish, ground or whole. Essential for Nigerian soups.", category: "Groceries", subcategory: "Cooking Essentials", retailPrice: 200000, groupPrice: 160000, imageUrl: null },
    { name: "Locust Beans (iru)", description: "Fermented locust beans for efo riro and egusi. Small pack.", category: "Groceries", subcategory: "Cooking Essentials", retailPrice: 50000, groupPrice: 40000, imageUrl: null },
    { name: "Seasoning Cubes (box)", description: "Maggi or Knorr seasoning cubes. Box of 100.", category: "Groceries", subcategory: "Cooking Essentials", retailPrice: 150000, groupPrice: 120000, imageUrl: null },
    { name: "Tomato Paste (tin)", description: "Gino or Tasty Tom tomato paste. 400g tin.", category: "Groceries", subcategory: "Cooking Essentials", retailPrice: 80000, groupPrice: 65000, imageUrl: null },
    { name: "Salt (500g)", description: "Mr Chef iodized table salt. 500g pack.", category: "Groceries", subcategory: "Cooking Essentials", retailPrice: 20000, groupPrice: 16000, imageUrl: null },

    // ═══ FRUITS ═══
    { name: "Watermelon (whole)", description: "Sweet seedless watermelon, approximately 5kg.", category: "Groceries", subcategory: "Fruits", retailPrice: 150000, groupPrice: 120000, imageUrl: null },
    { name: "Pineapple", description: "Fresh sweet pineapple, large size.", category: "Groceries", subcategory: "Fruits", retailPrice: 80000, groupPrice: 65000, imageUrl: null },
    { name: "Oranges (12 pcs)", description: "Fresh sweet oranges, bag of 12.", category: "Groceries", subcategory: "Fruits", retailPrice: 100000, groupPrice: 80000, imageUrl: null },
    { name: "Bananas (bunch)", description: "Ripe Cavendish bananas, bunch of 6-8.", category: "Groceries", subcategory: "Fruits", retailPrice: 60000, groupPrice: 48000, imageUrl: null },
    { name: "Mangoes (6 pcs)", description: "Fresh ripe mangoes, pack of 6.", category: "Groceries", subcategory: "Fruits", retailPrice: 120000, groupPrice: 95000, imageUrl: null },
    { name: "Avocado (3 pcs)", description: "Fresh ripe avocados, pack of 3.", category: "Groceries", subcategory: "Fruits", retailPrice: 100000, groupPrice: 80000, imageUrl: null },

    // ═══ BEVERAGES ═══
    { name: "Peak Milk (tin)", description: "Peak evaporated milk. 160g tin.", category: "Groceries", subcategory: "Beverages", retailPrice: 40000, groupPrice: 32000, imageUrl: null },
    { name: "Milo (500g)", description: "Nestlé Milo chocolate drink. 500g tin.", category: "Groceries", subcategory: "Beverages", retailPrice: 250000, groupPrice: 200000, imageUrl: null },
    { name: "Lipton Tea (100 bags)", description: "Lipton Yellow Label tea bags. Box of 100.", category: "Groceries", subcategory: "Beverages", retailPrice: 150000, groupPrice: 120000, imageUrl: null },
    { name: "Nescafé (200g)", description: "Nescafé Classic instant coffee. 200g jar.", category: "Groceries", subcategory: "Beverages", retailPrice: 200000, groupPrice: 160000, imageUrl: null },
    { name: "Zobo Leaves (pack)", description: "Dried hibiscus leaves for zobo drink. Large pack.", category: "Groceries", subcategory: "Beverages", retailPrice: 50000, groupPrice: 40000, imageUrl: null },

    // ═══ HOUSEHOLD ═══
    { name: "Tissue Paper (12 rolls)", description: "Softcare or similar toilet tissue. Pack of 12 rolls.", category: "Groceries", subcategory: "Household", retailPrice: 250000, groupPrice: 200000, imageUrl: null },
    { name: "Dettol Soap (6 pcs)", description: "Dettol antiseptic bath soap. Pack of 6 bars.", category: "Groceries", subcategory: "Household", retailPrice: 180000, groupPrice: 145000, imageUrl: null },
    { name: "Morning Fresh (900ml)", description: "Morning Fresh dishwashing liquid. 900ml bottle.", category: "Groceries", subcategory: "Household", retailPrice: 120000, groupPrice: 95000, imageUrl: null },
    { name: "Ariel Detergent (2kg)", description: "Ariel washing powder. 2kg bag.", category: "Groceries", subcategory: "Household", retailPrice: 250000, groupPrice: 200000, imageUrl: null },
  ];

  let created = 0;
  for (const item of items) {
    const existing = await prisma.product.findFirst({ where: { name: item.name, vendorId: store.id } });
    if (!existing) {
      await prisma.product.create({
        data: {
          name: item.name,
          description: item.description,
          category: item.category,
          subcategory: item.subcategory,
          retailPrice: item.retailPrice,
          groupPrice: item.groupPrice,
          minPoolSize: 5,
          vendorId: store.id,
          imageUrl: item.imageUrl,
          isActive: true,
        },
      });
      created++;
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      storeId: store.id,
      storeName: store.name,
      totalItems: items.length,
      created,
    },
  });
}
