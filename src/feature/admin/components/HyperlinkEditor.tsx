/**
 * Hyperlink Editor Component
 * 超链接编辑器组件
 *
 * Allows editing hyperlinks on PDF pages with click-to-create and drag-to-adjust
 * 允许在 PDF 页面上编辑超链接，支持点击创建和拖拽调整
 */

import { useState, useRef, useEffect, useCallback } from 'react';
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
import {
  MainSlide,
  CourseMedia,
  CourseHyperlink,
  UpsertMainSlideInput,
} from '@/lib/course.service';
import { HyperlinkFormDialog } from './HyperlinkFormDialog';
import { FileUpload } from '@/components/ui/FileUpload';

import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface HyperlinkEditorProps {
  courseId: string;
  mainSlide?: MainSlide | null;
  media: CourseMedia[];
  hyperlinks: CourseHyperlink[];
}

export function HyperlinkEditor({
  courseId,
  mainSlide,
  media,
  hyperlinks,
}: HyperlinkEditorProps) {
  const { upsertMainSlide, deleteHyperlink, isLoading, error, clearError } = useCourseAdminStore();

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
  const [newHyperlinkPosition, setNewHyperlinkPosition] = useState<{
    x: number;
    y: number;
    page: number;
  } | null>(null);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // PDF URL state
  const [pdfUrl, setPdfUrl] = useState(mainSlide?.url || '');
  const [showPdfInput, setShowPdfInput] = useState(!mainSlide?.url);

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

  // Handle PDF URL submit
  const handlePdfUrlSubmit = async () => {
    if (!pdfUrl.trim()) return;

    try {
      const input: UpsertMainSlideInput = { url: pdfUrl.trim() };
      await upsertMainSlide(courseId, input);
      setShowPdfInput(false);
    } catch (err) {
      console.error('Failed to set PDF URL:', err);
    }
  };

  // Handle click on PDF to create hyperlink
  const handlePdfClick = (e: React.MouseEvent) => {
    if (!pdfWrapperRef.current) return;

    const rect = pdfWrapperRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setNewHyperlinkPosition({ x, y, page: currentPage });
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
  const currentPageHyperlinks = hyperlinks.filter((h) => h.page === currentPage);

  // Get media title for hyperlink
  const getMediaTitle = (mediaId: string) => {
    const m = media.find((m) => m.id === mediaId);
    return m?.title['zh-CN'] || mediaId;
  };

  // No PDF URL state
  if (showPdfInput) {
    return (
      <div className="space-y-4">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            设置主课件 PDF
          </h3>
          <p className="text-gray-400 mb-4">
            上传 PDF 文件或输入链接作为主课件。
          </p>

          <FileUpload
            category="pdf"
            value={pdfUrl}
            onChange={(url) => setPdfUrl(url)}
            preview={false}
          />

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={handlePdfUrlSubmit}
              disabled={isLoading || !pdfUrl.trim()}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 text-white rounded-lg text-sm transition-colors"
            >
              {isLoading ? '保存中...' : '保存'}
            </button>
          </div>
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400">
            点击 PDF 创建超链接。每个超链接指向一个媒体资源。
          </p>
          <p className="text-gray-500 text-sm mt-1">
            共 {hyperlinks.length} 个超链接，分布于 {numPages} 页
          </p>
        </div>
        <button
          onClick={() => setShowPdfInput(true)}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          更换 PDF
        </button>
      </div>

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
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={handlePdfLoadError}
            loading={null}
          >
            <div className="flex justify-center p-4">
              <div
                ref={pdfWrapperRef}
                className="relative cursor-crosshair"
                onClick={handlePdfClick}
              >
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  onLoadSuccess={onPageLoadSuccess}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />

                {/* Hyperlink overlays */}
                {currentPageHyperlinks.map((hyperlink) => (
                  <div
                    key={hyperlink.id}
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
                        className="p-1 bg-slate-700 hover:bg-slate-600 text-white rounded"
                      >
                        <Link2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(hyperlink.id);
                        }}
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
      {hyperlinks.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h4 className="text-sm font-medium text-gray-300 mb-3">所有超链接</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {hyperlinks.map((h) => (
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
        media={media}
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
