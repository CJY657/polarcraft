/**
 * Course Editor Page
 * 课程编辑页面
 *
 * Tabbed interface for editing course details, media, and hyperlinks
 * 带标签页的界面，用于编辑课程详情、媒体和超链接
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCourseAdminStore } from '@/stores/courseAdminStore';
import { CourseFormDialog } from '@/feature/admin/components/CourseFormDialog';
import { MediaManager } from '@/feature/admin/components/MediaManager';
import { HyperlinkEditor } from '@/feature/admin/components/HyperlinkEditor';
import { FileUpload } from '@/components/ui/FileUpload';
import { cn } from '@/utils/classNames';
import type { Course, CourseMedia } from '@/lib/course.service';
import { ArrowLeft, Settings, Image, Link2, ImagePlus, Loader2, Trash2 } from 'lucide-react';

type TabId = 'settings' | 'media' | 'hyperlinks';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'settings', label: '设置', icon: <Settings className="w-4 h-4" /> },
  { id: 'media', label: '媒体', icon: <Image className="w-4 h-4" /> },
  { id: 'hyperlinks', label: '超链接', icon: <Link2 className="w-4 h-4" /> },
];

export default function CourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentCourse, isLoading, error, fetchCourse, clearError } = useCourseAdminStore();

  const [activeTab, setActiveTab] = useState<TabId>('settings');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId);
    }
  }, [courseId, fetchCourse]);

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab === 'settings' || requestedTab === 'media' || requestedTab === 'hyperlinks') {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);

  if (isLoading && !currentCourse) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-cyan-400 text-sm">加载实验中...</span>
        </div>
      </div>
    );
  }

  if (!currentCourse && !isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">实验未找到</h2>
          <p className="text-gray-400 mb-4">您查找的实验不存在。</p>
          <button
            onClick={() => navigate('/admin/units')}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm transition-colors"
          >
            返回单元列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(currentCourse?.unitId ? `/admin/units/${currentCourse.unitId}` : '/admin/units')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-white">
                  {currentCourse?.title['zh-CN'] || '加载中...'}
                </h1>
                <p className="text-sm text-gray-400">{currentCourse?.unitId}</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditDialogOpen(true)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
            >
              编辑详情
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-cyan-400 border-cyan-400'
                    : 'text-gray-400 border-transparent hover:text-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between">
            <span className="text-red-400">{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-300">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'settings' && currentCourse && (
          <SettingsTab course={currentCourse} />
        )}
        {activeTab === 'media' && currentCourse && (
          <MediaManager
            courseId={currentCourse.id}
            unitId={currentCourse.unitId}
          />
        )}
        {activeTab === 'hyperlinks' && currentCourse && (
          <HyperlinkEditor
            courseId={currentCourse.id}
            media={currentCourse.media ?? []}
            hyperlinks={currentCourse.hyperlinks ?? []}
          />
        )}
      </div>

      {/* Edit Dialog */}
      {currentCourse && (
        <CourseFormDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          mode="edit"
          course={currentCourse}
        />
      )}
    </div>
  );
}

// Settings Tab Component
function getFirstImageMedia(media: CourseMedia[]) {
  return [...media]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .find((item) => item.type === 'image');
}

function SettingsTab({ course }: { course: Course }) {
  const { updateCourse } = useCourseAdminStore();
  const [draftCoverImage, setDraftCoverImage] = useState(course.coverImage || '');
  const [isSavingCover, setIsSavingCover] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  const firstImageMedia = useMemo(() => getFirstImageMedia(course.media || []), [course.media]);
  const previewImage = draftCoverImage || firstImageMedia?.url || '';
  const previewSource = draftCoverImage
    ? '独立封面图'
    : firstImageMedia
      ? '首张图片资源'
      : '暂无图片资源';

  useEffect(() => {
    setDraftCoverImage(course.coverImage || '');
    setCoverError(null);
  }, [course.id, course.coverImage]);

  const persistCoverImage = async (nextUrl: string) => {
    const normalizedUrl = nextUrl.trim();
    const previousUrl = course.coverImage || '';

    setDraftCoverImage(normalizedUrl);
    setCoverError(null);
    setIsSavingCover(true);

    try {
      await updateCourse(course.id, {
        coverImage: normalizedUrl || undefined,
      });
    } catch (error) {
      setDraftCoverImage(previousUrl);
      setCoverError(error instanceof Error ? error.message : '保存实验封面失败');
    } finally {
      setIsSavingCover(false);
    }
  };

  if (!course) return null;

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="grid gap-px bg-slate-700/80 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="bg-slate-900/80 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                  <ImagePlus className="h-3.5 w-3.5" />
                  单元实验缩略图
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white">实验封面图</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                  这里上传的图片会优先显示在每个单元里的实验缩略图上；如果没有单独封面，系统会自动使用当前实验的第一张图片资源。
                </p>
              </div>
              <div
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
                  draftCoverImage
                    ? 'bg-emerald-500/10 text-emerald-200'
                    : previewImage
                      ? 'bg-amber-500/10 text-amber-200'
                      : 'bg-slate-800 text-slate-400',
                )}
              >
                {isSavingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {previewSource}
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-slate-800 bg-slate-950">
              <div className="relative aspect-[16/10]">
                {previewImage ? (
                  <>
                    <img
                      src={previewImage}
                      alt={course.title['zh-CN'] || '实验封面图'}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300/80">
                          Thumbnail Preview
                        </p>
                        <p className="mt-1 text-sm text-white">
                          {course.title['zh-CN'] || '未命名实验'}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-950/70 px-3 py-1 text-xs font-medium text-slate-200 ring-1 ring-white/10">
                        {previewSource}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_42%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,1))] px-6 text-center">
                    <ImagePlus className="h-12 w-12 text-slate-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-200">还没有可用缩略图</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        上传独立封面，或先在“媒体”标签里添加一张图片资源作为默认缩略图。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6">
            <div className="rounded-[1.25rem] border border-slate-700 bg-slate-900/70 p-4">
              <p className="text-sm font-semibold text-white">上传独立封面</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                上传完成后会自动保存到当前实验，并存储到服务器的 disk 目录。
              </p>

              <FileUpload
                category="image"
                unitId={course.unitId}
                value={draftCoverImage}
                onChange={(url) => {
                  void persistCoverImage(url);
                }}
                disabled={isSavingCover}
                preview
                showUrlInput={false}
                className="mt-4"
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    void persistCoverImage('');
                  }}
                  disabled={!draftCoverImage || isSavingCover}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    !draftCoverImage || isSavingCover
                      ? 'cursor-not-allowed bg-slate-700 text-slate-500'
                      : 'bg-slate-700 text-slate-100 hover:bg-slate-600',
                  )}
                >
                  {isSavingCover && draftCoverImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  清除独立封面
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-950/70 p-4 text-sm text-slate-300">
                <p className="font-medium text-white">当前缩略图规则</p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-400">
                  <li>1. 有独立封面图时，优先显示独立封面。</li>
                  <li>2. 没有独立封面时，自动回退到第一张图片资源。</li>
                  <li>3. 两者都没有时，显示默认占位图标。</li>
                </ul>
              </div>

              {coverError ? (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {coverError}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Course Info */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">实验信息</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">单元 ID:</span>
            <p className="text-white">{course.unitId}</p>
          </div>
          <div>
            <span className="text-gray-400">主题色:</span>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: course.color }}
              />
              <span className="text-white">{course.color}</span>
            </div>
          </div>
          <div>
            <span className="text-gray-400">标题 (中文):</span>
            <p className="text-white">{course.title['zh-CN']}</p>
          </div>
          <div>
            <span className="text-gray-400">标题 (英文):</span>
            <p className="text-white">{course.title['en-US'] || '-'}</p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-400">描述 (中文):</span>
            <p className="text-white">{course.description['zh-CN'] || '-'}</p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-400">描述 (英文):</span>
            <p className="text-white">{course.description['en-US'] || '-'}</p>
          </div>
          {course.coverImage && (
            <div className="col-span-2">
              <span className="text-gray-400">封面图片:</span>
              <p className="text-white break-all">{course.coverImage}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">统计信息</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-slate-700/50 rounded-lg">
            <p className="text-3xl font-bold text-cyan-400">{course.media?.length || 0}</p>
            <p className="text-gray-400 text-sm">媒体资源</p>
          </div>
          <div className="text-center p-4 bg-slate-700/50 rounded-lg">
            <p className="text-3xl font-bold text-cyan-400">{course.hyperlinks?.length || 0}</p>
            <p className="text-gray-400 text-sm">超链接</p>
          </div>
        </div>
      </div>
    </div>
  );
}
