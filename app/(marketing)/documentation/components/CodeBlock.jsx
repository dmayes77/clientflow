"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CodeBlock({ code, language = "bash", title }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 bg-zinc-800/50">
          <span className="et-text-2xs font-medium text-zinc-400">{title}</span>
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-zinc-700 rounded transition-colors"
            aria-label="Copy code"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-zinc-400" />
            )}
          </button>
        </div>
      )}
      <pre className="p-3 overflow-x-auto">
        <code className="text-zinc-100 font-mono et-text-xs whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}
