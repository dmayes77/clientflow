"use client";

import { Button as ShadcnButton } from "@/components/ui/button";
import { Button as BaseUIButton } from "@/components/ui-next/Button";

export default function FontSizesTestPage() {
  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "32px" }}>Font Size Comparison</h1>

      <p style={{ marginBottom: "24px", color: "#666" }}>Resize the browser to see responsive changes at 480px, 640px, and 1024px breakpoints.</p>

      {/* Default Size */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ marginBottom: "16px" }}>Default Size</h2>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ width: "120px", color: "#666" }}>shadcn:</span>
          <ShadcnButton size="default">Default Buttons</ShadcnButton>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span style={{ width: "120px", color: "#666" }}>Base UI:</span>
          <BaseUIButton size="default">Default Button</BaseUIButton>
        </div>
        <div style={{ marginTop: "12px", padding: "12px", background: "#f5f5f5", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace" }}>
          <div>Mobile: 16px → Fold (480px): 16px → Tablet (640px): 13px → Desktop (1024px): 11px</div>
        </div>
      </section>

      {/* Small Size */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ marginBottom: "16px" }}>Small Size</h2>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ width: "120px", color: "#666" }}>shadcn:</span>
          <ShadcnButton size="sm">Small Button</ShadcnButton>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span style={{ width: "120px", color: "#666" }}>Base UI:</span>
          <BaseUIButton size="sm">Small Button</BaseUIButton>
        </div>
        <div style={{ marginTop: "12px", padding: "12px", background: "#f5f5f5", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace" }}>
          <div>Mobile: 13px → Tablet (640px): 11px → Desktop (1024px): 11px</div>
        </div>
      </section>

      {/* XS Size */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ marginBottom: "16px" }}>Extra Small Size</h2>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ width: "120px", color: "#666" }}>shadcn:</span>
          <ShadcnButton size="xs">XS Button</ShadcnButton>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span style={{ width: "120px", color: "#666" }}>Base UI:</span>
          <BaseUIButton size="xs">XS Button</BaseUIButton>
        </div>
        <div style={{ marginTop: "12px", padding: "12px", background: "#f5f5f5", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace" }}>
          <div>Mobile: 12px → Tablet (640px): 11px → Desktop (1024px): 10px</div>
        </div>
      </section>

      {/* Large Size */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ marginBottom: "16px" }}>Large Size</h2>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ width: "120px", color: "#666" }}>shadcn:</span>
          <ShadcnButton size="lg">Large Button</ShadcnButton>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span style={{ width: "120px", color: "#666" }}>Base UI:</span>
          <BaseUIButton size="lg">Large Button</BaseUIButton>
        </div>
        <div style={{ marginTop: "12px", padding: "12px", background: "#f5f5f5", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace" }}>
          <div>Mobile: 17px → Tablet (640px): 16px → Desktop (1024px): 14px</div>
        </div>
      </section>

      {/* All Variants at Default Size */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ marginBottom: "16px" }}>All Variants (Default Size)</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Variant</th>
              <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>shadcn</th>
              <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Base UI</th>
            </tr>
          </thead>
          <tbody>
            {["default", "destructive", "outline", "secondary", "ghost", "link", "success", "warning"].map((variant) => (
              <tr key={variant}>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", fontFamily: "monospace" }}>{variant}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                  <ShadcnButton variant={variant}>{variant}</ShadcnButton>
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                  <BaseUIButton variant={variant}>{variant}</BaseUIButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Computed Styles Inspector */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ marginBottom: "16px" }}>Live Computed Styles</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <h3 style={{ marginBottom: "8px", color: "#666" }}>shadcn Button</h3>
            <ShadcnButton id="shadcn-test">Inspect Me</ShadcnButton>
            <div
              id="shadcn-computed"
              style={{ marginTop: "8px", padding: "12px", background: "#f5f5f5", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace" }}
            >
              Click button to see computed styles
            </div>
          </div>
          <div>
            <h3 style={{ marginBottom: "8px", color: "#666" }}>Base UI Button</h3>
            <BaseUIButton id="baseui-test">Inspect Me</BaseUIButton>
            <div
              id="baseui-computed"
              style={{ marginTop: "8px", padding: "12px", background: "#f5f5f5", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace" }}
            >
              Click button to see computed styles
            </div>
          </div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('DOMContentLoaded', function() {
                function showComputedStyles(buttonId, outputId) {
                  const button = document.getElementById(buttonId);
                  const output = document.getElementById(outputId);
                  if (button && output) {
                    button.addEventListener('click', function() {
                      const styles = window.getComputedStyle(button);
                      output.innerHTML =
                        'font-size: ' + styles.fontSize + '<br>' +
                        'line-height: ' + styles.lineHeight + '<br>' +
                        'font-weight: ' + styles.fontWeight + '<br>' +
                        'padding: ' + styles.padding + '<br>' +
                        'height: ' + styles.height;
                    });
                  }
                }
                showComputedStyles('shadcn-test', 'shadcn-computed');
                showComputedStyles('baseui-test', 'baseui-computed');
              });
            `,
          }}
        />
      </section>

      {/* Reference: Your Theme Values */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ marginBottom: "16px" }}>Reference: Theme Font Sizes</h2>
        <table style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Token</th>
              <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Value</th>
              <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>px</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px", fontFamily: "monospace" }}>--font-size-2xs</td>
              <td>0.625rem</td>
              <td>10px</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", fontFamily: "monospace" }}>--font-size-xs</td>
              <td>0.6875rem</td>
              <td>11px</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", fontFamily: "monospace" }}>--font-size-sm</td>
              <td>0.8125rem</td>
              <td>13px</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", fontFamily: "monospace" }}>--font-size-base</td>
              <td>0.875rem</td>
              <td>14px</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", fontFamily: "monospace" }}>--font-size-lg</td>
              <td>1rem</td>
              <td>16px</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", fontFamily: "monospace" }}>--font-size-xl</td>
              <td>1.125rem</td>
              <td>18px</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
