"use client";

import { useState } from "react";

type CharLimitTextareaProps = {
  name: string;
  id: string;
  maxLength: number;
  rows?: number;
  required?: boolean;
};

// Textarea with a live character counter
export function CharLimitTextarea({ name, id, maxLength, rows = 3, required }: CharLimitTextareaProps) {
  const [length, setLength] = useState(0);

  return (
    <div>
      <textarea
        id={id}
        name={name}
        required={required}
        maxLength={maxLength}
        rows={rows}
        onChange={(e) => setLength(e.target.value.length)}
        className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
      />
      <div className="mt-1 text-right text-[10px] text-slate-400 dark:text-neutral-500">
        {length}/{maxLength}
      </div>
    </div>
  );
}
