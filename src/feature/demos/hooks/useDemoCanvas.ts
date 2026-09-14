/**
 * useDemoCanvas - 演示画布动画 Hook
 *
 * 统一处理所有 2D 演示画布的底层细节：
 * - 响应式尺寸：跟随容器宽度缩放，保持设计宽高比，杜绝拉伸变形
 * - HiDPI：按 devicePixelRatio 缩放，文字与线条在视网膜屏上锐利
 * - 基于时间的动画：draw 回调拿到的是"经过的秒数"，与刷新率无关
 *   （60Hz 与 144Hz 屏幕上的动画速度一致）
 * - 暂停：paused 时停止时间累计但仍按需重绘一次（参数变化能立即反映）
 */
import { useEffect, useRef } from "react";

export interface DemoCanvasFrame {
  ctx: CanvasRenderingContext2D;
  /** 设计坐标系宽度（draw 内部直接用设计坐标，无需关心 DPR/缩放） */
  width: number;
  /** 设计坐标系高度 */
  height: number;
  /** 动画时间，单位秒（暂停时冻结） */
  time: number;
  /** 距上一帧的时间，单位秒 */
  dt: number;
}

interface UseDemoCanvasOptions {
  /** 设计坐标系宽度 */
  width: number;
  /** 设计坐标系高度 */
  height: number;
  /** 每帧绘制回调（用 ref 持有，无需 memo 化） */
  draw: (frame: DemoCanvasFrame) => void;
  /** 暂停动画时间（仍会以 time 冻结值重绘） */
  paused?: boolean;
  /** 时间倍率，默认 1 */
  timeScale?: number;
}

export function useDemoCanvas({
  width,
  height,
  draw,
  paused = false,
  timeScale = 1,
}: UseDemoCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const timeScaleRef = useRef(timeScale);
  timeScaleRef.current = timeScale;
  const timeRef = useRef(0);
  const redrawRef = useRef(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let lastTimestamp: number | null = null;
    let cssScale = 1;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const loop = (timestamp: number) => {
      rafId = 0;
      if (document.hidden) {
        lastTimestamp = null;
        return;
      }
      const shouldAnimate = !pausedRef.current && !motionQuery.matches && timeScaleRef.current > 0;
      // Keep pause/resume and a return from another tab on the same wavefront.
      const dt = shouldAnimate && lastTimestamp !== null
        ? Math.min(0.05, (timestamp - lastTimestamp) / 1000)
        : 0;
      lastTimestamp = shouldAnimate ? timestamp : null;
      timeRef.current += dt * timeScaleRef.current;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(cssScale * dpr, 0, 0, cssScale * dpr, 0, 0);
      drawRef.current({ ctx, width, height, time: timeRef.current, dt });

      if (shouldAnimate) rafId = requestAnimationFrame(loop);
    };
    const redraw = () => {
      if (!rafId && !document.hidden) rafId = requestAnimationFrame(loop);
    };
    redrawRef.current = redraw;

    const resize = () => {
      const parent = canvas.parentElement;
      let available = width;
      if (parent) {
        // clientWidth includes padding; use the actual content width.
        const style = window.getComputedStyle(parent);
        available = parent.clientWidth
          - (parseFloat(style.paddingLeft) || 0)
          - (parseFloat(style.paddingRight) || 0);
      }
      cssScale = Math.max(0.1, Math.min(1, available / width));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * cssScale * dpr);
      canvas.height = Math.round(height * cssScale * dpr);
      canvas.style.width = `${width * cssScale}px`;
      canvas.style.height = `${height * cssScale}px`;
      redraw();
    };

    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    const onPlaybackChange = () => {
      cancelAnimationFrame(rafId);
      rafId = 0;
      lastTimestamp = null;
      redraw();
    };
    motionQuery.addEventListener("change", onPlaybackChange);
    document.addEventListener("visibilitychange", onPlaybackChange);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      motionQuery.removeEventListener("change", onPlaybackChange);
      document.removeEventListener("visibilitychange", onPlaybackChange);
      redrawRef.current = () => {};
    };
  }, [width, height]);

  // Parameter changes redraw a frozen scene immediately, without an idle loop.
  useEffect(() => {
    redrawRef.current();
  });

  return canvasRef;
}

/**
 * 把画布上的指针事件坐标换算回设计坐标系。
 */
export function pointerToCanvas(
  canvas: HTMLCanvasElement,
  e: { clientX: number; clientY: number },
  designWidth: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scale = designWidth / rect.width;
  return {
    x: (e.clientX - rect.left) * scale,
    y: (e.clientY - rect.top) * scale,
  };
}
