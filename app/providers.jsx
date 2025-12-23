"use client";

import { QueryProvider } from "@/lib/query-provider";
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export function Providers({ children }) {
  return (
    <QueryProvider>
      <NuqsAdapter>
        {children}
      </NuqsAdapter>
    </QueryProvider>
  );
}
