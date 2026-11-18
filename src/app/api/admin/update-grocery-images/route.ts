import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "rigeva3a";
const API_KEY = process.env.CLOUDINARY_API_KEY || "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

const S3 = "https://pp-new-node-medusa-prod-bucket.s3.us-east-1.amazonaws.com";

const IMAGE_MAP: Record<string, string> = {
  // Proteins
  "Goat Meat (1kg)": `${S3}/hard%20lap%20orobo-1725266010730.jpg`,
  "Prawns (500g)": `${S3}/Frozen%20shrimps%20general%20picture-1725278930949.jpg`,
  "Eggs (crate of 30)": `${S3}/image-1723277282212.jpg`,
  // Grains & Tubers
  "Yam (tuber)": `${S3}/yam-100tubers-1718791625485.jpg`,
  "Garri (5kg)": `${S3}/Dried-1726068534862.jpg`,
  "Semovita (2kg)": `${S3}/Ayoola%20Poundo%20Yam%20(0.9kg)-1719040655627.jpg`,
  "Wheat Flour (2kg)": `${S3}/flour-1kg-1718875082299.jpg`,
  // Fruits
  "Pineapple": `${S3}/Pineapple%201%20Piece-1717666038098.jpg`,
  "Bananas (bunch)": `${S3}/native-banana-stemofbunches-1717666397270.jpg`,
  "Oranges (12 pcs)": `${S3}/Tangerine%20-%20Clementine%20General-1718875488792.jpg`,
  "Mangoes (6 pcs)": `${S3}/plum-1718394036429.jpg`,
  "Watermelon (whole)": `${S3}/WVML2620copy-1717665865756.jpg`,
  "Avocado (3 pcs)": `${S3}/gx7HpZzVCdK6WhGSQcmHg2dkM1aD54OMT9oGTpnZ-1725786050291.jpg`,
  // Cooking
  "Locust Beans (iru)": `${S3}/Soya%20Beans%20General-1725023067820.jpg`,
  "Tomato Paste (tin)": `${S3}/Tomato%20General(3)-1724760424441.jpg`,
  // Vegetables
  "Okra (1kg)": `${S3}/Bell%20Pepper-1718790211639.jpg`,
  "Fresh Spinach (ugu)": `${S3}/Corn%20-%20White%20General-1726068166131.jpg`,
  "Cabbage (whole)": `${S3}/Coconut%20General%20Picture(1)-1717666169949.jpg`,
};

async function uploadToCloudinary(sourceUrl: string, productName: string): Promise<string | null> {
  if (!API_KEY || !API_SECRET) return null;

  const folder = "chopdrop/groceries";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const sigStr = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash("sha1").update(sigStr).digest("hex");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file: sourceUrl,
      api_key: API_KEY,
      timestamp,
      signature,
      folder,
    }),
  });

  const result = await res.json();
  return result.secure_url || null;
}

export async function POST() {
  let updated = 0;
  const errors: string[] = [];

  for (const [name, sourceUrl] of Object.entries(IMAGE_MAP)) {
    const product = await prisma.product.findFirst({
      where: { name, category: "Groceries", imageUrl: null },
    });

    if (!product) continue;

    try {
      const cloudinaryUrl = await uploadToCloudinary(sourceUrl, name);
      if (cloudinaryUrl) {
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: cloudinaryUrl },
        });
        updated++;
      } else {
        errors.push(`Failed to upload: ${name}`);
      }
    } catch (e) {
      errors.push(`Error ${name}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({ success: true, data: { updated, total: Object.keys(IMAGE_MAP).length, errors } });
}
