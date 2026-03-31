/**
 * PERFORMANCE MONITOR - Dev tools for performance tracking
 * FPS counter, render tracking, memory usage
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Cpu, HardDrive, Zap, X } from 'lucide-react';

interface PerformanceMetrics {
  fps: number;
  memory: number;
  renderCount: number;
  lastRenderTime: number;
}

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: 0,
    renderCount: 0,
    lastRenderTime: 0,
  });

  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const renderCountRef = useRef(0);

  // Toggle visibility with Ctrl+Shift+P
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Track FPS
  useEffect(() => {
    if (!isVisible) return;

    let animationFrameId: number;

    const measureFPS = () => {
      const now = performance.now();
      frameCountRef.current++;

      const elapsed = now - lastFrameTimeRef.current;

      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        
        setMetrics((prev) => ({
          ...prev,
          fps,
        }));

        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }

      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isVisible]);

  // Track memory (if available)
  useEffect(() => {
    if (!isVisible) return;

    const measureMemory = () => {
      if ('memory' in performance) {
        const memoryInfo = (performance as any).memory;
        const usedMemoryMB = Math.round(memoryInfo.usedJSHeapSize / 1048576);
        
        setMetrics((prev) => ({
          ...prev,
          memory: usedMemoryMB,
        }));
      }
    };

    const interval = setInterval(measureMemory, 1000);
    return () => clearInterval(interval);
  }, [isVisible]);

  // Track renders
  useEffect(() => {
    renderCountRef.current++;
    const renderTime = performance.now();

    setMetrics((prev) => ({
      ...prev,
      renderCount: renderCountRef.current,
      lastRenderTime: renderTime,
    }));
  });

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return 'text-emerald-600';
    if (fps >= 30) return 'text-amber-600';
    return 'text-red-600';
  };

  const getMemoryColor = (memory: number) => {
    if (memory < 100) return 'text-emerald-600';
    if (memory < 200) return 'text-amber-600';
    return 'text-red-600';
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed bottom-4 right-4 z-[9999] w-64"
        >
          <div className="p-4 rounded-xl bg-slate-900 border-2 border-slate-700 shadow-2xl backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Performance</h3>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="h-3 w-3 text-slate-400" />
              </button>
            </div>

            {/* Metrics */}
            <div className="space-y-2">
              {/* FPS */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-300">FPS</span>
                </div>
                <span className={`text-sm font-bold ${getFPSColor(metrics.fps)}`}>
                  {metrics.fps}
                </span>
              </div>

              {/* Memory */}
              {metrics.memory > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-300">Memory</span>
                  </div>
                  <span className={`text-sm font-bold ${getMemoryColor(metrics.memory)}`}>
                    {metrics.memory} MB
                  </span>
                </div>
              )}

              {/* Render Count */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                <div className="flex items-center gap-2">
                  <Cpu className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-300">Renders</span>
                </div>
                <span className="text-sm font-bold text-sky-400">{metrics.renderCount}</span>
              </div>
            </div>

            {/* Hint */}
            <p className="text-xs text-slate-500 mt-3 text-center">
              Press <kbd className="px-1 bg-slate-800 rounded">Ctrl+Shift+P</kbd> to toggle
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Performance Profiler Hook
// ============================================================

export function usePerformanceProfiler(componentName: string) {
  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);

  useEffect(() => {
    const startTime = performance.now();
    renderCountRef.current++;

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      renderTimesRef.current.push(renderTime);

      // Keep only last 100 renders
      if (renderTimesRef.current.length > 100) {
        renderTimesRef.current.shift();
      }

      // Log slow renders (> 16ms = below 60fps)
      if (renderTime > 16) {
        console.warn(
          `[Performance] ${componentName} slow render: ${renderTime.toFixed(2)}ms (render #${
            renderCountRef.current
          })`
        );
      }

      // Log stats every 100 renders
      if (renderCountRef.current % 100 === 0) {
        const avgRenderTime =
          renderTimesRef.current.reduce((sum, time) => sum + time, 0) /
          renderTimesRef.current.length;
        const maxRenderTime = Math.max(...renderTimesRef.current);
      }
    };
  });

  return {
    renderCount: renderCountRef.current,
    avgRenderTime:
      renderTimesRef.current.length > 0
        ? renderTimesRef.current.reduce((sum, time) => sum + time, 0) /
          renderTimesRef.current.length
        : 0,
  };
}

// ============================================================
// Usage Example
// ============================================================

/*
// In your component:
import { usePerformanceProfiler } from '@/components/shared/PerformanceMonitor';

function MyComponent() {
  const { renderCount, avgRenderTime } = usePerformanceProfiler('MyComponent');

  return <div>Component content</div>;
}

// In App.tsx:
import { PerformanceMonitor } from '@/components/shared/PerformanceMonitor';

function App() {
  return (
    <>
      <YourApp />
      <PerformanceMonitor />
    </>
  );
}
*/
