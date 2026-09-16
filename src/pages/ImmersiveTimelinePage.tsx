import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { PolariScopeLogo } from "@/components/icons";
import {
  cameraZForProgress,
  eventIndexForProgress,
  heroTransition,
  interpolateSky,
  journeyProgress,
  layoutTimelineEvents,
  markerOpacity,
  progressForEvent,
  scrollTopForProgress,
  smoothProgress,
} from "./immersiveTimeline";
import "./ImmersiveTimelinePage.css";

type RenderState = "loading" | "ready" | "reduced-motion" | "webgl-unavailable";

const StoryModal = lazy(() =>
  import("@/feature/course/chronicles/StoryModal").then(({ StoryModal: Component }) => ({
    default: Component,
  })),
);

const MARKERS = layoutTimelineEvents();
const JOURNEY_DISTANCE = scrollTopForProgress(1, MARKERS.length);

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function pointCountForDevice() {
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency || 4;
  if (window.innerWidth < 640 || memory <= 4 || cores <= 4) return 5_500;
  return 12_000;
}

export default function ImmersiveTimelinePage() {
  const { i18n } = useTranslation();
  const [renderState, setRenderState] = useState<RenderState>(() =>
    prefersReducedMotion() ? "reduced-motion" : "loading",
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);

  const mainRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const markerSizesRef = useRef(MARKERS.map(() => ({ width: 0, height: 0 })));
  const progressRef = useRef(0);
  const rangeRef = useRef<HTMLInputElement>(null);
  const wakeRef = useRef<() => void>(() => {});
  const pausedRef = useRef(false);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const isZh = i18n.language.startsWith("zh");
  const isFallback = renderState === "reduced-motion" || renderState === "webgl-unavailable";

  useEffect(() => {
    if (renderState !== "ready") return;
    const indices = new Map<Element, number>();
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const index = indices.get(entry.target);
        if (index === undefined) continue;
        const box = entry.borderBoxSize[0];
        markerSizesRef.current[index] = {
          width: box?.inlineSize ?? entry.contentRect.width,
          height: box?.blockSize ?? entry.contentRect.height,
        };
      }
      wakeRef.current();
    });
    markerRefs.current.forEach((element, index) => {
      if (!element) return;
      indices.set(element, index);
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, [renderState]);

  useEffect(() => {
    if (isFallback && heroRef.current) heroRef.current.inert = false;
  }, [isFallback]);

  useEffect(() => {
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference?.matches ?? false);
    preference?.addEventListener("change", update);
    return () => preference?.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    pausedRef.current = selectedIndex !== null;
    if (selectedIndex === null) {
      wakeRef.current();
      openerRef.current?.focus({ preventScroll: true });
      openerRef.current = null;
    }
  }, [selectedIndex]);

  function navigateToProgress(progress: number) {
    window.scrollTo({
      top: scrollTopForProgress(progress, MARKERS.length),
      behavior: "instant",
    });
  }

  function navigateToEvent(index: number) {
    const targetIdx = Math.max(0, Math.min(MARKERS.length - 1, index));
    navigateToProgress(progressForEvent(targetIdx, MARKERS.length));
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex !== null) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " " && e.target instanceof Element &&
          e.target.closest('button, a, [role="button"]')) return;

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        navigateToEvent(activeIndex < 0 ? 0 : activeIndex + 1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        navigateToEvent(activeIndex <= 0 ? 0 : activeIndex - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        navigateToProgress(0);
      } else if (e.key === "End") {
        e.preventDefault();
        navigateToProgress(1);
      } else if (e.key === " " && activeIndex >= 0) {
        e.preventDefault();
        setSelectedIndex(activeIndex);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, selectedIndex]);

  useEffect(() => {
    if (reducedMotion) {
      setRenderState("reduced-motion");
      return;
    }
    setRenderState("loading");

    const canvas = canvasRef.current;
    if (!canvas || !hasWebGL()) {
      setRenderState("webgl-unavailable");
      return;
    }

    let cancelled = false;
    let frameId = 0;
    let removeListeners: (() => void) | undefined;
    let disposeRenderer: (() => void) | undefined;

    async function initializeScene() {
      try {
        const [THREE, { SimplexNoise }] = await Promise.all([
          import("three"),
          import("three/examples/jsm/math/SimplexNoise.js"),
        ]);

        if (cancelled || !canvas) return;

        const pointCount = pointCountForDevice();
        const lowPower = pointCount === 5_500;
        const renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: !lowPower,
          powerPreference: "high-performance",
        });

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 160);

        // Circular dot canvas texture (Dotism style from mlsysbook)
        const dotCanvas = document.createElement("canvas");
        dotCanvas.width = 64;
        dotCanvas.height = 64;
        const dotCtx = dotCanvas.getContext("2d");
        if (dotCtx) {
          const grad = dotCtx.createRadialGradient(32, 32, 0, 32, 32, 30);
          grad.addColorStop(0, "rgba(255, 255, 255, 1)");
          grad.addColorStop(0.65, "rgba(255, 255, 255, 0.95)");
          grad.addColorStop(0.85, "rgba(255, 255, 255, 0.45)");
          grad.addColorStop(1, "rgba(255, 255, 255, 0)");
          dotCtx.fillStyle = grad;
          dotCtx.beginPath();
          dotCtx.arc(32, 32, 30, 0, Math.PI * 2);
          dotCtx.fill();
        }
        const dotTexture = new THREE.CanvasTexture(dotCanvas);

        const initialFogColor = new THREE.Color(0x0e1726);
        const shaderMaterial = new THREE.ShaderMaterial({
          uniforms: {
            pointTexture: { value: dotTexture },
            fogColor: { value: initialFogColor },
            fogNear: { value: 20 },
            fogFar: { value: 125 },
            time: { value: 0 },
          },
          vertexShader: `
            uniform float time;
            attribute float size;
            varying vec3 vColor;
            varying float vFogDepth;
            void main() {
              vColor = color;
              vec3 animatedPosition = position;
              float terrainWave = sin(position.z * 0.09 + time * 0.35) * 0.16;
              float crossWave = cos(position.x * 0.12 - time * 0.22) * 0.08;
              animatedPosition.y += terrainWave + crossWave;
              animatedPosition.x += sin(position.z * 0.045 + time * 0.18) * 0.06;
              vec4 mvPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
              float shimmer = 1.0 + sin(position.z * 0.15 + time * 1.4) * 0.08;
              gl_PointSize = size * shimmer * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
              vFogDepth = -mvPosition.z;
            }
          `,
          fragmentShader: `
            uniform sampler2D pointTexture;
            uniform vec3 fogColor;
            uniform float fogNear;
            uniform float fogFar;
            varying vec3 vColor;
            varying float vFogDepth;
            void main() {
              vec4 tex = texture2D(pointTexture, gl_PointCoord);
              if (tex.a < 0.25) discard;
              float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
              vec3 col = mix(vColor * tex.rgb, fogColor, fogFactor);
              gl_FragColor = vec4(col, tex.a * (1.0 - fogFactor * 0.75));
            }
          `,
          transparent: true,
          depthTest: true,
          depthWrite: false,
          vertexColors: true,
        });

        const geometry = new THREE.BufferGeometry();
        let disposed = false;
        disposeRenderer = () => {
          if (disposed) return;
          disposed = true;
          geometry.dispose();
          shaderMaterial.dispose();
          dotTexture.dispose();
          renderer.dispose();
          renderer.forceContextLoss();
        };

        const noise = new SimplexNoise();
        const positions = new Float32Array(pointCount * 3);
        const colors = new Float32Array(pointCount * 3);
        const sizes = new Float32Array(pointCount);

        const finalMarkerZ = MARKERS.at(-1)?.z ?? -300;
        const totalZSpan = Math.abs(finalMarkerZ) + 120;

        for (let index = 0; index < pointCount; index += 1) {
          const offset = index * 3;
          const pProgress = index / Math.max(1, pointCount - 1);
          const x = (Math.random() - 0.5) * 88;
          const z = 35 - pProgress * totalZSpan;

          // 2-octave simplex terrain
          const h1 = noise.noise(x * 0.024, z * 0.012) * 16.5;
          const h2 = noise.noise(x * 0.065, z * 0.032) * 5.2;
          const distFromCenter = Math.abs(x);
          const valley = Math.min(1, Math.pow(distFromCenter / 14, 1.8));
          let y = -6.4 + (h1 + h2) * valley;

          // Center valley: polarized light stream particles
          const isStream = distFromCenter < 5.0 && Math.random() < 0.28;
          let pSize = 0.85 + Math.random() * 0.85;
          let r = 0.1,
            g = 0.4,
            b = 0.6;

          if (isStream) {
            const wave = z * 0.12;
            y = -5.5 + Math.sin(wave) * 0.75 + (Math.random() - 0.5) * 0.5;
            pSize = 1.4 + Math.random() * 1.3;
            // Dual-colored polarized stream: amber / electric cyan
            if (Math.sin(wave * 0.5) > 0) {
              r = 0.98;
              g = 0.72;
              b = 0.22; // Amber gold (Optics beam)
            } else {
              r = 0.22;
              g = 0.86;
              b = 0.98; // Cyan (Polarization beam)
            }
          } else {
            const hNorm = (y + 12) / 22 + (Math.random() - 0.5) * 0.15;
            if (hNorm < 0.25) {
              // Oceanic polar navy floor
              r = 0.06;
              g = 0.18;
              b = 0.32;
            } else if (hNorm < 0.5) {
              // Glacier teal
              r = 0.1;
              g = 0.48;
              b = 0.62;
            } else if (hNorm < 0.72) {
              // Aurora emerald & vivid teal
              r = 0.16;
              g = 0.82;
              b = 0.72;
            } else if (hNorm < 0.88) {
              // Starlight violet
              r = 0.56;
              g = 0.44;
              b = 0.92;
            } else {
              // High ridge ice white
              r = 0.9;
              g = 0.95;
              b = 1.0;
              pSize = 1.2 + Math.random() * 1.0;
            }
          }

          positions[offset] = x;
          positions[offset + 1] = y;
          positions[offset + 2] = z;
          colors[offset] = r;
          colors[offset + 1] = g;
          colors[offset + 2] = b;
          sizes[index] = pSize;
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

        const landscape = new THREE.Points(geometry, shaderMaterial);
        scene.add(landscape);
        scene.fog = new THREE.Fog(0x0e1726, 20, 125);
        camera.position.set(0, 4.2, 10);

        let sceneProgress = 0;
        let lastTime = 0;
        let previousIndex = -2;
        let previousHeroOpacity = -1;
        let previousCueOpacity = -1;
        const markerStates = MARKERS.map(() => ({ visible: false, interactive: false }));
        const visibleMarkerBounds: Array<{ left: number; right: number; top: number; bottom: number }> = [];
        let width = window.innerWidth;
        let height = window.innerHeight;

        const requestDraw = () => {
          if (!frameId && !cancelled && !document.hidden && !pausedRef.current) {
            frameId = window.requestAnimationFrame(draw);
          }
        };
        wakeRef.current = requestDraw;

        const updateScroll = () => {
          progressRef.current = journeyProgress(window.scrollY, MARKERS.length);
          requestDraw();
        };

        const resize = () => {
          width = window.innerWidth;
          height = window.innerHeight;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2));
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.fov = width < 640 ? 72 : 60;
          camera.updateProjectionMatrix();
          updateScroll();
        };

        const visibilityChange = () => {
          window.cancelAnimationFrame(frameId);
          frameId = 0;
          lastTime = 0;
          requestDraw();
        };

        const contextLost = (event: Event) => {
          event.preventDefault();
          window.cancelAnimationFrame(frameId);
          frameId = 0;
          removeListeners?.();
          disposeRenderer?.();
          wakeRef.current = () => {};
          setRenderState("webgl-unavailable");
        };

        window.addEventListener("scroll", updateScroll, { passive: true });
        window.addEventListener("resize", resize);
        document.addEventListener("visibilitychange", visibilityChange);
        canvas.addEventListener("webglcontextlost", contextLost);

        let listenersActive = true;
        removeListeners = () => {
          if (!listenersActive) return;
          listenersActive = false;
          window.removeEventListener("scroll", updateScroll);
          window.removeEventListener("resize", resize);
          document.removeEventListener("visibilitychange", visibilityChange);
          canvas.removeEventListener("webglcontextlost", contextLost);
        };

        const projected = new THREE.Vector3();
        const background = new THREE.Color();
        const fog = new THREE.Color();

        const draw = (time: number) => {
          frameId = 0;
          if (cancelled || document.hidden || pausedRef.current) {
            lastTime = 0;
            return;
          }
          const delta = lastTime ? Math.min(time - lastTime, 64) : 16;
          lastTime = time;
          shaderMaterial.uniforms.time.value += delta * 0.001;
          sceneProgress = smoothProgress(sceneProgress, progressRef.current, delta);
          const settled = Math.abs(sceneProgress - progressRef.current) < 0.00001;
          if (settled) sceneProgress = progressRef.current;
          const currentJourneyProgress = sceneProgress;

          // Camera flight: forward + subtle natural organic sway (TinyTorch style)
          camera.position.z = cameraZForProgress(currentJourneyProgress, MARKERS.length);
          camera.position.x = Math.sin(currentJourneyProgress * Math.PI * 4) * 1.35;
          camera.position.y = 4.2 + Math.cos(currentJourneyProgress * Math.PI * 2.4) * 0.35;
          camera.lookAt(camera.position.x * 0.35, -0.4, camera.position.z - 32);
          camera.updateMatrixWorld();

          // Dynamic Sky and Horizon Fog interpolation
          const sky = interpolateSky(currentJourneyProgress);
          background.setRGB(...sky.background);
          fog.setRGB(...sky.fog);
          scene.background = background;
          if (scene.fog) scene.fog.color.copy(fog);
          shaderMaterial.uniforms.fogColor.value.copy(fog);

          landscape.rotation.z = Math.sin(currentJourneyProgress * Math.PI * 2) * 0.01;

          const trackScale = width < 640 ? 0.6 : 1;
          const focusedIndex = eventIndexForProgress(currentJourneyProgress, MARKERS.length);
          if (focusedIndex !== previousIndex) {
            previousIndex = focusedIndex;
            setActiveIndex(focusedIndex);
          }

          if (rangeRef.current) {
            rangeRef.current.value = String(progressRef.current * 1000);
          }
          mainRef.current?.style.setProperty(
            "--journey-progress",
            String(currentJourneyProgress),
          );

          visibleMarkerBounds.length = 0;
          // Cull before projection; only visible markers receive per-frame DOM writes.
          MARKERS.forEach((marker, index) => {
            const element = markerRefs.current[index];
            if (!element) return;
            const state = markerStates[index];
            let opacity = markerOpacity(camera.position.z, marker.z, currentJourneyProgress);
            if (opacity > 0) {
              projected.set(marker.x * trackScale, marker.y, marker.z).project(camera);
              if (projected.z < -1 || projected.z > 1) opacity = 0;
            }
            if (opacity === 0) {
              if (state.visible) {
                element.style.opacity = "0";
                element.style.pointerEvents = "none";
                element.style.willChange = "auto";
                element.tabIndex = -1;
                element.setAttribute("aria-hidden", "true");
                state.visible = false;
                state.interactive = false;
              }
              return;
            }

            const { width: markerWidth, height: markerHeight } = markerSizesRef.current[index];
            if (!markerWidth || !markerHeight) return;
            const margin = 12;
            const screenX = Math.max(margin + markerWidth / 2, Math.min(
              width - margin - markerWidth / 2, (projected.x * 0.5 + 0.5) * width,
            ));
            const bottom = height - 128;
            let screenY = Math.max(80 + markerHeight, Math.min(
              bottom, (-projected.y * 0.5 + 0.5) * height,
            ));
            if (opacity > 0) {
              const left = screenX - markerWidth / 2;
              const right = screenX + markerWidth / 2;
              for (const previous of visibleMarkerBounds) {
                if (left < previous.right + 12 && right > previous.left - 12 &&
                    screenY > previous.top - 12 && screenY - markerHeight < previous.bottom + 12) {
                  screenY = previous.top - 12;
                }
              }
              visibleMarkerBounds.push({ left, right, top: screenY - markerHeight, bottom: screenY });
            }

            element.style.transform = `translate3d(${screenX.toFixed(2)}px, ${screenY.toFixed(2)}px, 0) translate(-50%, -100%)`;
            element.style.opacity = String(opacity);
            const interactive = opacity > 0.45;
            if (!state.visible || interactive !== state.interactive) {
              element.style.pointerEvents = interactive ? "auto" : "none";
              element.tabIndex = interactive ? 0 : -1;
              element.setAttribute("aria-hidden", String(!interactive));
            }
            element.style.willChange = !settled ? "transform, opacity" : "auto";
            state.visible = true;
            state.interactive = interactive;
          });

          // Hero section fade and lift (exact MLSYSBOOK hero transition)
          const scrollY = scrollTopForProgress(currentJourneyProgress, MARKERS.length);
          const hero = heroTransition(scrollY);
          if (heroRef.current && (hero.opacity > 0 || previousHeroOpacity !== hero.opacity)) {
            heroRef.current.style.opacity = String(hero.opacity);
            mainRef.current?.style.setProperty("--hero-opacity", String(hero.opacity));
            heroRef.current.style.transform = `translate(-50%, calc(-50% - ${hero.lift}px))`;
            heroRef.current.inert = hero.opacity < 0.1;
            previousHeroOpacity = hero.opacity;
          }

          // Bouncing scroll cue: fade out as user scrolls
          const cueOpacity = Math.max(0, 1 - currentJourneyProgress * 15);
          if (scrollCueRef.current && cueOpacity !== previousCueOpacity) {
            scrollCueRef.current.style.opacity = String(cueOpacity);
            scrollCueRef.current.style.pointerEvents = cueOpacity > 0.1 ? "auto" : "none";
            scrollCueRef.current.inert = cueOpacity <= 0.1;
            previousCueOpacity = cueOpacity;
          }

          // Terrain vertices are ordered by descending z, so skip the range outside the camera depth.
          const pointsPerUnit = (pointCount - 1) / totalZSpan;
          const firstPoint = Math.max(0, Math.floor((35 - camera.position.z - 8) * pointsPerUnit));
          const lastPoint = Math.min(pointCount, Math.ceil((35 - camera.position.z + camera.far) * pointsPerUnit) + 1);
          geometry.setDrawRange(firstPoint, Math.max(0, lastPoint - firstPoint));
          renderer.render(scene, camera);
          if (!settled) requestDraw();
          else lastTime = 0;
        };

        resize();
        sceneProgress = progressRef.current;
        setRenderState("ready");
        requestDraw();
      } catch {
        removeListeners?.();
        disposeRenderer?.();
        wakeRef.current = () => {};
        if (!cancelled) setRenderState("webgl-unavailable");
      }
    }

    void initializeScene();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      removeListeners?.();
      disposeRenderer?.();
      wakeRef.current = () => {};
    };
  }, [reducedMotion]);

  return (
    <>
      <main
        ref={mainRef}
        inert={selectedIndex !== null}
        className={`immersive-timeline ${isFallback ? "immersive-timeline--fallback" : ""}`}
        style={{ height: isFallback ? "100svh" : `calc(100dvh + ${JOURNEY_DISTANCE}px)` }}
        aria-label={isZh ? "PolarCraft 沉浸式时间线" : "PolarCraft immersive timeline"}
        data-render-state={renderState}
      >
        <div id="canvas-container">
          <canvas ref={canvasRef} className="immersive-timeline__canvas" aria-hidden="true" />
        </div>

        {/* --- Hero Title Section (Exact MLSYSBOOK ID and Structure) --- */}
        <div id="hero-title" ref={heroRef}>
          <PolariScopeLogo size={100} theme="dark" animated={false} rotating={false} className="hero-logo" />
          <div className="subtitle">
            <Sparkles size={13} className="inline-block mr-1 text-amber-500" />
            <span>{isZh ? "偏振探索者社区" : "Builder Community"}</span>
          </div>
          <h1 className="hero-heading">
            {isZh ? "穿越偏振光的历史" : "AI & Optics Landscape"}
          </h1>
          <p className="hero-intro">
            {isZh
              ? "从一块会制造双影的冰岛石出发，沿两条光学轨迹飞向今天。"
              : "Fly through the milestones of light, optics, and polarization history."}
          </p>
          {!isFallback && (
            <button
              className="begin-btn"
              type="button"
              disabled={renderState !== "ready"}
              onClick={() => navigateToEvent(0)}
            >
              <span>{isZh ? "开启飞行" : "Begin Flight"}</span>
              <ArrowDown size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* --- Top Left Back Button --- */}
        <Link
          className="immersive-timeline__back"
          to="/"
          aria-label={isZh ? "返回首页" : "Back to home"}
          title={isZh ? "返回首页" : "Back to home"}
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>

        {/* Timeline markers are the only in-scene event surface. */}
        {renderState === "ready" && (
          <div
            id="markers-container"
            aria-label={isZh ? "历史事件标记" : "Milestone markers"}
          >
            {MARKERS.map(({ event }, index) => (
              <button
                key={`marker-${event.year}-${event.track}-${event.titleEn}`}
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                ref={(element) => {
                  markerRefs.current[index] = element;
                }}
                className={`marker ${event.track === "polarization" ? "polarization" : "optics"}`}
                onClick={() => {
                  openerRef.current = markerRefs.current[index];
                  setSelectedIndex(index);
                }}
                aria-label={`${event.year} ${isZh ? event.titleZh : event.titleEn}`}
              >
                <span className="marker-content">
                  <span className="marker-year">{event.year}</span>
                  <span className="marker-label">{isZh ? event.titleZh : event.titleEn}</span>
                  {(event.scientistZh || event.scientistEn) && (
                    <span className="marker-author">
                      {event.scientistBio?.portraitEmoji ? `${event.scientistBio.portraitEmoji} ` : ""}
                      {isZh ? event.scientistZh : event.scientistEn}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* --- Exact MLSYSBOOK .ui-overlay with bouncing caret --- */}
        {!isFallback && renderState === "ready" && (
          <div
            ref={scrollCueRef}
            className="ui-overlay"
            onClick={() => navigateToEvent(0)}
            role="button"
            tabIndex={0}
            aria-label={isZh ? "向下滚动" : "Scroll"}
          >
            <div className="caret-up" />
            <div style={{ fontSize: "10px", letterSpacing: "2px", marginTop: "8px" }}>
              {isZh ? "向下滑动" : "SCROLL"}
            </div>
          </div>
        )}

        {/* --- Bottom Navigation HUD --- */}
        {renderState === "ready" && (
          <nav
            className="immersive-timeline__journey"
            aria-label={isZh ? "时间线导航" : "Timeline navigation"}
          >
            <div className="immersive-timeline__journey-row">
              <button
                type="button"
                onClick={() => navigateToProgress(0)}
                disabled={activeIndex < 0}
                aria-label={isZh ? "回到起点" : "Back to start"}
                title={isZh ? "回到起点" : "Back to start"}
              >
                <RotateCcw size={17} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => navigateToEvent(activeIndex - 1)}
                disabled={activeIndex <= 0}
                aria-label={isZh ? "上一个事件" : "Previous event"}
                title={isZh ? "上一个事件" : "Previous event"}
              >
                <ChevronLeft size={19} aria-hidden="true" />
              </button>

              <div className="immersive-timeline__position">
                <strong>
                  {activeIndex < 0
                    ? `${MARKERS[0].event.year} – ${MARKERS.at(-1)?.event.year}`
                    : `${MARKERS[activeIndex].event.year} · ${
                        isZh ? MARKERS[activeIndex].event.titleZh : MARKERS[activeIndex].event.titleEn
                      }`}
                </strong>
                <span>{`${Math.max(0, activeIndex + 1)} / ${MARKERS.length}`}</span>
              </div>

              <button
                type="button"
                onClick={() => navigateToEvent(activeIndex + 1)}
                disabled={activeIndex === MARKERS.length - 1}
                aria-label={isZh ? "下一个事件" : "Next event"}
                title={isZh ? "下一个事件" : "Next event"}
              >
                <ChevronRight size={19} aria-hidden="true" />
              </button>

            </div>

            <input
              ref={rangeRef}
              className="immersive-timeline__scrubber"
              type="range"
              min="0"
              max="1000"
              defaultValue="0"
              aria-label={isZh ? "时间线进度" : "Timeline progress"}
              aria-valuetext={
                activeIndex < 0
                  ? isZh
                    ? "起点"
                    : "Start"
                  : `${MARKERS[activeIndex].event.year}, ${
                      isZh ? MARKERS[activeIndex].event.titleZh : MARKERS[activeIndex].event.titleEn
                    }`
              }
              onChange={(event) => navigateToProgress(Number(event.target.value) / 1000)}
            />
          </nav>
        )}

        {/* Fallback Section */}
        {isFallback && (
          <section className="immersive-timeline__fallback" role="status">
            <p>
              {renderState === "reduced-motion"
                ? isZh
                  ? "已根据你的动态效果偏好关闭飞行场景。"
                  : "The flight is paused to respect your motion preference."
                : isZh
                  ? "此设备无法启动 WebGL 飞行场景。"
                  : "This device cannot start the WebGL flight."}
            </p>
            <Link to="/chronicles/explore">
              {isZh ? "浏览历史事件" : "Browse historical events"}
            </Link>
          </section>
        )}
      </main>

      {/* --- Detailed Story Modal --- */}
      {selectedIndex !== null && (
        <Suspense fallback={null}>
          <StoryModal
            event={MARKERS[selectedIndex].event}
            onClose={() => setSelectedIndex(null)}
            onPrev={() => {
              if (selectedIndex > 0) {
                const nextIdx = selectedIndex - 1;
                setSelectedIndex(nextIdx);
                navigateToEvent(nextIdx);
              }
            }}
            onNext={() => {
              if (selectedIndex < MARKERS.length - 1) {
                const nextIdx = selectedIndex + 1;
                setSelectedIndex(nextIdx);
                navigateToEvent(nextIdx);
              }
            }}
            hasPrev={selectedIndex > 0}
            hasNext={selectedIndex < MARKERS.length - 1}
          />
        </Suspense>
      )}
    </>
  );
}
