import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN]);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: any = {};
  if (action && action !== "ALL") where.action = action;

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ logs });
}

