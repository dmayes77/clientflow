# Enterprise Theme Responsive Implementation Guide

## Overview

This is a **single responsive theme** that adapts from mobile-first booking to desktop dashboard density.

### Breakpoint Strategy

```
Mobile (default)    → Touch-friendly booking experience
  ↓
Tablet (768px+)     → Balanced optimization  
  ↓
Desktop (1024px+)   → Compact dashboard mode
```

---

## Key Differences Across Breakpoints

### Typography

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Base text | 16px | 15px | 13px |
| H1 | 30px | 28px | 20px |
| Buttons | 16px | 15px | 13px |

**Why:** Mobile needs 16px to prevent iOS auto-zoom on inputs. Desktop gets compact.

### Touch Targets

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Buttons | 44px | 40px | 32px |
| Inputs | 44px | 40px | 32px |
| Icons | 20px | 18px | 16px |

**Why:** Apple HIG requires 44px minimum for thumb tapping. Desktop uses mouse precision.

### Spacing

| Token | Mobile | Tablet | Desktop |
|-------|--------|--------|---------|
| Container padding | 16px | 24px | 32px |
| Base spacing | 16px | 16px | 16px |
| Card padding | 16px | 24px | 20px |

---

## Usage Examples

### 1. Booking Form (Mobile-Optimized)

```jsx
// components/BookingForm.jsx
export default function BookingForm() {
  return (
    <div className="enterprise-theme">
      <div className="et-container et-safe-top et-safe-bottom">
        <h1 className="et-h1 mb-6">Book Appointment</h1>
        
        <div className="et-form-group">
          <label className="et-label">Select Service</label>
          <select className="et-input w-full">
            <option>Window Tint - Full Vehicle</option>
            <option>Paint Correction</option>
          </select>
        </div>

        <div className="et-form-group">
          <label className="et-label">Preferred Date</label>
          <input type="date" className="et-input w-full" />
        </div>

        {/* Full-width CTA on mobile */}
        <button className="et-btn et-btn-primary et-btn-full">
          Continue to Time Selection
        </button>
      </div>
    </div>
  );
}
```

**What happens:**
- **Mobile:** 16px text, 44px button height, 100% width CTA
- **Desktop:** 13px text, 32px button height, still 100% if needed

### 2. Dashboard Table (Desktop-Optimized)

```jsx
// components/AppointmentsTable.jsx
export default function AppointmentsTable() {
  return (
    <div className="enterprise-theme">
      <div className="et-card">
        <h2 className="et-h2 mb-4">Today's Appointments</h2>
        
        <table className="w-full">
          <thead>
            <tr className="border-b border-et-border">
              <th className="text-left p-2 et-caption uppercase">Client</th>
              <th className="text-left p-2 et-caption uppercase">Service</th>
              <th className="text-left p-2 et-caption uppercase">Time</th>
              <th className="text-left p-2 et-caption uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-et-border">
              <td className="p-2 et-body">John Smith</td>
              <td className="p-2 et-small">Full Detail</td>
              <td className="p-2 et-small">2:00 PM</td>
              <td className="p-2">
                <span className="et-badge et-badge-success">Confirmed</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**What happens:**
- **Mobile:** Readable 16px text, might need horizontal scroll
- **Desktop:** Compact 13px text, more rows visible, denser layout

### 3. Mobile Navigation

```jsx
// components/MobileNav.jsx
export default function MobileNav() {
  return (
    <nav className="et-bottom-nav">
      <button className="et-nav-item active">
        <CalendarIcon />
        <span className="et-nav-label">Book</span>
      </button>
      <button className="et-nav-item">
        <ClockIcon />
        <span className="et-nav-label">Appointments</span>
      </button>
      <button className="et-nav-item">
        <UserIcon />
        <span className="et-nav-label">Profile</span>
      </button>
    </nav>
  );
}
```

**What happens:**
- **Mobile:** Visible, 44px touch targets, safe area aware
- **Desktop:** `display: none` - use sidebar instead

### 4. Modal/Bottom Sheet

```jsx
// components/ServiceSelector.jsx
export default function ServiceSelector({ open, onClose }) {
  return (
    <div className={`et-bottom-sheet ${open ? 'open' : ''}`}>
      <div className="et-bottom-sheet-backdrop" onClick={onClose} />
      <div className="et-bottom-sheet-content">
        <div className="et-bottom-sheet-handle" />
        <h2 className="et-h2 mb-4">Select Service</h2>
        
        <div className="space-y-3">
          <button className="et-card w-full text-left p-4 hover:border-et-primary">
            <h3 className="et-h3">Window Tinting</h3>
            <p className="et-small text-et-muted-foreground">Starting at $299</p>
          </button>
          <button className="et-card w-full text-left p-4 hover:border-et-primary">
            <h3 className="et-h3">Paint Protection</h3>
            <p className="et-small text-et-muted-foreground">Starting at $599</p>
          </button>
        </div>
      </div>
    </div>
  );
}
```

**What happens:**
- **Mobile:** Slides up from bottom, swipe handle visible
- **Desktop:** Centered modal, no handle, smaller max-width

---

## Component Size Reference

### Buttons at Each Breakpoint

```jsx
// Mobile (default)
<button className="et-btn et-btn-primary">
  Book Now  {/* 44px height, 16px text */}
</button>

// Automatically becomes on desktop:
{/* 32px height, 13px text */}
```

### Card Padding Progression

```jsx
<div className="et-card">
  {/* Mobile: 16px padding */}
  {/* Tablet: 24px padding */}
  {/* Desktop: 24px padding (from tablet) */}
</div>

<div className="et-card-compact">
  {/* Always: 12px padding across all sizes */}
</div>
```

---

## Working with Tailwind

The theme **works WITH Tailwind**, not against it:

```jsx
// ✅ GOOD - Combine theme classes with Tailwind utilities
<button className="et-btn et-btn-primary flex items-center gap-2">
  <PlusIcon className="w-5 h-5" />
  Add Appointment
</button>

// ✅ GOOD - Theme handles sizing, Tailwind handles layout
<div className="et-card grid grid-cols-2 gap-4">
  <div>Content</div>
  <div>Content</div>
</div>

// ✅ GOOD - Use Tailwind breakpoints when you need custom behavior
<div className="et-card md:flex md:items-center md:justify-between">
  <h2 className="et-h2">Dashboard</h2>
  <button className="et-btn et-btn-primary mt-4 md:mt-0">
    New
  </button>
</div>
```

---

## Safe Areas (iOS Notch/Home Indicator)

```jsx
// Header with safe area
<header className="et-mobile-header et-safe-top">
  {/* Automatically adds padding for notch */}
</header>

// Bottom nav with safe area
<nav className="et-bottom-nav">
  {/* Automatically adds padding for home indicator */}
</nav>

// Custom components
<div className="et-safe-top et-safe-bottom">
  {/* Content respects both top and bottom safe areas */}
</div>
```

---

## Testing Across Breakpoints

### In Chrome DevTools:

1. **Mobile (375px):**
   - Text should be 16px
   - Buttons should be 44px
   - Full-width CTAs work well

2. **Tablet (768px):**
   - Text slightly smaller (15px)
   - Buttons 40px
   - More breathing room

3. **Desktop (1280px):**
   - Compact text (13px)
   - Dense buttons (32px)
   - Information-rich layout

### Key Test Points:

```jsx
// This should be comfortable on mobile, compact on desktop
<div className="enterprise-theme">
  <h1 className="et-h1">Title</h1>
  <p className="et-body">Body text that should be readable on mobile</p>
  <button className="et-btn et-btn-primary">
    Tap-friendly on mobile
  </button>
</div>
```

---

## Migration from Old Theme

If you're updating from the original enterprise-theme.css:

### Old way (fought Tailwind):
```css
.enterprise-theme .text-sm { font-size: inherit; }
```

### New way (works with Tailwind):
```jsx
// Just use theme classes when you need responsive sizing
<p className="et-body">
  {/* Automatically responsive */}
</p>

// Use Tailwind when you need utilities
<div className="flex items-center gap-2">
  <p className="et-body">Text</p>
</div>
```

---

## Deployment Checklist

- [ ] Import theme in root layout: `import "@/styles/enterprise-theme.css"`
- [ ] Wrap app in `.enterprise-theme` class
- [ ] Test booking flow on iPhone (375px width)
- [ ] Test dashboard on desktop (1920px width)
- [ ] Verify 44px button height on mobile
- [ ] Check safe area padding on iPhone with notch
- [ ] Confirm 16px input text prevents zoom
- [ ] Test dark mode if implemented

---

## Performance Notes

- All responsive values use CSS custom properties
- No JavaScript required for responsive behavior
- Breakpoints trigger only CSS recalculation
- Dark mode uses same strategy
- Minimal specificity conflicts with Tailwind

---

## What's Next?

1. **Add to ClientFlow:**
   ```bash
   cp enterprise-theme-responsive.css app/styles/
   ```

2. **Import in layout:**
   ```tsx
   // app/layout.tsx
   import "@/styles/enterprise-theme-responsive.css"
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body className="enterprise-theme">
           {children}
         </body>
       </html>
     )
   }
   ```

3. **Build your first component** using the examples above

4. **Test on real devices** - iOS Safari is the critical test

Ready to ship! 🚀
