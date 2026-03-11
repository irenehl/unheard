"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useShouldReduceMotion } from "@/lib/motionPrefs";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AdminPanel() {
  const t = useTranslations("admin");
  const tFeed = useTranslations("feed");

  const { results, status, loadMore } = usePaginatedQuery(
    api.testimonies.listForAdmin,
    {},
    { initialNumItems: 50 }
  );
  const setStatusMutation = useMutation(api.testimonies.setStatus);

  const shouldReduceMotion = useShouldReduceMotion();
  const [confirmId, setConfirmId] = useState<Id<"testimonies"> | null>(null);
  /** Track IDs being removed so we can animate them out before Convex updates */
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  async function handleRemove() {
    if (!confirmId) return;
    setRemovingIds((prev) => new Set([...prev, confirmId]));
    setConfirmId(null);
    // Give the opacity animation time to play, then commit
    setTimeout(() => {
      setStatusMutation({ id: confirmId, status: "removed" });
    }, 200);
  }

  return (
    <div className="space-y-6">
      <h1
        style={{ fontFamily: "var(--font-display), var(--font-serif), Georgia, serif" }}
        className="text-3xl text-foreground"
      >
        {t("title")}
      </h1>

      {status === "LoadingFirstPage" && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground text-sm"
          aria-busy="true"
          aria-live="polite"
        >
          {t("loading")}
        </motion.p>
      )}

      <ol aria-label={t("title")} className="space-y-4">
        <AnimatePresence initial={false}>
          {results.map((testimony) => {
            const isPublished = testimony.status === "published";
            const flagCount = testimony.flagCount ?? 0;
            const isRemoving = removingIds.has(testimony._id);

            return (
              <motion.li
                key={testimony._id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={
                  isRemoving
                    ? { opacity: 0, transition: { duration: 0.2 } }
                    : { opacity: 1, y: 0, transition: { duration: 0.3 } }
                }
                exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { opacity: { duration: 0.2 }, height: { duration: 0.2, delay: 0.2 } } }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {testimony.type}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {testimony.category}
                      </Badge>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={testimony.status}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                        >
                          <Badge
                            variant={isPublished ? "default" : "secondary"}
                            className={
                              isPublished
                                ? "bg-primary/20 text-primary border-primary/30"
                                : "text-muted-foreground"
                            }
                          >
                            {isPublished ? t("statusPublished") : t("statusRemoved")}
                          </Badge>
                        </motion.span>
                      </AnimatePresence>
                      {flagCount > 0 && (
                        <Badge variant="destructive">
                          {t("flagCount", { count: flagCount })}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground line-clamp-4">
                      {testimony.originalText}
                    </p>
                  </CardContent>
                  <CardFooter className="gap-2 justify-end">
                    {isPublished ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setConfirmId(testimony._id as Id<"testimonies">)
                        }
                      >
                        {t("remove")}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setStatusMutation({
                            id: testimony._id as Id<"testimonies">,
                            status: "published",
                          })
                        }
                      >
                        {t("restore")}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>

      {status === "CanLoadMore" && (
        <div className="flex justify-center">
          <motion.div
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            <Button variant="outline" onClick={() => loadMore(50)}>
              <ChevronDown className="mr-2 h-4 w-4" />
              {tFeed("loadMore")}
            </Button>
          </motion.div>
        </div>
      )}

      <Dialog open={confirmId !== null} onOpenChange={() => setConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmRemove")}</DialogTitle>
            <DialogDescription>
              {t("confirmRemoveDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmId(null)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleRemove}>
              {t("remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
