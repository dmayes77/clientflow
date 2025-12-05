"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "./CodeBlock";

const methodColors = {
  GET: "bg-emerald-100 text-emerald-700 border-emerald-200",
  POST: "bg-blue-100 text-blue-700 border-blue-200",
  PUT: "bg-amber-100 text-amber-700 border-amber-200",
  PATCH: "bg-orange-100 text-orange-700 border-orange-200",
  DELETE: "bg-red-100 text-red-700 border-red-200",
};

export function EndpointCard({ method, path, description, request, response, params }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 p-2.5 hover:bg-zinc-50 transition-colors text-left"
      >
        <Badge className={`${methodColors[method]} border font-mono et-text-2xs px-1.5 py-0`}>
          {method}
        </Badge>
        <code className="et-text-xs font-mono font-medium text-zinc-900">{path}</code>
        <span className="et-text-2xs text-zinc-400 ml-auto mr-1 hidden sm:block truncate max-w-[200px]">
          {description}
        </span>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="border-t bg-zinc-50 p-3 space-y-3">
          <p className="et-text-xs text-zinc-500 sm:hidden">{description}</p>

          {params && params.length > 0 && (
            <div>
              <h4 className="et-text-xs font-semibold text-zinc-700 mb-1.5">Parameters</h4>
              <div className="space-y-1">
                {params.map((param, idx) => (
                  <div key={idx} className="flex items-center gap-2 et-text-2xs">
                    <code className="px-1 py-0.5 bg-zinc-200 rounded font-mono text-zinc-700">
                      {param.name}
                    </code>
                    <span className="text-zinc-400">
                      {param.type}
                    </span>
                    {param.required && (
                      <Badge variant="outline" className="et-text-2xs h-4 px-1">
                        required
                      </Badge>
                    )}
                    <span className="text-zinc-500 truncate">
                      {param.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {request && (
            <div>
              <h4 className="et-text-xs font-semibold text-zinc-700 mb-1.5">Request</h4>
              <CodeBlock code={request} title="Request Body" />
            </div>
          )}

          {response && (
            <div>
              <h4 className="et-text-xs font-semibold text-zinc-700 mb-1.5">Response</h4>
              <CodeBlock code={response} title="200 OK" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
