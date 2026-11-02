"use client";

import React, { useMemo } from "react";
import { Compass, CreditCard, Coins, Gift, User, LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  match?: string[];
}

export const CUSTOMER_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Inicio", icon: Compass, match: ["dashboard"] },
  { id: "tarjeta", label: "Tarjeta", icon: CreditCard, match: ["tarjeta"] },
  { id: "puntos", label: "Puntos", icon: Coins, match: ["puntos", "servicios"] },
  { id: "recompensas", label: "Premios", icon: Gift, match: ["recompensas", "canjes"] },
  { id: "perfil", label: "Perfil", icon: User, match: ["perfil", "promociones"] },
];

interface CustomerBottomNavProps {
  activeTab: string;
  onChangeTab: (tabId: string) => void;
}

export default function CustomerBottomNav({
  activeTab,
  onChangeTab,
}: CustomerBottomNavProps) {
  // Find which nav item index is active
  const activeIndex = useMemo(() => {
    const idx = CUSTOMER_NAV_ITEMS.findIndex((item) => {
      if (item.id === activeTab) return true;
      if (item.match && item.match.includes(activeTab)) return true;
      return false;
    });
    return idx >= 0 ? idx : 0;
  }, [activeTab]);

  const activeItem = CUSTOMER_NAV_ITEMS[activeIndex];
  const ActiveIcon = activeItem.icon;

  return (
    <nav
      aria-label="Navegación del cliente"
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md select-none"
    >
      {/* Outer Floating Bar Container */}
      <div className="relative h-[68px] rounded-[34px] bg-[#0E0E0E]/95 backdrop-blur-xl border border-[#D4AF37]/25 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.06),0_0_24px_rgba(212,175,55,0.14)]">
        
        {/* Animated Notch & Floating Bubble Wrapper */}
        <div
          className="absolute -top-[1px] pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
          style={{
            width: "88px",
            height: "68px",
            left: `calc(${(activeIndex + 0.5) * 20}% - 44px)`,
          }}
        >
          {/* Scooped Cutout SVG */}
          <div className="absolute top-0 left-0 w-full h-[32px] overflow-hidden">
            <svg
              viewBox="0 0 88 32"
              className="w-full h-full"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* Fill matching the page background (#080808) */}
              <path
                d="M 0,0 C 14,0 18,2 24,9 C 32,18 37,27 44,27 C 51,27 56,18 64,9 C 70,2 74,0 88,0 L 88,32 L 0,32 Z"
                fill="#080808"
              />
              {/* Golden metallic border tracing the curve */}
              <path
                d="M 0,0 C 14,0 18,2 24,9 C 32,18 37,27 44,27 C 51,27 56,18 64,9 C 70,2 74,0 88,0"
                fill="none"
                stroke="rgba(212, 175, 55, 0.45)"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          {/* Floating Circle Bubble with Active Icon */}
          <div
            className="absolute -top-[20px] left-[18px] w-[52px] h-[52px] rounded-full flex items-center justify-center border-2 border-[#D4AF37] bg-gradient-to-br from-[#242424] via-[#161616] to-[#0A0A0A] shadow-[0_6px_22px_rgba(212,175,55,0.4),0_0_0_4px_rgba(212,175,55,0.12)] transition-transform duration-300 transform scale-100"
          >
            <ActiveIcon className="h-6 w-6 text-[#D4AF37] animate-in fade-in zoom-in-75 duration-200" />
          </div>

          {/* Active Tab Label Under Bubble */}
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <span className="text-[11px] font-black tracking-wider text-[#D4AF37] uppercase drop-shadow-sm">
              {activeItem.label}
            </span>
          </div>
        </div>

        {/* 5 Navigation Buttons */}
        <div className="relative z-10 flex h-full items-center">
          {CUSTOMER_NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === activeIndex;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTab(item.id)}
                className="group relative flex-1 h-full flex flex-col items-center justify-center pt-1 transition-all focus:outline-none"
                aria-label={item.label}
              >
                {/* Regular Icon & Label (visible only when inactive) */}
                <div
                  className={`flex flex-col items-center justify-center transition-all duration-200 ${
                    isActive
                      ? "opacity-0 scale-50 pointer-events-none"
                      : "opacity-80 group-hover:opacity-100 group-hover:scale-105"
                  }`}
                >
                  <Icon className="h-5 w-5 text-neutral-400 group-hover:text-white transition-colors" />
                  <span className="text-[10px] font-medium text-neutral-400 group-hover:text-neutral-200 mt-1">
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

