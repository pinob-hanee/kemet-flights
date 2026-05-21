# Kemet Luxury Travel - Design System & UI Specifications

This document outlines the **Pharaonic Luxury + High-End International** design system engineered for Kemet Luxury Travel.

## 1. Color Palette Tokens

The palette represents Giza's sands at dusk, the deep flowing Nile waters, and royal treasures.

| Token | Hex | Name | Purpose |
| :--- | :--- | :--- | :--- |
| `gold` | `#D4AF37` | Pharaoh's Gold | Accents, sticky borders, key pricing highlights |
| `gold-light` | `#F5D061` | Golden Sand | Hover states and button gradient centers |
| `gold-glint` | `#FFF2B2` | Sun Ray Glow | Heading gradient text values |
| `sand` | `#E6DFD5` | Sandstone Sand | Light mode layouts, dashboard cards, labels |
| `sand-light` | `#F8F4EC` | Alabaster Stone | Secondary panels and inputs background |
| `nile` | `#0D0F12` | Nile Night | Core dark mode backdrop |
| `nile-blue` | `#0F1A2A` | Deep Sacred Blue | Glassmorphic cards base backdrop |

---

## 2. Multilingual Typographical System

We combine classic European serif typography with high-end traditional Arabic typography.

### English Layout (LTR)
- **Primary Headers**: `Playfair Display` (Elegant serif with high contrast lines)
- **Sub-headers / body**: `Montserrat` (Clean, round geometrics displaying international class)

### Arabic Layout (RTL)
- **Primary Headers**: `Amiri` (Stately classical Arabic serif inspired by royal manuscripts)
- **Sub-headers / body**: `Cairo` (Contemporary clean Arabic sans-serif optimized for mobile visibility)

---

## 3. Glassmorphic Card Standards

We employ premium translucency to represent the mysterious, shifting dunes of Egypt:
- **Card Background**: `bg-gradient-to-br from-nile-light/80 to-nile-blue/50`
- **Blur Factor**: `backdrop-blur-sm`
- **Borders**: Thin, high-contrast borders `border border-gold/10` shifting to `border-gold/25` on active cursor hover.
- **Shadow**: `shadow-glass` with a glowing transition to `shadow-gold-hover`.
