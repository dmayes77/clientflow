"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculatePasswordStrength, getAllRules } from "@/lib/password-validation";

export function PasswordStrength({ password, context = {} }) {
  const strength = calculatePasswordStrength(password);
  const rules = getAllRules(context);

  return (
    <div className="space-y-3">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Password strength</span>
          {strength.label && (
            <span
              className={cn(
                "font-medium",
                strength.level === 1 && "text-red-500",
                strength.level === 2 && "text-orange-500",
                strength.level === 3 && "text-yellow-600",
                strength.level === 4 && "text-green-500"
              )}
            >
              {strength.label}
            </span>
          )}
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", strength.color)}
            style={{ width: `${strength.score}%` }}
          />
        </div>
      </div>

      {/* Rules checklist */}
      <div className="grid grid-cols-1 gap-1 text-xs">
        {rules.map((rule) => {
          const passed = rule.test(password);
          return (
            <div
              key={rule.id}
              className={cn(
                "flex items-center gap-1.5",
                passed ? "text-green-600" : "text-gray-400"
              )}
            >
              {passed ? (
                <Check className="w-3 h-3" />
              ) : (
                <X className="w-3 h-3" />
              )}
              <span>{rule.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
