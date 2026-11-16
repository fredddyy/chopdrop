import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SETTING_KEY = "product-categories";

interface Category {
  name: string;
  imageUrl: string | null;
}

// GET — list all product categories
export async function GET() {
  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  const categories: Category[] = setting ? (setting.value as Category[]) : [
    { name: "Food", imageUrl: "/categories/food.png" },
    { name: "Groceries", imageUrl: "/categories/groceries.png" },
    { name: "Gadgets", imageUrl: "/categories/gadgets.png" },
    { name: "Fashion", imageUrl: "/categories/fashion.png" },
    { name: "Home", imageUrl: "/categories/home.png" },
  ];
  return NextResponse.json({ success: true, data: categories });
}

// POST — add a new category
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, imageUrl } = body as { name: string; imageUrl?: string };

  if (!name?.trim()) {
    return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
  }

  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  const categories: Category[] = setting ? (setting.value as Category[]) : [
    { name: "Food", imageUrl: "/categories/food.png" },
    { name: "Groceries", imageUrl: "/categories/groceries.png" },
    { name: "Gadgets", imageUrl: "/categories/gadgets.png" },
    { name: "Fashion", imageUrl: "/categories/fashion.png" },
    { name: "Home", imageUrl: "/categories/home.png" },
  ];

  if (categories.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
    return NextResponse.json({ success: false, error: "Category already exists" }, { status: 400 });
  }

  categories.push({ name: name.trim(), imageUrl: imageUrl || null });

  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: categories as unknown as Record<string, unknown>[] },
    update: { value: categories as unknown as Record<string, unknown>[] },
  });

  return NextResponse.json({ success: true, data: categories });
}

// DELETE — remove a category
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
  }

  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  const categories: Category[] = setting ? (setting.value as Category[]) : [];

  const filtered = categories.filter(c => c.name.toLowerCase() !== name.toLowerCase());

  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: filtered as unknown as Record<string, unknown>[] },
    update: { value: filtered as unknown as Record<string, unknown>[] },
  });

  return NextResponse.json({ success: true, data: filtered });
}
