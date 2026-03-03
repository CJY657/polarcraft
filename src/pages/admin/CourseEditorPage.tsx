/**
 * Course Editor Page
 * 课程编辑页面
 *
 * Tabbed interface for editing course details, media, and hyperlinks
 * 带标签页的界面，用于编辑课程详情、媒体和超链接
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseAdminStore } from '@/stores/courseAdminStore';
import { CourseFormDialog } from '@/feature/admin/components/CourseFormDialog';
import { MediaManager } from '@/feature/admin/components/MediaManager';
import { HyperlinkEditor } from '@/feature/admin/components/HyperlinkEditor';
import { ArrowLeft, Settings, Image, Link2, FileText } from 'lucide-react';

type TabId = 'settings' | 'media' | 'hyperlinks';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'settings', label: '设置', icon: <Settings className="w-4 h-4" /> },
  { id: 'media', label: '媒体', icon: <Image className="w-4 h-4" /> },
  { id: 'hyperlinks', label: '超链接', icon: <Link2 className="w-4 h-4" /> },
];

export default function CourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { currentCourse, isLoading, error, fetchCourse, clearError } = useCourseAdminStore();

  const [activeTab, setActiveTab] = useState<TabId>('settings');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId);
    }
  }, [courseId, fetchCourse]);

  if (isLoading && !currentCourse) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-cyan-400 text-sm">加载课程中...</span>
        </div>
      </div>
    );
  }

  if (!currentCourse && !isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">课程未找到</h2>
          <p className="text-gray-400 mb-4">您查找的课程不存在。</p>
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
        {activeTab === 'settings' && (
          <SettingsTab course={currentCourse} />
        )}
        {activeTab === 'media' && currentCourse && (
          <MediaManager courseId={currentCourse.id} />
        )}
        {activeTab === 'hyperlinks' && currentCourse && (
          <HyperlinkEditor
            courseId={currentCourse.id}
            mainSlide={currentCourse.mainSlide}
            media={currentCourse.media}
            hyperlinks={currentCourse.hyperlinks}
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
function SettingsTab({ course }: { course: any }) {
  if (!course) return null;

  return (
    <div className="space-y-6">
      {/* Main Slide Section */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            主课件 (PDF)
          </h3>
        </div>
        {course.mainSlide ? (
          <div className="space-y-2">
            <p className="text-gray-300">
              <span className="text-gray-400">链接:</span>{' '}
              <a
                href={course.mainSlide.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline break-all"
              >
                {course.mainSlide.url}
              </a>
            </p>
            {course.mainSlide.title['zh-CN'] && (
              <p className="text-gray-300">
                <span className="text-gray-400">标题 (中文):</span> {course.mainSlide.title['zh-CN']}
              </p>
            )}
            {course.mainSlide.title['en-US'] && (
              <p className="text-gray-300">
                <span className="text-gray-400">标题 (英文):</span> {course.mainSlide.title['en-US']}
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-400">尚未配置主课件。请前往超链接标签页添加。</p>
        )}
      </div>

      {/* Course Info */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">课程信息</h3>
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
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-slate-700/50 rounded-lg">
            <p className="text-3xl font-bold text-cyan-400">{course.media?.length || 0}</p>
            <p className="text-gray-400 text-sm">媒体资源</p>
          </div>
          <div className="text-center p-4 bg-slate-700/50 rounded-lg">
            <p className="text-3xl font-bold text-cyan-400">{course.hyperlinks?.length || 0}</p>
            <p className="text-gray-400 text-sm">超链接</p>
          </div>
          <div className="text-center p-4 bg-slate-700/50 rounded-lg">
            <p className="text-3xl font-bold text-cyan-400">{course.mainSlide ? 1 : 0}</p>
            <p className="text-gray-400 text-sm">主课件</p>
          </div>
        </div>
      </div>
    </div>
  );
}
