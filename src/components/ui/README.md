# UI Component Library

A comprehensive design system for the Mastertech construction company web application, built with React and Tailwind CSS.

## Design Philosophy

- **Consistent**: Unified spacing, typography, and color system
- **Accessible**: WCAG compliant with proper ARIA labels and keyboard navigation
- **Responsive**: Mobile-first design with smooth breakpoints
- **Professional**: Clean construction-industry aesthetic with orange brand color
- **Performant**: Optimized components with minimal re-renders

## Color System

### Brand Colors
- `brand` (Primary): #f97316 (Orange)
- `brand-hover`: #ea580c (Dark Orange)
- `brand-light`: #ffedd5 (Light Orange)
- `brand-dark`: #c2410c (Deep Orange)

### Gray Scale
- `gray-50`: #f9fafb (Background)
- `gray-100`: #f3f4f6 (Light Background)
- `gray-200`: #e5e7eb (Border)
- `gray-300`: #d1d5db (Disabled Border)
- `gray-400`: #9ca3af (Placeholder)
- `gray-500`: #6b7280 (Secondary Text)
- `gray-600`: #4b5563 (Text)
- `gray-700`: #374151 (Heading)
- `gray-800`: #1f2937 (Dark Text)
- `gray-900`: #111827 (Darkest Text)

## Typography

- **Headings**: `font-semibold` with gray-800/900
- **Body**: `text-sm` with gray-600/700
- **Labels**: `text-sm font-medium` with gray-700
- **Helper Text**: `text-xs` with gray-500

## Spacing System

- **xs**: 0.5rem (8px)
- **sm**: 1rem (16px)
- **md**: 1.5rem (24px)
- **lg**: 2rem (32px)
- **xl**: 3rem (48px)

## Components

### Button

Flexible button component with multiple variants and sizes.

```jsx
import { Button } from '../ui';

<Button variant="primary" size="md" loading={false} disabled={false}>
  Click me
</Button>
```

**Variants:**
- `primary` (Orange background)
- `secondary` (Gray background)
- `outline` (Border only)
- `ghost` (No background)
- `danger` (Red background)
- `success` (Green background)

**Sizes:**
- `sm`: Small (px-3 py-1.5)
- `md`: Medium (px-4 py-2)
- `lg`: Large (px-6 py-3)
- `xl`: Extra Large (px-8 py-4)

### Card

Container component with optional header, content, and footer.

```jsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui';

<Card hover={true} padding="default" shadow="soft">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Input

Form input components with validation states.

```jsx
import { Input, Textarea, Select } from '../ui';

<Input
  label="Project Title"
  placeholder="Enter project title"
  value={value}
  onChange={handleChange}
  error={errorMessage}
  helperText="Optional helper text"
  icon={<Icon />}
/>

<Textarea
  label="Description"
  placeholder="Enter description"
  rows={4}
/>

<Select
  label="Status"
  options={[
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' }
  ]}
  value={selectedValue}
  onChange={handleChange}
/>
```

### Modal

Accessible modal component with overlay and keyboard support.

```jsx
import { Modal, ModalFooter } from '../ui';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
  size="lg"
  closeOnOverlayClick={true}
>
  <form>
    Modal content
    <ModalFooter>
      <Button variant="secondary" onClick={handleClose}>
        Cancel
      </Button>
      <Button type="submit">Save</Button>
    </ModalFooter>
  </form>
</Modal>
```

### Toast

Notification system for user feedback.

```jsx
import { useToast } from '../ui';

const { success, error, warning, info, loading } = useToast();

// Show success toast
success('Project created successfully!');

// Show error toast
error('Failed to create project');

// Show loading toast
const toastId = loading('Processing...', { duration: 0 });
// Later: removeToast(toastId)
```

### Loading & Skeleton

Loading states and skeleton components.

```jsx
import { Loading, SkeletonCard, SkeletonList, EmptyState } from '../ui';

<Loading size="md" text="Loading projects..." />

<SkeletonCard />
<SkeletonList items={3} />

<EmptyState
  title="No projects found"
  description="Create your first project to get started."
  icon={<Icon />}
  action={<Button>Create Project</Button>}
/>
```

## Animation System

Custom animations defined in Tailwind config:

- `animate-fade-in`: Fade in effect
- `animate-slide-up`: Slide up from bottom
- `animate-slide-down`: Slide down from top
- `animate-scale-in`: Scale in from center

## Accessibility Features

- **Keyboard Navigation**: All interactive elements support tab navigation
- **ARIA Labels**: Proper labels and descriptions for screen readers
- **Focus Management**: Visible focus states and logical tab order
- **Color Contrast**: WCAG AA compliant color combinations
- **Semantic HTML**: Proper use of HTML5 semantic elements

## Usage Guidelines

### Do's
- Use consistent spacing (4px grid system)
- Follow the established color hierarchy
- Include proper labels and descriptions
- Test with keyboard navigation
- Use semantic HTML elements

### Don'ts
- Don't hardcode colors (use Tailwind classes)
- Don't skip accessibility attributes
- Don't use arbitrary values without documentation
- Don't mix different design patterns

## Performance Considerations

- Components use `React.memo` where appropriate
- Event handlers are optimized with `useCallback`
- Minimal re-renders through proper state management
- CSS-in-JS approach with Tailwind for better caching

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

When adding new components:

1. Follow the established naming conventions
2. Include proper TypeScript types (if applicable)
3. Add comprehensive documentation
4. Test accessibility with screen readers
5. Ensure responsive behavior
6. Add to this README file
