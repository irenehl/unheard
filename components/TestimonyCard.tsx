"use client";

import { useTranslations } from "next-intl";
import { Flag, Heart, Mic } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { VersionPanel } from "./VersionPanel";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Testimony {
  _id: Id<"testimonies">;
  type: "honor" | "tell";
  category:
    | "work"
    | "family"
    | "health"
    | "love"
    | "money"
    | "education"
    | "courage";
  authorName?: string;
  isAnonymous: boolean;
  originalText: string;
  originalLanguage: string;
  editedText: string;
  translatedText: Record<string, string>;
  createdAt: number;
}

export function TestimonyCard({ testimony }: { testimony: Testimony }) {
  const t = useTranslations();
  const flag = useMutation(api.testimonies.flag);

  const displayName = testimony.isAnonymous
    ? t("feed.anonymous")
    : testimony.authorName ?? t("feed.anonymous");

  const formattedDate = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(testimony.createdAt));

  const typeKey =
    `feed.type${testimony.type.charAt(0).toUpperCase() + testimony.type.slice(1)}` as
      | "feed.typeHonor"
      | "feed.typeTell";

  const isHonor = testimony.type === "honor";

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={
              isHonor
                ? "bg-primary/15 text-primary border-primary/30 hover:bg-primary/20"
                : "bg-accent/20 text-accent-foreground border-accent/30 hover:bg-accent/25"
            }
            variant="outline"
          >
            {isHonor ? (
              <Heart className="mr-1 h-3 w-3" />
            ) : (
              <Mic className="mr-1 h-3 w-3" />
            )}
            {t(typeKey)}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            {t(`categories.${testimony.category}` as any)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          <span>{t("feed.postedBy")}</span>{" "}
          <span className="font-medium text-foreground">{displayName}</span>
          {" · "}
          <time dateTime={new Date(testimony.createdAt).toISOString()}>
            {formattedDate}
          </time>
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <VersionPanel
          originalText={testimony.originalText}
          originalLanguage={testimony.originalLanguage}
          editedText={testimony.editedText}
          translatedText={testimony.translatedText}
        />
      </CardContent>

      <CardFooter className="pt-2 justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
          onClick={() => flag({ id: testimony._id })}
          aria-label={t("flag.button")}
        >
          <Flag className="mr-1 h-3 w-3" />
          {t("flag.button")}
        </Button>
      </CardFooter>
    </Card>
  );
}
