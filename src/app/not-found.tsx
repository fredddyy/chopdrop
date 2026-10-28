import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <div className="max-w-[400px] w-full text-center">
        <div className="flex justify-center mb-8">
          <Logo size={28} />
        </div>

        <div className="text-[80px] font-extrabold leading-none tracking-[-0.04em] mb-2" style={{ color: "var(--border)" }}>
          404
        </div>

        <h1 className="text-[24px] font-extrabold tracking-[-0.02em] mb-2" style={{ color: "var(--text)" }}>
          Page not found
        </h1>
        <p className="text-[15px] mb-8" style={{ color: "var(--text-secondary)" }}>
          This page doesn&apos;t exist or the link has expired.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/menu"
            className="w-full h-[52px] rounded-full text-[16px] font-bold text-white flex items-center justify-center active:scale-[0.97] transition-all"
            style={{ background: "var(--coral)" }}
          >
            Go to menu
          </Link>
          <Link
            href="/"
            className="w-full h-[48px] rounded-full text-[15px] font-semibold flex items-center justify-center active:scale-[0.97] transition-all"
            style={{ background: "var(--sand)", color: "var(--text)" }}
          >
            Back to home
          </Link>
        </div>

        <p className="text-[13px] mt-8" style={{ color: "var(--text-muted)" }}>
          Need help? <a href="https://wa.me/2349120532827" className="font-semibold underline" style={{ color: "var(--text-secondary)" }}>WhatsApp us</a>
        </p>
      </div>
    </main>
  );
}
