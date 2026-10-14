import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter }) as unknown as InstanceType<typeof PrismaClient>;

async function main() {
  // Clean existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.dailyMenu.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.meal.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.admin.deleteMany();

  // Create admin
  const passwordHash = await bcrypt.hash("admin123", 12);
  await prisma.admin.create({
    data: {
      email: "admin@chopdrop.ng",
      passwordHash,
      name: "ChopDrop Admin",
    },
  });
  console.log("Admin created: admin@chopdrop.ng / admin123");

  // Create time slot
  const lunchSlot = await prisma.timeSlot.create({
    data: {
      label: "Lunch",
      startTime: "12:30",
      endTime: "13:30",
      cutoffTime: "10:30",
    },
  });
  console.log("Time slot created: Lunch 12:30-13:30 (cutoff 10:30)");

  // Create restaurants
  const mamaT = await prisma.restaurant.create({
    data: {
      name: "Mama T's Kitchen",
      address: "15 Allen Avenue, Ikeja",
      phone: "08012345678",
    },
  });

  const tfc = await prisma.restaurant.create({
    data: {
      name: "TFC Restaurant",
      address: "22 Computer Village, Ikeja",
      phone: "08098765432",
    },
  });
  console.log("Restaurants created: Mama T's Kitchen, TFC Restaurant");

  // Create fixed meals
  const jollof = await prisma.meal.create({
    data: {
      restaurantId: mamaT.id,
      name: "Jollof Rice + Chicken",
      description: "Smoky party jollof with grilled chicken and plantain",
      price: 250000, // ₦2,500
      tag: "REGULAR",
      type: "FIXED",
    },
  });

  const friedRice = await prisma.meal.create({
    data: {
      restaurantId: tfc.id,
      name: "Fried Rice + Fish",
      description: "Nigerian fried rice with crispy fried fish",
      price: 220000, // ₦2,200
      tag: "REGULAR",
      type: "FIXED",
    },
  });

  const shawarma = await prisma.meal.create({
    data: {
      restaurantId: tfc.id,
      name: "Shawarma Special",
      description: "Large chicken shawarma with extra sauce",
      price: 180000, // ₦1,800
      tag: "DEAL",
      type: "FIXED",
    },
  });

  // Create build-your-plate meal
  const buildPlate = await prisma.meal.create({
    data: {
      restaurantId: mamaT.id,
      name: "Build Your Plate",
      description: "Choose your base, protein, and extras",
      price: 0, // calculated from items
      type: "BUILD_YOUR_PLATE",
    },
  });

  // Create menu categories for Mama T's build-your-plate
  const baseCategory = await prisma.menuCategory.create({
    data: {
      restaurantId: mamaT.id,
      name: "Base",
      selectionRule: "PICK_ONE",
      sortOrder: 1,
    },
  });

  const proteinCategory = await prisma.menuCategory.create({
    data: {
      restaurantId: mamaT.id,
      name: "Protein",
      selectionRule: "PICK_ONE_OR_MORE",
      sortOrder: 2,
    },
  });

  const extrasCategory = await prisma.menuCategory.create({
    data: {
      restaurantId: mamaT.id,
      name: "Extras",
      selectionRule: "PICK_ANY",
      sortOrder: 3,
    },
  });

  // Create menu items
  await prisma.menuItem.createMany({
    data: [
      // Bases
      { categoryId: baseCategory.id, name: "Jollof Rice", price: 80000, sortOrder: 1 },
      { categoryId: baseCategory.id, name: "Fried Rice", price: 80000, sortOrder: 2 },
      { categoryId: baseCategory.id, name: "White Rice", price: 60000, sortOrder: 3 },
      { categoryId: baseCategory.id, name: "Amala", price: 50000, sortOrder: 4 },
      { categoryId: baseCategory.id, name: "Pounded Yam", price: 70000, sortOrder: 5 },
      // Proteins
      { categoryId: proteinCategory.id, name: "Chicken", price: 80000, sortOrder: 1 },
      { categoryId: proteinCategory.id, name: "Fish", price: 100000, sortOrder: 2 },
      { categoryId: proteinCategory.id, name: "Goat Meat", price: 90000, sortOrder: 3 },
      { categoryId: proteinCategory.id, name: "Egg", price: 20000, sortOrder: 4 },
      // Extras
      { categoryId: extrasCategory.id, name: "Plantain", price: 30000, sortOrder: 1 },
      { categoryId: extrasCategory.id, name: "Coleslaw", price: 20000, sortOrder: 2 },
      { categoryId: extrasCategory.id, name: "Moi Moi", price: 30000, sortOrder: 3 },
      { categoryId: extrasCategory.id, name: "Extra Meat", price: 50000, sortOrder: 4 },
    ],
  });
  console.log("Menu categories and items created for build-your-plate");

  // Create today's daily menu
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.dailyMenu.createMany({
    data: [
      { date: today, mealId: jollof.id, timeSlotId: lunchSlot.id, maxOrders: 30 },
      { date: today, mealId: friedRice.id, timeSlotId: lunchSlot.id, maxOrders: 25 },
      { date: today, mealId: shawarma.id, timeSlotId: lunchSlot.id, maxOrders: 20 },
      { date: today, mealId: buildPlate.id, timeSlotId: lunchSlot.id, maxOrders: 25 },
    ],
  });
  console.log("Today's daily menu created with 4 meals");

  console.log("\nSeed complete! You can now:");
  console.log("1. Visit http://localhost:3000 to see the customer menu");
  console.log("2. Login at http://localhost:3000/admin/login");
  console.log("   Email: admin@chopdrop.ng");
  console.log("   Password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
