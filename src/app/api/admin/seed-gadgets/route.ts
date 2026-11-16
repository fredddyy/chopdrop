import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/admin/seed-gadgets — one-time seed of oraimo products
export async function POST() {
  // Create or find oraimo store
  let store = await prisma.restaurant.findFirst({ where: { name: "oraimo Nigeria" } });
  if (!store) {
    store = await prisma.restaurant.create({
      data: {
        name: "oraimo Nigeria",
        address: "Computer Village, Ikeja, Lagos",
        phone: "08000672466",
        imageUrl: "https://ng.oraimo.com/favicon.ico",
        bannerUrl: null,
        isActive: true,
        deliveryFee: 100000, // ₦1,000
        freeDeliveryMin: 2000000, // ₦20,000
        groupDeliveryPct: 25,
      },
    });
  }

  const products = [
    { name: "oraimo SpaceBuds 2", retailPrice: 2290000, groupPrice: 1950000, desc: "True wireless earbuds with deep bass, 28h playtime, and touch controls.", img: "https://cdn-img.oraimo.com/fit-in/540x540/MA/product/2026/05/25/oraimo-True-Wireless-Earbuds-SpaceBuds2-OTW-631-DIGITALLAVENDER.png", sub: "Earbuds" },
    { name: "oraimo SpaceBuds Lite", retailPrice: 1490000, groupPrice: 1270000, desc: "Lightweight earbuds with ENC for clear calls and 25h total playtime.", img: "https://cdn-img.oraimo.com/fit-in/540x540/CI/product/2025/10/31/OEB-311-VIP.png", sub: "Earbuds" },
    { name: "oraimo OpenSnap Air", retailPrice: 3490000, groupPrice: 2970000, desc: "Open-ear wireless earbuds with air conduction and 10h battery life.", img: "https://cdn-img.oraimo.com/fit-in/540x540/MA/product/2026/04/14/OTW-631-SPACEGREY-MAIN.png", sub: "Earbuds" },
    { name: "oraimo SpaceBuds Neo", retailPrice: 1990000, groupPrice: 1690000, desc: "Compact true wireless earbuds with passive noise cancellation.", img: null, sub: "Earbuds" },
    { name: "oraimo SpaceBuds Neo+", retailPrice: 2490000, groupPrice: 2120000, desc: "Premium earbuds with hybrid ANC and 32h battery life.", img: null, sub: "Earbuds" },
    { name: "oraimo BoomPop N", retailPrice: 4990000, groupPrice: 4240000, desc: "Over-ear wireless headphones with ANC, 60h battery, and deep bass.", img: null, sub: "Headphones" },
    { name: "oraimo BoomPop Air", retailPrice: 1990000, groupPrice: 1690000, desc: "Lightweight on-ear wireless headphones with 40h playtime.", img: null, sub: "Headphones" },
    { name: "oraimo BoomPop Pro", retailPrice: 2990000, groupPrice: 2540000, desc: "Studio-quality wireless headphones with ANC and Hi-Res audio.", img: null, sub: "Headphones" },
    { name: "oraimo SpaceBox Pro", retailPrice: 3990000, groupPrice: 3390000, desc: "Portable Bluetooth speaker with 20W output and IPX5 waterproof.", img: null, sub: "Speakers" },
    { name: "oraimo SpaceBox", retailPrice: 1490000, groupPrice: 1270000, desc: "Compact wireless speaker with rich bass and 8h playtime.", img: null, sub: "Speakers" },
    { name: "oraimo SpaceBox Active", retailPrice: 2490000, groupPrice: 2120000, desc: "Rugged outdoor speaker with 15W output and 12h battery.", img: null, sub: "Speakers" },
    { name: "oraimo Necklace 5", retailPrice: 1290000, groupPrice: 1100000, desc: "Wireless neckband earphones with 50h playtime and fast charge.", img: null, sub: "Neckband" },
    { name: "oraimo Necklace Lite", retailPrice: 790000, groupPrice: 670000, desc: "Affordable neckband earphones with 18h playtime and magnetic tips.", img: null, sub: "Neckband" },
    { name: "oraimo PowerNova L12", retailPrice: 2990000, groupPrice: 2540000, desc: "12000mAh power bank with 22.5W fast charging and LED display.", img: null, sub: "Power Banks" },
    { name: "oraimo PowerBox 300", retailPrice: 1990000, groupPrice: 1690000, desc: "30000mAh mega power bank with dual USB output and LED indicator.", img: null, sub: "Power Banks" },
    { name: "oraimo PowerNova Q21", retailPrice: 1490000, groupPrice: 1270000, desc: "10000mAh slim power bank with 20W PD fast charge.", img: null, sub: "Power Banks" },
    { name: "oraimo Watch 6", retailPrice: 2490000, groupPrice: 2120000, desc: "Smart watch with AMOLED display, SpO2, heart rate, and 100+ sports modes.", img: null, sub: "Smartwatches" },
    { name: "oraimo Watch 6 Pro", retailPrice: 3490000, groupPrice: 2970000, desc: "Premium smart watch with always-on AMOLED, GPS, and Bluetooth calling.", img: null, sub: "Smartwatches" },
    { name: "oraimo SmartTrim", retailPrice: 990000, groupPrice: 840000, desc: "Electric hair trimmer with titanium blade and 120min runtime.", img: null, sub: "Personal Care" },
    { name: "oraimo SmartClipper 2", retailPrice: 1490000, groupPrice: 1270000, desc: "Professional hair clipper with LCD display and adjustable blade.", img: null, sub: "Personal Care" },
  ];

  let created = 0;
  for (const p of products) {
    const exists = await prisma.product.findFirst({ where: { name: p.name, vendorId: store.id } });
    if (exists) continue;

    await prisma.product.create({
      data: {
        name: p.name,
        description: p.desc,
        imageUrl: p.img,
        category: "Gadgets",
        subcategory: p.sub,
        retailPrice: p.retailPrice,
        groupPrice: p.groupPrice,
        minPoolSize: 5,
        isActive: true,
        vendorId: store.id,
      },
    });
    created++;
  }

  return NextResponse.json({
    success: true,
    data: { storeId: store.id, storeName: store.name, productsCreated: created, totalProducts: products.length },
  });
}
