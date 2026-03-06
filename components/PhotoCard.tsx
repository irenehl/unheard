import Image from "next/image";
import { useTranslations } from "next-intl";

export type PhotoProfile = {
  _id: string;
  name: string;
  profession: string;
  country: string;
  photoUrl: string | null;
};

/**
 * Single photo card — grayscale, Ken Burns, footer overlay.
 * `index` drives the animation-delay offset so cards are out of sync.
 * `priority` should be true for LCP candidates (first 4 cards).
 */
export function PhotoCard({
  photo,
  index,
  priority = false,
}: {
  photo: PhotoProfile;
  index: number;
  priority?: boolean;
}) {
  const t = useTranslations("gallery");

  if (!photo.photoUrl) return null;

  // Negative delay spreads each card's cycle by 1.5s, wrapping around 16s cycle
  const kenDelay = `${-(index * 1.5) % 16}s`;

  return (
    <article
      className="relative w-full aspect-square overflow-hidden bg-secondary focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0"
      tabIndex={0}
      aria-label={t("cardAriaLabel", { name: photo.name })}
    >
      {/* Photo — grayscale + Ken Burns */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={photo.photoUrl}
          alt={photo.name}
          fill
          sizes="(max-width: 768px) 90vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover grayscale ken-burns"
          style={{ "--ken-delay": kenDelay } as React.CSSProperties}
          priority={priority}
          draggable={false}
        />
      </div>

      {/* Gradient footer overlay — always visible */}
      <footer
        className="absolute inset-x-0 bottom-0 pt-10 pb-4 px-4 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
        }}
        aria-hidden={false}
      >
        <p className="text-white font-bold tracking-wide leading-tight text-sm md:text-base truncate">
          {photo.name}
        </p>
        <p className="text-white/80 text-xs md:text-sm truncate mt-0.5">
          {photo.profession}
        </p>
        <p className="text-white/60 text-xs truncate mt-0.5">{photo.country}</p>
      </footer>
    </article>
  );
}
