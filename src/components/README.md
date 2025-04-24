# Fade-in Animations

This directory contains components and utilities for adding fade-in animations to your React application.

## Components

### FadeInSection

A reusable component that adds fade-in animations to any content when it comes into view.

```jsx
import FadeInSection from './components/FadeInSection';

// Basic usage
<FadeInSection>
  <h1>This will fade in when scrolled into view</h1>
</FadeInSection>

// With options
<FadeInSection 
  direction="left" 
  delay={0.2} 
  threshold={0.2} 
  stagger={true}
>
  <div>This will fade in from the left with a delay</div>
</FadeInSection>
```

#### Props

- `children`: React nodes to animate
- `direction`: Animation direction ('up', 'down', 'left', 'right', 'scale')
- `delay`: Animation delay in seconds
- `threshold`: Intersection observer threshold (0-1)
- `stagger`: Whether to stagger child animations
- `className`: Additional CSS classes

## Utilities

### withFadeIn

A higher-order component that adds fade-in animation to any component.

```jsx
import withFadeIn from '../utils/withFadeIn';

// Basic usage
const AnimatedComponent = withFadeIn(MyComponent);

// With options
const AnimatedComponent = withFadeIn(MyComponent, {
  direction: 'right',
  delay: 0.3,
  threshold: 0.2,
  stagger: true
});
```

## CSS Classes

The following CSS classes are available for customizing animations:

- `.fade-in-section`: Base class for fade-in animations
- `.fade-in-left`: Fade in from the left
- `.fade-in-right`: Fade in from the right
- `.fade-in-up`: Fade in from the bottom
- `.fade-in-down`: Fade in from the top
- `.fade-in-scale`: Fade in with scale effect
- `.stagger-children`: Stagger child animations

## Best Practices

1. Use the `FadeInSection` component for one-off animations
2. Use the `withFadeIn` HOC for reusable components
3. Keep animations subtle and consistent throughout the application
4. Consider using different directions for different sections to create visual interest
5. Use the stagger effect for lists or grids of items
6. Adjust the threshold based on when you want the animation to trigger
7. Use delays sparingly to create a natural flow of animations

## Examples

### Basic Section

```jsx
<FadeInSection>
  <section>
    <h2>Section Title</h2>
    <p>Section content that will fade in when scrolled into view.</p>
  </section>
</FadeInSection>
```

### Staggered List

```jsx
<FadeInSection stagger={true}>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
    <li>Item 4</li>
  </ul>
</FadeInSection>
```

### Side-by-Side Content

```jsx
<div className="content-grid">
  <FadeInSection direction="left" delay={0.2}>
    <div className="content-left">
      Left content
    </div>
  </FadeInSection>
  
  <FadeInSection direction="right" delay={0.4}>
    <div className="content-right">
      Right content
    </div>
  </FadeInSection>
</div>
``` 