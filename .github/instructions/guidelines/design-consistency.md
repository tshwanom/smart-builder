# 🎨 Design Consistency Guidelines

**Status:** MANDATORY - Apply to ALL frontend work  
**Version:** 1.0  
**Last Updated:** 2025-11-09

---

## ⚠️ This is MANDATORY

All frontend pages and components MUST follow the MOB Smart Builder design system for consistent user experience.

---

## 🎯 Core Principle

**"All pages must reflect the same look and feel"**

Every page users see should feel like part of the same professional application. Consistency builds trust and improves usability.

---

## 🎨 MOB Smart Builder Brand Colors

**ALWAYS use these exact hex values** (not Tailwind utility classes):

| Color Name | Hex Value | Usage |
|------------|-----------|--------|
| **Sage Green** (Primary) | `#697861` | Buttons, icons, links, focus rings, primary actions |
| **Gold** (Accent) | `#D4AF37` | Badges, highlights, section labels, stars, accents |
| **Warm Neutral** (Background) | `#f5f5f0` | Section backgrounds, card backgrounds |
| **Light Neutral** (Background 2) | `#e8e8e0` | Gradient end, alternating sections |
| **Dark Green-Gray** (Text) | `#2c3e35` | Headings, labels, dark text |
| **Medium Gray** (Text) | `#6b7280` | Body text, descriptions |
| **White** | `#ffffff` | Card backgrounds, text on dark backgrounds |

### Why Exact Hex Values?

```typescript
// ❌ BAD - Tailwind classes don't guarantee exact colors
<button className="bg-brand-primary-600">Click</button>

// ✅ GOOD - Exact hex values for brand consistency
<button style={{ backgroundColor: '#697861' }}>Click</button>
```

**Reference:** See `docs/BRAND_COLORS.md` for full color specifications.

---

## 🎨 Gradient Backgrounds

**Standard page gradient** (use on all public pages):

```typescript
style={{
  background: 'linear-gradient(135deg, #f5f5f0 0%, #e8e8e0 100%)'
}}
```

**Sage Green gradient** (for CTA sections):

```typescript
style={{
  background: 'linear-gradient(135deg, #697861 0%, #5a6851 100%)'
}}
```

---

## 📐 Consistent Component Patterns

### 1. Cards

**Standard card styling:**
```typescript
<Card className="shadow-2xl border-0">
  {/* content */}
</Card>
```

- **Shadow:** `shadow-2xl` for main cards, `shadow-lg` for smaller cards
- **Border:** `border-0` (no borders on modern cards)
- **Padding:** `px-8 py-8` for content areas
- **Rounded:** `rounded-xl` or `rounded-2xl`

### 2. Buttons

**Primary button (Sage Green):**
```typescript
<button
  className="h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
  style={{ 
    backgroundColor: '#697861',
    color: '#ffffff'
  }}
  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a6851'}
  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#697861'}
>
  Button Text
</button>
```

**Key specs:**
- Height: `h-12` (48px)
- Font: `text-base font-semibold`
- Shadow: `shadow-lg` with `hover:shadow-xl`
- Background: `#697861` → hover `#5a6851`
- Text: White `#ffffff`
- Transition: `transition-all duration-200`

### 3. Form Inputs

**Standard input styling:**
```typescript
<input
  className="h-11 border-gray-300 focus:border-[#697861] focus:ring-[#697861] focus:ring-2 focus:ring-offset-0"
  type="text"
/>
```

**Key specs:**
- Height: `h-11` (44px)
- Border: `border-gray-300` default
- Focus: Sage Green border and ring (`#697861`)
- Ring: `focus:ring-2` with `focus:ring-offset-0`

### 4. Links

**Standard link styling:**
```typescript
<a
  style={{ color: '#697861' }}
  className="font-semibold transition-all duration-200"
  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
>
  Link Text
</a>
```

**Key specs:**
- Color: Sage Green `#697861`
- Font: `font-semibold`
- Hover: Underline with transition
- Duration: `duration-200`

### 5. Icon Containers

**Standard icon container:**
```typescript
<div 
  className="p-4 rounded-2xl shadow-lg"
  style={{ backgroundColor: '#697861' }}
>
  <Icon className="h-10 w-10" style={{ color: '#ffffff' }} />
</div>
```

**Key specs:**
- Padding: `p-4`
- Rounded: `rounded-2xl` (not rounded-full)
- Shadow: `shadow-lg`
- Background: Sage Green `#697861`
- Icon: White `#ffffff`, size `h-10 w-10`

---

## 📏 Typography Scale

| Element | Class | Font Size | Weight | Color |
|---------|-------|-----------|--------|-------|
| Page Heading | `text-5xl md:text-7xl` | 48px/72px | `font-bold` | `#2c3e35` |
| Section Heading | `text-3xl md:text-4xl` | 30px/36px | `font-bold` | `#2c3e35` |
| Card Title | `text-3xl` | 30px | `font-bold` | `#2c3e35` |
| Subheading | `text-xl` | 20px | `font-semibold` | `#2c3e35` |
| Body Text | `text-base` | 16px | `font-normal` | `#6b7280` |
| Small Text | `text-sm` | 14px | `font-normal` | `#6b7280` |
| Tiny Text | `text-xs` | 12px | `font-normal` | `#6b7280` |

**Always use exact color values in styles:**
```typescript
<h1 className="text-5xl font-bold" style={{ color: '#2c3e35' }}>
  Heading
</h1>
```

---

## 📐 Spacing Scale

**Use consistent spacing throughout:**

| Context | Class | Size |
|---------|-------|------|
| Section padding (vertical) | `py-16` or `py-20 md:py-28` | 64px / 80-112px |
| Container padding | `px-6` or `px-8` | 24px / 32px |
| Card padding | `px-8 py-8` | 32px both |
| Element gaps | `space-y-5` or `gap-6` | 20px / 24px |
| Section gaps | `space-y-12` or `gap-12` | 48px |

---

## 🎨 Shadow Scale

**Use consistent shadows for depth:**

| Component | Class | Use Case |
|-----------|-------|----------|
| Main cards | `shadow-2xl` | Auth cards, feature cards |
| Secondary cards | `shadow-lg` | Testimonials, small cards |
| Buttons/Icons | `shadow-lg hover:shadow-xl` | Interactive elements |
| Subtle depth | `shadow-md` | Stat cards, minor elements |

---

## 🎯 Hover Effects

**Standard hover patterns:**

### Color Transitions
```typescript
// Button hover
onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a6851'}
onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#697861'}

// Link hover
onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
```

### Shadow Transitions
```typescript
className="shadow-lg hover:shadow-xl transition-all duration-200"
```

### Transform Effects
```typescript
className="hover:-translate-y-1 transition-all duration-200"
```

**Always include:**
- `transition-all duration-200` for smooth animations
- Subtle changes (don't overdo it)
- Consistent timing across similar elements

---

## ✅ Client Component Requirements

**When you need hover effects, you MUST use client components:**

```typescript
'use client'; // ADD THIS at the top

export default function MyComponent() {
  // Now you can use onMouseEnter/onMouseLeave
  return (
    <button
      onMouseEnter={(e) => {/* hover effect */}}
      onMouseLeave={(e) => {/* hover effect */}}
    >
      Hover Me
    </button>
  );
}
```

**Error you'll see if missing:**
```
Error: Event handlers cannot be passed to Client Component props
```

---

## 🚫 Design Violations (Auto-Reject)

Your PR will be **AUTOMATICALLY REJECTED** if:

1. **Wrong Colors**
   - Using Tailwind brand classes instead of exact hex values
   - Using colors not in the MOB brand palette
   - Inconsistent colors across pages

2. **Inconsistent Components**
   - Different button heights (must be h-12)
   - Different input heights (must be h-11)
   - Different card shadows (use shadow-2xl or shadow-lg)
   - Different icon container styles

3. **Missing Hover Effects**
   - Buttons without hover state changes
   - Links without hover underlines
   - Interactive elements without transitions

4. **Wrong Typography**
   - Using wrong heading sizes
   - Not using color: '#2c3e35' for headings
   - Inconsistent font weights

5. **Poor Spacing**
   - Cramped layouts (not enough padding)
   - Inconsistent spacing between sections
   - Different card padding values

6. **Missing 'use client' Directive**
   - Components with hover handlers but no 'use client'
   - Event handlers on server components

---

## ✅ Design Checklist

Before submitting frontend work:

- [ ] All colors use exact hex values from brand palette
- [ ] Buttons are h-12 with Sage Green background
- [ ] Inputs are h-11 with Sage Green focus rings
- [ ] Cards use shadow-2xl or shadow-lg
- [ ] Icon containers are p-4 rounded-2xl with Sage Green background
- [ ] Links are Sage Green with hover underline
- [ ] Headings use color: '#2c3e35'
- [ ] All hover effects include transition-all duration-200
- [ ] 'use client' added if using event handlers
- [ ] Spacing is consistent with scale (py-16, px-8, etc.)
- [ ] Shadows are consistent with scale
- [ ] Typography follows size/weight/color scale
- [ ] Page feels cohesive with rest of application

---

## 📋 Page-Specific Patterns

### Public Pages (Marketing, Auth)

**Must have:**
- Gradient background: `linear-gradient(135deg, #f5f5f0 0%, #e8e8e0 100%)`
- Centered content with `min-h-screen flex items-center justify-center`
- shadow-2xl cards with border-0
- Sage Green branding throughout

**Examples:**
- Landing page: `app/(marketing)/page.tsx`
- Login page: `app/(auth)/login/page.tsx`
- Register page: `app/(auth)/register/page.tsx`

### Authenticated Pages (App)

**Should have:**
- Clean white or neutral backgrounds
- Consistent card styling (shadow-lg)
- Sage Green primary actions
- Gold accents for important information
- Same button/input/link styling as public pages

---

## 🎨 Component Library Reference

When building new components, check these for examples:

| Pattern | Example File | Key Features |
|---------|-------------|--------------|
| Auth card layout | `app/(auth)/login/page.tsx` | Centered card, gradient background |
| Feature cards | `app/(marketing)/page.tsx` (FeatureCard) | Hover lift, icon container, shadow |
| Testimonials | `app/(marketing)/page.tsx` (TestimonialCard) | Gold border, italic text, stars |
| CTA sections | `app/(marketing)/page.tsx` (CTA section) | Gradient background, large button |
| Hero sections | `app/(marketing)/page.tsx` (Hero section) | Large text, stat cards, gradient |

---

## 📚 Related Guidelines

- `docs/BRAND_COLORS.md` - Complete brand color specifications
- `core/code-quality.md` - Code quality standards
- `guidelines/component-modularization.md` - Component size and structure
- `tailwind.config.js` - Tailwind configuration (for reference only)

---

## 🎯 Quick Reference Card

**Copy this for every frontend component:**

```typescript
'use client'; // If using hover effects

// Brand Colors
const SAGE_GREEN = '#697861';
const GOLD = '#D4AF37';
const DARK_TEXT = '#2c3e35';
const GRAY_TEXT = '#6b7280';

// Gradient Background
const GRADIENT_BG = 'linear-gradient(135deg, #f5f5f0 0%, #e8e8e0 100%)';

// Standard Button
<button
  className="h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
  style={{ backgroundColor: SAGE_GREEN, color: '#ffffff' }}
  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a6851'}
  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = SAGE_GREEN}
>
  Button Text
</button>

// Standard Input
<input
  className="h-11 border-gray-300 focus:border-[#697861] focus:ring-[#697861] focus:ring-2"
  type="text"
/>

// Standard Card
<Card className="shadow-2xl border-0">
  <CardContent className="px-8 py-8">
    {/* content */}
  </CardContent>
</Card>
```

---

*Consistent design creates professional, trustworthy applications*  
*Last Updated: 2025-11-09*
