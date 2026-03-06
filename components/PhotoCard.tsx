import Image from "next/image";
import { useTranslations } from "next-intl";

export type PhotoProfile = {
  _id: string;
  name: string;
  profession: string;
  country: string;
  photoUrl: string | null;
  createdAt?: number;
};

/**
 * Single photo card — grayscale, Ken Burns, footer overlay.
 * `index` drives the animation-delay offset so cards are out of sync.
 * `priority` should be true for LCP candidates (first 4 cards).
 * `isColorActive` enables the warm-color "life" state for the sequential cycle.
 */
export function PhotoCard({
  photo,
  index,
  priority = false,
  isColorActive = false,
}: {
  photo: PhotoProfile;
  index: number;
  priority?: boolean;
  isColorActive?: boolean;
}) {
  const t = useTranslations("gallery");

  if (!photo.photoUrl) return null;

  const dur = isColorActive ? "800ms" : "600ms";
  const ease = isColorActive ? "ease-in-out" : "ease-out";

  const hasOverlay = Boolean(photo.name || photo.profession || photo.country);
  const altText = photo.name || photo.profession || photo.country || t("storyPhotoAlt");

  return (
    <article
      className="relative w-full h-full overflow-hidden bg-secondary focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0"
      tabIndex={0}
      aria-label={hasOverlay ? t("cardAriaLabel", { name: photo.name }) : altText}
      style={{
        boxShadow: isColorActive
          ? "0 8px 32px rgba(180, 140, 80, 0.15)"
          : "none",
        transition: `box-shadow ${dur} ${ease}`,
      }}
    >
      {/* Photo — grayscale + Ken Burns */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={photo.photoUrl}
          alt={altText}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover"
          style={{
            filter: isColorActive
              ? "grayscale(0%) saturate(110%) brightness(1.05)"
              : "grayscale(100%)",
            transition: `filter ${dur} ${ease}`,
          }}
          priority={priority}
          draggable={false}
        />
      </div>

      {/* Gradient footer overlay — only when there's text to show */}
      {hasOverlay && (
        <footer
          className="absolute inset-x-0 bottom-0 pt-10 pb-4 px-4 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
          }}
          aria-hidden={false}
        >
          {photo.name && (
            <p
              className="font-bold tracking-wide leading-tight text-sm md:text-base truncate"
              style={{
                color: isColorActive ? "#F5ECD7" : "#FFFFFF",
                transition: `color ${dur} ${ease}`,
              }}
            >
              {photo.name}
            </p>
          )}
          {photo.profession && (
            <p
              className="text-xs md:text-sm truncate mt-0.5"
              style={{
                color: isColorActive
                  ? "rgba(245, 236, 215, 0.8)"
                  : "rgba(255, 255, 255, 0.8)",
                transition: `color ${dur} ${ease}`,
              }}
            >
              {photo.profession}
            </p>
          )}
          {photo.country && (
            <p
              className="text-xs truncate mt-0.5"
              style={{
                color: isColorActive
                  ? "rgba(245, 236, 215, 0.6)"
                  : "rgba(255, 255, 255, 0.6)",
                transition: `color ${dur} ${ease}`,
              }}
            >
              {photo.country}
            </p>
          )}
        </footer>
      )}
    </article>
  );
}
