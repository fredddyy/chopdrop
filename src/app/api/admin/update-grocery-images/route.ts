import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "rigeva3a";
const API_KEY = process.env.CLOUDINARY_API_KEY || "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

const S3 = "https://pp-new-node-medusa-prod-bucket.s3.us-east-1.amazonaws.com";

const IMAGE_MAP: Record<string, string> = {
  "Tomatoes (basket)": `${S3}/Tomato%20General(3)-1724760266675.jpg`,
  "Pepper (Rodo)": `${S3}/Ata%20Rodo%20General(1)-1724760450804.jpg`,
  "Onions (bag)": `${S3}/Onions%20-%20Red%20General-1724763704377.jpg`,
  "Carrots (1kg)": `${S3}/Carrot%20General(1)-1724754920238.jpg`,
  "Frozen Chicken (whole)": `${S3}/Nigerian%20Chicken-1725265461432.jpg`,
  "Beef (1kg)": `${S3}/Cow%20Beef%20Boneless%20(1kg)-1725267649816.jpg`,
  "Turkey (whole)": `${S3}/turkey%20full%20wings-1725267108642.jpg`,
  "Catfish (1kg)": `${S3}/Titus%20General%20(1)-1725278725512.jpg`,
  "Rice (25kg)": `${S3}/Big%20Bull%20Rice%20(50kg)-1719040298233.jpg`,
  "Rice (5kg)": `${S3}/Big%20Bull%20Rice%20(50kg)-1719040298233.jpg`,
  "Beans (5kg)": `${S3}/Beans%20-%20Oloyin%20General(1)-1725022956578.jpg`,
  "Plantain (bunch)": `${S3}/Plantain%20General(1)-1724756334818.jpg`,
  "Crayfish (500g)": `${S3}/Crayfish%20General-1724917719103.jpg`,
  "Fresh Pepper Mix": `${S3}/Pepper-1750444014859.jpg`,
  "Pineapple": `${S3}/Pineapple%201%20Piece-1717666038098.jpg`,
  "Bananas (bunch)": `${S3}/native-banana-stemofbunches-1717666397270.jpg`,
  "Stockfish (medium)": `${S3}/eja-panla-1718650694306.jpg`,
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
