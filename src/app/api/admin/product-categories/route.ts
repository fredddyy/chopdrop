import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SETTING_KEY = "product-categories";

interface Category {
  name: string;
  imageUrl: string | null;
}

const DEFAULTS: Category[] = [
  { name: "Food", imageUrl: "/categories/food.png" },
  { name: "Groceries", imageUrl: "/categories/groceries.png" },
  { name: "Gadgets", imageUrl: "/categories/gadgets.png" },
  { name: "Fashion", imageUrl: "/categories/fashion.png" },
  { name: "Home", imageUrl: "/categories/home.png" },
];

async function getCategories(): Promise<Category[]> {
  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  if (!setting) return [...DEFAULTS];
  return JSON.parse(JSON.stringify(setting.value)) as Category[];
}

async function saveCategories(categories: Category[]) {
  const value = JSON.parse(JSON.stringify(categories));
  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value },
    update: { value },
  });
}

// GET — list all product categories
export async function GET() {
  const categories = await getCategories();
  return NextResponse.json({ success: true, data: categories });
}

// POST — add a new category
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, imageUrl } = body as { name: string; imageUrl?: string };

  if (!name?.trim()) {
    return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
  }

  const categories = await getCategories();

  if (categories.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
    return NextResponse.json({ success: false, error: "Category already exists" }, { status: 400 });
  }

  categories.push({ name: name.trim(), imageUrl: imageUrl || null });
  await saveCategories(categories);

  return NextResponse.json({ success: true, data: categories });
}

// DELETE — remove a category
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
  }

  const categories = await getCategories();
  const filtered = categories.filter(c => c.name.toLowerCase() !== name.toLowerCase());
  await saveCategories(filtered);

  return NextResponse.json({ success: true, data: filtered });
}
