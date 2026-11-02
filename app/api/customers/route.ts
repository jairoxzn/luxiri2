import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, CustomerStatus, DocType, CardStatus } from "@prisma/client";
import { generateCardNumber, generateSecureQRToken } from "@/lib/qr/qr-service";
import { hashPassword } from "@/lib/auth/password";
import { logAuditEvent } from "@/lib/loyalty/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN, Role.OPERATOR]);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || "";
  const tierId = searchParams.get("tierId") || "";
  const status = searchParams.get("status") || "";
  const limit = parseInt(searchParams.get("limit") || "50");
  const page = parseInt(searchParams.get("page") || "1");
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { docNumber: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }

  if (tierId) {
    where.tierId = tierId;
  }

  if (status && status !== "ALL") {
    where.status = status as CustomerStatus;
  }

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      include: {
        tier: true,
        card: true,
        _count: {
          select: {
            bookings: true,
            redemptions: true,
            pointTransactions: true,
          },
        },
      },
      orderBy: { registeredAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN]);
  if (!auth.authorized) return auth.response;

  try {
    const data = await request.json();
    const {
      firstName,
      lastName,
      docType = "DNI",
      docNumber,
      phone,
      email,
      address,
      district,
      city = "Arequipa",
      birthDate,
      tierId,
      createAccount = false,
      accountPassword,
      notes,
    } = data;

    if (!firstName || !lastName || !docNumber || !phone || !email) {
      return NextResponse.json(
        { error: "Nombres, apellidos, documento, teléfono y correo son obligatorios" },
        { status: 400 }
      );
    }

    // Check unique constraints
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [
          { docNumber: docNumber.trim() },
          { email: email.toLowerCase().trim() },
          { phone: phone.trim() },
        ],
      },
    });

    if (existing) {
      if (existing.docNumber === docNumber.trim()) {
        return NextResponse.json({ error: "Ya existe un cliente con este número de documento" }, { status: 400 });
      }
      if (existing.email === email.toLowerCase().trim()) {
        return NextResponse.json({ error: "Ya existe un cliente con este correo electrónico" }, { status: 400 });
      }
      return NextResponse.json({ error: "Ya existe un cliente con este número de teléfono" }, { status: 400 });
    }

    // Determine initial tier (default Bronze)
    let selectedTierId = tierId;
    if (!selectedTierId) {
      const bronzeTier = await prisma.loyaltyTier.findFirst({
        where: { orderIndex: 1 },
      });
      selectedTierId = bronzeTier?.id;
    }

    if (!selectedTierId) {
      return NextResponse.json({ error: "No se encontró un nivel VIP válido" }, { status: 400 });
    }

    // Count for unique sequential code
    const count = await prisma.customer.count();
    const customerCode = `LPT-${10001 + count}`;
    const cardNumber = generateCardNumber();
    const qrToken = generateSecureQRToken();

    // Optionally create user account
    let createdUserId: string | null = null;
    if (createAccount) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (existingUser) {
        createdUserId = existingUser.id;
      } else {
        const passwordToHash = accountPassword || process.env.DEMO_PASSWORD || "Luxury2026*";
        const hashedPassword = await hashPassword(passwordToHash);
        const newUser = await prisma.user.create({
          data: {
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            name: `${firstName} ${lastName}`,
            phone,
            role: Role.CUSTOMER,
            isActive: true,
          },
        });
        createdUserId = newUser.id;
      }
    }

    // Create customer with digital card
    const customer = await prisma.customer.create({
      data: {
        code: customerCode,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        docType: docType as DocType,
        docNumber: docNumber.trim(),
        phone: phone.trim(),
        email: email.toLowerCase().trim(),
        address: address?.trim() || null,
        district: district?.trim() || null,
        city: city?.trim() || "Arequipa",
        birthDate: birthDate ? new Date(birthDate) : null,
        tierId: selectedTierId,
        userId: createdUserId,
        notes: notes?.trim() || null,
        status: CustomerStatus.ACTIVE,
        card: {
          create: {
            cardNumber,
            qrCodeToken: qrToken,
            status: CardStatus.ACTIVE,
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 86400000),
          },
        },
      },
      include: {
        tier: true,
        card: true,
      },
    });

    await logAuditEvent({
      userId: auth.session.userId,
      action: "CREATE_CUSTOMER",
      entity: "Customer",
      entityId: customer.id,
      details: { code: customer.code, name: `${customer.firstName} ${customer.lastName}` },
    });

    return NextResponse.json({
      success: true,
      customer,
      message: "Cliente registrado exitosamente",
    });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Error en el servidor al crear cliente: " + (error?.message || "") },
      { status: 500 }
    );
  }
}

