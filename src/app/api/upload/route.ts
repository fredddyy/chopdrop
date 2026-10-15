import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "rigeva3a";
const API_KEY = process.env.CLOUDINARY_API_KEY || "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

export async function POST(request: NextRequest) {
  if (!API_KEY || !API_SECRET) {
    return NextResponse.json(
      { success: false, error: "Cloudinary not configured" },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "chopdrop";

  if (!file) {
    return NextResponse.json(
      { success: false, error: "No file provided" },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const sigStr = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash("sha1").update(sigStr).digest("hex");

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: dataUri,
        api_key: API_KEY,
        timestamp,
        signature,
        folder,
      }),
    }
  );

  const result = await uploadRes.json();

  if (result.secure_url) {
    return NextResponse.json({ success: true, url: result.secure_url });
  }

  return NextResponse.json(
    { success: false, error: result.error?.message || "Upload failed" },
    { status: 500 }
  );
}
