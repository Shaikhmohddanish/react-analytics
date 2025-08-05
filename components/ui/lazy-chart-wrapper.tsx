import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyChartProps {
  data: any[];
  title: string;
  height: number;
  renderChart: (props: { data: any[]; height: number }) => React.ReactNode;
  className?: string;
  id?: string; // Optional id for the chart container
}

export function LazyChartWrapper({
  data,
  title,
  height,
  renderChart,
  className,
  id,
}: LazyChartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Load charts a bit before they come into view
        threshold: 0.1,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Simulate a small delay to show loading state
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <div 
      ref={ref}
      id={id}
      className={cn('chart-wrapper relative', className)}
      style={{ height: `${height}px` }}
    >
      {!isVisible && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-md">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-xs text-muted-foreground mt-1">Loading chart...</p>
          </div>
        </div>
      )}
      
      {isVisible && (
        <div style={{ height: `${height}px`, opacity: isLoaded ? 1 : 0.3, transition: 'opacity 0.3s ease-in-out' }}>
          {renderChart({ data, height })}
        </div>
      )}
    </div>
  );
}
