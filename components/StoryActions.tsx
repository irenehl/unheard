"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { DeleteDialog } from "./DeleteDialog";
import { useShouldReduceMotion } from "@/lib/motionPrefs";
import { clarityTrack } from "@/lib/clarity";

export function StoryDeleteButton({
  testimonyId,
  locale,
}: {
  testimonyId: string;
  locale: string;
}) {
  const t = useTranslations("story");
  const shouldReduceMotion = useShouldReduceMotion();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleConfirm() {
    setIsPending(true);
    try {
      await fetch(`/api/submit/${testimonyId}`, { method: "DELETE" });
      clarityTrack("story_delete");
      router.push(`/${locale}`);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        aria-label={t("delete")}
        className="flex items-center gap-1.5 text-[0.625rem] font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
        whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
        transition={{ duration: 0.1 }}
      >
        <Trash2 className="h-3 w-3" aria-hidden />
        {t("delete")}
      </motion.button>
      <DeleteDialog
        open={open}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
        isPending={isPending}
      />
    </>
  );
}
