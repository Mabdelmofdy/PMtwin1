# Tailwind CSS migration guide

### What this page is

Notes on the **Tailwind** setup and migration for the POC front end.

### What happens next

Run `npm run build:css` or your usual Tailwind pipeline when styles change.

---

## Overview

The PMTwin POC has been successfully migrated to use Tailwind CSS for better consistency and maintainability. This document outlines the migration approach and provides guidelines for continued development.

## Implementation Approach

### 1. Tailwind CSS Setup
- **Method**: CDN-based implementation (suitable for POC)
- **Location**: `index.html`
- **Configuration**: Custom theme extending Tailwind's defaults with project colors

```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#2563eb',
                    dark: '#1e40af',
                    light: '#3b82f6',
                },
                secondary: '#10b981',
                danger: '#ef4444',
                warning: '#f59e0b',
                success: '#10b981',
            },
            maxWidth: {
                'container': '1200px',
            },
        }
    }
}
```

## Migrated Components

### ✅ Core Layout
- **Navigation**: Fully migrated to Tailwind classes
- **Footer**: Fully migrated to Tailwind classes
- **Main Content Container**: Using Tailwind utilities

### ✅ Pages
1. **Dashboard** (`/pages/dashboard/index.html`)
   - Stats cards
   - Empty states
   - Action buttons
   - Grid layout

2. **Opportunities** (`/pages/opportunities/index.html`)
   - Page header
   - Filter section
   - Grid layout
   - Opportunity cards (partial - see legacy styles)

3. **Login** (`/pages/login/index.html`)
   - Form layout
   - Input fields
   - Buttons

4. **Register** (`/pages/register/index.html`)
   - Form layout
   - Conditional fields
   - Input validation styles

### ✅ JavaScript-Generated Components
- **Empty States**: Updated in `dashboard.js` and `opportunities.js`
- **Navigation**: Updated in `layout-service.js`

## Common Tailwind Patterns

### Buttons
```html
<!-- Primary Button -->
<button class="px-6 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition-all shadow-md">
    Button Text
</button>

<!-- Secondary Button -->
<button class="px-6 py-2 bg-gray-100 text-gray-900 font-medium rounded-md hover:bg-gray-200 transition-all">
    Button Text
</button>

<!-- Danger Button -->
<button class="px-6 py-2 bg-danger text-white font-medium rounded-md hover:bg-red-600 transition-all">
    Delete
</button>
```

### Form Inputs
```html
<!-- Text Input -->
<input 
    type="text" 
    class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
    placeholder="Enter text"
>

<!-- Select -->
<select class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
    <option>Option 1</option>
</select>
```

### Cards
```html
<div class="bg-white border border-gray-200 rounded-lg p-6">
    <h2 class="text-xl font-semibold mb-4">Card Title</h2>
    <p class="text-gray-600">Card content</p>
</div>
```

### Empty States
```html
<div class="flex flex-col items-center justify-center py-12 px-8 text-center min-h-[300px]">
    <div class="w-20 h-20 rounded-full bg-gradient-to-br from-primary/90 to-primary-light flex items-center justify-center mb-6 text-white opacity-90">
        <!-- Icon SVG -->
    </div>
    <h3 class="text-xl font-semibold text-gray-900 mb-4">Empty State Title</h3>
    <p class="text-base text-gray-600 max-w-md mb-8 leading-relaxed">Description text</p>
    <a href="#" class="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg no-underline">
        Call to Action
    </a>
</div>
```

### Grid Layouts
```html
<!-- Responsive Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Grid items -->
</div>

<!-- Stats Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- Stat cards -->
</div>
```

## Legacy CSS (Still in use)

The following components still use custom CSS in `main.css`:

### 1. Opportunity Cards
- `.opportunity-card` - Card container with hover effects
- `.opportunity-header`, `.opportunity-title`, `.opportunity-meta`, `.opportunity-description`, `.opportunity-footer`

### 2. Badges
- `.badge` and variants (`.badge-primary`, `.badge-success`, etc.)

### 3. Alerts
- `.alert` and variants (`.alert-success`, `.alert-error`, etc.)

### 4. Modal System
- `.modal-overlay`, `.modal-content`, `.modal-header`, etc.

### 5. Spinners
- `.spinner` - Loading spinner animation

### 6. Person Cards
- `.person-card` - Profile cards in people section

### 7. Forms (Some variants)
- `.form-checkbox`, `.form-radio`
- `.checkbox-group`, `.radio-group`

## Migration Strategy for Remaining Pages

When migrating additional pages, follow these steps:

1. **Identify Layout Structure**
   - Replace custom grid/flex classes with Tailwind utilities
   - Use: `flex`, `grid`, `gap-*`, `items-center`, `justify-between`

2. **Update Typography**
   - Headings: `text-3xl font-bold`, `text-2xl font-semibold`, `text-xl font-semibold`
   - Body text: `text-base text-gray-600`
   - Small text: `text-sm text-gray-500`

3. **Replace Spacing**
   - Margins: `mb-8`, `mt-6`, `mx-auto`
   - Padding: `p-6`, `px-4 py-2`

4. **Update Colors**
   - Primary: `bg-primary`, `text-primary`, `hover:bg-primary-dark`
   - Grays: `bg-gray-100`, `text-gray-600`, `border-gray-200`

5. **Add Transitions**
   - Always include: `transition-all` on interactive elements
   - Hover effects: `hover:bg-*`, `hover:-translate-y-0.5`, `hover:shadow-lg`

## Responsive Design

Tailwind's responsive prefixes are used throughout:
- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up
- `xl:` - 1280px and up

Example:
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
```

## Benefits

1. **Consistency**: Unified spacing, colors, and typography across all components
2. **Maintainability**: No need to write custom CSS for common patterns
3. **Performance**: Tailwind's purge removes unused styles (when using build process)
4. **Developer Experience**: IntelliSense support, faster development
5. **Responsive**: Built-in responsive utilities make mobile-first design easier

## Future Improvements

1. **Build Process**: Move from CDN to build process for:
   - CSS purging
   - Custom plugins
   - Better performance

2. **Complete Migration**: Migrate remaining components:
   - Person cards
   - Modal system
   - Form checkboxes/radios
   - Badge system

3. **Component Library**: Create reusable component patterns:
   - Button components
   - Form field components
   - Card components

4. **Documentation**: Create a component library documentation

## Notes

- The `main.css` file is still linked for legacy components
- Both Tailwind and custom CSS can coexist during the transition
- Gradual migration is recommended to avoid breaking existing functionality
- Test thoroughly after migrating each page/component
