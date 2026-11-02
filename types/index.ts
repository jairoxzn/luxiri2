export type Role = "ADMIN" | "OPERATOR" | "CUSTOMER";
export const Role = {
  ADMIN: "ADMIN",
  OPERATOR: "OPERATOR",
  CUSTOMER: "CUSTOMER",
} as const;

export type DocType = "DNI" | "CE" | "PASAPORTE" | "RUC";
export const DocType = {
  DNI: "DNI",
  CE: "CE",
  PASAPORTE: "PASAPORTE",
  RUC: "RUC",
} as const;

export type CustomerStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";
export const CustomerStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BLOCKED: "BLOCKED",
} as const;

export type CardStatus = "ACTIVE" | "BLOCKED" | "EXPIRED";
export const CardStatus = {
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED",
  EXPIRED: "EXPIRED",
} as const;

export type ServiceCategory =
  | "TRANSPORTE"
  | "VIAJES_PRIVADOS"
  | "TOURS"
  | "MENSAJERIA"
  | "TRANSPORTE_EMPRESARIAL"
  | "SERVICIOS_ESPECIALES";

export const ServiceCategory = {
  TRANSPORTE: "TRANSPORTE",
  VIAJES_PRIVADOS: "VIAJES_PRIVADOS",
  TOURS: "TOURS",
  MENSAJERIA: "MENSAJERIA",
  TRANSPORTE_EMPRESARIAL: "TRANSPORTE_EMPRESARIAL",
  SERVICIOS_ESPECIALES: "SERVICIOS_ESPECIALES",
} as const;

export type PaymentMethod =
  | "EFECTIVO"
  | "YAPE"
  | "PLIN"
  | "TRANSFERENCIA_BANCARIA"
  | "TARJETA"
  | "OTROS";

export const PaymentMethod = {
  EFECTIVO: "EFECTIVO",
  YAPE: "YAPE",
  PLIN: "PLIN",
  TRANSFERENCIA_BANCARIA: "TRANSFERENCIA_BANCARIA",
  TARJETA: "TARJETA",
  OTROS: "OTROS",
} as const;

export type PaymentStatus = "PENDIENTE" | "PAGADO" | "REEMBOLSADO";
export const PaymentStatus = {
  PENDIENTE: "PENDIENTE",
  PAGADO: "PAGADO",
  REEMBOLSADO: "REEMBOLSADO",
} as const;

export type BookingStatus =
  | "PENDIENTE"
  | "EN_PROCESO"
  | "COMPLETADO"
  | "CANCELADO"
  | "REEMBOLSADO";

export const BookingStatus = {
  PENDIENTE: "PENDIENTE",
  EN_PROCESO: "EN_PROCESO",
  COMPLETADO: "COMPLETADO",
  CANCELADO: "CANCELADO",
  REEMBOLSADO: "REEMBOLSADO",
} as const;

export type PointTransactionType =
  | "EARNED"
  | "REDEEMED"
  | "EXPIRED"
  | "REVERSED"
  | "ADJUSTMENT";

export const PointTransactionType = {
  EARNED: "EARNED",
  REDEEMED: "REDEEMED",
  EXPIRED: "EXPIRED",
  REVERSED: "REVERSED",
  ADJUSTMENT: "ADJUSTMENT",
} as const;

export type LotStatus = "ACTIVE" | "EXHAUSTED" | "EXPIRED" | "REVERSED";
export const LotStatus = {
  ACTIVE: "ACTIVE",
  EXHAUSTED: "EXHAUSTED",
  EXPIRED: "EXPIRED",
  REVERSED: "REVERSED",
} as const;

export type RedemptionStatus =
  | "PENDIENTE"
  | "APROBADO"
  | "RECHAZADO"
  | "COMPLETADO"
  | "CANCELADO";

export const RedemptionStatus = {
  PENDIENTE: "PENDIENTE",
  APROBADO: "APROBADO",
  RECHAZADO: "RECHAZADO",
  COMPLETADO: "COMPLETADO",
  CANCELADO: "CANCELADO",
} as const;
