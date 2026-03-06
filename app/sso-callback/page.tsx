"use client";

import {
  AuthenticateWithRedirectCallback,
  ClerkProvider,
} from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <ClerkProvider>
      <AuthenticateWithRedirectCallback />
    </ClerkProvider>
  );
}
