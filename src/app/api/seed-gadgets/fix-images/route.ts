import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/seed-gadgets/fix-images — update oraimo product images
export async function POST() {
  const imageMap: Record<string, string> = {
    "oraimo SpaceBuds 2": "https://cdn-img.oraimo.com/MA/product/2026/04/14/OTW-631-SPACEGREY-MAIN.png",
    "oraimo SpaceBuds Lite": "https://cdn-img.oraimo.com/KE/product/2026/04/13/OTW-324-1080-b.png",
    "oraimo OpenSnap Air": "https://cdn-img.oraimo.com/MZ/product/2026/07/10/oraimo-opensnap-air-open-ear-true-wireless-earbuds-africa-opn-371-black-mainimage.png",
    "oraimo SpaceBuds Neo": "https://cdn-img.oraimo.com/GH/product/2025/01/09/spacebuds-neo-otw-323.png",
    "oraimo SpaceBuds Neo+": "https://cdn-img.oraimo.com/GH/product/2025/05/09/wireless-earphones-spacebuds-neo-plus-otw-323p-black.png",
    "oraimo BoomPop N": "https://cdn-img.oraimo.com/GH/product/2025/07/14/oraimo-Wireless-Headphones-BoomPop-N-OHP-915N-0.png",
    "oraimo BoomPop Air": "https://cdn-img.oraimo.com/KE/product/2026/04/13/oraimo-Headphone-BoomPop-Air-OHP-316-GRAVITYBLACK-mainimage.png",
    "oraimo BoomPop Pro": "https://cdn-img.oraimo.com/PK/product/2025/05/20/oraimo-BoomPop-Pro-OHP-917-wireless-headphones-GREY.png",
    "oraimo SpaceBox Pro": "https://cdn-img.oraimo.com/MA/product/2025/06/18/speaker-spacebox-pro-obs-682.png",
    "oraimo SpaceBox": "https://cdn-img.oraimo.com/BD/product/2025/12/22/OBS-680-BLACK.png",
    "oraimo SpaceBox Active": "https://cdn-img.oraimo.com/BD/product/2025/12/22/OBS-680-BLACK.png",
    "oraimo Necklace 5": "https://cdn-img.oraimo.com/BD/product/2025/09/15/OEB-611-BLACK.png",
    "oraimo Necklace Lite": "https://cdn-img.oraimo.com/MA/product/2024/03/19/OEB-311.png",
    "oraimo PowerNova L12": "https://cdn-img.oraimo.com/NG/product/2025/05/16/OPN-675-1080-1.png",
    "oraimo PowerBox 300": "https://cdn-img.oraimo.com/NG/product/2026/05/15/OPN-670N-GRAVITYBLACK-MAIN.png",
    "oraimo PowerNova Q21": "https://cdn-img.oraimo.com/BD/product/2025/08/07/OPN-373-BLACK.png",
    "oraimo Watch 6": "https://cdn-img.oraimo.com/products/main/NG/OSW-807-OPN-374N-GRAVITYBLACK/OSW-807-OPN-374N-GRAVITYBLACK-1793672475.png",
    "oraimo Watch 6 Pro": "https://cdn-img.oraimo.com/products/main/NG/OSW-807S-TITANIUMGOLD-OHP-316-GRAVITYBLACK/OSW-807S-TITANIUMGOLD-OHP-316-GRAVITYBLACK-1793671925.png",
    "oraimo SmartTrim": "https://cdn-img.oraimo.com/KE/product/2025/02/07/OHP-317-BLACK.png",
    "oraimo SmartClipper 2": "https://cdn-img.oraimo.com/CI/product/2026/06/23/OTW-325S-GRAPHITEBLACK-MAIN.png",
  };

  let updated = 0;
  for (const [name, imageUrl] of Object.entries(imageMap)) {
    const result = await prisma.product.updateMany({
      where: { name, imageUrl: null },
      data: { imageUrl },
    });
    updated += result.count;
  }

  return NextResponse.json({ success: true, data: { updated } });
}
