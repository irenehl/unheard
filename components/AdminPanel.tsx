"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ChevronDown } from "lucide-react";
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

  const [confirmId, setConfirmId] = useState<Id<"testimonies"> | null>(null);

  async function handleRemove() {
    if (!confirmId) return;
    await setStatusMutation({ id: confirmId, status: "removed" });
    setConfirmId(null);
  }

  return (
    <div className="space-y-6">
      <h1
        className="font-serif text-3xl font-semibold text-foreground"
        style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
      >
        {t("title")}
      </h1>

      {status === "LoadingFirstPage" && (
        <div aria-busy="true" aria-live="polite" className="text-muted-foreground text-sm">
          Cargando…
        </div>
      )}

      <ol aria-label={t("title")} className="space-y-4">
        {results.map((testimony) => {
          const isPublished = testimony.status === "published";
          const flagCount = testimony.flagCount ?? 0;

          return (
            <li key={testimony._id}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {testimony.type}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {testimony.category}
                    </Badge>
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
            </li>
          );
        })}
      </ol>

      {status === "CanLoadMore" && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => loadMore(50)}>
            <ChevronDown className="mr-2 h-4 w-4" />
            {tFeed("loadMore")}
          </Button>
        </div>
      )}

      <Dialog open={confirmId !== null} onOpenChange={() => setConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmRemove")}</DialogTitle>
            <DialogDescription>
              Esta acción eliminará la historia de la vista pública. Puedes
              restaurarla después.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmId(null)}>
              Cancelar
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
