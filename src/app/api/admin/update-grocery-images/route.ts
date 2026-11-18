import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "rigeva3a";
const API_KEY = process.env.CLOUDINARY_API_KEY || "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

const S3 = "https://pp-new-node-medusa-prod-bucket.s3.us-east-1.amazonaws.com";

const IMAGE_MAP: Record<string, string> = {
  // Proteins
  "Goat Meat (1kg)": `${S3}/assorted%20cow%20meat-1725267840614.jpg`,
  "Prawns (500g)": `${S3}/Frozen%20shrimps%20general%20picture-1725278930949.jpg`,
  "Eggs (crate of 30)": `${S3}/image-1725565316310.jpg`,
  // Grains & Tubers
  "Yam (tuber)": `${S3}/Ayoola%20Poundo%20Yam%20(4.5kg)-1719040800310.jpg`,
  "Garri (5kg)": `${S3}/Dried-1733938515698.jpg`,
  "Semovita (2kg)": `${S3}/Ayoola%20Poundo%20Yam%20(0.9kg)-1719040655627.jpg`,
  "Wheat Flour (2kg)": `${S3}/flour-1kg-1725273124614.jpg`,
  // Fruits
  "Pineapple": `${S3}/Pineapple%201%20Piece-1717666038098.jpg`,
  "Bananas (bunch)": `${S3}/native-banana-stemofbunches-1717666397270.jpg`,
  "Oranges (12 pcs)": `${S3}/Tangerine%20-%20Clementine%20General-1718875488792.jpg`,
  "Mangoes (6 pcs)": `${S3}/plum-1718394036429.jpg`,
  "Watermelon (whole)": `${S3}/WVML2620copy-1717665865756.jpg`,
  "Avocado (3 pcs)": `${S3}/gx7HpZzVCdK6WhGSQcmHg2dkM1aD54OMT9oGTpnZ-1725786050291.jpg`,
  // Cooking essentials
  "Locust Beans (iru)": `${S3}/Soya%20Beans%20General-1725023067820.jpg`,
  "Tomato Paste (tin)": `${S3}/TRS%20Plum%20Peeled%20Tomatoes-1719303862710.jpg`,
  "Salt (500g)": `${S3}/Dangote%20Sugar%20(250g)-1719303578783.jpg`,
  "Seasoning Cubes (box)": `${S3}/image%20(10)-1719303992006.jpg`,
  "Palm Oil (4L)": `${S3}/Corn%20-%20Yellow%20General-1726068282430.jpg`,
  "Vegetable Oil (5L)": `${S3}/White%20Vinegar%20(1%20Bottle)-1719303745296.jpg`,
  // Vegetables
  "Okra (1kg)": `${S3}/Bell%20Pepper-1718790211639.jpg`,
  "Fresh Spinach (ugu)": `${S3}/Corn%20-%20White%20General-1726068166131.jpg`,
  "Cabbage (whole)": `${S3}/Coconut%20General%20Picture(1)-1717666169949.jpg`,
  // Household
  "Morning Fresh (900ml)": `${S3}/Morning%20Fresh%20Dishwashing%20Liquid%20(1L)-1732259688698.jpg`,
  "Tissue Paper (12 rolls)": `${S3}/Carla%20Towels%202ply%201-1732260155760.jpg`,
  "Ariel Detergent (2kg)": `${S3}/Viva%20Plus%20Detergent%20Powder%20(850g)-1732261010281.jpg`,
  "Dettol Soap (6 pcs)": `${S3}/Carex-1732262211267.jpg`,
  // Beverages
  "Milo (500g)": `${S3}/Milo%20Refill%20(400g)(1)-1719304278379.jpg`,
  "Peak Milk (tin)": `${S3}/Dano%20Cool%20Cow%20Sachet%20(1%20Roll)-1719302694432.jpg`,
  "Zobo Leaves (pack)": `${S3}/Dates%20General%20Picture-1718875695116.jpg`,
  "Nescafé (200g)": `${S3}/Milo%203%20in%201%20Sachet%20(8%20Rolls,%201%20Carton)-1719304085449.jpg`,
  "Lipton Tea (100 bags)": `${S3}/Dano%20Full%20Cream%20Refill%20(800g)-1719302828989.jpg`,
  "Groundnut Oil (4L)": `${S3}/starch-1718707527135.jpg`,
};

async function uploadToCloudinary(sourceUrl: string): Promise<string | null> {
  if (!API_KEY || !API_SECRET) return null;
  const folder = "chopdrop/groceries";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const sigStr = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash("sha1").update(sigStr).digest("hex");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file: sourceUrl, api_key: API_KEY, timestamp, signature, folder }),
  });
  const result = await res.json();
  return result.secure_url || null;
}

export async function POST() {
  let updated = 0;
  const errors: string[] = [];
  for (const [name, sourceUrl] of Object.entries(IMAGE_MAP)) {
    const product = await prisma.product.findFirst({ where: { name, imageUrl: null } });
    if (!product) continue;
    try {
      const url = await uploadToCloudinary(sourceUrl);
      if (url) { await prisma.product.update({ where: { id: product.id }, data: { imageUrl: url } }); updated++; }
      else errors.push(`Upload failed: ${name}`);
    } catch (e) { errors.push(`${name}: ${(e as Error).message}`); }
  }
  return NextResponse.json({ success: true, data: { updated, total: Object.keys(IMAGE_MAP).length, errors } });
}
