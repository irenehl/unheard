"use client";

import { useSignIn } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useShouldReduceMotion } from "@/lib/motionPrefs";

const EASE = [0.25, 0, 0, 1] as [number, number, number, number];

export function SignInPrompt({
  returnUrl,
  centered = false,
}: {
  returnUrl: string;
  centered?: boolean;
}) {
  const { signIn } = useSignIn();
  const t = useTranslations("auth");
  const shouldReduceMotion = useShouldReduceMotion();

  async function handleOAuth(strategy: "oauth_google" | "oauth_x") {
    await signIn?.authenticateWithRedirect({
      strategy,
      redirectUrl: "/sso-callback",
      redirectUrlComplete: returnUrl,
    });
  }

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div
        variants={itemVariants}
        className={`space-y-3 ${centered ? "text-center" : ""}`}
      >
        <h2
          className="text-foreground leading-tight"
          style={{
            fontFamily: "var(--font-display), var(--font-serif), Georgia, serif",
            fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
            fontWeight: 300,
            letterSpacing: "-0.02em",
          }}
        >
          {t("signInToPublish")}
        </h2>
        <p
          className={`text-muted-foreground text-sm leading-relaxed max-w-md ${
            centered ? "mx-auto" : ""
          }`}
        >
          {t("signInPromptDesc")}
        </p>
      </motion.div>

      <div className={`flex flex-col gap-3 max-w-sm ${centered ? "mx-auto" : ""}`}>
        <motion.button
          variants={itemVariants}
          onClick={() => handleOAuth("oauth_google")}
          className="flex items-center justify-center gap-3 w-full border border-foreground bg-background text-foreground px-6 py-3.5 text-xs font-bold tracking-widest uppercase hover:bg-foreground hover:text-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
          whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          transition={{ duration: 0.1 }}
        >
          <GoogleIcon />
          {t("signInWithGoogle")}
        </motion.button>

        <motion.button
          variants={itemVariants}
          onClick={() => handleOAuth("oauth_x")}
          className="flex items-center justify-center gap-3 w-full border border-foreground bg-background text-foreground px-6 py-3.5 text-xs font-bold tracking-widest uppercase hover:bg-foreground hover:text-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
          whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          transition={{ duration: 0.1 }}
        >
          <XIcon />
          {t("signInWithX")}
        </motion.button>
      </div>

      <motion.p
        variants={itemVariants}
        className={`text-[0.625rem] tracking-widest uppercase text-muted-foreground max-w-sm ${
          centered ? "mx-auto text-center" : ""
        }`}
      >
        {t("signInNote")}
      </motion.p>
    </motion.div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
