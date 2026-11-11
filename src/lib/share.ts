/**
 * Share a pool/product link via Web Share API, WhatsApp, or clipboard fallback.
 */

interface SharePoolOptions {
  productName: string;
  groupPrice: number;
  retailPrice: number;
  spotsLeft: number;
  poolSize: number;
  url: string;
}

function formatNaira(kobo: number): string {
  return "\u20A6" + (kobo / 100).toLocaleString();
}

function buildShareText(opts: SharePoolOptions): string {
  const savePct = Math.round(((opts.retailPrice - opts.groupPrice) / opts.retailPrice) * 100);
  const spotsText = opts.spotsLeft === 1 ? "1 spot left" : `${opts.spotsLeft} spots left`;
  return `${opts.productName} for ${formatNaira(opts.groupPrice)} (save ${savePct}%). ${spotsText}. Join my group: ${opts.url}`;
}

export async function sharePool(opts: SharePoolOptions): Promise<"shared" | "copied" | "whatsapp" | "failed"> {
  const text = buildShareText(opts);

  // Try native Web Share API first (mostly mobile)
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: `${opts.productName} on ChopDrop`,
        text,
        url: opts.url,
      });
      return "shared";
    } catch {
      // User cancelled or API failed — fall through
    }
  }

  // Fallback: copy to clipboard
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      // Clipboard failed
    }
  }

  return "failed";
}

export function shareToWhatsApp(opts: SharePoolOptions): void {
  const text = buildShareText(opts);
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, "_blank");
}

export function copyShareLink(url: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    return navigator.clipboard.writeText(url).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}
