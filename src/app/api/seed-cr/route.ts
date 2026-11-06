import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/seed-cr — re-create Chicken Republic + product. Hit once then delete.
export async function GET() {
  let cr = await prisma.restaurant.findFirst({ where: { name: { contains: "Chicken Republic" } } });

  if (!cr) {
    cr = await prisma.restaurant.create({
      data: {
        name: "Chicken Republic",
        address: "Ikeja City Mall, Alausa, Ikeja",
        phone: "08001234567",
        imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/samples/food/fish-vegetables.jpg",
        latitude: 6.6018,
        longitude: 3.3515,
      },
    });
  }

  const existing = await prisma.product.findFirst({
    where: { name: "Chicken Club Sandwich", vendorId: cr.id },
  });

  if (existing) {
    return NextResponse.json({ success: true, message: "Already exists", id: existing.id });
  }

  const product = await prisma.product.create({
    data: {
      vendorId: cr.id,
      name: "Chicken Club Sandwich",
      description: "Crispy toasted club sandwich loaded with seasoned chicken, fresh lettuce, mayo, and Chicken Republic's signature spice blend. A campus favourite.",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/samples/food/dessert.jpg",
      category: "Food",
      subcategory: "Sandwiches",
      retailPrice: 210000,
      groupPrice: 100000,
      minPoolSize: 20,
      maxQuantity: 50,
      isActive: true,
      sortOrder: -100,
      tags: "trending,new,popular",
    },
  });

  return NextResponse.json({ success: true, restaurantId: cr.id, productId: product.id });
}
