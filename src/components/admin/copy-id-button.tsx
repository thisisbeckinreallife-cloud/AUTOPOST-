"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyIdButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "¡Copiado!" : `Copiar ${label ?? "ID"} completo`}
      className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-6 hover:text-ink-9 transition-colors group"
    >
      <span className="truncate max-w-[8ch]">{value.slice(0, 8)}</span>
      {copied ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity" />
      )}
    </button>
  );
}
