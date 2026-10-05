import React, { useState, useEffect, useRef } from 'react';

/**
 * High-performance viewport intersection wrapper
 * Defers rendering and heavy DOM layout calculations of child elements until scrolled near view.
 */
export const LazyOnScroll = ({ children, minHeight = 140, placeholder = null, rootMargin = '400px' }) => {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined' && window.scrollY < 200) {
      return true;
    }
    return false;
  });
  const containerRef = useRef(null);

  useEffect(() => {
    if (isVisible) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isVisible, rootMargin]);

  return (
    <div ref={containerRef} style={{ minHeight: !isVisible ? `${minHeight}px` : undefined }}>
      {isVisible ? children : (placeholder || (
        <div 
          className="w-full flex items-center justify-center animate-pulse rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50"
          style={{ minHeight: `${minHeight}px` }}
        >
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Loading component...</span>
        </div>
      ))}
    </div>
  );
};

export default LazyOnScroll;
