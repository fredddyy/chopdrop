import Link from "next/link";
import { formatNaira } from "@/lib/utils";

interface MealCardProps {
  dailyMenuId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  tag: string;
  type: string;
  restaurantName: string;
  restaurantAddress: string;
  startTime: string;
  endTime: string;
  remaining: number;
  expired: boolean;
  onCustomize?: () => void;
  onAdd?: () => void;
}

export function MealCard({
  dailyMenuId,
  name,
  description,
  imageUrl,
  price,
  type,
  restaurantName,
  startTime,
  endTime,
  remaining,
  expired,
  onCustomize,
  onAdd,
}: MealCardProps) {
  const soldOut = remaining <= 0;
  const disabled = expired || soldOut;

  return (
    <article className="bg-paper border border-line rounded-[17px] overflow-hidden transition-all duration-250 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(35,58,50,0.1)]">
      {/* Tall image */}
      <div className="relative h-[200px] sm:h-[210px] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-400 hover:scale-[1.035]"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              target.parentElement!.classList.add("bg-gradient-to-br", "from-green-soft", "to-cream");
              const fallback = document.createElement("div");
              fallback.className = "w-full h-full flex items-center justify-center text-5xl absolute inset-0";
              fallback.textContent = "🍽️";
              target.parentElement!.appendChild(fallback);
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-soft to-cream flex items-center justify-center text-5xl">
            🍽️
          </div>
        )}
        {/* Tag pill — inside image, top-left */}
        <span className="absolute top-3 left-3 bg-amber-soft text-[#7d5716] text-[10px] font-extrabold uppercase tracking-[0.07em] px-2.5 py-1.5 rounded-full leading-none">
          {type === "BUILD_YOUR_PLATE" ? "Customisable" : "Ready meal"}
        </span>
        {/* Stock count — inside image, bottom-right */}
        <span className={`absolute bottom-3 right-3 text-[10px] font-bold px-2 py-1 rounded-[7px] ${
          soldOut
            ? "bg-coral/90 text-white"
            : "bg-ink/[0.85] text-white"
        }`}>
          {soldOut ? "Sold out" : `${remaining} left`}
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Vendor */}
        <div className="text-coral text-[10px] font-extrabold uppercase tracking-[0.08em]">
          {restaurantName}
        </div>
        {/* Meal name */}
        <h3 className="font-display font-bold text-[18px] tracking-[-0.025em] mt-1.5 leading-tight">
          {name}
        </h3>
        {/* Description */}
        {description && (
          <p className="text-ink-soft text-[12px] mt-1.5 leading-[1.4] min-h-[34px]">
            {description}
          </p>
        )}
        {/* Meta row: time + batch delivery tag */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-ink-soft text-[11px]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            {startTime} – {endTime}
          </div>
          <span className="flex items-center gap-1 text-green text-[10px] font-semibold">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h11v11H3zM14 10h4l3 4v3h-7z" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" />
            </svg>
            Free batch delivery
          </span>
        </div>

        {/* Footer: price + button */}
        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-line">
          <div>
            <strong className="font-display font-bold text-[17px]">
              {type === "BUILD_YOUR_PLATE" ? "From " : ""}
              {formatNaira(price)}
            </strong>
            {type === "BUILD_YOUR_PLATE" && (
              <span className="block text-green text-[9px] font-extrabold mt-0.5">
                Customisable
              </span>
            )}
          </div>
          {onCustomize ? (
            <button
              type="button"
              onClick={disabled ? undefined : onCustomize}
              disabled={disabled}
              className={`inline-flex items-center gap-2 rounded-[10px] font-bold text-[12px] min-h-[36px] px-3.5 transition-all duration-200 border-0 cursor-pointer ${
                disabled
                  ? "bg-line text-ink-soft cursor-not-allowed opacity-50"
                  : "bg-coral text-white shadow-[0_5px_14px_rgba(240,100,73,0.22)] hover:bg-[#d95038] hover:-translate-y-0.5"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
              Choose
            </button>
          ) : (
            <button
              type="button"
              onClick={disabled ? undefined : onAdd}
              disabled={disabled}
              className={`inline-flex items-center gap-2 rounded-[10px] font-bold text-[12px] min-h-[36px] px-3.5 transition-all duration-200 border-0 cursor-pointer ${
                disabled
                  ? "bg-line text-ink-soft cursor-not-allowed opacity-50"
                  : "bg-coral text-white shadow-[0_5px_14px_rgba(240,100,73,0.22)] hover:bg-[#d95038] hover:-translate-y-0.5"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
