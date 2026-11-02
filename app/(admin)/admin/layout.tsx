import React from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminNavbar } from "@/components/layout/AdminNavbar";
import { getSession } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-[#080808]">
      <AdminSidebar />
      <div className="flex flex-col lg:pl-72">
        <AdminNavbar
          user={
            session
              ? {
                  name: session.name,
                  email: session.email,
                  role: session.role,
                }
              : undefined
          }
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

