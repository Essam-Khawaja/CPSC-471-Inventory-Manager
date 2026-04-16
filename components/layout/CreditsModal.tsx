"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CreditPerson } from "./creditsData";
import { creditsPeople } from "./creditsData";
import { X } from "lucide-react";

type CreditsModalProps = {
  open: boolean;
  onClose: () => void;
};

function initials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function CreditsModal({ open, onClose }: CreditsModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-neutral-800">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
              Project Credits
            </div>
            <div className="text-[11px] text-slate-600 dark:text-neutral-400">
              People who contributed to the freight cargo control app.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-600 hover:bg-slate-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
            aria-label="Close credits"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-4 py-3">
          {creditsPeople.length === 0 ? (
            <div className="rounded border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
              Add people in `components/layout/creditsData.ts`.
            </div>
          ) : (
            <ul className="space-y-2">
              {creditsPeople.map((p: CreditPerson) => (
                <li
                  key={`${p.id}-${p.name}`}
                  className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-neutral-100">
                      {p.name}
                    </div>
                    <div className="truncate text-[11px] text-slate-600 dark:text-neutral-400">
                      {p.id}
                    </div>
                  </div>

                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={`${p.name} avatar`}
                      className="h-10 w-10 flex-shrink-0 rounded-full border border-slate-200 object-cover dark:border-neutral-700"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                      {initials(p.name)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

