import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | any): string {
  const num = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  return `S/ ${num.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date: Date | string | null | undefined, pattern: string = "dd/MM/yyyy HH:mm"): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return format(d, pattern, { locale: es });
  } catch {
    return "-";
  }
}

export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return formatDistanceToNow(d, { addSuffix: true, locale: es });
  } catch {
    return "-";
  }
}

export function formatPoints(points: number): string {
  return `${points.toLocaleString("es-PE")} ${points === 1 ? "punto" : "puntos"}`;
}

