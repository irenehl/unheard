"use client";

import { useTranslations } from "next-intl";
import { Flag, Heart, Mic } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Doc } from "@/convex/_generated/dataModel";
import { VersionPanel } from "./VersionPanel";
import { Button } from "@/components/ui/button";

type Testimony = Doc<"testimonies">;

export function TestimonyCard({
  testimony,
  isFeatured = false,
  isPlaceholder = false,
}: {
  testimony: Testimony;
  isFeatured?: boolean;
  isPlaceholder?: boolean;
}) {
  const t = useTranslations();
  const flag = useMutation(api.testimonies.flag);

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

  return (
    <motion.article
      className="p-8 md:p-10 group h-full flex flex-col"
      /* scroll reveal — fires once when card enters viewport */
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, ease: [0.25, 0, 0, 1] }}
      /* hover lift — translateY only, shadow via CSS on article */
      whileHover={{ y: -2 }}
      /* press scale */
      whileTap={{ scale: 0.99 }}
    >
      <header className="mb-5 border-b border-border pb-3">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-foreground">
            <span>{t(`categories.${testimony.category}`)}</span>
            <span className="text-muted-foreground">—</span>
            <time dateTime={new Date(testimony.createdAt).toISOString()}>
              {formattedDate}
            </time>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
            <span className={isHonor ? "text-primary" : ""}>
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

      <div className="flex-grow">
        <VersionPanel
          testimonyId={testimony._id}
          originalText={testimony.originalText}
          originalLanguage={testimony.originalLanguage}
          editedText={testimony.editedText}
          translatedText={testimony.translatedText}
          isFeatured={isFeatured}
        />
      </div>

      <footer className="mt-6 flex justify-end border-t border-border pt-3">
        {!isPlaceholder && (
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground hover:bg-transparent h-auto p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded-none"
            onClick={() => flag({ id: testimony._id })}
            aria-label={t("flag.button")}
          >
            <Flag className="mr-1.5 h-3 w-3" aria-hidden />
            {t("flag.button")}
          </Button>
        )}
      </footer>
    </motion.article>
  );
}
