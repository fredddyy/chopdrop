import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/seed-cr — convert existing Meals into Products with pool pricing
// Uses combos already in the DB, gives them a group discount
// Hit once then delete this file
export async function GET() {
  const created: string[] = [];
  const skipped: string[] = [];

  // 1. Ensure Chicken Republic exists
  let cr = await prisma.restaurant.findFirst({ where: { name: { contains: "Chicken Republic" } } });
  if (!cr) {
    cr = await prisma.restaurant.create({
      data: { name: "Chicken Republic", address: "Ikeja City Mall, Alausa, Ikeja", phone: "08001234567", latitude: 6.6018, longitude: 3.3515 },
    });
    created.push("Restaurant: Chicken Republic");
  }

  // Ensure Chicken Republic has at least one product
  const crProduct = await prisma.product.findFirst({ where: { vendorId: cr.id } });
  if (!crProduct) {
    await prisma.product.create({
      data: {
        vendorId: cr.id,
        name: "Chicken Club Sandwich",
        description: "Crispy toasted club sandwich with seasoned chicken, fresh lettuce, mayo.",
        category: "Food", subcategory: "Sandwiches",
        retailPrice: 210000, groupPrice: 100000,
        minPoolSize: 20, isActive: true, sortOrder: -100,
      },
    });
    created.push("Chicken Club Sandwich");
  }

  // 2. Find all meals in the DB and create Products from them
  const meals = await prisma.meal.findMany({
    include: { restaurant: { select: { id: true, name: true } } },
    take: 15,
  });

  // Also list what restaurants exist for debugging
  const restaurants = await prisma.restaurant.findMany({ select: { id: true, name: true, _count: { select: { meals: true, products: true, menuCategories: true } } } });

  for (const meal of meals) {
    // Skip if a Product with same name + vendor already exists
    const exists = await prisma.product.findFirst({
      where: { name: meal.name, vendorId: meal.restaurant.id },
    });
    if (exists) {
      skipped.push(meal.name);
      continue;
    }

    // Pool price = 65% of retail (35% discount)
    const retailPrice = meal.originalPrice || meal.price;
    const groupPrice = Math.round(retailPrice * 0.65);

    await prisma.product.create({
      data: {
        vendorId: meal.restaurant.id,
        name: meal.name,
        description: meal.description,
        imageUrl: meal.imageUrl,
        category: "Food",
        subcategory: meal.tag === "DEAL" ? "Deals" : "Combos",
        retailPrice,
        groupPrice,
        minPoolSize: 15,
        isActive: true,
        sortOrder: 0,
      },
    });
    created.push(`${meal.name} (${meal.restaurant.name})`);
  }

  return NextResponse.json({
    success: true,
    created,
    skipped,
    mealsFound: meals.length,
    restaurants: restaurants.map(r => ({ name: r.name, meals: r._count.meals, products: r._count.products, menuCats: r._count.menuCategories })),
    message: `${created.length} products created, ${skipped.length} already existed`,
  });
}
