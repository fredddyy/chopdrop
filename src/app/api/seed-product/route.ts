import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/seed-product — one-time: create Chicken Republic + featured product
// Hit this endpoint once on Vercel to seed the data, then delete this file
export async function GET() {
  // 1. Create or find Chicken Republic restaurant
  let chickenRepublic = await prisma.restaurant.findFirst({
    where: { name: { contains: "Chicken Republic" } },
  });

  if (!chickenRepublic) {
    chickenRepublic = await prisma.restaurant.create({
      data: {
        name: "Chicken Republic",
        address: "Ikeja City Mall, Alausa, Ikeja",
        phone: "08001234567",
        imageUrl: "https://res.cloudinary.com/dzxrv5o3q/image/upload/v1730900000/chicken-republic-logo.jpg",
        latitude: 6.6018,
        longitude: 3.3515,
      },
    });
  }

  // 2. Create the Chicken Club Sandwich product
  const existing = await prisma.product.findFirst({
    where: { name: "Chicken Club Sandwich", vendorId: chickenRepublic.id },
  });

  if (existing) {
    // Update it
    await prisma.product.update({
      where: { id: existing.id },
      data: {
        retailPrice: 210000, // ₦2,100
        groupPrice: 100000,  // ₦1,000
        imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=600&fit=crop",
        minPoolSize: 20,
        isActive: true,
        description: "Crispy toasted club sandwich loaded with seasoned chicken, fresh lettuce, mayo, and Chicken Republic's signature spice blend. A campus favourite.",
      },
    });
    return NextResponse.json({ success: true, message: "Updated existing product", id: existing.id });
  }

  const product = await prisma.product.create({
    data: {
      vendorId: chickenRepublic.id,
      name: "Chicken Club Sandwich",
      description: "Crispy toasted club sandwich loaded with seasoned chicken, fresh lettuce, mayo, and Chicken Republic's signature spice blend. A campus favourite.",
      imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=600&fit=crop",
      category: "Food",
      subcategory: "Sandwiches",
      retailPrice: 210000, // ₦2,100
      groupPrice: 100000,  // ₦1,000
      minPoolSize: 20,
      maxQuantity: 50,
      isActive: true,
      tags: "trending,new,popular",
    },
  });

  return NextResponse.json({
    success: true,
    message: "Created Chicken Republic + Chicken Club Sandwich",
    restaurantId: chickenRepublic.id,
    productId: product.id,
  });
}
