import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDefaultDashboard } from "@/lib/auth/rbac";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const target = getDefaultDashboard(session.role);
  redirect(target);
}

