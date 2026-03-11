import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/AdminPanel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string } | undefined)
    ?.role;

  if (role !== "admin") {
    redirect(`/${locale}`);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <AdminPanel />
    </div>
  );
}
