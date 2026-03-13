/**
 * Hyperlink Editor Component
 * 超链接编辑器组件
 *
 * Allows editing hyperlinks on PDF pages with drag-to-create interactions
 * 允许在 PDF 页面上编辑超链接，支持拖拽拉框创建
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFPageProxy } from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Link2,
  Trash2,
} from 'lucide-react';
import { useCourseAdminStore } from '@/stores/courseAdminStore';
import { CourseMedia, CourseHyperlink } from '@/lib/course.service';
import { getPptPdfFallbackUrl, hasPdfSidecar } from '@/feature/course/pptMedia';
import { FileUpload } from '@/components/ui/FileUpload';
import { HyperlinkFormDialog } from './HyperlinkFormDialog';

import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const DEFAULT_SELECTION_WIDTH = 0.15;
const DEFAULT_SELECTION_HEIGHT = 0.1;
const MIN_SELECTION_SIZE = 0.01;
const DRAG_THRESHOLD_PX = 6;

type HyperlinkRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
};

type DragSelectionState = {
  pointerId: number;
  page: number;
  start: { x: number; y: number };
  current: { x: number; y: number };
  startClientX: number;
  startClientY: number;
};

function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value));
}

function createRectFromPoints(
  start: { x: number; y: number },
  end: { x: number; y: number },
  page: number
): HyperlinkRect {
  const left = Math.min(start.x, end.x);
  const right = Math.max(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const bottom = Math.max(start.y, end.y);
  const width = Math.max(right - left, MIN_SELECTION_SIZE);
  const height = Math.max(bottom - top, MIN_SELECTION_SIZE);
  const boundedLeft = Math.min(left, 1 - width);
  const boundedTop = Math.min(top, 1 - height);

  return {
    page,
    x: boundedLeft + width / 2,
    y: boundedTop + height / 2,
    width,
    height,
  };
}

function createDefaultRect(point: { x: number; y: number }, page: number): HyperlinkRect {
  const left = clampUnit(point.x - DEFAULT_SELECTION_WIDTH / 2);
  const top = clampUnit(point.y - DEFAULT_SELECTION_HEIGHT / 2);
  const boundedLeft = Math.min(left, 1 - DEFAULT_SELECTION_WIDTH);
  const boundedTop = Math.min(top, 1 - DEFAULT_SELECTION_HEIGHT);

  return {
    page,
    x: boundedLeft + DEFAULT_SELECTION_WIDTH / 2,
    y: boundedTop + DEFAULT_SELECTION_HEIGHT / 2,
    width: DEFAULT_SELECTION_WIDTH,
    height: DEFAULT_SELECTION_HEIGHT,
  };
}

interface HyperlinkEditorProps {
  courseId: string;
  media: CourseMedia[];
  hyperlinks: CourseHyperlink[];
}

export function HyperlinkEditor({
  courseId,
  media,
  hyperlinks,
}: HyperlinkEditorProps) {
  const { deleteHyperlink, updateMedia, isLoading, error, clearError } = useCourseAdminStore();
  const pptMedia = media.filter((item) => item.type === 'pptx');
  const targetMedia = media.filter((item) => item.type !== 'pptx');
  const hasSinglePpt = pptMedia.length === 1;

  // PDF state
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(
    null
  );
  const [scale, setScale] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const pdfWrapperRef = useRef<HTMLDivElement>(null);

  // Dialog state
  const [isHyperlinkDialogOpen, setIsHyperlinkDialogOpen] = useState(false);
  const [editingHyperlink, setEditingHyperlink] = useState<CourseHyperlink | null>(null);
  const [newHyperlinkPosition, setNewHyperlinkPosition] = useState<HyperlinkRect | null>(null);
  const [dragSelection, setDragSelection] = useState<DragSelectionState | null>(null);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [selectedPptId, setSelectedPptId] = useState('');
  const [previewPdfUrl, setPreviewPdfUrl] = useState('');
  const [isCheckingPreview, setIsCheckingPreview] = useState(false);
  const activePptMedia = pptMedia.find((item) => item.id === selectedPptId) ?? pptMedia[0] ?? null;
  const legacyHyperlinks = hyperlinks.filter((hyperlink) => !hyperlink.sourceMediaId);
  const currentPptHyperlinks = activePptMedia
    ? hyperlinks.filter((hyperlink) => {
        if (hyperlink.sourceMediaId) {
          return hyperlink.sourceMediaId === activePptMedia.id;
        }

        return hasSinglePpt;
      })
    : [];

  useEffect(() => {
    if (!pptMedia.length) {
      setSelectedPptId('');
      return;
    }

    setSelectedPptId((currentId) => {
      if (currentId && pptMedia.some((item) => item.id === currentId)) {
        return currentId;
      }

      return pptMedia[0].id;
    });
  }, [pptMedia]);

  useEffect(() => {
    let isCancelled = false;

    const loadPreviewPdf = async () => {
      if (!activePptMedia) {
        setPreviewPdfUrl('');
        return;
      }

      setPreviewPdfUrl('');

      const fallbackUrl = activePptMedia.previewPdfUrl || getPptPdfFallbackUrl(activePptMedia.url);
      if (!fallbackUrl) {
        return;
      }

      setIsCheckingPreview(true);
      try {
        const exists = await hasPdfSidecar(fallbackUrl);
        if (!isCancelled) {
          setPreviewPdfUrl(exists ? fallbackUrl : '');
        }
      } finally {
        if (!isCancelled) {
          setIsCheckingPreview(false);
        }
      }
    };

    void loadPreviewPdf();

    return () => {
      isCancelled = true;
    };
  }, [activePptMedia]);

  useEffect(() => {
    setNumPages(0);
    setCurrentPage(1);
    setPageDimensions(null);
    setPageLoading(Boolean(previewPdfUrl));
  }, [previewPdfUrl]);

  // Calculate scale
  useEffect(() => {
    if (!containerRef.current || !pageDimensions) return;

    const calculateScale = () => {
      const container = containerRef.current!;
      const { width: containerWidth } = container.getBoundingClientRect();
      const { width: pageWidth } = pageDimensions;
      const newScale = containerWidth / pageWidth;
      setScale(Math.max(0.1, newScale));
    };

    calculateScale();

    const resizeObserver = new ResizeObserver(calculateScale);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [pageDimensions]);

  const onPageLoadSuccess = useCallback((page: PDFPageProxy) => {
    const { width, height } = page.getViewport({ scale: 1 });
    setPageDimensions({ width, height });
    setPageLoading(false);
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  }, []);

  const handlePdfLoadError = useCallback((err: Error) => {
    console.error('Error loading PDF:', err);
    setPageLoading(false);
  }, []);

  const getRelativePoint = useCallback((clientX: number, clientY: number) => {
    if (!pdfWrapperRef.current) {
      return null;
    }

    const rect = pdfWrapperRef.current.getBoundingClientRect();
    return {
      x: clampUnit((clientX - rect.left) / rect.width),
      y: clampUnit((clientY - rect.top) / rect.height),
    };
  }, []);

  const shouldIgnorePointerEvent = (target: EventTarget | null) =>
    target instanceof Element && Boolean(target.closest('[data-hyperlink-control="true"]'));

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || shouldIgnorePointerEvent(event.target)) {
      return;
    }

    const point = getRelativePoint(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    setDragSelection({
      pointerId: event.pointerId,
      page: currentPage,
      start: point,
      current: point,
      startClientX: event.clientX,
      startClientY: event.clientY,
    });
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragSelection || event.pointerId !== dragSelection.pointerId) {
      return;
    }

    const point = getRelativePoint(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    setDragSelection((prev) =>
      prev && prev.pointerId === event.pointerId
        ? { ...prev, current: point }
        : prev
    );
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragSelection || event.pointerId !== dragSelection.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragSelection(null);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragSelection || event.pointerId !== dragSelection.pointerId) {
      return;
    }

    const point = getRelativePoint(event.clientX, event.clientY) ?? dragSelection.current;
    const deltaX = Math.abs(event.clientX - dragSelection.startClientX);
    const deltaY = Math.abs(event.clientY - dragSelection.startClientY);
    const nextRect =
      Math.max(deltaX, deltaY) >= DRAG_THRESHOLD_PX
        ? createRectFromPoints(dragSelection.start, point, dragSelection.page)
        : createDefaultRect(point, dragSelection.page);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragSelection(null);
    setEditingHyperlink(null);
    setNewHyperlinkPosition(nextRect);
    setIsHyperlinkDialogOpen(true);
  };

  // Handle editing existing hyperlink
  const handleEditHyperlink = (hyperlink: CourseHyperlink) => {
    setEditingHyperlink(hyperlink);
    setIsHyperlinkDialogOpen(true);
  };

  // Handle delete hyperlink
  const handleDeleteHyperlink = async (id: string) => {
    try {
      await deleteHyperlink(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete hyperlink:', err);
    }
  };

  // Page navigation
  const nextPage = () => {
    if (currentPage < numPages) setCurrentPage((p) => p + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  // Get hyperlinks for current page
  const currentPageHyperlinks = currentPptHyperlinks.filter((h) => h.page === currentPage);
  const draftHyperlinkRect =
    dragSelection && dragSelection.page === currentPage
      ? createRectFromPoints(dragSelection.start, dragSelection.current, dragSelection.page)
      : null;

  // Get media title for hyperlink
  const getMediaTitle = (mediaId: string) => {
    const m = media.find((m) => m.id === mediaId);
    return m?.title['zh-CN'] || mediaId;
  };

  const handlePreviewPdfChange = (url: string) => {
    if (!activePptMedia) {
      return;
    }

    void updateMedia(activePptMedia.id, { previewPdfUrl: url }).catch((err) => {
      console.error('Failed to update PPT preview PDF:', err);
    });
  };

  if (!pptMedia.length) {
    return (
      <div className="space-y-4">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">暂无可配置超链接的 PPT</h3>
          <p className="text-gray-400 mb-4">
            超链接现在只支持配置在 `pptx` 类型媒体上。请先在“媒体”标签中添加 PPT 课件。
          </p>
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    );
  }

  if (isCheckingPreview && !previewPdfUrl) {
    return (
      <div className="space-y-4">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
          <div>
            <h3 className="text-lg font-semibold text-white">正在检查 PPT 预览</h3>
            <p className="text-sm text-gray-400">正在确认所选 PPT 是否存在可编辑的 PDF 预览。</p>
          </div>
        </div>
      </div>
    );
  }

  if (activePptMedia && !previewPdfUrl) {
    return (
      <div className="space-y-4">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">当前 PPT 缺少 PDF 预览</h3>
          <p className="text-gray-400 mb-2">
            只能在 PPT 的 PDF 预览上拉框配置超链接。当前已选择：
            <span className="ml-1 text-white">
              {activePptMedia.title['zh-CN'] || activePptMedia.title['en-US'] || activePptMedia.id}
            </span>
          </p>
          <p className="text-sm text-gray-500">
            先为这个 PPT 上传一个 PDF 预览文件，上传完成后即可在下方编辑热点。
          </p>
          <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
            <p className="mb-2 text-sm font-medium text-white">上传 PDF 预览</p>
            <FileUpload
              category="pdf"
              unitId={courseId}
              value={activePptMedia.previewPdfUrl || ''}
              onChange={handlePreviewPdfChange}
              preview={false}
              showUrlInput={false}
            />
          </div>
          {pptMedia.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {pptMedia.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedPptId(item.id)}
                  className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                    item.id === activePptMedia.id
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  {item.title['zh-CN'] || item.title['en-US'] || item.id}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-gray-400">
            仅可在 PPT 课件上拖拽拉框，并将热点指向右侧实验媒体（图片/视频）。
          </p>
          <p className="text-gray-500 text-sm mt-1">
            当前正在编辑：
            <span className="mx-1 text-white">
              {activePptMedia?.title['zh-CN'] || activePptMedia?.title['en-US'] || activePptMedia?.id}
            </span>
            。本 PPT 共 {currentPptHyperlinks.length} 个超链接，分布于 {numPages} 页。
          </p>
        </div>
        {pptMedia.length > 1 && (
          <div className="flex flex-wrap justify-end gap-2">
            {pptMedia.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedPptId(item.id)}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  item.id === activePptMedia?.id
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                {item.title['zh-CN'] || item.title['en-US'] || item.id}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white">PPT 预览 PDF</p>
            <p className="text-xs text-gray-400">
              为当前 PPT 绑定或替换 PDF 预览文件。上传后会立即用于超链接编辑。
            </p>
          </div>
        </div>
        <FileUpload
          category="pdf"
          unitId={courseId}
          value={activePptMedia?.previewPdfUrl || ''}
          onChange={handlePreviewPdfChange}
          preview={false}
          showUrlInput={false}
        />
      </div>

      {legacyHyperlinks.length > 0 && !hasSinglePpt && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
          <span className="text-sm text-amber-300">
            检测到 {legacyHyperlinks.length} 个旧超链接尚未绑定具体 PPT，当前不会显示。请重新创建到对应 PPT。
          </span>
        </div>
      )}

      {targetMedia.length === 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
          <span className="text-sm text-amber-300">
            当前没有可作为目标的实验媒体。请先添加图片或视频资源，再为 PPT 配置超链接。
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between">
          <span className="text-red-400 text-sm">{error}</span>
          <button onClick={clearError} className="text-red-400 hover:text-red-300">
            ×
          </button>
        </div>
      )}

      {/* PDF Viewer */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <button
              onClick={prevPage}
              disabled={currentPage <= 1}
              className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-white text-sm">
              {currentPage} / {numPages || 1}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage >= numPages}
              className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">
              当前页 {currentPageHyperlinks.length} 个链接
            </span>
          </div>
        </div>

        {/* PDF Container */}
        <div
          ref={containerRef}
          className="relative min-h-[500px] max-h-[70vh] overflow-auto bg-slate-900"
        >
          {pageLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
          )}

          <Document
            file={previewPdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={handlePdfLoadError}
            loading={null}
          >
            <div className="flex justify-center p-4">
              <div
                ref={pdfWrapperRef}
                className="relative cursor-crosshair"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
              >
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  onLoadSuccess={onPageLoadSuccess}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />

                {/* Hyperlink overlays */}
                {draftHyperlinkRect && (
                  <div
                    className="pointer-events-none absolute z-10"
                    style={{
                      left: `${draftHyperlinkRect.x * 100}%`,
                      top: `${draftHyperlinkRect.y * 100}%`,
                      width: `${draftHyperlinkRect.width * 100}%`,
                      height: `${draftHyperlinkRect.height * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div className="absolute inset-0 rounded border-2 border-cyan-300 bg-cyan-400/20 shadow-[0_0_0_1px_rgba(103,232,249,0.25)]" />
                  </div>
                )}

                {currentPageHyperlinks.map((hyperlink) => (
                  <div
                    key={hyperlink.id}
                    data-hyperlink-control="true"
                    className="absolute group"
                    style={{
                      left: `${hyperlink.x * 100}%`,
                      top: `${hyperlink.y * 100}%`,
                      width: `${hyperlink.width * 100}%`,
                      height: `${hyperlink.height * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {/* Visible overlay */}
                    <div className="absolute inset-0 bg-blue-500/30 border-2 border-blue-500 rounded group-hover:bg-blue-500/50 transition-colors" />

                    {/* Label */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {getMediaTitle(hyperlink.targetMediaId)}
                    </div>

                    {/* Actions */}
                    <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditHyperlink(hyperlink);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="p-1 bg-slate-700 hover:bg-slate-600 text-white rounded"
                      >
                        <Link2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(hyperlink.id);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="p-1 bg-red-500 hover:bg-red-600 text-white rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Document>
        </div>
      </div>

      {/* Hyperlink List */}
      {currentPptHyperlinks.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h4 className="text-sm font-medium text-gray-300 mb-3">当前 PPT 的超链接</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {currentPptHyperlinks.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">第 {h.page} 页</span>
                  <span className="text-white">→</span>
                  <span className="text-cyan-400">{getMediaTitle(h.targetMediaId)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditHyperlink(h)}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(h.id)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hyperlink Dialog */}
      <HyperlinkFormDialog
        isOpen={isHyperlinkDialogOpen}
        onClose={() => {
          setIsHyperlinkDialogOpen(false);
          setEditingHyperlink(null);
          setNewHyperlinkPosition(null);
        }}
        courseId={courseId}
        sourceMediaId={activePptMedia?.id || ''}
        sourceMediaTitle={
          activePptMedia?.title['zh-CN'] || activePptMedia?.title['en-US'] || activePptMedia?.id || ''
        }
        media={targetMedia}
        editingHyperlink={editingHyperlink}
        newPosition={newHyperlinkPosition}
      />

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-2">删除超链接？</h3>
            <p className="text-gray-400 mb-6">此操作无法撤销。</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteHyperlink(deleteConfirmId)}
                disabled={isLoading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-lg text-sm transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
