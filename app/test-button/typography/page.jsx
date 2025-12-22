"use client";

import { Button as ShadcnButton } from "@/components/ui/button";
import { Button as BaseUIButton } from "@/components/ui-next/Button";
import { ButtonGroup } from "@/components/ui-next/ButtonGroup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, ChevronLeft, ChevronRight } from "lucide-react";

export default function TypographyTestPage() {
  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Typography & Components Test Page</h1>
      <p style={{ color: "var(--color-muted-foreground)", marginBottom: "48px" }}>
        Testing all typography scales and component styling. CSS is the single source of truth.
      </p>

      {/* Headings */}
      <section style={{ marginBottom: "64px" }}>
        <h2 style={{ marginBottom: "24px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          Headings (Native HTML)
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <span style={{ width: "60px", color: "var(--color-muted-foreground)", fontSize: "12px" }}>h1</span>
            <h1>The quick brown fox jumps over the lazy dog</h1>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <span style={{ width: "60px", color: "var(--color-muted-foreground)", fontSize: "12px" }}>h2</span>
            <h2>The quick brown fox jumps over the lazy dog</h2>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <span style={{ width: "60px", color: "var(--color-muted-foreground)", fontSize: "12px" }}>h3</span>
            <h3>The quick brown fox jumps over the lazy dog</h3>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <span style={{ width: "60px", color: "var(--color-muted-foreground)", fontSize: "12px" }}>h4</span>
            <h4>The quick brown fox jumps over the lazy dog</h4>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <span style={{ width: "60px", color: "var(--color-muted-foreground)", fontSize: "12px" }}>h5</span>
            <h5>The quick brown fox jumps over the lazy dog</h5>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <span style={{ width: "60px", color: "var(--color-muted-foreground)", fontSize: "12px" }}>h6</span>
            <h6>The quick brown fox jumps over the lazy dog</h6>
          </div>
        </div>
      </section>

      {/* HIG Utility Classes */}
      <section style={{ marginBottom: "64px" }}>
        <h2 style={{ marginBottom: "24px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          HIG Utility Classes
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <code style={{ width: "180px", fontSize: "11px", color: "var(--color-muted-foreground)" }}>.hig-large-title</code>
            <span className="hig-large-title">Large Title (24px/700)</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <code style={{ width: "180px", fontSize: "11px", color: "var(--color-muted-foreground)" }}>.hig-title-1</code>
            <span className="hig-title-1">Title 1 (20px/600)</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <code style={{ width: "180px", fontSize: "11px", color: "var(--color-muted-foreground)" }}>.hig-title-2</code>
            <span className="hig-title-2">Title 2 (18px/600)</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <code style={{ width: "180px", fontSize: "11px", color: "var(--color-muted-foreground)" }}>.hig-title-3</code>
            <span className="hig-title-3">Title 3 (16px/500)</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <code style={{ width: "180px", fontSize: "11px", color: "var(--color-muted-foreground)" }}>.hig-headline</code>
            <span className="hig-headline">Headline (14px/600)</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <code style={{ width: "180px", fontSize: "11px", color: "var(--color-muted-foreground)" }}>.hig-body</code>
            <span className="hig-body">Body (14px/400)</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <code style={{ width: "180px", fontSize: "11px", color: "var(--color-muted-foreground)" }}>.hig-callout</code>
            <span className="hig-callout">Callout (13px/400)</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <code style={{ width: "180px", fontSize: "11px", color: "var(--color-muted-foreground)" }}>.hig-subheadline</code>
            <span className="hig-subheadline">Subheadline (12px/400)</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <code style={{ width: "180px", fontSize: "11px", color: "var(--color-muted-foreground)" }}>.hig-footnote</code>
            <span className="hig-footnote">Footnote (11px/400)</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <code style={{ width: "180px", fontSize: "11px", color: "var(--color-muted-foreground)" }}>.hig-caption-1</code>
            <span className="hig-caption-1">Caption 1 (10px/400)</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <code style={{ width: "180px", fontSize: "11px", color: "var(--color-muted-foreground)" }}>.hig-caption-2</code>
            <span className="hig-caption-2">Caption 2 (9px/400)</span>
          </div>
        </div>
      </section>

      {/* Body Text */}
      <section style={{ marginBottom: "64px" }}>
        <h2 style={{ marginBottom: "24px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          Body Text Elements
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <code style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>&lt;p&gt;</code>
            <p style={{ marginTop: "8px" }}>
              This is a paragraph element. The quick brown fox jumps over the lazy dog.
              Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!
            </p>
          </div>
          <div>
            <code style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>&lt;span&gt;</code>
            <div style={{ marginTop: "8px" }}>
              <span>This is a span element with default styling.</span>
            </div>
          </div>
          <div>
            <code style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>&lt;small&gt;</code>
            <div style={{ marginTop: "8px" }}>
              <small>This is a small element for fine print and secondary text.</small>
            </div>
          </div>
          <div>
            <code style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>&lt;strong&gt; &lt;em&gt;</code>
            <div style={{ marginTop: "8px" }}>
              <p>This text has <strong>strong emphasis</strong> and <em>italic emphasis</em> inline.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Buttons Comparison */}
      <section style={{ marginBottom: "64px" }}>
        <h2 style={{ marginBottom: "24px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          Buttons
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
          <div>
            <h3 style={{ marginBottom: "16px" }}>shadcn (Current)</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
              <ShadcnButton size="lg">Large</ShadcnButton>
              <ShadcnButton size="default">Default</ShadcnButton>
              <ShadcnButton size="sm">Small</ShadcnButton>
              <ShadcnButton size="xs">XS</ShadcnButton>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <ShadcnButton variant="default">Primary</ShadcnButton>
              <ShadcnButton variant="secondary">Secondary</ShadcnButton>
              <ShadcnButton variant="outline">Outline</ShadcnButton>
              <ShadcnButton variant="ghost">Ghost</ShadcnButton>
              <ShadcnButton variant="destructive">Destructive</ShadcnButton>
            </div>
          </div>
          <div>
            <h3 style={{ marginBottom: "16px" }}>Base UI + CSS Modules (New)</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
              <BaseUIButton size="lg">Large</BaseUIButton>
              <BaseUIButton size="default">Default</BaseUIButton>
              <BaseUIButton size="sm">Small</BaseUIButton>
              <BaseUIButton size="xs">XS</BaseUIButton>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <BaseUIButton variant="default">Primary</BaseUIButton>
              <BaseUIButton variant="secondary">Secondary</BaseUIButton>
              <BaseUIButton variant="outline">Outline</BaseUIButton>
              <BaseUIButton variant="ghost">Ghost</BaseUIButton>
              <BaseUIButton variant="destructive">Destructive</BaseUIButton>
            </div>
          </div>
        </div>
      </section>

      {/* Button Groups */}
      <section style={{ marginBottom: "64px" }}>
        <h2 style={{ marginBottom: "24px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          Button Groups
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
          <div>
            <h3 style={{ marginBottom: "16px" }}>Default (with gap)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <ButtonGroup>
                <BaseUIButton variant="outline">Left</BaseUIButton>
                <BaseUIButton variant="outline">Middle</BaseUIButton>
                <BaseUIButton variant="outline">Right</BaseUIButton>
              </ButtonGroup>
              <ButtonGroup>
                <BaseUIButton variant="default">Save</BaseUIButton>
                <BaseUIButton variant="outline">Cancel</BaseUIButton>
              </ButtonGroup>
            </div>
          </div>
          <div>
            <h3 style={{ marginBottom: "16px" }}>Connected (joined)</h3>
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
                <BaseUIButton variant="outline" size="sm"><ChevronLeft /></BaseUIButton>
                <BaseUIButton variant="secondary" size="sm">Page 1 of 10</BaseUIButton>
                <BaseUIButton variant="outline" size="sm"><ChevronRight /></BaseUIButton>
              </ButtonGroup>
            </div>
          </div>
        </div>
        <div style={{ marginTop: "24px" }}>
          <h3 style={{ marginBottom: "16px" }}>Vertical</h3>
          <div style={{ display: "flex", gap: "24px" }}>
            <ButtonGroup orientation="vertical">
              <BaseUIButton variant="outline" size="sm">Option A</BaseUIButton>
              <BaseUIButton variant="outline" size="sm">Option B</BaseUIButton>
              <BaseUIButton variant="outline" size="sm">Option C</BaseUIButton>
            </ButtonGroup>
            <ButtonGroup orientation="vertical" variant="connected">
              <BaseUIButton variant="outline" size="sm">Top</BaseUIButton>
              <BaseUIButton variant="outline" size="sm">Middle</BaseUIButton>
              <BaseUIButton variant="outline" size="sm">Bottom</BaseUIButton>
            </ButtonGroup>
          </div>
        </div>
      </section>

      {/* Form Elements */}
      <section style={{ marginBottom: "64px" }}>
        <h2 style={{ marginBottom: "24px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          Form Elements
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <Label htmlFor="input-1">Label (11px/500)</Label>
              <Input id="input-1" placeholder="Input placeholder text" style={{ marginTop: "6px" }} />
            </div>
            <div>
              <Label htmlFor="input-2">Email Address</Label>
              <Input id="input-2" type="email" placeholder="you@example.com" style={{ marginTop: "6px" }} />
            </div>
            <div>
              <Label htmlFor="textarea-1">Message</Label>
              <Textarea id="textarea-1" placeholder="Enter your message..." style={{ marginTop: "6px" }} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Checkbox id="check-1" />
              <Label htmlFor="check-1" style={{ margin: 0 }}>Checkbox with label</Label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Switch id="switch-1" />
              <Label htmlFor="switch-1" style={{ margin: 0 }}>Switch with label</Label>
            </div>
            <div>
              <Label>Native Select</Label>
              <select style={{
                marginTop: "6px",
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--color-border)",
                fontSize: "14px"
              }}>
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section style={{ marginBottom: "64px" }}>
        <h2 style={{ marginBottom: "24px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          Badges
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <span style={{ marginLeft: "16px", color: "var(--color-muted-foreground)", fontSize: "11px" }}>
            Badge uses 9px/500 (caption-2)
          </span>
        </div>
      </section>

      {/* Cards */}
      <section style={{ marginBottom: "64px" }}>
        <h2 style={{ marginBottom: "24px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          Cards
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          <Card>
            <CardHeader>
              <CardTitle>Card Title (14px/600)</CardTitle>
              <CardDescription>Card description text (11px)</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card content with body text styling.</p>
            </CardContent>
            <CardFooter>
              <ShadcnButton size="sm">Action</ShadcnButton>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Analytics Overview</CardTitle>
              <CardDescription>Your performance this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: "32px", fontWeight: "700" }}>2,847</div>
              <p style={{ color: "var(--color-muted-foreground)" }}>Total visitors</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <ShadcnButton variant="outline" size="sm" style={{ justifyContent: "flex-start" }}>Create Invoice</ShadcnButton>
              <ShadcnButton variant="outline" size="sm" style={{ justifyContent: "flex-start" }}>Add Contact</ShadcnButton>
              <ShadcnButton variant="outline" size="sm" style={{ justifyContent: "flex-start" }}>Schedule Meeting</ShadcnButton>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tables */}
      <section style={{ marginBottom: "64px" }}>
        <h2 style={{ marginBottom: "24px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          Tables
        </h2>
        <table className="table">
          <thead className="table-header">
            <tr className="table-row">
              <th className="table-head">Name</th>
              <th className="table-head">Email</th>
              <th className="table-head">Status</th>
              <th className="table-head">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="table-row">
              <td className="table-cell">John Doe</td>
              <td className="table-cell">john@example.com</td>
              <td className="table-cell"><Badge variant="outline">Active</Badge></td>
              <td className="table-cell">$250.00</td>
            </tr>
            <tr className="table-row">
              <td className="table-cell">Jane Smith</td>
              <td className="table-cell">jane@example.com</td>
              <td className="table-cell"><Badge variant="secondary">Pending</Badge></td>
              <td className="table-cell">$150.00</td>
            </tr>
            <tr className="table-row">
              <td className="table-cell">Bob Johnson</td>
              <td className="table-cell">bob@example.com</td>
              <td className="table-cell"><Badge variant="destructive">Cancelled</Badge></td>
              <td className="table-cell">$0.00</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: "8px", color: "var(--color-muted-foreground)", fontSize: "11px" }}>
          Table head: 11px/500 | Table cell: 14px/400
        </p>
      </section>

      {/* Display Classes */}
      <section style={{ marginBottom: "64px" }}>
        <h2 style={{ marginBottom: "24px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          Display Classes
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <code style={{ width: "100px", fontSize: "11px", color: "var(--color-muted-foreground)" }}>.display-1</code>
            <span className="display-1">Display 1</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <code style={{ width: "100px", fontSize: "11px", color: "var(--color-muted-foreground)" }}>.display-2</code>
            <span className="display-2">Display 2</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <code style={{ width: "100px", fontSize: "11px", color: "var(--color-muted-foreground)" }}>.display-3</code>
            <span className="display-3">Display 3</span>
          </div>
        </div>
      </section>

      {/* Real World Example */}
      <section style={{ marginBottom: "64px" }}>
        <h2 style={{ marginBottom: "24px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
          Real World Example: Settings Form
        </h2>
        <Card style={{ maxWidth: "500px" }}>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your account information below.</CardDescription>
          </CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue="John Doe" style={{ marginTop: "6px" }} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="john@example.com" style={{ marginTop: "6px" }} />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" placeholder="Tell us about yourself..." style={{ marginTop: "6px" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <Label htmlFor="notifications" style={{ marginBottom: "4px", display: "block" }}>Email Notifications</Label>
                <span style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>Receive updates about your account</span>
              </div>
              <Switch id="notifications" />
            </div>
          </CardContent>
          <CardFooter style={{ justifyContent: "flex-end", gap: "8px" }}>
            <ShadcnButton variant="outline">Cancel</ShadcnButton>
            <ShadcnButton>Save Changes</ShadcnButton>
          </CardFooter>
        </Card>
      </section>

    </div>
  );
}
