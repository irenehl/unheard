"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Flag, Check, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { VersionPanel } from "./VersionPanel";
import dynamic from "next/dynamic";
import { useShouldReduceMotion } from "@/lib/motionPrefs";
import type { Id } from "@/convex/_generated/dataModel";

const SharePopover = dynamic(
  () => import("./SharePopover").then((mod) => mod.SharePopover),
  { ssr: false }
);
const DeleteDialog = dynamic(
  () => import("./DeleteDialog").then((mod) => mod.DeleteDialog),
  { ssr: false }
);

type Testimony = {
  _id: Id<"testimonies">;
  type: "honor" | "tell";
  category: "work" | "family" | "health" | "love" | "money" | "education" | "courage";
  authorId?: string;
  authorName?: string;
  isAnonymous: boolean;
  originalText: string;
  originalLanguage: string;
  editedText: string;
  translatedText: Record<string, string>;
  createdAt: number;
  editedAt?: number;
  photoUrl?: string | null;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export function TestimonyCard({
  testimony,
  isFeatured = false,
  isPlaceholder = false,
  currentUserId,
  locale,
  showExpandLink = false,
  showExpandOriginal = false,
  showExpandEdited = false,
  showExpandTranslated = false,
}: {
  testimony: Testimony;
  isFeatured?: boolean;
  isPlaceholder?: boolean;
  currentUserId?: string;
  locale: string;
  showExpandLink?: boolean;
  showExpandOriginal?: boolean;
  showExpandEdited?: boolean;
  showExpandTranslated?: boolean;
}) {
  const t = useTranslations();
  const flag = useMutation(api.testimonies.flag);
  const shouldReduceMotion = useShouldReduceMotion();
  const router = useRouter();

  const [flagged, setFlagged] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const displayName = testimony.isAnonymous
    ? t("feed.anonymous")
    : testimony.authorName ?? t("feed.anonymous");

  const formattedDate = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(testimony.createdAt));

  const typeKey =
    `feed.type${testimony.type.charAt(0).toUpperCase() + testimony.type.slice(1)}` as
      | "feed.typeHonor"
      | "feed.typeTell";

  const isHonor = testimony.type === "honor";
  const isOwn = Boolean(currentUserId && testimony.authorId === currentUserId);
  const ageMs = Date.now() - testimony.createdAt;
  const canEdit = isOwn && ageMs < 86_400_000;
  const hoursLeft = Math.floor((86_400_000 - ageMs) / 3_600_000);

  const storyUrl = `${SITE_URL}/${locale}/story/${testimony._id}`;

  async function handleFlag() {
    if (flagged || isPlaceholder) return;
    setFlagged(true);
    await flag({ id: testimony._id });
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await fetch(`/api/submit/${testimony._id}`, { method: "DELETE" });
      setDeleteOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <motion.article
        className="group flex flex-col p-8 md:p-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: [0.25, 0, 0, 1] as [number, number, number, number] }}
        whileHover={shouldReduceMotion ? undefined : { y: -2 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
      >
        <header className="mb-5 border-b border-border pb-3">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-foreground">
              <span>{t(`categories.${testimony.category}`)}</span>
              <span className="text-muted-foreground">—</span>
              <time dateTime={new Date(testimony.createdAt).toISOString()}>
                {formattedDate}
              </time>
              {testimony.editedAt && (
                <>
                  <span className="text-muted-foreground">—</span>
                  <span className="text-muted-foreground">{t("story.edited")}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
              <span className={isHonor ? "text-[hsl(35,40%,52%)]" : ""}>
                {t(typeKey)}
              </span>
              <span>·</span>
              <span>
                {t("feed.postedBy")}{" "}
                <span className="text-foreground">{displayName}</span>
              </span>
            </div>
          </div>
        </header>

        <div className="grow">
          {testimony.photoUrl && (
            <div className="mb-6 overflow-hidden border border-border">
              <img
                src={testimony.photoUrl}
                alt={t("submit.photoPreviewAlt")}
                className="block h-auto max-h-[60vh] lg:max-h-128 w-full grayscale hover:grayscale-0 transition-all duration-500"
                loading="lazy"
                decoding="async"
              />
            </div>
          )}

          <VersionPanel
            testimonyId={testimony._id}
            originalText={testimony.originalText}
            originalLanguage={testimony.originalLanguage}
            editedText={testimony.editedText}
            translatedText={testimony.translatedText}
            isFeatured={isFeatured}
            showExpandLink={showExpandLink}
            showExpandOriginal={showExpandOriginal}
            showExpandEdited={showExpandEdited}
            showExpandTranslated={showExpandTranslated}
          />
        </div>

        <footer className="mt-6 flex items-center justify-between border-t border-border pt-3">
          {/* Share — always visible */}
          {/* {!isPlaceholder && (
            <SharePopover
              testimonyId={testimony._id}
              originalText={testimony.originalText}
              locale={locale}
              storyUrl={storyUrl}
            />
          )} */}

          <div className="flex items-center gap-3 ml-auto">
            {/* Edit / Delete — own stories only */}
            {isOwn && !isPlaceholder && (
              <>
                {canEdit && (
                  <div className="flex flex-col items-end">
                    <motion.button
                      className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => router.push(`/${locale}/story/${testimony._id}/edit`)}
                      aria-label={t("story.edit")}
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.85 }}
                      transition={{ duration: 0.1 }}
                    >
                      <Pencil className="h-3 w-3" aria-hidden />
                      {t("story.edit")}
                    </motion.button>
                    <span className="text-[9px] tracking-widest uppercase text-muted-foreground mt-0.5">
                      {hoursLeft < 1
                        ? t("story.editTimeLeftLess")
                        : t("story.editTimeLeft", { hours: hoursLeft })}
                    </span>
                  </div>
                )}
                <motion.button
                  className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setDeleteOpen(true)}
                  aria-label={t("story.delete")}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.85 }}
                  transition={{ duration: 0.1 }}
                >
                  <Trash2 className="h-3 w-3" aria-hidden />
                  {t("story.delete")}
                </motion.button>
              </>
            )}

            {/* Flag button — not own stories */}
            {!isOwn && !isPlaceholder && (
              <motion.button
                className={`flex items-center gap-1.5 text-[10px] tracking-widest uppercase h-auto p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded-none ${
                  flagged
                    ? "text-primary cursor-default"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={handleFlag}
                disabled={flagged}
                aria-label={flagged ? t("flag.success") : t("flag.button")}
                whileTap={shouldReduceMotion || flagged ? undefined : { scale: 0.85 }}
                transition={{ duration: 0.1 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {flagged ? (
                    <motion.span
                      key="flagged"
                      className="flex items-center gap-1.5"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <Check className="h-3 w-3" aria-hidden />
                      {t("flag.success")}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      className="flex items-center gap-1.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Flag className="h-3 w-3" aria-hidden />
                      {t("flag.button")}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
          </div>
        </footer>
      </motion.article>

      <DeleteDialog
        open={deleteOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        isPending={deleteLoading}
      />
    </>
  );
}
