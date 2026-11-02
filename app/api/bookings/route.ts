import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, PaymentMethod, PaymentStatus, BookingStatus } from "@prisma/client";
import { creditPointsForBooking } from "@/lib/loyalty/points-engine";
import { logAuditEvent } from "@/lib/loyalty/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN, Role.OPERATOR, Role.CUSTOMER]);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");
  const serviceId = searchParams.get("serviceId");
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50");
  const page = parseInt(searchParams.get("page") || "1");
  const skip = (page - 1) * limit;

  const where: any = {};

  if (auth.session.role === Role.CUSTOMER) {
    where.customerId = auth.session.customerId;
  } else if (customerId) {
    where.customerId = customerId;
  }

  if (serviceId) where.serviceId = serviceId;
  if (status && status !== "ALL") where.serviceStatus = status as BookingStatus;

  if (search) {
    where.OR = [
      { code: { contains: search } },
      { customer: { firstName: { contains: search, mode: "insensitive" } } },
      { customer: { lastName: { contains: search, mode: "insensitive" } } },
      { customer: { docNumber: { contains: search } } },
      { service: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: {
        customer: {
          include: { tier: true, card: true },
        },
        service: true,
        operator: {
          select: { id: true, name: true, email: true },
        },
        payments: true,
      },
      orderBy: { bookingDate: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    bookings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN, Role.OPERATOR]);
  if (!auth.authorized) return auth.response;

  try {
    const data = await request.json();
    const {
      customerId,
      serviceId,
      amount,
      paymentMethod = PaymentMethod.EFECTIVO,
      paymentStatus = PaymentStatus.PAGADO,
      serviceStatus = BookingStatus.COMPLETADO,
      bookingDate,
      notes,
      referenceNumber,
    } = data;

    if (!customerId || !serviceId || !amount) {
      return NextResponse.json(
        { error: "Cliente, servicio e importe son obligatorios" },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "El importe debe ser un número válido mayor a 0" }, { status: 400 });
    }

    // Generate unique code CNS-YYYY-XXXX
    const count = await prisma.booking.count();
    const year = new Date().getFullYear();
    const code = `CNS-${year}-${String(count + 1001).padStart(4, "0")}`;

    const dateToUse = bookingDate ? new Date(bookingDate) : new Date();

    const booking = await prisma.booking.create({
      data: {
        code,
        customerId,
        serviceId,
        amount: numAmount,
        paymentMethod: paymentMethod as PaymentMethod,
        paymentStatus: paymentStatus as PaymentStatus,
        serviceStatus: serviceStatus as BookingStatus,
        bookingDate: dateToUse,
        operatorId: auth.session.userId,
        notes: notes?.trim() || null,
        completedAt: serviceStatus === BookingStatus.COMPLETADO ? dateToUse : null,
        payments: {
          create: {
            amount: numAmount,
            paymentMethod: paymentMethod as PaymentMethod,
            status: paymentStatus as PaymentStatus,
            referenceNumber: referenceNumber || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
            paidAt: dateToUse,
          },
        },
      },
      include: {
        customer: { include: { tier: true } },
        service: true,
      },
    });

    let pointsResult = null;
    // Credit points if completed and paid
    if (booking.paymentStatus === PaymentStatus.PAGADO && booking.serviceStatus === BookingStatus.COMPLETADO) {
      pointsResult = await creditPointsForBooking(booking.id, auth.session.userId);
    }

    await logAuditEvent({
      userId: auth.session.userId,
      action: "REGISTER_BOOKING",
      entity: "Booking",
      entityId: booking.id,
      details: {
        code: booking.code,
        amount: numAmount,
        customer: `${booking.customer.firstName} ${booking.customer.lastName}`,
        pointsEarned: pointsResult?.pointsEarned || 0,
      },
    });

    return NextResponse.json({
      success: true,
      booking,
      pointsResult,
      message: `Consumo ${booking.code} registrado con éxito` + (pointsResult?.pointsEarned ? `. Se acumularon ${pointsResult.pointsEarned} puntos.` : ""),
    });
  } catch (error: any) {
    console.error("Booking creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

