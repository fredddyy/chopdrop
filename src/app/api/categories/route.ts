import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — public list of product categories
export async function GET() {
  const setting = await prisma.setting.findUnique({ where: { key: "product-categories" } });
  const categories = setting ? (setting.value as Array<{ name: string; imageUrl: string | null }>) : [
    { name: "Food", imageUrl: "/categories/food.png" },
    { name: "Groceries", imageUrl: "/categories/groceries.png" },
    { name: "Gadgets", imageUrl: "/categories/gadgets.png" },
    { name: "Fashion", imageUrl: "/categories/fashion.png" },
    { name: "Home", imageUrl: "/categories/home.png" },
  ];
  return NextResponse.json({ success: true, data: categories });
}
