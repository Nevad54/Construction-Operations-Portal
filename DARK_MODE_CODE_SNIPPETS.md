# Dark Mode Code Snippets Reference

Quick copy-paste dark mode examples for common patterns.

---

## Basic Patterns

### Card Container
```jsx
<div className="bg-surface-card dark:bg-gray-900 border border-stroke dark:border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-shadow duration-fast">
  {/* Content */}
</div>
```

### Text Colors
```jsx
<h1 className="text-text-primary dark:text-gray-100">Main Title</h1>
<p className="text-text-secondary dark:text-gray-400">Subtitle</p>
<span className="text-text-muted dark:text-gray-500">Meta text</span>
```

### Button Primary
```jsx
<button className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700 dark:active:bg-brand-800 text-white transition-colors duration-fast">
  Click me
</button>
```

### Button Secondary
```jsx
<button className="px-4 py-2 rounded-lg bg-surface-muted dark:bg-gray-800 text-text-primary dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-fast">
  Secondary
</button>
```

### Button Ghost
```jsx
<button className="px-4 py-2 rounded-lg text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-200 hover:bg-surface-muted dark:hover:bg-gray-800 transition-colors duration-fast">
  Ghost Button
</button>
```

### Input Field
```jsx
<input 
  type="text"
  className="w-full px-4 py-2 rounded-lg border border-stroke dark:border-gray-600 bg-white dark:bg-gray-800 text-text-primary dark:text-gray-100 placeholder:text-text-muted dark:placeholder:text-gray-500 focus:outline-none focus:border-brand dark:focus:border-brand-400 focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand/30 transition-colors duration-fast"
  placeholder="Enter text..."
/>
```

### Textarea
```jsx
<textarea 
  className="w-full px-4 py-2 rounded-lg border border-stroke dark:border-gray-600 bg-white dark:bg-gray-800 text-text-primary dark:text-gray-100 placeholder:text-text-muted dark:placeholder:text-gray-500 focus:outline-none focus:border-brand dark:focus:border-brand-400 focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand/30 transition-colors duration-fast"
  rows="5"
  placeholder="Enter description..."
></textarea>
```

### Select Dropdown
```jsx
<select 
  className="w-full px-4 py-2 rounded-lg border border-stroke dark:border-gray-600 bg-white dark:bg-gray-800 text-text-primary dark:text-gray-100 focus:outline-none focus:border-brand dark:focus:border-brand-400 focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand/30 transition-colors duration-fast appearance-none pr-8"
  style={{
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.75rem center',
    backgroundSize: '16px 16px',
    paddingRight: '2.5rem'
  }}
>
  <option>Select option</option>
</select>
```

### Divider Line
```jsx
<div className="border-t border-stroke dark:border-gray-700" />
```

### Badge
```jsx
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-subtle dark:bg-brand-600/20 text-brand dark:text-brand-400">
  Badge
</span>
```

### Alert Box
```jsx
<div className="px-4 py-3 rounded-lg bg-feedback-success/10 dark:bg-green-600/10 border border-feedback-success/20 dark:border-green-600/20">
  <p className="text-sm text-feedback-success dark:text-green-400">Success message</p>
</div>
```

### Hover State
```jsx
<div className="p-4 rounded-lg hover:shadow-md dark:hover:shadow-lg hover:border-brand/20 dark:hover:border-brand-400/30 border border-stroke dark:border-gray-700 transition-all duration-fast cursor-pointer">
  Hoverable element
</div>
```

### Loading Skeleton
```jsx
<div className="h-12 rounded-lg bg-surface-muted dark:bg-gray-800 animate-pulse" />
```

---

## Dashboard Specific

### Dashboard Sidebar Menu Item
```jsx
<button 
  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors duration-fast flex items-center gap-3
    ${isActive 
      ? 'bg-brand dark:bg-brand-600 text-white' 
      : 'text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-200 hover:bg-surface-muted dark:hover:bg-gray-800'
    }`}
>
  <Icon className="w-5 h-5" />
  <span>Menu Item</span>
</button>
```

### Dashboard Card with Icon
```jsx
<div className="bg-surface-card dark:bg-gray-900 border border-stroke dark:border-gray-700 rounded-lg p-5 flex items-start gap-3">
  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-subtle dark:bg-brand-600/20 flex items-center justify-center text-brand dark:text-brand-400">
    <Icon className="w-6 h-6" />
  </div>
  <div className="flex-1 min-w-0">
    <h3 className="text-sm font-semibold text-text-primary dark:text-gray-100">Title</h3>
    <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">Description</p>
  </div>
</div>
```

### Dashboard Stat Display
```jsx
<div className="text-center">
  <p className="text-3xl font-bold text-text-primary dark:text-gray-100">1,234</p>
  <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">Active Projects</p>
</div>
```

### Top Navigation Bar
```jsx
<header className="h-16 bg-surface-card dark:bg-gray-900 border-b border-stroke dark:border-gray-700 flex items-center px-6 gap-4 sticky top-0 z-40">
  {/* Nav content with dark:text-gray-100 on text, etc */}
</header>
```

---

## Form Patterns

### Label + Input
```jsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-text-primary dark:text-gray-200">
    Field Label
  </label>
  <input 
    type="text"
    className="w-full px-4 py-2 rounded-lg border border-stroke dark:border-gray-600 bg-white dark:bg-gray-800 text-text-primary dark:text-gray-100 placeholder:text-text-muted dark:placeholder:text-gray-500 focus:border-brand dark:focus:border-brand-400 focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand/30 transition-colors"
    placeholder="Enter value..."
  />
</div>
```

### Label + Textarea with Character Count
```jsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-text-primary dark:text-gray-200">
    Message <span className="text-xs text-text-muted dark:text-gray-500">Optional</span>
  </label>
  <textarea 
    className="w-full px-4 py-2 rounded-lg border border-stroke dark:border-gray-600 bg-white dark:bg-gray-800 text-text-primary dark:text-gray-100 placeholder:text-text-muted dark:placeholder:text-gray-500 focus:border-brand dark:focus:border-brand-400 focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand/30 transition-colors resize-none"
    rows="4"
    placeholder="Your feedback..."
  />
  <p className="text-xs text-text-muted dark:text-gray-500">0 / 500 characters</p>
</div>
```

### Error State Input
```jsx
<div className="space-y-1">
  <label className="block text-sm font-medium text-text-primary dark:text-gray-200">
    Email
  </label>
  <input 
    type="email"
    className="w-full px-4 py-2 rounded-lg border-2 border-feedback-error dark:border-feedback-error/50 bg-white dark:bg-gray-800 text-text-primary dark:text-gray-100 focus:border-feedback-error dark:focus:border-feedback-error focus:ring-feedback-error/20 dark:focus:ring-feedback-error/30 transition-colors"
    placeholder="your@email.com"
  />
  <p className="text-xs text-feedback-error dark:text-red-400">Invalid email address</p>
</div>
```

### Checkbox
```jsx
<label className="flex items-center gap-3 cursor-pointer">
  <input 
    type="checkbox"
    className="w-5 h-5 rounded border border-stroke dark:border-gray-600 accent-brand dark:accent-brand-400 focus:ring-2 focus:ring-brand/50 dark:focus:ring-brand/30"
  />
  <span className="text-sm text-text-primary dark:text-gray-100">Agree to terms</span>
</label>
```

### Radio Button
```jsx
<label className="flex items-center gap-3 cursor-pointer">
  <input 
    type="radio"
    name="option"
    className="w-5 h-5 accent-brand dark:accent-brand-400 focus:ring-2 focus:ring-brand/50 dark:focus:ring-brand/30"
  />
  <span className="text-sm text-text-primary dark:text-gray-100">Option</span>
</label>
```

---

## Modal/Dialog Patterns

### Modal Container
```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={onClose} />
  
  {/* Modal */}
  <div className="relative bg-surface-card dark:bg-gray-900 border border-stroke dark:border-gray-700 rounded-lg shadow-xl max-w-md w-full">
    {/* Header */}
    <div className="flex items-center justify-between p-5 border-b border-stroke dark:border-gray-700">
      <h2 className="text-lg font-semibold text-text-primary dark:text-gray-100">Modal Title</h2>
      <button 
        onClick={onClose}
        className="text-text-muted dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-200 hover:bg-surface-muted dark:hover:bg-gray-800 p-1 rounded transition-colors"
      >
        ✕
      </button>
    </div>
    
    {/* Content */}
    <div className="p-5">
      <p className="text-sm text-text-secondary dark:text-gray-400">Modal content here</p>
    </div>
    
    {/* Footer */}
    <div className="flex gap-3 p-5 border-t border-stroke dark:border-gray-700">
      <button className="flex-1 px-4 py-2 rounded-lg bg-surface-muted dark:bg-gray-800 text-text-primary dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
        Cancel
      </button>
      <button className="flex-1 px-4 py-2 rounded-lg bg-brand dark:bg-brand-600 text-white hover:bg-brand-600 dark:hover:bg-brand-700 transition-colors">
        Confirm
      </button>
    </div>
  </div>
</div>
```

---

## Advanced Patterns

### Gradient Background with Dark Mode
```jsx
<div className="bg-gradient-to-r from-brand/10 dark:from-brand/5 via-transparent to-accent/10 dark:to-accent/5 rounded-lg p-6">
  {/* Content */}
</div>
```

### Card with Overlay on Hover
```jsx
<div className="relative rounded-lg overflow-hidden group">
  <img src="image.jpg" alt="" className="w-full h-48 object-cover" />
  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 dark:group-hover:bg-black/60 transition-colors duration-fast flex items-center justify-center opacity-0 group-hover:opacity-100">
    <button className="px-4 py-2 rounded-lg bg-white dark:bg-gray-900 text-brand dark:text-brand-400 font-medium">
      View
    </button>
  </div>
</div>
```

### Animated Loading State
```jsx
<div className="flex gap-2">
  <div className="w-2 h-2 rounded-full bg-brand dark:bg-brand-400 animate-pulse" />
  <div className="w-2 h-2 rounded-full bg-brand dark:bg-brand-400 animate-pulse animation-delay-200" />
  <div className="w-2 h-2 rounded-full bg-brand dark:bg-brand-400 animate-pulse animation-delay-400" />
</div>
```

### Conditional Styling Based on Theme
```jsx
import { useTheme } from '../context/ThemeContext';

export function MyComponent() {
  const { theme } = useTheme();
  
  return (
    <div className={theme === 'dark' ? 'bg-gray-900' : 'bg-white'}>
      {/* Or use it for images, etc */}
      <img 
        src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'} 
        alt="Logo"
      />
    </div>
  );
}
```

---

## Common Mistakes (Don't Do This!)

### ❌ Hardcoded colors without dark mode
```jsx
// Wrong - doesn't adapt to dark mode
<div className="bg-gray-100 text-black">Content</div>

// Correct - adapts to dark mode
<div className="bg-surface-card dark:bg-gray-900 text-text-primary dark:text-gray-100">Content</div>
```

### ❌ Using only dark: without light mode
```jsx
// Wrong - only works in dark mode
<div className="dark:bg-gray-900">Content</div>

// Correct - works in both modes
<div className="bg-white dark:bg-gray-900">Content</div>
```

### ❌ Forgetting to update nested elements
```jsx
// Wrong - container is dark but text isn't
<div className="dark:bg-gray-900">
  <p className="text-black">This is hard to read!</p>
</div>

// Correct - update all nested elements
<div className="dark:bg-gray-900">
  <p className="text-text-primary dark:text-gray-100">This is readable</p>
</div>
```

### ❌ Using opacity utilities on colors
```jsx
// Wrong - opacity doesn't work on text-gray-400 in dark mode
<div className="border border-gray-300/50 dark:border-gray-700">Not consistent</div>

// Correct - use color stops directly
<div className="border border-stroke/50 dark:border-gray-700/50">Consistent</div>
```

---

## Copy-Paste Components

Copy these complete components into your code:

### Reusable Button Component
```jsx
export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-brand dark:bg-brand-600 hover:bg-brand-600 dark:hover:bg-brand-700 active:bg-brand-700 dark:active:bg-brand-800 text-white',
    secondary: 'bg-surface-muted dark:bg-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700',
    outline: 'border border-stroke dark:border-gray-600 text-text-primary dark:text-gray-100 hover:bg-surface-muted dark:hover:bg-gray-800',
    ghost: 'text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-200 hover:bg-surface-muted dark:hover:bg-gray-800',
  };

  return (
    <button 
      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-fast ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Reusable Card Component
```jsx
export function Card({ children, className = '' }) {
  return (
    <div className={`bg-surface-card dark:bg-gray-900 border border-stroke dark:border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-shadow duration-fast ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-lg font-semibold text-text-primary dark:text-gray-100 ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }) {
  return <p className={`text-sm text-text-secondary dark:text-gray-400 ${className}`}>{children}</p>;
}
```

---

## Testing Your Dark Mode Implementation

### DevTools Console Test
```javascript
// Toggle dark mode programmatically (for testing)
document.documentElement.classList.toggle('dark');

// Force dark mode
document.documentElement.classList.add('dark');
localStorage.setItem('theme', 'dark');

// Force light mode
document.documentElement.classList.remove('dark');
localStorage.setItem('theme', 'light');

// Check current theme
const isDark = document.documentElement.classList.contains('dark');
console.log('Dark mode:', isDark);
```

---

## File Locations for Reference

- **Design tokens**: `tailwind.config.js`
- **Theme logic**: `src/context/ThemeContext.js`
- **Example patterns**: `src/components/DarkModeExample.jsx`
- **Color reference**: `DARK_MODE_COLORS.md`

---

Ready to add dark mode to any component? Use these snippets as a reference! 🎨
