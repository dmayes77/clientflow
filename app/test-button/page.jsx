"use client";

import { Button as ShadcnButton } from "@/components/ui/button";
import { Button as BaseUIButton } from "@/components/ui-next/Button";
import { ButtonGroup } from "@/components/ui-next/ButtonGroup";
import { Mail, Plus, Trash2, Check, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, ChevronLeft, ChevronRight } from "lucide-react";

export default function TestButtonPage() {
  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "32px" }}>Button Comparison: shadcn vs Base UI + CSS Modules</h1>

      {/* Variants */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ marginBottom: "16px" }}>Variants</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <h3 style={{ marginBottom: "12px", color: "#666" }}>shadcn (current)</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <ShadcnButton variant="default">Default</ShadcnButton>
              <ShadcnButton variant="destructive">Destructive</ShadcnButton>
              <ShadcnButton variant="outline">Outline</ShadcnButton>
              <ShadcnButton variant="secondary">Secondary</ShadcnButton>
              <ShadcnButton variant="ghost">Ghost</ShadcnButton>
              <ShadcnButton variant="link">Link</ShadcnButton>
              <ShadcnButton variant="success">Success</ShadcnButton>
              <ShadcnButton variant="warning">Warning</ShadcnButton>
            </div>
          </div>
          <div>
            <h3 style={{ marginBottom: "12px", color: "#666" }}>Base UI + CSS Modules (new)</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <BaseUIButton variant="default">Default</BaseUIButton>
              <BaseUIButton variant="destructive">Destructive</BaseUIButton>
              <BaseUIButton variant="outline">Outline</BaseUIButton>
              <BaseUIButton variant="secondary">Secondary</BaseUIButton>
              <BaseUIButton variant="ghost">Ghost</BaseUIButton>
              <BaseUIButton variant="link">Link</BaseUIButton>
              <BaseUIButton variant="success">Success</BaseUIButton>
              <BaseUIButton variant="warning">Warning</BaseUIButton>
            </div>
          </div>
        </div>
      </section>

      {/* Sizes */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ marginBottom: "16px" }}>Sizes</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <h3 style={{ marginBottom: "12px", color: "#666" }}>shadcn (current)</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
              <ShadcnButton size="lg">Large</ShadcnButton>
              <ShadcnButton size="default">Default</ShadcnButton>
              <ShadcnButton size="sm">Small</ShadcnButton>
              <ShadcnButton size="xs">XS</ShadcnButton>
            </div>
          </div>
          <div>
            <h3 style={{ marginBottom: "12px", color: "#666" }}>Base UI + CSS Modules (new)</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
              <BaseUIButton size="lg">Large</BaseUIButton>
              <BaseUIButton size="default">Default</BaseUIButton>
              <BaseUIButton size="sm">Small</BaseUIButton>
              <BaseUIButton size="xs">XS</BaseUIButton>
            </div>
          </div>
        </div>
      </section>

      {/* Icon Buttons */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ marginBottom: "16px" }}>Icon Buttons</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <h3 style={{ marginBottom: "12px", color: "#666" }}>shadcn (current)</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
              <ShadcnButton size="icon-lg" variant="outline"><Plus /></ShadcnButton>
              <ShadcnButton size="icon" variant="outline"><Mail /></ShadcnButton>
              <ShadcnButton size="icon-sm" variant="outline"><Check /></ShadcnButton>
              <ShadcnButton size="icon-xs" variant="outline"><Trash2 /></ShadcnButton>
            </div>
          </div>
          <div>
            <h3 style={{ marginBottom: "12px", color: "#666" }}>Base UI + CSS Modules (new)</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
              <BaseUIButton size="icon-lg" variant="outline"><Plus /></BaseUIButton>
              <BaseUIButton size="icon" variant="outline"><Mail /></BaseUIButton>
              <BaseUIButton size="icon-sm" variant="outline"><Check /></BaseUIButton>
              <BaseUIButton size="icon-xs" variant="outline"><Trash2 /></BaseUIButton>
            </div>
          </div>
        </div>
      </section>

      {/* With Icons */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ marginBottom: "16px" }}>With Icons</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <h3 style={{ marginBottom: "12px", color: "#666" }}>shadcn (current)</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <ShadcnButton><Mail /> Send Email</ShadcnButton>
              <ShadcnButton variant="destructive"><Trash2 /> Delete</ShadcnButton>
              <ShadcnButton variant="success"><Check /> Confirm</ShadcnButton>
            </div>
          </div>
          <div>
            <h3 style={{ marginBottom: "12px", color: "#666" }}>Base UI + CSS Modules (new)</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <BaseUIButton><Mail /> Send Email</BaseUIButton>
              <BaseUIButton variant="destructive"><Trash2 /> Delete</BaseUIButton>
              <BaseUIButton variant="success"><Check /> Confirm</BaseUIButton>
            </div>
          </div>
        </div>
      </section>

      {/* Disabled State */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ marginBottom: "16px" }}>Disabled State</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <h3 style={{ marginBottom: "12px", color: "#666" }}>shadcn (current)</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <ShadcnButton disabled>Disabled</ShadcnButton>
              <ShadcnButton variant="outline" disabled>Disabled</ShadcnButton>
            </div>
          </div>
          <div>
            <h3 style={{ marginBottom: "12px", color: "#666" }}>Base UI + CSS Modules (new)</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <BaseUIButton disabled>Disabled</BaseUIButton>
              <BaseUIButton variant="outline" disabled>Disabled</BaseUIButton>
            </div>
          </div>
        </div>
      </section>

      {/* Button Groups */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ marginBottom: "16px" }}>Button Groups</h2>

        {/* Default (with gap) */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "12px", color: "#666" }}>Default (with gap)</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <ButtonGroup>
              <BaseUIButton variant="outline">Left</BaseUIButton>
              <BaseUIButton variant="outline">Middle</BaseUIButton>
              <BaseUIButton variant="outline">Right</BaseUIButton>
            </ButtonGroup>
            <ButtonGroup size="sm">
              <BaseUIButton variant="outline" size="sm">One</BaseUIButton>
              <BaseUIButton variant="outline" size="sm">Two</BaseUIButton>
              <BaseUIButton variant="outline" size="sm">Three</BaseUIButton>
            </ButtonGroup>
          </div>
        </div>

        {/* Connected (no gap) */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "12px", color: "#666" }}>Connected (joined buttons)</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <ButtonGroup variant="connected">
              <BaseUIButton variant="outline"><Bold /></BaseUIButton>
              <BaseUIButton variant="outline"><Italic /></BaseUIButton>
              <BaseUIButton variant="outline"><Underline /></BaseUIButton>
            </ButtonGroup>
            <ButtonGroup variant="connected">
              <BaseUIButton variant="outline"><AlignLeft /></BaseUIButton>
              <BaseUIButton variant="outline"><AlignCenter /></BaseUIButton>
              <BaseUIButton variant="outline"><AlignRight /></BaseUIButton>
            </ButtonGroup>
            <ButtonGroup variant="connected">
              <BaseUIButton variant="outline"><ChevronLeft /></BaseUIButton>
              <BaseUIButton variant="secondary">Page 1 of 10</BaseUIButton>
              <BaseUIButton variant="outline"><ChevronRight /></BaseUIButton>
            </ButtonGroup>
          </div>
        </div>

        {/* Vertical */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "12px", color: "#666" }}>Vertical</h3>
          <div style={{ display: "flex", gap: "24px" }}>
            <ButtonGroup orientation="vertical">
              <BaseUIButton variant="outline">Top</BaseUIButton>
              <BaseUIButton variant="outline">Middle</BaseUIButton>
              <BaseUIButton variant="outline">Bottom</BaseUIButton>
            </ButtonGroup>
            <ButtonGroup orientation="vertical" variant="connected">
              <BaseUIButton variant="outline">Top</BaseUIButton>
              <BaseUIButton variant="outline">Middle</BaseUIButton>
              <BaseUIButton variant="outline">Bottom</BaseUIButton>
            </ButtonGroup>
          </div>
        </div>

        {/* Mixed variants */}
        <div>
          <h3 style={{ marginBottom: "12px", color: "#666" }}>Mixed variants</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <ButtonGroup>
              <BaseUIButton variant="default">Save</BaseUIButton>
              <BaseUIButton variant="outline">Cancel</BaseUIButton>
            </ButtonGroup>
            <ButtonGroup>
              <BaseUIButton variant="destructive"><Trash2 /> Delete</BaseUIButton>
              <BaseUIButton variant="outline">Cancel</BaseUIButton>
            </ButtonGroup>
          </div>
        </div>
      </section>
    </div>
  );
}
