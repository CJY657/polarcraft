import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { PolariScopeLogo } from "@/components/icons";
import {
  cameraZForProgress,
  heroTransition,
  interpolateSky,
  layoutTimelineEvents,
  markerEdgeFade,
  markerOpacity,
  scrollProgress,
} from "./immersiveTimeline";
import "./ImmersiveTimelinePage.css";

type RenderState = "loading" | "ready" | "reduced-motion" | "webgl-unavailable";

const StoryModal = lazy(() =>
  import("@/feature/course/chronicles/StoryModal").then(({ StoryModal: Component }) => ({
    default: Component,
  })),
);

const MARKERS = layoutTimelineEvents();
const JOURNEY_HEIGHT = Math.max(5_200, MARKERS.length * 220);
const MARKER_HORIZONTAL_SPREAD = 0.28;

function prefersReducedMotion() {
  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  if (window.innerWidth < 640 || memory <= 4 || cores <= 4) return 4_500;
  return 9_000;
}

export default function ImmersiveTimelinePage() {
  const { i18n } = useTranslation();
  const [renderState, setRenderState] = useState<RenderState>(() =>
    prefersReducedMotion() ? "reduced-motion" : "loading",
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const progressRef = useRef(0);
  const isZh = i18n.language.startsWith("zh");
  const isFallback = renderState === "reduced-motion" || renderState === "webgl-unavailable";

  useEffect(() => {
    if (renderState === "reduced-motion") return;

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

        const renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: pointCountForDevice() > 4_500,
          powerPreference: "high-performance",
        });
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 140);
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.PointsMaterial({
          size: 0.11,
          vertexColors: true,
          transparent: true,
          opacity: 0.88,
          sizeAttenuation: true,
        });
        let disposed = false;
        disposeRenderer = () => {
          if (disposed) return;
          disposed = true;
          geometry.dispose();
          material.dispose();
          renderer.dispose();
          renderer.forceContextLoss();
        };
        const noise = new SimplexNoise();
        const pointCount = pointCountForDevice();
        const positions = new Float32Array(pointCount * 3);
        const colors = new Float32Array(pointCount * 3);
        const finalMarkerZ = MARKERS.at(-1)?.z ?? -20;
        const landscapeLength = Math.abs(finalMarkerZ) + 70;

        for (let index = 0; index < pointCount; index += 1) {
          const offset = index * 3;
          const progress = index / Math.max(1, pointCount - 1);
          const x = (Math.random() - 0.5) * 58;
          const z = 28 - progress * landscapeLength;
          const ridge = noise.noise(x * 0.055, z * 0.022);
          const y = -5.2 + ridge * 4.3 + Math.min(4, Math.abs(x) * 0.08);
          const warmth = (ridge + 1) * 0.5;

          positions[offset] = x;
          positions[offset + 1] = y;
          positions[offset + 2] = z;
          colors[offset] = 0.39 + warmth * 0.34;
          colors[offset + 1] = 0.65 + warmth * 0.23;
          colors[offset + 2] = 0.72 + warmth * 0.2;
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        const landscape = new THREE.Points(geometry, material);
        scene.add(landscape);
        scene.fog = new THREE.Fog(0x90a8a8, 24, 92);
        camera.position.set(0, 4, 10);

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        const updateScroll = () => {
          progressRef.current = scrollProgress(
            window.scrollY,
            document.documentElement.scrollHeight,
            window.innerHeight,
          );
        };
        const resize = () => {
          const width = window.innerWidth;
          const height = window.innerHeight;
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.fov = width < 640 ? 72 : 60;
          camera.updateProjectionMatrix();
        };

        updateScroll();
        resize();
        window.addEventListener("scroll", updateScroll, { passive: true });
        window.addEventListener("resize", resize);
        let listenersActive = true;
        removeListeners = () => {
          if (!listenersActive) return;
          listenersActive = false;
          window.removeEventListener("scroll", updateScroll);
          window.removeEventListener("resize", resize);
        };

        const projected = new THREE.Vector3();
        const background = new THREE.Color();
        const fog = new THREE.Color();

        const draw = () => {
          const journeyProgress = progressRef.current;
          const targetZ = cameraZForProgress(journeyProgress, MARKERS.length);
          camera.position.z += (targetZ - camera.position.z) * 0.075;
          camera.position.x = Math.sin(journeyProgress * Math.PI * 4) * 1.15;
          camera.position.y = 4 + Math.sin(journeyProgress * Math.PI * 2) * 0.45;
          camera.lookAt(camera.position.x * 0.2, -0.8, camera.position.z - 28);

          const sky = interpolateSky(journeyProgress);
          background.setRGB(...sky.background);
          fog.setRGB(...sky.fog);
          scene.background = background;
          scene.fog?.color.copy(fog);
          landscape.rotation.z = Math.sin(journeyProgress * Math.PI * 2) * 0.012;

          const trackScale = window.innerWidth < 640 ? 0.55 : 1;
          MARKERS.forEach((marker, index) => {
            const element = markerRefs.current[index];
            if (!element) return;

            projected.set(marker.x * trackScale, marker.y, marker.z).project(camera);
            const opacity =
              markerOpacity(camera.position.z, marker.z, journeyProgress) *
              markerEdgeFade(projected.x, projected.y);
            const x = (projected.x * MARKER_HORIZONTAL_SPREAD + 0.5) * window.innerWidth;
            const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;

            element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
            element.style.opacity = String(opacity);
            element.style.pointerEvents = opacity > 0.18 ? "auto" : "none";
            element.tabIndex = opacity > 0.35 ? 0 : -1;
          });

          if (heroRef.current) {
            const hero = heroTransition(window.scrollY);
            heroRef.current.style.opacity = String(hero.opacity);
            heroRef.current.style.transform = `translate(-50%, calc(-50% - ${hero.lift}px))`;
          }

          renderer.render(scene, camera);
          frameId = window.requestAnimationFrame(draw);
        };

        setRenderState("ready");
        draw();
      } catch {
        removeListeners?.();
        disposeRenderer?.();
        if (!cancelled) setRenderState("webgl-unavailable");
      }
    }

    void initializeScene();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      removeListeners?.();
      disposeRenderer?.();
    };
  }, []);

  return (
    <>
      <main
        className={`immersive-timeline ${isFallback ? "immersive-timeline--fallback" : ""}`}
        style={{ height: isFallback ? "100vh" : JOURNEY_HEIGHT }}
        aria-label={isZh ? "PolarCraft 沉浸式时间线" : "PolarCraft immersive timeline"}
        data-render-state={renderState}
      >
        <canvas ref={canvasRef} className="immersive-timeline__canvas" aria-hidden="true" />

        <div ref={heroRef} className="immersive-timeline__hero">
          <PolariScopeLogo
            size={92}
            theme="dark"
            animated={renderState !== "reduced-motion"}
            rotating={renderState !== "reduced-motion"}
            rotationSpeed="slow"
          />
          <p className="immersive-timeline__eyebrow">POLARCRAFT · CHRONICLES OF LIGHT</p>
          <h1>{isZh ? "穿越偏振光的历史" : "Fly through the history of polarized light"}</h1>
          <p className="immersive-timeline__intro">
            {isZh
              ? "从一块会制造双影的晶体出发，沿两条光学轨迹飞向今天。"
              : "Begin with a crystal that made two images, then follow two paths of optics into today."}
          </p>
          {!isFallback && (
            <p className="immersive-timeline__scroll-cue" aria-hidden="true">
              <span /> {isZh ? "向下滚动启程" : "Scroll to begin"}
            </p>
          )}
        </div>

        <Link
          className="immersive-timeline__explore"
          to="/chronicles/explore"
          aria-label={isZh ? "查看完整时间线" : "View full timeline"}
        >
          <span>{isZh ? "查看完整时间线" : "View full timeline"}</span>
          <span aria-hidden="true">↗</span>
        </Link>

        {renderState === "ready" && (
          <div className="immersive-timeline__markers" aria-label={isZh ? "历史事件" : "Historical events"}>
            {MARKERS.map(({ event }, index) => (
              <button
                key={`${event.year}-${event.track}-${event.titleEn}`}
                ref={(element) => {
                  markerRefs.current[index] = element;
                }}
                type="button"
                className={`immersive-timeline__marker immersive-timeline__marker--${event.track}`}
                aria-label={`${event.year}, ${isZh ? event.titleZh : event.titleEn}`}
                onClick={() => setSelectedIndex(index)}
                tabIndex={-1}
              >
                <span className="immersive-timeline__marker-year">{event.year}</span>
                <span className="immersive-timeline__marker-copy">
                  <span className="immersive-timeline__marker-title">
                    {isZh ? event.titleZh : event.titleEn}
                  </span>
                  {(event.scientistZh || event.scientistEn) && (
                    <span className="immersive-timeline__marker-scientist">
                      {isZh ? event.scientistZh : event.scientistEn}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}

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
              {isZh ? "直接查看完整时间线" : "Open the full timeline"}
            </Link>
          </section>
        )}
      </main>

      {selectedIndex !== null && (
        <Suspense fallback={null}>
          <StoryModal
            event={MARKERS[selectedIndex].event}
            onClose={() => setSelectedIndex(null)}
            onPrev={() => setSelectedIndex((current) => (current === null ? null : Math.max(0, current - 1)))}
            onNext={() =>
              setSelectedIndex((current) =>
                current === null ? null : Math.min(MARKERS.length - 1, current + 1),
              )
            }
            hasPrev={selectedIndex > 0}
            hasNext={selectedIndex < MARKERS.length - 1}
          />
        </Suspense>
      )}
    </>
  );
}
