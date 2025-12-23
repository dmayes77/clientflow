# Using Mobile-First Themes with shadcn/ui

## The Good News

**Both themes are ALREADY compatible with shadcn!** They include shadcn variable mapping at the bottom:

```css
/* Both themes include this */
.enterprise-theme,
.mobile-first-theme {
  --background: var(--et-background);  /* Maps to shadcn */
  --foreground: var(--et-foreground);
  --card: var(--et-card);
  --card-foreground: var(--et-card-foreground);
  --primary: var(--et-primary);
  /* ... all shadcn variables mapped */
}
```

This means **shadcn components work out of the box** with your themes!

---

## How It Works Together

### Architecture:

```
Your App
├── Theme CSS (enterprise or mobile-first)
│   ├── Sets responsive sizing (16px → 13px)
│   ├── Sets button heights (44px → 32px)
│   └── Maps to shadcn variables
│
└── shadcn Components
    ├── Button (uses --primary)
    ├── Card (uses --card)
    ├── Input (uses --input)
    └── Uses theme variables automatically
```

---

## The Strategy: Mix Custom Classes + shadcn Components

### Use Theme Classes For:
- **Layout** (containers, sections, spacing)
- **Typography** (headings, body text)
- **Custom components** (hero sections, feature grids)

### Use shadcn Components For:
- **Forms** (Input, Select, Checkbox)
- **Buttons** (when you want consistency)
- **Dialogs/Modals**
- **Tables**
- **Dropdowns/Popovers**

---

## Example: Booking Form (Enterprise Theme + shadcn)

```tsx
// app/(app)/book/page.tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function BookingPage() {
  return (
    <div className="enterprise-theme">
      <div className="et-container et-safe-top">
        {/* Custom theme typography */}
        <h1 className="et-h1 mb-6">Book Your Appointment</h1>
        
        {/* shadcn Card component */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Service Selection</CardTitle>
            <CardDescription>Choose your service and preferred time</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Theme form group + shadcn components */}
            <div className="et-form-group">
              <label className="et-label">Service Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="window-tint">Window Tint - Full Vehicle</SelectItem>
                  <SelectItem value="paint-correction">Paint Correction</SelectItem>
                  <SelectItem value="ceramic-coating">Ceramic Coating</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="et-form-group">
              <label className="et-label">Preferred Date</label>
              <Input type="date" />
            </div>

            {/* shadcn Button (automatically responsive) */}
            <Button className="w-full" size="lg">
              Continue to Time Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

**What happens:**
- **Mobile:** Button is 44px (from theme), Input is 44px
- **Desktop:** Button is 32px (from theme), Input is 32px
- **Colors:** Button uses `--primary` from your theme
- **Everything works together!**

---

## Example: Landing Page (Mobile-First Theme + shadcn)

```tsx
// app/(marketing)/page.tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="mobile-first-theme">
      {/* Custom hero section */}
      <section className="mft-hero mft-safe-top">
        <div className="mft-container">
          <div className="max-w-4xl mx-auto text-center">
            {/* Theme typography */}
            <h1 className="mft-hero-title mb-6">
              Streamline Your{' '}
              <span className="mft-gradient-text">Booking Flow</span>
            </h1>
            
            <p className="mft-hero-subtitle mb-8">
              ClientFlow helps service businesses manage appointments, 
              track clients, and grow revenue—all in one beautiful platform.
            </p>
            
            {/* shadcn Buttons with theme sizing */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="mft-btn-responsive">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="mft-btn-responsive">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="mft-section bg-muted/50">
        <div className="mft-container">
          <h2 className="mft-h2 text-center mb-12">Everything You Need</h2>
          
          {/* Theme feature grid + shadcn Cards */}
          <div className="mft-feature-grid">
            <Card>
              <CardHeader>
                <div className="mft-feature-icon mb-4">
                  <CalendarIcon />
                </div>
                <CardTitle>Smart Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Automated booking that syncs with your calendar and sends 
                  reminders to clients.
                </CardDescription>
              </CardContent>
            </Card>

            {/* More cards... */}
          </div>
        </div>
      </section>
    </div>
  )
}
```

---

## Customizing shadcn Components for Responsive Sizing

### Option 1: Update shadcn Component Styles

Edit `components/ui/button.tsx` to use theme variables:

```tsx
// components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md...",
  {
    variants: {
      variant: { /* ... */ },
      size: {
        default: "h-[var(--et-height-md)] px-4 py-2",  // Responsive!
        sm: "h-[var(--et-height-sm)] px-3",
        lg: "h-[var(--et-height-lg)] px-8",
        icon: "h-[var(--et-height-md)] w-[var(--et-height-md)]",
      },
    },
    defaultVariants: { /* ... */ },
  }
)
```

**Result:** shadcn buttons automatically adapt:
- Mobile: 44px
- Desktop: 32px

### Option 2: Use Theme Classes When Needed

```tsx
{/* Default shadcn Button */}
<Button>Standard</Button>

{/* Override with theme class for specific sizing */}
<Button className="et-btn-lg">Large CTA</Button>

{/* Mix both */}
<Button variant="outline" className="mft-btn-responsive">
  Responsive Width
</Button>
```

---

## Form Components Best Practices

### Input Fields (Enterprise Theme)

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="et-form-group">
  <Label>Email Address</Label>
  <Input 
    type="email" 
    placeholder="you@example.com"
    // Automatically 44px on mobile, 32px on desktop from theme
  />
</div>
```

### Select/Dropdown

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"

<div className="et-form-group">
  <Label>Service Type</Label>
  <Select>
    <SelectTrigger>
      {/* 44px touch target on mobile */}
      <SelectValue placeholder="Choose service" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="detailing">Full Detailing</SelectItem>
      <SelectItem value="tint">Window Tinting</SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

## Dashboard Components (Enterprise Theme)

### Data Table

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"

<div className="enterprise-theme">
  <div className="et-container">
    <Card>
      <CardHeader>
        <CardTitle className="et-h2">Today's Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="et-caption uppercase">Client</TableHead>
              <TableHead className="et-caption uppercase">Service</TableHead>
              <TableHead className="et-caption uppercase">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="et-body">John Smith</TableCell>
              <TableCell className="et-small">Full Detail</TableCell>
              <TableCell className="et-small">2:00 PM</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</div>
```

**Result:**
- **Mobile:** 16px readable text
- **Desktop:** 13px compact for more data

### Dialog/Modal

```tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button className="et-btn-primary">Add Client</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle className="et-h2">New Client</DialogTitle>
      <DialogDescription>Add a new client to your database</DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div className="et-form-group">
        <Label>Full Name</Label>
        <Input type="text" />
      </div>
      <div className="et-form-group">
        <Label>Email</Label>
        <Input type="email" />
      </div>
      <Button className="w-full">Save Client</Button>
    </div>
  </DialogContent>
</Dialog>
```

---

## Calendar Integration

```tsx
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

<div className="enterprise-theme">
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline">
        <CalendarIcon className="mr-2" />
        Select Date
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
      />
    </PopoverContent>
  </Popover>
</div>
```

**Mobile:** Calendar days are touch-friendly (theme handles spacing)

---

## Colors: Using Theme Variables with shadcn

Your themes already define shadcn colors. To customize:

```css
/* In enterprise-theme-responsive.css or mobile-first-theme.css */

/* Light mode */
.enterprise-theme {
  --primary: oklch(0.5 0.2 260);           /* Your brand blue */
  --primary-foreground: oklch(1 0 0);      /* White text */
  --secondary: oklch(0.97 0.004 250);
  /* etc */
}

/* Dark mode */
.enterprise-theme.dark {
  --primary: oklch(0.7 0.2 260);           /* Lighter blue for dark */
  --primary-foreground: oklch(0.15 0.02 260);
}
```

**All shadcn components automatically use these colors!**

---

## Mobile Navigation with shadcn

```tsx
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export function MobileNav() {
  return (
    <div className="mobile-first-theme">
      <header className="mft-mobile-header">
        <div className="mft-container flex items-center justify-between">
          <Logo />
          
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <nav className="flex flex-col gap-4 mt-8">
                <a href="/features" className="text-lg font-semibold">Features</a>
                <a href="/pricing" className="text-lg font-semibold">Pricing</a>
                <a href="/contact" className="text-lg font-semibold">Contact</a>
                <Button className="mt-4">Get Started</Button>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6">
            <a href="/features">Features</a>
            <a href="/pricing">Pricing</a>
            <Button>Get Started</Button>
          </nav>
        </div>
      </header>
    </div>
  )
}
```

---

## What You DON'T Need from Themes

Since you're using shadcn, you can skip these theme classes:

❌ Don't use:
- `.et-btn` - Use shadcn `<Button>`
- `.et-input` - Use shadcn `<Input>`
- `.et-card` - Use shadcn `<Card>`

✅ DO use:
- `.et-container` - Layout wrapper
- `.et-h1`, `.et-h2` - Typography
- `.et-form-group` - Form spacing
- `.et-section` - Section spacing
- `.et-safe-top` - Safe areas

---

## Recommended Setup

### 1. Install shadcn components you need:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
```

### 2. Import your theme:

```tsx
// app/layout.tsx
import "@/styles/enterprise-theme-responsive.css"
// or
import "@/styles/mobile-first-theme.css"
```

### 3. Wrap with theme class:

```tsx
export default function Layout({ children }) {
  return (
    <html>
      <body className="enterprise-theme">
        {children}
      </body>
    </html>
  )
}
```

### 4. Build with shadcn + theme classes:

```tsx
<div className="et-container">
  <h1 className="et-h1">Dashboard</h1>
  
  <Card>
    <CardHeader>
      <CardTitle>Stats</CardTitle>
    </CardHeader>
    <CardContent>
      <Button>Action</Button>
    </CardContent>
  </Card>
</div>
```

---

## Theme + shadcn Cheat Sheet

| Need | Use | Why |
|------|-----|-----|
| Button | `<Button>` from shadcn | Consistent, accessible |
| Input/Form | `<Input>` from shadcn | Auto 44px mobile |
| Card | `<Card>` from shadcn | Proper structure |
| Modal | `<Dialog>` from shadcn | Accessibility |
| Container | `.et-container` from theme | Responsive padding |
| Headings | `.et-h1` from theme | Responsive sizing |
| Sections | `.et-section` from theme | Consistent spacing |
| Safe areas | `.et-safe-top` from theme | iPhone notch |

---

## Quick Example: Complete Booking Page

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function BookingPage() {
  return (
    <div className="enterprise-theme">
      <div className="et-container et-section et-safe-top et-safe-bottom">
        <div className="max-w-2xl mx-auto">
          <h1 className="et-h1 mb-2">Book Your Appointment</h1>
          <p className="et-body text-muted-foreground mb-8">
            Choose your service and preferred time slot
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
              <CardDescription>Select the service you need</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="service">Service Type</Label>
                <Select>
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Detail - $299</SelectItem>
                    <SelectItem value="tint">Window Tint - $599</SelectItem>
                    <SelectItem value="ppf">Paint Protection - $1,299</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Preferred Date</Label>
                <Input id="date" type="date" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Preferred Time</Label>
                <Select>
                  <SelectTrigger id="time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9am">9:00 AM</SelectItem>
                    <SelectItem value="11am">11:00 AM</SelectItem>
                    <SelectItem value="2pm">2:00 PM</SelectItem>
                    <SelectItem value="4pm">4:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" size="lg">
                Continue to Contact Info
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

**What you get:**
- **Mobile:** 44px inputs/buttons, 16px text, full-width layout
- **Desktop:** 32px inputs/buttons, 13px text, centered max-width
- **Colors:** All from your theme
- **Accessibility:** All from shadcn
- **Zero custom CSS needed**

---

## The Bottom Line

**Your themes + shadcn = Perfect combo!**

1. Themes handle **responsive sizing** (16px → 13px)
2. Themes provide **layout/spacing** (containers, sections)
3. shadcn handles **components** (buttons, forms, modals)
4. Everything works together seamlessly

Just use:
- shadcn components for UI elements
- Theme classes for layout and typography
- Tailwind for one-off utilities

Ready to build! 🚀
