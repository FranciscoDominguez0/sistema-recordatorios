"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: "danger" | "default";
  onConfirm: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loading = false,
  variant = "default",
  onConfirm,
  onOpenChange
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    createPortal(
      <div className={cn("fixed inset-0 z-50", open ? "" : "pointer-events-none")} aria-hidden={!open}>
        <div
          className={cn("absolute inset-0 bg-black/50 transition-opacity", open ? "opacity-100" : "opacity-0")}
          onClick={() => (loading ? null : onOpenChange(false))}
        />

        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center p-4 transition-opacity",
            open ? "opacity-100" : "opacity-0"
          )}
        >
          <aside
            className={cn(
              "relative z-50 flex w-full max-w-[520px] flex-col overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white text-[#0F172A] shadow-2xl shadow-black/10 transition-transform dark:border-neutral-900 dark:bg-[#080808] dark:text-[#F1F5F9] dark:shadow-black/30",
              open ? "scale-100" : "scale-95"
            )}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[#E2E8F0] px-5 py-5 dark:border-neutral-900">
              <p className="text-sm font-semibold">{title}</p>
              {description ? (
                <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">{description}</p>
              ) : null}
            </div>

            <div className="p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" disabled={loading} onClick={() => onOpenChange(false)}>
                  {cancelText}
                </Button>

                <Button
                  type="button"
                  disabled={loading}
                  className={cn(
                    variant === "danger" ? "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600" : ""
                  )}
                  onClick={() => onConfirm()}
                >
                  {confirmText}
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>,
      document.body
    )
  );
}
