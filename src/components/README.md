# Animation Components

This directory contains components for adding animations to your React application.

## Available Components

### FadeInSection

A component that adds a fade-in animation to any content when it comes into view.

```jsx
import FadeInSection from './components/FadeInSection';

// Basic usage
<FadeInSection>
  <div>This content will fade in when scrolled into view</div>
</FadeInSection>

// With custom animation class
<FadeInSection animationClass="slide-in-left">
  <div>This content will slide in from the left</div>
</FadeInSection>

// With delay
<FadeInSection delay={300}>
  <div>This content will fade in after a 300ms delay</div>
</FadeInSection>

// With custom options for the IntersectionObserver
<FadeInSection options={{ threshold: 0.5 }}>
  <div>This content will fade in when 50% visible</div>
</FadeInSection>
```

### StaggerContainer

A component that adds staggered animations to a list of items.

```jsx
import StaggerContainer from './components/StaggerContainer';

// Basic usage
<StaggerContainer>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</StaggerContainer>

// With custom delay between items
<StaggerContainer staggerDelay={200}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</StaggerContainer>

// With custom options for the IntersectionObserver
<StaggerContainer options={{ threshold: 0.5 }}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</StaggerContainer>
```

## Available Animation Classes

The following animation classes are available in the CSS:

- `fade-in`: Fades in and slides up
- `slide-in-left`: Slides in from the left
- `slide-in-right`: Slides in from the right
- `scale-in`: Scales in from slightly smaller
- `rotate-in`: Rotates in from a slight angle

## Higher-Order Component

You can also use the `withFadeIn` higher-order component to wrap entire pages:

```jsx
import withFadeIn from '../hooks/withFadeIn';

const MyPage = () => {
  return (
    <div>
      <h1>My Page</h1>
      <p>This entire page will fade in when loaded</p>
    </div>
  );
};

export default withFadeIn(MyPage);
```

## Accessibility

All animations respect the user's motion preferences through the `prefers-reduced-motion` media query. If a user has enabled reduced motion in their system settings, animations will be disabled. 