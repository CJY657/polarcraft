/**
 * WebsiteUpdatesDropdown Component
 * 网站更新下拉组件 - 展示最近的、用户可见的网站改动
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { getStorageItem, setStorageItem } from '@/lib/storage';

const LAST_SEEN_STORAGE_KEY = 'polariscope.websiteUpdates.lastSeenId';
const MAX_VISIBLE_UPDATES = 5;

interface WebsiteUpdate {
  id: string;
  /** 中文展示日期 */
  date: string;
  title: string;
  description: string;
  /** 站内路由，可选 */
  href?: string;
}

// ponytail: 更新条目跟随部署手写维护，只保留最新 5 条；等更新频率超过发版频率再考虑后端接口与管理后台。
// 每次发布用户可见的新功能时，都必须在最前面添加通知，并使用新的 id（id 变化才会重新出现小圆点）。
const WEBSITE_UPDATES: WebsiteUpdate[] = [
  {
    id: '2026-09-24-calcite-birefringence-simulation',
    date: '2026年9月24日',
    title: '方解石双折射虚拟仿真上线',
    description:
      '“偏振挑战”新增方解石双折射仿真，可拖动入射光与光轴方向，调节晶体形状、尺寸、姿态、光源波长及偏振态，实时观察 o 光与 e 光的传播路径。支持典型场景切换、光轴与晶体联动，以及折射数据和原理说明。',
    href: '/devices/calcite-sim',
  },
  {
    id: '2026-09-19-html-courseware',
    date: '2026年9月19日',
    title: '新增交互式网页课件',
    description:
      '经典实验 →“光的偏振态及其调制与测量”→“光的基础知识”→“基础知识”下新增“偏振实验（交互课件）”，包含偏振原理讲解、可操作的偏振仿真、随堂练习、进度保存与报告下载。管理员可在实验的媒体页选择“网页课件”类型，上传含 index.html 的 ZIP 包发布同类课件。',
    href: '/experiments',
  },
  {
    id: '2026-09-17-experiment-file-categories',
    date: '2026年9月17日',
    title: '自定义分类移至实验内',
    description:
      '经典实验目录调整为“单元 → 实验 → 自定义分类 → 文件”。可在每个实验的媒体页管理分类，并为文件选择分类；原有自定义名称保留，删除分类不会删除文件。',
    href: '/experiments',
  },
  {
    id: '2026-09-16-experiment-subcategories',
    date: '2026年9月16日',
    title: '经典实验支持子分类',
    description:
      '“基础知识”的实验目录现在可以在单元下再分一层子分类，层级为“单元 → 子分类 → 实验 → 文件”。管理员可在单元编辑页的“实验”标签中新建、重命名、上下排序或删除分类，并在编辑课件时把实验归入某个分类；删除分类只把其中的实验变为未分类，不会删除实验。学生端可同时展开多个分类，进入某个实验时会自动展开它所在的单元与分类，未分类的实验仍直接挂在单元下。',
    href: '/experiments',
  },
  {
    id: '2026-09-15-immersive-timeline-flight',
    date: '2026年9月15日',
    title: '沉浸式时间线飞行重制',
    description:
      '时间线场景改为点阵地形，偏振光以琥珀色与青色双色光流穿过山谷。滚动经过每个历史节点时视角会平滑跟随，卡片自动避让重叠；底部新增“回到起点 / 上一个 / 下一个”与进度条，可随时定位到任意年代。还支持 ↑ ↓ ← → 与 Home / End 键切换节点、空格键打开当前故事；切到其他标签页时会暂停绘制，减少耗电。',
    href: '/chronicles',
  },
  {
    id: '2026-09-15-story-modal-reading',
    date: '2026年9月15日',
    title: '历史故事阅读体验优化',
    description:
      '打开事件故事后，键盘操作会留在弹窗内，按 ESC 关闭即回到原来的事件卡片，鼠标不再误触到背后的场景。点击“上一个 / 下一个”时，背后的飞行视角也会同步移动到对应事件，读完一个故事可以接着往前飞。系统开启“减少动态效果”或设备不支持飞行时，仍可直接浏览历史事件列表。',
    href: '/chronicles',
  },
  {
    id: '2026-09-15-curriculum-category-deduplication',
    date: '2026年9月15日',
    title: '实验与前沿应用分类更清晰',
    description:
      '经典实验和前沿应用分别展示各自分类的内容，不再显示当前模块下没有内容的单元，减少无关空目录。包含两类内容的单元仍会分别展示对应条目，查找学习材料更直接。',
    href: '/experiments',
  },
  {
    id: '2026-09-14-public-project-names',
    date: '2026年9月14日',
    title: '公开课题卡片突出课题名称',
    description:
      '公开课题卡片的信息区现在直接展示课题名称与成员名单，替代原先的组长姓名展示，浏览多个课题时更容易辨认研究内容。议题编号、查看详情和申请加入的入口保持不变。',
    href: '/lab/explore',
  },
  {
    id: '2026-09-14-optics-demo-visual-playback',
    date: '2026年9月14日',
    title: '光学演示画面与播放体验升级',
    description:
      '进入“理论模拟”，电磁波、偏振态、布儒斯特角、冰洲石双折射和旋光演示的光路、方向箭头与标签更清楚了。暂停时会保留当前画面，调整参数仍会更新；切回标签页时动画会从原来的位置继续，方便逐步观察光的传播与偏振变化。',
    href: '/demos',
  },
  {
    id: '2026-09-13-demo-controls-accessibility',
    date: '2026年9月13日',
    title: '光学演示控件体验优化',
    description:
      '光学演示中的滑块、预设按钮和开关现在支持更清晰的状态反馈、键盘操作与减少动态效果；暂停演示、切换标签页或启用系统减弱动态效果后，画面会自动降低不必要的绘制，同时保持控件变化及时显示。',
    href: '/demos',
  },
  {
    id: '2026-09-08-topic-references',
    date: '2026年9月8日',
    title: '议题引用与关联上线',
    description:
      '在议题简介、讨论和个人简介中输入 @ 即可搜索并引用你有权限查看的议题，选中后议题名称会以高亮标签显示在输入框中，保存时记录为稳定的 #议题编号。已引用的议题会显示为可点击的名称标签；进入某个议题时，还能看到哪些议题和研究者提到了它，便于追踪相关工作。私密议题仍会遵循原有访问权限，不会向无权查看的用户暴露内容。',
    href: '/lab/explore',
  },
  {
    id: '2026-09-02-project-issues',
    date: '2026年9月2日',
    title: '课题改版为议题',
    description:
      '每个课题现在都是一条“议题”：详情页顶部会显示全站唯一且永不复用的议题编号（例如 #12）与议题状态（草稿 / 开放中 / 已结束），原来的挑战卡改为连续的议题正文，桌面端在右侧、移动端在正文前展示难度、招募、角色分工等协作信息。你也可以在“实验室 → 公开课题”的搜索框里直接输入 #12 精确跳转到对应议题。申请加入、编辑与权限规则保持不变。',
    href: '/lab/explore',
  },
  {
    id: '2026-08-30-public-project-cards',
    date: '2026年8月30日',
    title: '公开课题浏览更清爽',
    description:
      '进入“实验室 → 公开课题”时，课题卡片现在会集中展示课题阶段、挑战难度、组长和成员，减少重复信息，方便你在浏览多个课题时快速比较。查看详情和申请加入的入口保持不变；更多任务分工、招募与评审信息可进入课题详情页查看。',
    href: '/lab/explore',
  },
  {
    id: '2026-08-28-public-feedback-wall',
    date: '2026年8月28日',
    title: '公开反馈墙上线',
    description:
      '登录后，你现在可以在提交反馈时选择是否公开，并在反馈表单下方查看大家公开的实验问题与产品建议。公开内容会展示主题、正文和用户名，方便彼此参考与交流；联系邮箱、提交环境和附图不会公开。取消勾选的反馈及未登录提交的反馈仍只对管理员可见。',
    href: '/feedback',
  },
  {
    id: '2026-08-28-feedback-images',
    date: '2026年8月28日',
    title: '反馈支持附图',
    description:
      '提交网站问题或改进建议时，现在可以附上一张 JPG、PNG 或 WebP 图片，并在提交前预览、更换或移除，图片最大为 5 MB。管理员可以随反馈查看原图，更快定位页面显示或实验内容问题；请勿上传包含个人隐私等敏感信息的图片。',
    href: '/feedback',
  },
  {
    id: '2026-08-23-immersive-timeline',
    date: '2026年8月23日',
    title: '沉浸式光学历史之旅',
    description:
      '现在可以向下滚动，沿着昼夜变化的场景穿梭偏振光历史中的重要节点；点击事件卡片即可阅读完整故事，并继续查看上一项或下一项。你也可以随时进入完整时间线；如果启用了“减少动态效果”，或设备无法显示飞行场景，仍可直接浏览全部内容。',
    href: '/chronicles',
  },
  {
    id: '2026-08-21-curriculum-navigation',
    date: '2026年8月21日',
    title: '实验与应用目录焕新',
    description:
      '实验内容和前沿应用现在按“单元 → 实验/应用 → 文件”清晰展开，课件、视频、图片和 PDF 可以直接选择，不再需要逐层打开资源文件夹。桌面端目录固定在左侧，手机端可快速打开目录，并在选择内容后自动收起。',
    href: '/experiments',
  },
];

interface WebsiteUpdatesDropdownProps {
  className?: string;
}

export function WebsiteUpdatesDropdown({ className }: WebsiteUpdatesDropdownProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [lastSeenId, setLastSeenId] = useState(() => getStorageItem(LAST_SEEN_STORAGE_KEY));
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updates = WEBSITE_UPDATES.slice(0, MAX_VISIBLE_UPDATES);
  const newestId = updates[0]?.id;
  const hasUnseen = Boolean(newestId) && lastSeenId !== newestId;

  // 打开时记录已看过的最新条目 / Mark the newest entry as seen when opening
  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    if (newestId && newestId !== lastSeenId) {
      setStorageItem(LAST_SEEN_STORAGE_KEY, newestId);
      setLastSeenId(newestId);
    }
  };

  // 点击外部关闭 / Esc 关闭并把焦点还给按钮
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={cn(
          'glass-button relative rounded-xl p-2',
          'text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-tertiary)]'
        )}
        title="网站更新"
        aria-label={hasUnseen ? '网站更新（有新内容）' : '网站更新'}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Megaphone className="w-4 h-4" />
        {hasUnseen && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-500"
          />
        )}
      </button>

      {isOpen && (
        <div
          role="region"
          aria-label="网站更新"
          className={cn(
            'fixed left-3 right-3 top-20 z-50 rounded-[1.5rem] py-2',
            'sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80',
            'glass-panel-strong shadow-[0_24px_60px_-32px_rgba(2,10,22,0.56)]'
          )}
        >
          <div className="px-4 py-2 border-b border-[var(--paper-border)]">
            <h3 className="text-sm font-medium">网站更新</h3>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {updates.map((update) => {
              const body = (
                <>
                  <p className="text-xs text-[var(--paper-muted)]">{update.date}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm font-medium">
                    <span className="flex-1">{update.title}</span>
                    {update.href && (
                      <ChevronRight className="w-4 h-4 flex-shrink-0 text-[var(--paper-muted)]" />
                    )}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--paper-muted)]">
                    {update.description}
                  </p>
                </>
              );

              const rowClass =
                'w-full px-4 py-3 text-left border-b border-[var(--paper-border)] last:border-b-0';

              return update.href ? (
                <button
                  key={update.id}
                  type="button"
                  onClick={() => {
                    navigate(update.href as string);
                    setIsOpen(false);
                  }}
                  className={cn(
                    rowClass,
                    'transition-colors hover:bg-[var(--glass-panel-soft)]'
                  )}
                >
                  {body}
                </button>
              ) : (
                <div key={update.id} className={rowClass}>
                  {body}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
