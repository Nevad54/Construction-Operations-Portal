import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from '../ui';

/**
 * DARK MODE EXAMPLE COMPONENT
 * 
 * This demonstrates how to add dark mode styles to components.
 * All components already have dark mode integrated via Tailwind CSS.
 * 
 * Key patterns:
 * - Light: `bg-surface-card` → Dark: `dark:bg-gray-900`
 * - Light: `text-text-primary` → Dark: `dark:text-gray-100`
 * - Light: `border-stroke` → Dark: `dark:border-gray-700`
 * 
 * The theme is automatically applied when user clicks the theme toggle
 * in the navbar. Preference is saved to localStorage.
 */

export default function DarkModeExample() {
  return (
    <div className="space-y-6">
      {/* Basic Card with dark mode */}
      <Card variant="default">
        <CardHeader>
          <CardTitle>Dark Mode Example</CardTitle>
          <CardDescription>
            This card automatically adapts to light and dark modes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary dark:text-gray-400">
            All components use Tailwind's dark mode class strategy.
            No JavaScript logic needed for styling—just add <code className="text-xs bg-surface-muted dark:bg-gray-800 px-2 py-1 rounded">dark:</code> variants.
          </p>
        </CardContent>
        <CardFooter divider>
          <Button variant="primary" size="sm">Learn More</Button>
        </CardFooter>
      </Card>

      {/* Text color example */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-text-primary dark:text-gray-100">
          Text Color Palette
        </h3>
        <div className="space-y-2">
          <p className="text-text-primary dark:text-gray-100">Primary (main text)</p>
          <p className="text-text-secondary dark:text-gray-400">Secondary (labels, help text)</p>
          <p className="text-text-muted dark:text-gray-500">Muted (disabled, meta)</p>
        </div>
      </div>

      {/* Background example */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-surface-card dark:bg-gray-900 border border-stroke dark:border-gray-700 rounded-lg">
          <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">surface-card</p>
        </div>
        <div className="p-4 bg-surface-muted dark:bg-gray-800 border border-stroke/50 dark:border-gray-700/50 rounded-lg">
          <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">surface-muted</p>
        </div>
        <div className="p-4 bg-surface-page dark:bg-gray-950 border border-stroke dark:border-gray-700 rounded-lg">
          <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">surface-page</p>
        </div>
        <div className="p-4 bg-brand dark:bg-brand-600 text-white border border-brand dark:border-brand-700 rounded-lg">
          <p className="text-sm font-medium">brand</p>
        </div>
      </div>

      {/* Button examples */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-text-primary dark:text-gray-100">
          Buttons (all variants support dark mode)
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="success">Success</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </div>

      {/* Usage Guidelines */}
      <Card variant="subtle">
        <CardHeader>
          <CardTitle size="sm">Implementation Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-text-secondary dark:text-gray-400">
            <p>
              <strong className="text-text-primary dark:text-gray-100">Theme Provider:</strong> Wraps the entire app with theme context
            </p>
            <p>
              <strong className="text-text-primary dark:text-gray-100">useTheme Hook:</strong> Access {'{theme, toggleTheme}'} in any component
            </p>
            <p>
              <strong className="text-text-primary dark:text-gray-100">Tailwind Classes:</strong> Add dark: variants for dark mode styles
            </p>
            <p>
              <strong className="text-text-primary dark:text-gray-100">LocalStorage:</strong> Preference persists across sessions
            </p>
            <p>
              <strong className="text-text-primary dark:text-gray-100">System Preference:</strong> Auto-detects if no saved preference
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Code example */}
      <Card variant="outlined">
        <CardHeader>
          <CardTitle size="sm">Example Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-surface-muted dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-xs text-text-secondary dark:text-gray-300">
{`// In any component:
import { useTheme } from '../context/ThemeContext';

export function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="bg-surface-card dark:bg-gray-900">
      <p>Current: {theme}</p>
      <button onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  );
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
