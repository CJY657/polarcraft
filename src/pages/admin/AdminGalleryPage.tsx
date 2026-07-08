import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import { PersistentHeader } from '@/components/shared';
import { useTheme } from '@/contexts/ThemeContext';
import {
  getKnowledgeTagLabel,
  type Course,
  type KnowledgeTag,
} from '@/lib/course.service';
import { useCourseAdminStore } from '@/stores/courseAdminStore';
import { cn } from '@/utils/classNames';
import {
  GALLERY_RESULTS_UNIT_ID,
  GALLERY_RESULT_TAGS,
  isGalleryResultCourse,
} from '@/feature/gallery/courseResults';

const DEFAULT_RESULT_COLOR = '#264653';

function sortResults(left: Course, right: Course) {
  return (
    (left.sortOrder ?? 0) - (right.sortOrder ?? 0) ||
    new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );
}

function getResultThumbnail(course: Course) {
  return course.coverImage || course.media.find((media) => media.type === 'image')?.url || '';
}

export default function AdminGalleryPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const {
    courses,
    isLoading,
    error,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    clearError,
  } = useCourseAdminStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [updatingCourseId, setUpdatingCourseId] = useState<string | null>(null);
  const [newResult, setNewResult] = useState({
    title_zh: '',
    title_en: '',
    description_zh: '',
    description_en: '',
    color: DEFAULT_RESULT_COLOR,
    knowledgeTag: 'student_project' as KnowledgeTag,
  });

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const resultCourses = useMemo(
    () => courses.filter(isGalleryResultCourse).sort(sortResults),
    [courses],
  );

  const handleCreate = async () => {
    if (!newResult.title_zh.trim()) {
      return;
    }

    setUpdatingCourseId('new');
    try {
      const created = await createCourse({
        unitId: GALLERY_RESULTS_UNIT_ID,
        title_zh: newResult.title_zh.trim(),
        title_en: newResult.title_en.trim() || undefined,
        description_zh: newResult.description_zh.trim() || undefined,
        description_en: newResult.description_en.trim() || undefined,
        color: newResult.color,
        knowledgeTag: newResult.knowledgeTag,
      });

      await updateCourse(created.id, { sortOrder: resultCourses.length });
      setNewResult({
        title_zh: '',
        title_en: '',
        description_zh: '',
        description_en: '',
        color: DEFAULT_RESULT_COLOR,
        knowledgeTag: 'student_project',
      });
      setShowCreateForm(false);
      navigate(`/admin/gallery/${created.id}?tab=media`);
    } catch (error) {
      console.error('Failed to create gallery result:', error);
    } finally {
      setUpdatingCourseId(null);
    }
  };

  const handleDelete = async (courseId: string) => {
    setUpdatingCourseId(courseId);
    try {
      await deleteCourse(courseId);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete gallery result:', error);
    } finally {
      setUpdatingCourseId(null);
    }
  };

  const handleMove = async (courseId: string, direction: 'up' | 'down') => {
    const currentIndex = resultCourses.findIndex((course) => course.id === courseId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= resultCourses.length) {
      return;
    }

    setUpdatingCourseId(courseId);
    try {
      await Promise.all([
        updateCourse(resultCourses[currentIndex].id, { sortOrder: targetIndex }),
        updateCourse(resultCourses[targetIndex].id, { sortOrder: currentIndex }),
      ]);
      await fetchCourses();
    } catch (error) {
      console.error('Failed to reorder gallery results:', error);
    } finally {
      setUpdatingCourseId(null);
    }
  };

  return (
    <div className={cn('min-h-screen', theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50')}>
      <PersistentHeader
        moduleKey="gallery"
        moduleName="成果展示管理"
        variant="glass"
        className={cn(
          'sticky top-0 z-40',
          theme === 'dark'
            ? 'bg-slate-900/80 border-b border-slate-700'
            : 'bg-white/80 border-b border-gray-200',
        )}
        rightContent={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/admin/units')}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                theme === 'dark'
                  ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                  : 'bg-white text-slate-700 hover:bg-slate-100',
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              单元管理
            </button>
            <button
              onClick={() => setShowCreateForm((value) => !value)}
              className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-600"
            >
              <Plus className="w-4 h-4" />
              新建成果
            </button>
          </div>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className={cn('text-3xl font-bold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            成果展示管理
          </h1>
          <p className={cn('mt-1', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
            管理学生 PPT、海报和项目成果；上传文件会进入 gallery-results 专用目录。
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <span className="text-red-400">{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-300">
              ×
            </button>
          </div>
        )}

        {showCreateForm && (
          <section
            className={cn(
              'mb-6 rounded-xl border p-6',
              theme === 'dark'
                ? 'border-slate-700 bg-slate-800'
                : 'border-gray-200 bg-white shadow-sm',
            )}
          >
            <h2 className={cn('mb-4 text-lg font-semibold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
              新建成果
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                type="text"
                value={newResult.title_zh}
                onChange={(event) => setNewResult({ ...newResult, title_zh: event.target.value })}
                placeholder="标题（中文）*"
                className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <input
                type="text"
                value={newResult.title_en}
                onChange={(event) => setNewResult({ ...newResult, title_en: event.target.value })}
                placeholder="Title (English)"
                className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <textarea
                value={newResult.description_zh}
                onChange={(event) =>
                  setNewResult({ ...newResult, description_zh: event.target.value })
                }
                placeholder="描述（中文）"
                rows={2}
                className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <textarea
                value={newResult.description_en}
                onChange={(event) =>
                  setNewResult({ ...newResult, description_en: event.target.value })
                }
                placeholder="Description (English)"
                rows={2}
                className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <label className={cn('block text-sm font-medium', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
                成果分类
                <select
                  value={newResult.knowledgeTag}
                  onChange={(event) =>
                    setNewResult({ ...newResult, knowledgeTag: event.target.value as KnowledgeTag })
                  }
                  className="mt-2 block rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {GALLERY_RESULT_TAGS.map((tag) => (
                    <option key={tag} value={tag}>
                      {getKnowledgeTagLabel(tag, true)}
                    </option>
                  ))}
                </select>
              </label>
              <label className={cn('block text-sm font-medium', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
                主题色
                <input
                  type="color"
                  value={newResult.color}
                  onChange={(event) => setNewResult({ ...newResult, color: event.target.value })}
                  className="mt-2 h-10 w-14 cursor-pointer rounded border border-slate-600"
                />
              </label>
              <button
                onClick={handleCreate}
                disabled={!newResult.title_zh.trim() || updatingCourseId === 'new'}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
              >
                {updatingCourseId === 'new' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                创建并上传文件
              </button>
            </div>
          </section>
        )}

        {isLoading && resultCourses.length === 0 ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        ) : resultCourses.length === 0 ? (
          <div
            className={cn(
              'rounded-xl border p-12 text-center',
              theme === 'dark'
                ? 'border-slate-700 bg-slate-800 text-slate-400'
                : 'border-gray-200 bg-white text-gray-600',
            )}
          >
            <ImageIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
            暂无成果，点击“新建成果”开始上传。
          </div>
        ) : (
          <div className="space-y-3">
            {resultCourses.map((course, index) => {
              const thumbnail = getResultThumbnail(course);
              const isUpdating = updatingCourseId === course.id;

              return (
                <div
                  key={course.id}
                  className={cn(
                    'flex items-center gap-4 rounded-xl border p-4 transition-colors',
                    theme === 'dark'
                      ? 'border-slate-700 bg-slate-800 hover:border-slate-500'
                      : 'border-gray-200 bg-white shadow-sm hover:shadow-md',
                  )}
                >
                  <div className="flex w-8 shrink-0 justify-center text-sm font-bold text-slate-400">
                    {index + 1}
                  </div>
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                    style={{ backgroundColor: thumbnail ? undefined : `${course.color}24` }}
                  >
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={course.title['zh-CN'] || '成果封面'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FileText className="h-6 w-6" style={{ color: course.color }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={cn('truncate font-semibold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                      {course.title['zh-CN'] || '未命名成果'}
                    </h3>
                    <p className={cn('truncate text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                      {course.description['zh-CN'] || '暂无描述'}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-0.5 text-cyan-200">
                        {getKnowledgeTagLabel(course.knowledgeTag, true)}
                      </span>
                      <span className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}>
                        {course.media.length} 个文件
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMove(course.id, 'up')}
                      disabled={index === 0 || Boolean(updatingCourseId)}
                      className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMove(course.id, 'down')}
                      disabled={index === resultCourses.length - 1 || Boolean(updatingCourseId)}
                      className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/admin/gallery/${course.id}`)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-600"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      编辑
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(course.id)}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/30 disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      删除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6">
            <h2 className="mb-2 text-xl font-semibold text-white">删除成果？</h2>
            <p className="mb-6 text-sm leading-6 text-slate-400">
              这会删除成果记录、媒体记录，并回收不再被其他内容引用的上传文件。此操作无法撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-600"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={Boolean(updatingCourseId)}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white transition-colors hover:bg-red-600 disabled:bg-red-500/50"
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
