import { prisma } from "../db/prisma";
import { PointTransactionType, LotStatus, RedemptionStatus, BookingStatus, PaymentStatus } from "@prisma/client";
import crypto from "crypto";

export interface CalculationResult {
  basePoints: number;
  multiplier: number;
  totalPoints: number;
  appliedRule: string;
}

/**
 * Calculates points for a given amount and customer tier / service multiplier
 */
export async function calculatePointsForAmount(
  amount: number,
  tierMultiplier: number = 1.0,
  serviceMultiplier: number = 1.0
): Promise<CalculationResult> {
  const rule = await prisma.loyaltyRule.findFirst({
    where: { isActive: true },
  });

  const spendPerPoint = Number(rule?.spendPerPoint || 10.00);
  const minSpend = Number(rule?.minSpend || 10.00);

  if (amount < minSpend) {
    return {
      basePoints: 0,
      multiplier: 1.0,
      totalPoints: 0,
      appliedRule: "Menor al gasto mínimo requerido",
    };
  }

  // Base calculation
  const rawBase = amount / spendPerPoint;
  const basePoints = Math.floor(rawBase);

  // Combined multiplier (tier + service)
  const combinedMultiplier = tierMultiplier * serviceMultiplier;
  const totalPoints = Math.floor(basePoints * combinedMultiplier);

  return {
    basePoints,
    multiplier: combinedMultiplier,
    totalPoints,
    appliedRule: `${rule?.name || "Regla Estándar"} (S/ ${spendPerPoint} = 1 pt)`,
  };
}

/**
 * Automatically evaluates and updates customer tier based on total spent
 */
export async function evaluateAndUpdateCustomerTier(
  customerId: string,
  operatorUserId?: string | null,
  tx?: any
) {
  const db = tx || prisma;

  const customer = await db.customer.findUnique({
    where: { id: customerId },
    include: { tier: true },
  });

  if (!customer) return null;

  // Retrieve all active tiers sorted descending by minSpend
  const tiers = await db.loyaltyTier.findMany({
    where: { isActive: true },
    orderBy: { minSpend: "desc" },
  });

  const totalSpent = Number(customer.totalSpent);

  // Find the highest qualifying tier
  const qualifyingTier = tiers.find((t: any) => totalSpent >= Number(t.minSpend)) || tiers[tiers.length - 1];

  if (qualifyingTier && qualifyingTier.id !== customer.tierId) {
    // Update tier
    await db.customer.update({
      where: { id: customerId },
      data: { tierId: qualifyingTier.id },
    });

    // Record tier history
    await db.customerTierHistory.create({
      data: {
        customerId,
        previousTierId: customer.tierId,
        newTierId: qualifyingTier.id,
        reason: `Ascenso automático por gasto acumulado de S/ ${totalSpent.toFixed(2)}`,
        changedById: operatorUserId || null,
      },
    });

    return {
      upgraded: true,
      previousTier: customer.tier.name,
      newTier: qualifyingTier.name,
    };
  }

  return { upgraded: false, currentTier: customer.tier.name };
}

/**
 * Credits points for a completed and paid booking using database transactions (Idempotent)
 */
export async function creditPointsForBooking(
  bookingId: string,
  operatorUserId?: string | null
) {
  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          include: { tier: true },
        },
        service: true,
      },
    });

    if (!booking) throw new Error("Servicio o consumo no encontrado");

    // Idempotency: Do not duplicate points if already processed
    if (booking.isProcessedForPoints) {
      return { success: false, message: "Este consumo ya acreditó puntos previamente" };
    }

    if (booking.paymentStatus !== PaymentStatus.PAGADO || booking.serviceStatus !== BookingStatus.COMPLETADO) {
      return {
        success: false,
        message: "Los puntos solo se acreditan cuando el servicio está COMPLETADO y PAGADO",
      };
    }

    const amount = Number(booking.amount);
    const tierMultiplier = booking.customer.tier?.pointsMultiplier || 1.0;
    const serviceMultiplier = booking.service?.pointsMultiplier || 1.0;

    const { totalPoints } = await calculatePointsForAmount(amount, tierMultiplier, serviceMultiplier);

    if (totalPoints <= 0) {
      await tx.booking.update({
        where: { id: bookingId },
        data: { isProcessedForPoints: true, pointsEarned: 0 },
      });
      return { success: true, pointsEarned: 0, message: "Consumo registrado sin puntos (monto menor al mínimo)" };
    }

    // New balances
    const newCurrentPoints = booking.customer.currentPoints + totalPoints;
    const newLifetimePoints = booking.customer.lifetimePoints + totalPoints;
    const newTotalSpent = Number(booking.customer.totalSpent) + amount;

    // 1. Update customer balance and spent
    await tx.customer.update({
      where: { id: booking.customerId },
      data: {
        currentPoints: newCurrentPoints,
        lifetimePoints: newLifetimePoints,
        totalSpent: newTotalSpent,
      },
    });

    // 2. Mark booking as processed
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        isProcessedForPoints: true,
        pointsEarned: totalPoints,
      },
    });

    // 3. Create Point Ledger entry
    await tx.pointTransaction.create({
      data: {
        customerId: booking.customerId,
        bookingId: booking.id,
        type: PointTransactionType.EARNED,
        points: totalPoints,
        balanceAfter: newCurrentPoints,
        concept: `Acreditación de puntos por ${booking.service.name} (${booking.code})`,
        operatorId: operatorUserId || null,
        referenceCode: booking.code,
      },
    });

    // 4. Create Point Lot for expiration tracking (12 months)
    const expiresAt = new Date(Date.now() + 365 * 86400000);
    await tx.pointLot.create({
      data: {
        customerId: booking.customerId,
        bookingId: booking.id,
        pointsInitial: totalPoints,
        pointsRemaining: totalPoints,
        status: LotStatus.ACTIVE,
        expiresAt,
      },
    });

    // 5. Evaluate VIP tier progression
    const tierResult = await evaluateAndUpdateCustomerTier(booking.customerId, operatorUserId, tx);

    return {
      success: true,
      pointsEarned: totalPoints,
      newBalance: newCurrentPoints,
      tierUpgraded: tierResult?.upgraded,
      newTier: tierResult?.newTier,
    };
  });
}

/**
 * Reverts points from a refunded or cancelled booking safely
 */
export async function revertPointsForBooking(
  bookingId: string,
  reason: string,
  operatorUserId?: string | null
) {
  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true },
    });

    if (!booking) throw new Error("Consumo no encontrado");
    if (!booking.isProcessedForPoints || booking.pointsEarned <= 0) {
      return { success: false, message: "Este consumo no tiene puntos para revertir" };
    }

    const pointsToRevert = booking.pointsEarned;
    const currentPoints = booking.customer.currentPoints;

    if (currentPoints < pointsToRevert) {
      throw new Error(
        `No se puede revertir: el cliente solo tiene ${currentPoints} puntos disponibles y se requiere revertir ${pointsToRevert} puntos`
      );
    }

    const newBalance = currentPoints - pointsToRevert;
    const newSpent = Math.max(0, Number(booking.customer.totalSpent) - Number(booking.amount));

    // Update customer
    await tx.customer.update({
      where: { id: booking.customerId },
      data: {
        currentPoints: newBalance,
        totalSpent: newSpent,
      },
    });

    // Mark booking reversed
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        serviceStatus: BookingStatus.REEMBOLSADO,
        paymentStatus: PaymentStatus.REEMBOLSADO,
      },
    });

    // Ledger entry for reversal
    await tx.pointTransaction.create({
      data: {
        customerId: booking.customerId,
        bookingId: booking.id,
        type: PointTransactionType.REVERSED,
        points: -pointsToRevert,
        balanceAfter: newBalance,
        concept: `Reversión de puntos por: ${reason} (${booking.code})`,
        operatorId: operatorUserId || null,
        referenceCode: booking.code,
      },
    });

    // Mark lot as reversed
    await tx.pointLot.updateMany({
      where: { bookingId: booking.id },
      data: { status: LotStatus.REVERSED, pointsRemaining: 0 },
    });

    return {
      success: true,
      pointsReverted: pointsToRevert,
      newBalance,
    };
  });
}

/**
 * Process a customer reward redemption request with concurrency protection & ledger
 */
export async function requestRewardRedemption(
  customerId: string,
  rewardId: string,
  notes?: string
) {
  return await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({
      where: { id: customerId },
      include: { tier: true },
    });

    if (!customer) throw new Error("Cliente no encontrado");
    if (customer.status !== "ACTIVE") throw new Error("Cliente inactivo o bloqueado");

    const reward = await tx.reward.findUnique({
      where: { id: rewardId },
      include: { minTier: true },
    });

    if (!reward || !reward.isActive) throw new Error("Recompensa no disponible");
    if (reward.stock <= 0) throw new Error("No hay stock disponible para esta recompensa");

    // Tier qualification check
    if (reward.minTier && customer.tier.orderIndex < reward.minTier.orderIndex) {
      throw new Error(`Esta recompensa requiere nivel mínimo ${reward.minTier.name}`);
    }

    // Points balance check
    if (customer.currentPoints < reward.pointsRequired) {
      throw new Error(
        `Puntos insuficientes: Tienes ${customer.currentPoints} y requieres ${reward.pointsRequired}`
      );
    }

    // Decrement customer points immediately (reserved)
    const newBalance = customer.currentPoints - reward.pointsRequired;
    await tx.customer.update({
      where: { id: customerId },
      data: { currentPoints: newBalance },
    });

    // Decrement reward stock
    await tx.reward.update({
      where: { id: rewardId },
      data: { stock: { decrement: 1 } },
    });

    // Generate codes
    const redemptionCode = `CJ-${Math.floor(100000 + Math.random() * 900000)}`;
    const qrValidationCode = crypto.randomBytes(16).toString("hex");

    // Create redemption record
    const redemption = await tx.redemption.create({
      data: {
        code: redemptionCode,
        customerId,
        rewardId,
        pointsSpent: reward.pointsRequired,
        status: RedemptionStatus.APROBADO, // Instant voucher ready for operator validation
        qrValidationCode,
        approvedAt: new Date(),
        notes: notes || "Canje solicitado desde el portal de recompensas",
      },
      include: {
        reward: true,
      },
    });

    // Create Point Transaction in Ledger
    await tx.pointTransaction.create({
      data: {
        customerId,
        redemptionId: redemption.id,
        type: PointTransactionType.REDEEMED,
        points: -reward.pointsRequired,
        balanceAfter: newBalance,
        concept: `Canje de recompensa: ${reward.name} (${redemption.code})`,
        referenceCode: redemption.code,
      },
    });

    return {
      success: true,
      redemption,
      newBalance,
    };
  });
}

/**
 * Validates a redemption voucher by operator or admin (marks COMPLETADO)
 */
export async function validateRedemptionVoucher(
  codeOrQrToken: string,
  operatorUserId: string
) {
  return await prisma.$transaction(async (tx) => {
    const redemption = await tx.redemption.findFirst({
      where: {
        OR: [
          { code: codeOrQrToken.trim() },
          { qrValidationCode: codeOrQrToken.trim() },
        ],
      },
      include: {
        customer: true,
        reward: true,
      },
    });

    if (!redemption) {
      throw new Error("Código de canje no encontrado");
    }

    if (redemption.status === RedemptionStatus.COMPLETADO) {
      throw new Error(`Este canje ya fue utilizado el ${redemption.completedAt?.toLocaleString("es-PE")}`);
    }

    if (redemption.status === RedemptionStatus.RECHAZADO || redemption.status === RedemptionStatus.CANCELADO) {
      throw new Error(`Este canje se encuentra ${redemption.status}`);
    }

    // Complete redemption
    const updated = await tx.redemption.update({
      where: { id: redemption.id },
      data: {
        status: RedemptionStatus.COMPLETADO,
        completedAt: new Date(),
        validatedByUserId: operatorUserId,
      },
      include: {
        customer: true,
        reward: true,
      },
    });

    return {
      success: true,
      redemption: updated,
    };
  });
}

