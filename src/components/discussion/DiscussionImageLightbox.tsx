import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";

import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/utils/classNames";

interface DiscussionImageLightboxLabels {
  close: string;
  zoomIn: string;
  zoomOut: string;
  zoomInAriaLabel?: string;
  zoomOutAriaLabel?: string;
  hint: string;
  zoomedHint?: string;
}

interface DiscussionImageLightboxProps {
  image: { url: string; alt: string } | null;
  onClose: () => void;
  labels: DiscussionImageLightboxLabels;
}

interface Size {
  width: number;
  height: number;
}

const ZOOM_SCALE = 2.4;
const DRAG_THRESHOLD = 4;

function fitImageWithinBounds(image: Size, bounds: Size): Size {
  if (image.width <= 0 || image.height <= 0 || bounds.width <= 0 || bounds.height <= 0) {
    return image;
  }

  const scale = Math.min(bounds.width / image.width, bounds.height / image.height, 1);

  return {
    width: Math.max(1, Math.round(image.width * scale)),
    height: Math.max(1, Math.round(image.height * scale)),
  };
}

export function DiscussionImageLightbox({
  image,
  onClose,
  labels,
}: DiscussionImageLightboxProps) {
  const [zoomed, setZoomed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [naturalSize, setNaturalSize] = useState<Size | null>(null);
  const [viewportSize, setViewportSize] = useState<Size>({ width: 0, height: 0 });

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const suppressNextClickRef = useRef(false);
  const dragStateRef = useRef({
    active: false,
    moved: false,
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
  });

  const measureViewport = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const nextSize = {
      width: viewport.clientWidth,
      height: viewport.clientHeight,
    };

    setViewportSize((current) =>
      current.width === nextSize.width && current.height === nextSize.height ? current : nextSize
    );
  }, []);

  const clearDragState = useCallback(() => {
    dragStateRef.current = {
      active: false,
      moved: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      startScrollLeft: 0,
      startScrollTop: 0,
    };
    setDragging(false);
  }, []);

  useEffect(() => {
    if (!image) {
      clearDragState();
      setZoomed(false);
      setNaturalSize(null);
      suppressNextClickRef.current = false;
      return;
    }

    setZoomed(false);
    setNaturalSize(null);
    suppressNextClickRef.current = false;
    clearDragState();

    const frame = window.requestAnimationFrame(measureViewport);
    window.addEventListener("resize", measureViewport);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measureViewport);
    };
  }, [clearDragState, image, measureViewport]);

  const zoomedDimensions = useMemo(() => {
    if (!naturalSize) {
      return null;
    }

    const fitted = fitImageWithinBounds(naturalSize, {
      width: Math.max(viewportSize.width - 48, 1),
      height: Math.max(viewportSize.height - 48, 1),
    });

    return {
      width: Math.round(fitted.width * ZOOM_SCALE),
      height: Math.round(fitted.height * ZOOM_SCALE),
    };
  }, [naturalSize, viewportSize.height, viewportSize.width]);

  useEffect(() => {
    if (!zoomed || !image) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const viewport = viewportRef.current;
      if (!viewport) {
        return;
      }

      viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
      viewport.scrollTop = Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [image, zoomed, zoomedDimensions?.height, zoomedDimensions?.width]);

  const toggleZoom = useCallback(() => {
    setZoomed((current) => !current);
  }, []);

  const handleClose = useCallback(() => {
    clearDragState();
    setZoomed(false);
    onClose();
  }, [clearDragState, onClose]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!zoomed || event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    dragStateRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: viewport.scrollLeft,
      startScrollTop: viewport.scrollTop,
    };

    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState.active) {
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (!dragState.moved) {
      dragState.moved =
        Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD;
    }

    viewport.scrollLeft = dragState.startScrollLeft - deltaX;
    viewport.scrollTop = dragState.startScrollTop - deltaY;

    if (dragState.moved) {
      event.preventDefault();
    }
  }

  function finishPointerDrag(event?: React.PointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState.active) {
      return;
    }

    if (
      event &&
      dragState.pointerId !== null &&
      event.currentTarget.hasPointerCapture(dragState.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(dragState.pointerId);
    }

    if (dragState.moved) {
      suppressNextClickRef.current = true;
    }

    clearDragState();
  }

  function handleImageClick() {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    toggleZoom();
  }

  const zoomButtonLabel = zoomed ? labels.zoomOut : labels.zoomIn;
  const zoomButtonAriaLabel = zoomed
    ? labels.zoomOutAriaLabel ?? labels.zoomOut
    : labels.zoomInAriaLabel ?? labels.zoomIn;
  const hintText = zoomed ? labels.zoomedHint ?? labels.hint : labels.hint;

  return (
    <Dialog
      isOpen={Boolean(image)}
      onClose={handleClose}
      showCloseButton={false}
      className="h-[96vh] max-w-[96vw] overflow-hidden border border-slate-800 bg-slate-950/96"
    >
      {image && (
        <div className="relative flex h-full flex-col">
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleZoom}
              aria-label={zoomButtonAriaLabel}
              aria-pressed={zoomed}
              className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-xs font-medium text-white transition hover:bg-black/78"
            >
              {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
              {zoomButtonLabel}
            </button>
            <span className="hidden rounded-full bg-black/45 px-3 py-2 text-xs text-white/88 sm:inline">
              {hintText}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/78"
            aria-label={labels.close}
          >
            <X className="h-5 w-5" />
          </button>

          <div
            ref={viewportRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishPointerDrag}
            onPointerCancel={finishPointerDrag}
            className={cn(
              "h-full overflow-auto bg-[radial-gradient(circle_at_center,rgba(30,41,59,0.75),rgba(2,6,23,0.96))]",
              zoomed ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
            )}
          >
            <div
              className={cn(
                "flex min-h-full min-w-full p-4 sm:p-6",
                zoomed ? "items-start justify-start" : "items-center justify-center"
              )}
            >
              <div
                className={cn("flex items-center justify-center", zoomed && "shrink-0")}
                style={
                  zoomed && zoomedDimensions
                    ? {
                        width: `${zoomedDimensions.width}px`,
                        height: `${zoomedDimensions.height}px`,
                      }
                    : undefined
                }
              >
                <img
                  data-testid="discussion-lightbox-image"
                  data-zoomed={zoomed ? "true" : "false"}
                  src={image.url}
                  alt={image.alt}
                  draggable={false}
                  onDragStart={(event) => event.preventDefault()}
                  onLoad={(event) => {
                    setNaturalSize({
                      width: event.currentTarget.naturalWidth,
                      height: event.currentTarget.naturalHeight,
                    });
                    measureViewport();
                  }}
                  onClick={handleImageClick}
                  className={cn(
                    "select-none rounded-[1.2rem] shadow-[0_24px_60px_rgba(15,23,42,0.42)] transition-[width,height,max-width,max-height] duration-200",
                    zoomed
                      ? "h-full w-full max-h-none max-w-none object-contain"
                      : "max-h-[calc(96vh-7rem)] w-auto max-w-full object-contain"
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
