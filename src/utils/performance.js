// Performance optimization utilities

/**
 * Debounce function to limit how often a function can be called
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit how often a function can be called
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Lazy load images with intersection observer
 */
export function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });

  images.forEach(img => imageObserver.observe(img));
}

/**
 * Preload critical resources
 */
export function preloadResources(resources) {
  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.url;
    link.as = resource.type;
    if (resource.type === 'image') {
      link.type = 'image/webp';
    }
    document.head.appendChild(link);
  });
}

/**
 * Measure and log performance metrics
 */
export function measurePerformance(name, fn) {
  return async function(...args) {
    const start = performance.now();
    const result = await fn.apply(this, args);
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  };
}

/**
 * Virtual scrolling helper for large lists
 */
export class VirtualScroller {
  constructor(container, itemHeight, renderItem, totalItems) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.renderItem = renderItem;
    this.totalItems = totalItems;
    this.visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;
    this.scrollTop = 0;
    
    this.setupScrollListener();
    this.render();
  }

  setupScrollListener() {
    const throttledScroll = throttle(() => {
      this.scrollTop = this.container.scrollTop;
      this.render();
    }, 16); // ~60fps

    this.container.addEventListener('scroll', throttledScroll);
  }

  render() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(startIndex + this.visibleItems, this.totalItems);
    
    // Clear container
    this.container.innerHTML = '';
    
    // Create spacer for items above viewport
    const topSpacer = document.createElement('div');
    topSpacer.style.height = `${startIndex * this.itemHeight}px`;
    this.container.appendChild(topSpacer);
    
    // Render visible items
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.renderItem(i);
      item.style.height = `${this.itemHeight}px`;
      this.container.appendChild(item);
    }
    
    // Create spacer for items below viewport
    const bottomSpacer = document.createElement('div');
    bottomSpacer.style.height = `${(this.totalItems - endIndex) * this.itemHeight}px`;
    this.container.appendChild(bottomSpacer);
  }
}

/**
 * Service worker registration for caching
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

/**
 * Cache API responses
 */
export class CacheManager {
  constructor(cacheName = 'mastertech-cache-v1') {
    this.cacheName = cacheName;
  }

  async get(key) {
    const cache = await caches.open(this.cacheName);
    const response = await cache.match(key);
    return response ? await response.json() : null;
  }

  async set(key, data) {
    const cache = await caches.open(this.cacheName);
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(key, response);
  }

  async clear() {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  }
}

/**
 * Bundle size analyzer
 */
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('chunk') || entry.name.includes('main')) {
          console.log(`Bundle: ${entry.name}, Size: ${(entry.transferSize / 1024).toFixed(2)} KB`);
        }
      });
    });
    observer.observe({ entryTypes: ['resource'] });
  }
}
