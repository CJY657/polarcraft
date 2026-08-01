/**
 * Friendly labels for activity statistics.
 * 活动统计的友好名称映射（模块与页面类型），管理端与公开热度页共用。
 *
 * 模块划分与 src/App.tsx 中的「六大核心模块」保持一致。
 */

export const EVENT_LABELS: Record<string, string> = {
  $pageview: '页面访问',
  auth_login_success: '登录平台',
  auth_register_success: '完成注册',
  course_opened: '进入课程',
  experiment_opened: '进入实验',
  feedback_submitted: '提交反馈',
  gallery_work_opened: '查看学习成果',
  project_application_submitted: '提交课题申请',
  research_discussion_posted: '课题讨论发言',
  research_evidence_submitted: '提交研究证据',
  research_project_created: '创建虚拟课题',
  research_project_opened: '查看研究课题',
  research_task_completed: '完成课题任务',
  simulation_opened: '使用计算模拟',
  unit_opened: '进入学习单元',
};

export function formatEventName(event: string): string {
  return EVENT_LABELS[event] ?? '其他学习行为';
}

/**
 * 「较上期 +12%」文案。上期为 0 时不编造百分比，直接说明新增量。
 * 返回 null 表示没有可比较的上期数据。
 */
export function formatActivityDelta(
  current: number,
  previous: number | null | undefined
): { text: string; direction: 'up' | 'down' | 'flat' } | null {
  if (previous === null || previous === undefined) {
    return null;
  }

  if (previous === 0) {
    return current === 0
      ? { text: '较上期持平', direction: 'flat' }
      : { text: `较上期新增 ${current.toLocaleString('zh-CN')}`, direction: 'up' };
  }

  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) {
    return { text: '较上期持平', direction: 'flat' };
  }

  return {
    text: `较上期 ${change > 0 ? '+' : ''}${change}%`,
    direction: change > 0 ? 'up' : 'down',
  };
}

interface PageRule {
  pattern: RegExp;
  module: string;
  page: string;
}

/** 按优先级匹配的页面规则（先具体后宽泛） */
const PAGE_RULES: PageRule[] = [
  // Module 1: 实验内容
  { pattern: /^\/experiments\/[^/]+$/, module: '实验内容', page: '课程详情' },
  { pattern: /^\/experiments$/, module: '实验内容', page: '实验单元列表' },
  { pattern: /^\/applications\/[^/]+$/, module: '实验内容', page: '应用案例详情' },
  { pattern: /^\/applications$/, module: '实验内容', page: '应用案例' },
  { pattern: /^\/units(\/|$)/, module: '实验内容', page: '学习单元' },
  { pattern: /^\/courses\/[^/]+$/, module: '实验内容', page: '课程详情' },
  { pattern: /^\/courses$/, module: '实验内容', page: '课程列表' },
  { pattern: /^\/timeline$/, module: '实验内容', page: '历史时间线' },
  { pattern: /^\/chronicles$/, module: '实验内容', page: '编年史' },
  // Module 2: 偏振挑战
  { pattern: /^\/devices\/calcite-case$/, module: '偏振挑战', page: '冰洲石案件' },
  { pattern: /^\/devices$/, module: '偏振挑战', page: '偏振器件' },
  { pattern: /^\/quiz$/, module: '偏振挑战', page: '偏振测验' },
  // Module 3: 理论模拟
  { pattern: /^\/demos\/[^/]+$/, module: '理论模拟', page: '模拟实验' },
  { pattern: /^\/demos$/, module: '理论模拟', page: '模拟列表' },
  // Module 4: 游戏挑战
  { pattern: /^\/games\/escape$/, module: '游戏挑战', page: '解谜逃脱' },
  { pattern: /^\/games\/minecraft$/, module: '游戏挑战', page: '我的世界' },
  { pattern: /^\/games$/, module: '游戏挑战', page: '游戏列表' },
  // Module 5: 成果展示
  { pattern: /^\/gallery\/work\/[^/]+$/, module: '成果展示', page: '作品详情' },
  { pattern: /^\/gallery(\/|$)/, module: '成果展示', page: '成果展示' },
  // Module 6: 虚拟课题
  { pattern: /^\/lab\/projects\/[^/]+$/, module: '虚拟课题', page: '课题详情' },
  { pattern: /^\/lab\/projects$/, module: '虚拟课题', page: '我的课题' },
  { pattern: /^\/lab\/explore$/, module: '虚拟课题', page: '课题广场' },
  { pattern: /^\/lab(\/|$)/, module: '虚拟课题', page: '虚拟课题组' },
  // 其他常用页面
  { pattern: /^\/$/, module: '首页', page: '' },
  { pattern: /^\/pulse$/, module: '学习热度', page: '' },
  { pattern: /^\/profile$/, module: '个人中心', page: '' },
  { pattern: /^\/inbox$/, module: '消息中心', page: '' },
  { pattern: /^\/feedback$/, module: '反馈', page: '' },
  { pattern: /^\/about$/, module: '关于', page: '' },
  { pattern: /^\/login$/, module: '登录', page: '' },
  { pattern: /^\/register$/, module: '注册', page: '' },
  { pattern: /^\/admin(\/|$)/, module: '管理后台', page: '' },
];

/**
 * Translate a raw pathname into a teacher-friendly label such as
 * 「实验内容 · 课程详情」. Unknown paths fall back to the raw path.
 */
export function formatPagePath(path: string): string {
  const normalized = path || '/';
  for (const rule of PAGE_RULES) {
    if (rule.pattern.test(normalized)) {
      return rule.page ? `${rule.module} · ${rule.page}` : rule.module;
    }
  }
  return normalized;
}
