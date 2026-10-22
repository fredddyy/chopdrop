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
  await prisma.user.deleteMany();
  await prisma.office.deleteMany();
  await prisma.admin.deleteMany();

  // ── Admin ──
  const passwordHash = await bcrypt.hash("admin123", 12);
  await prisma.admin.create({
    data: { email: "admin@chopdrop.ng", passwordHash, name: "ChopDrop Admin" },
  });
  console.log("Admin: admin@chopdrop.ng / admin123");

  // ── Time slots ──
  const breakfast = await prisma.timeSlot.create({
    data: { label: "Breakfast", startTime: "08:00", endTime: "09:30", cutoffTime: "07:30" },
  });
  const lunch = await prisma.timeSlot.create({
    data: { label: "Lunch", startTime: "12:30", endTime: "13:30", cutoffTime: "10:30" },
  });
  console.log("Time slots: Breakfast 8-9:30, Lunch 12:30-1:30");

  // ── Restaurants ──
  const ajisafe = await prisma.restaurant.create({
    data: {
      name: "Ajisafe Pepper Rice",
      address: "12 Toyin Street, Ikeja",
      phone: "08012345678",
      imageUrl: "https://images.unsplash.com/photo-1603496987674-79600a000f55?w=100&h=100&fit=crop",
    },
  });

  const thePlace = await prisma.restaurant.create({
    data: {
      name: "The Place",
      address: "Plot 5, Adeola Hopewell, VI",
      phone: "08098765432",
      imageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=100&h=100&fit=crop",
    },
  });

  const kilimanjaro = await prisma.restaurant.create({
    data: {
      name: "Kilimanjaro",
      address: "268 Muri Okunola, VI",
      phone: "08055556666",
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop",
    },
  });

  const mamaTola = await prisma.restaurant.create({
    data: {
      name: "Mama Tola's Kitchen",
      address: "15 Allen Avenue, Ikeja",
      phone: "08033334444",
      imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100&h=100&fit=crop",
    },
  });

  const tantalizers = await prisma.restaurant.create({
    data: {
      name: "Tantalizers",
      address: "3 Admiralty Way, Lekki Phase 1",
      phone: "08077778888",
      imageUrl: "https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=100&h=100&fit=crop",
    },
  });
  console.log("Restaurants: Ajisafe, The Place, Kilimanjaro, Mama Tola's, Tantalizers");

  // ── Fixed meals ──
  const meals = await Promise.all([
    // Ajisafe
    prisma.meal.create({ data: { restaurantId: ajisafe.id, name: "Jollof Rice + Chicken", description: "Smoky party jollof with grilled chicken, plantain and coleslaw", price: 250000, tag: "REGULAR", type: "FIXED", imageUrl: "https://images.unsplash.com/photo-1603496987674-79600a000f55?w=400&fit=crop" } }),
    prisma.meal.create({ data: { restaurantId: ajisafe.id, name: "Pepper Rice + Turkey", description: "Signature Ajisafe pepper rice with smoked turkey", price: 300000, tag: "REGULAR", type: "FIXED", imageUrl: "https://images.unsplash.com/photo-1593787614839-9b93c8998f25?w=400&fit=crop" } }),
    prisma.meal.create({ data: { restaurantId: ajisafe.id, name: "Fried Rice + Fish", description: "Nigerian fried rice with crispy fried fish", price: 220000, tag: "REGULAR", type: "FIXED", imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&fit=crop" } }),

    // The Place
    prisma.meal.create({ data: { restaurantId: thePlace.id, name: "Amala + Ewedu + Gbegiri", description: "Classic Amala combo with assorted meat", price: 200000, tag: "REGULAR", type: "FIXED", imageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&fit=crop" } }),
    prisma.meal.create({ data: { restaurantId: thePlace.id, name: "Pounded Yam + Egusi", description: "Fresh pounded yam with rich egusi soup and stockfish", price: 280000, tag: "REGULAR", type: "FIXED", imageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&fit=crop" } }),
    prisma.meal.create({ data: { restaurantId: thePlace.id, name: "Semo + Ogbono", description: "Semovita with ogbono soup and assorted meat", price: 250000, tag: "REGULAR", type: "FIXED" } }),
    prisma.meal.create({ data: { restaurantId: thePlace.id, name: "White Rice + Stew + Chicken", description: "Steamed white rice with tomato stew and grilled chicken", price: 200000, tag: "DEAL", type: "FIXED", imageUrl: "https://images.unsplash.com/photo-1593787614839-9b93c8998f25?w=400&fit=crop" } }),

    // Kilimanjaro
    prisma.meal.create({ data: { restaurantId: kilimanjaro.id, name: "Chicken Shawarma", description: "Large chicken shawarma with garlic sauce and fries", price: 180000, tag: "DEAL", type: "FIXED", imageUrl: "https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=400&fit=crop" } }),
    prisma.meal.create({ data: { restaurantId: kilimanjaro.id, name: "Chicken & Chips", description: "Two pieces of fried chicken with chips and coleslaw", price: 200000, tag: "REGULAR", type: "FIXED" } }),
    prisma.meal.create({ data: { restaurantId: kilimanjaro.id, name: "Burger Meal", description: "Beef burger with fries and drink", price: 250000, tag: "REGULAR", type: "FIXED" } }),

    // Mama Tola
    prisma.meal.create({ data: { restaurantId: mamaTola.id, name: "Ofada Rice + Sauce", description: "Local Ofada rice with spicy Ofada sauce and assorted", price: 230000, tag: "REGULAR", type: "FIXED", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&fit=crop" } }),
    prisma.meal.create({ data: { restaurantId: mamaTola.id, name: "Beans + Plantain + Fish", description: "Nigerian beans with fried plantain and grilled fish", price: 180000, tag: "DEAL", type: "FIXED" } }),
    prisma.meal.create({ data: { restaurantId: mamaTola.id, name: "Yam Porridge + Turkey", description: "Spicy yam porridge with smoked turkey", price: 200000, tag: "REGULAR", type: "FIXED" } }),

    // Tantalizers
    prisma.meal.create({ data: { restaurantId: tantalizers.id, name: "Meat Pie + Drink", description: "Signature Tantalizers meat pie with a soft drink", price: 120000, tag: "DEAL", type: "FIXED" } }),
    prisma.meal.create({ data: { restaurantId: tantalizers.id, name: "Chicken Pie Combo", description: "Chicken pie, sausage roll and drink", price: 150000, tag: "REGULAR", type: "FIXED" } }),
    prisma.meal.create({ data: { restaurantId: tantalizers.id, name: "Rice Box Meal", description: "Jollof or fried rice with chicken and plantain in a box", price: 200000, tag: "REGULAR", type: "FIXED", imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&fit=crop" } }),
  ]);
  console.log(`${meals.length} meals created`);

  // ── Build-your-plate for Mama Tola ──
  const buildPlate = await prisma.meal.create({
    data: { restaurantId: mamaTola.id, name: "Build Your Plate", description: "Pick your base, protein, and extras", price: 0, type: "BUILD_YOUR_PLATE" },
  });

  const baseCat = await prisma.menuCategory.create({ data: { restaurantId: mamaTola.id, name: "Base", selectionRule: "PICK_ONE", sortOrder: 1 } });
  const proteinCat = await prisma.menuCategory.create({ data: { restaurantId: mamaTola.id, name: "Protein", selectionRule: "PICK_ONE_OR_MORE", sortOrder: 2 } });
  const extrasCat = await prisma.menuCategory.create({ data: { restaurantId: mamaTola.id, name: "Extras", selectionRule: "PICK_ANY", sortOrder: 3 } });
  const drinksCat = await prisma.menuCategory.create({ data: { restaurantId: mamaTola.id, name: "Drinks", selectionRule: "PICK_ONE", sortOrder: 4 } });

  await prisma.menuItem.createMany({
    data: [
      { categoryId: baseCat.id, name: "Jollof Rice", price: 80000, sortOrder: 1 },
      { categoryId: baseCat.id, name: "Fried Rice", price: 80000, sortOrder: 2 },
      { categoryId: baseCat.id, name: "White Rice", price: 60000, sortOrder: 3 },
      { categoryId: baseCat.id, name: "Amala", price: 50000, sortOrder: 4 },
      { categoryId: baseCat.id, name: "Pounded Yam", price: 70000, sortOrder: 5 },
      { categoryId: baseCat.id, name: "Semo", price: 60000, sortOrder: 6 },
      { categoryId: proteinCat.id, name: "Chicken", price: 80000, sortOrder: 1 },
      { categoryId: proteinCat.id, name: "Fish (Tilapia)", price: 100000, sortOrder: 2 },
      { categoryId: proteinCat.id, name: "Goat Meat", price: 90000, sortOrder: 3 },
      { categoryId: proteinCat.id, name: "Turkey", price: 120000, sortOrder: 4 },
      { categoryId: proteinCat.id, name: "Egg (Boiled)", price: 20000, sortOrder: 5 },
      { categoryId: proteinCat.id, name: "Ponmo", price: 30000, sortOrder: 6 },
      { categoryId: extrasCat.id, name: "Plantain", price: 30000, sortOrder: 1 },
      { categoryId: extrasCat.id, name: "Coleslaw", price: 20000, sortOrder: 2 },
      { categoryId: extrasCat.id, name: "Moi Moi", price: 30000, sortOrder: 3 },
      { categoryId: extrasCat.id, name: "Extra Meat", price: 50000, sortOrder: 4 },
      { categoryId: extrasCat.id, name: "Salad", price: 25000, sortOrder: 5 },
      { categoryId: drinksCat.id, name: "Zobo", price: 20000, sortOrder: 1 },
      { categoryId: drinksCat.id, name: "Chapman", price: 30000, sortOrder: 2 },
      { categoryId: drinksCat.id, name: "Water", price: 10000, sortOrder: 3 },
      { categoryId: drinksCat.id, name: "Coke/Fanta", price: 25000, sortOrder: 4 },
    ],
  });
  console.log("Build-your-plate with 4 categories, 21 items");

  // ── Today's daily menu ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyMenuData = meals.map((meal) => ({
    date: today,
    mealId: meal.id,
    timeSlotId: lunch.id,
    maxOrders: 30,
  }));

  // Add build-your-plate
  dailyMenuData.push({ date: today, mealId: buildPlate.id, timeSlotId: lunch.id, maxOrders: 25 });

  // Add some breakfast items
  dailyMenuData.push(
    { date: today, mealId: meals[13].id, timeSlotId: breakfast.id, maxOrders: 20 }, // Meat Pie
    { date: today, mealId: meals[14].id, timeSlotId: breakfast.id, maxOrders: 20 }, // Chicken Pie Combo
  );

  await prisma.dailyMenu.createMany({ data: dailyMenuData });
  console.log(`${dailyMenuData.length} daily menu entries for today`);

  // ── Sample office + users ──
  const office = await prisma.office.create({
    data: {
      name: "Sterling Bank HQ",
      slug: "sterling-hq",
      code: "STERL-001",
      address: "20 Marina Street, Lagos Island",
      collectionPoint: "Reception",
      secretToken: "",
    },
  });

  const userNames = [
    "Amaka", "Tunde", "Blessing", "Emeka", "Funke",
    "Chidi", "Ngozi", "Yusuf", "Adaeze", "Kemi",
    "Oluwaseun", "Chidinma", "Ibrahim", "Folake", "Obinna",
  ];

  for (const name of userNames) {
    await prisma.user.create({
      data: {
        phone: `080${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: `${name.toLowerCase()}@sterling.ng`,
        passwordHash: await bcrypt.hash("test1234", 10),
        firstName: name,
        lastName: "Test",
        officeId: office.id,
      },
    });
  }
  console.log(`Office "${office.name}" with ${userNames.length} members`);

  console.log("\n✅ Seed complete!");
  console.log("   Menu: 5 restaurants, 17 meals, 1 build-your-plate");
  console.log("   Slots: Breakfast + Lunch");
  console.log("   Office: Sterling Bank HQ, 15 members");
  console.log("\n   http://localhost:3000/menu");
  console.log("   Admin: http://localhost:3000/admin/login");
  console.log("   Email: admin@chopdrop.ng / Password: admin123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
