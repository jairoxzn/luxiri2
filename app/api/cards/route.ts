import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN, Role.OPERATOR]);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || "";
  const status = searchParams.get("status") || "";

  const where: any = {};
  if (status && status !== "ALL") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { cardNumber: { contains: search } },
      { customer: { firstName: { contains: search, mode: "insensitive" } } },
      { customer: { lastName: { contains: search, mode: "insensitive" } } },
      { customer: { docNumber: { contains: search } } },
    ];
  }

  const cards = await prisma.loyaltyCard.findMany({
    where,
    include: {
      customer: {
        include: {
          tier: true,
        },
      },
    },
    orderBy: { issuedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ cards });
}

