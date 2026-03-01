import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/AdminPanel";

export default async function AdminPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string } | undefined)
    ?.role;

  if (role !== "admin") {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <AdminPanel />
    </div>
  );
}
