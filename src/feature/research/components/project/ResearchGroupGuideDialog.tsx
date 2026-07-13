/**
 * Research Group Guide Dialog
 * 研究小组指南 — prose sections by user level, leader duties, group operations
 * Visual accents only: DESIGN.md Clay palette (not card grid)
 */

import type { LucideIcon } from "lucide-react";
import {
  BookOpenText,
  Crown,
  Eye,
  Flag,
  LogIn,
  Settings,
  Users,
  X,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/utils/classNames";

interface ResearchGroupGuideDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuideSection {
  id: string;
  icon: LucideIcon;
  accentClass: string;
  iconTileClass: string;
  eyebrow: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "overview",
    icon: BookOpenText,
    accentClass: "text-clay-pink",
    iconTileClass: "bg-clay-pink text-white",
    eyebrow: "Overview",
    title: "虚拟课题组是什么",
    paragraphs: [
      "虚拟课题组是 PolariScope 内专为偏振光学领域打造的协作式研究空间。在这里，你可以浏览他人的研究方向并申请加入，或亲自发起课题、招募志同道合的伙伴。课题主页将研究主题、角色分工、讨论进展、证据沉淀与状态流转融为一体，打造贴近真实科研场景的沉浸式学习体验。",
      "本指南将详细阐述不同用户身份的权限、组长的核心职责，以及课题组成立后的标准运作流程。",
    ],
  },
  {
    id: "visitor",
    icon: Eye,
    accentClass: "text-clay-lavender",
    iconTileClass: "bg-clay-lavender text-clay-ink",
    eyebrow: "User level · Visitor",
    title: "访客（未登录）",
    paragraphs: [
      "作为访客，你可以自由访问「公开课题」大厅，浏览课题概览、挑战角色、团队规模及招募状态。公开课题的详情页同样开放只读权限，帮助你在加入前充分评估研究方向的匹配度。",
      "访客目前无法申请加入或创建课题，亦无法参与组内讨论或唤起课题 AI 顾问。当你想深度参与时，系统将在相应入口引导你完成登录。",
    ],
    bullets: [
      "可自由浏览公开课题列表及详情",
      "支持按关键词检索、筛选招募中的课题，并自定义排序",
      "不可提交加入申请、创建新课题或使用组内协作功能",
    ],
  },
  {
    id: "signed-in",
    icon: LogIn,
    accentClass: "text-clay-ochre",
    iconTileClass: "bg-clay-ochre text-clay-ink",
    eyebrow: "User level · Signed-in",
    title: "已登录用户（尚未加入课题）",
    paragraphs: [
      "登录后，你将解锁完整的发现与申请权限。对于招募中且免审核的课题，可一键加入；若需审核，提交申请后等待组长审批即可。你也可以在此发起「新建课题」，跟随向导设定研究方向、挑战角色与协作模式。",
      "在正式成为成员前，课题详情页仍保持只读状态，你可以查看研究计划与团队构成。讨论区、证据管理及 AI 顾问等深度协作功能将在加入后为你开放。",
    ],
    bullets: [
      "可申请加入招募中的课题，或自主发起新课题",
      "可在「我的课题」中统一管理已加入或创建的项目",
      "尚未加入时，无法参与讨论、管理证据或调整课题设置",
    ],
  },
  {
    id: "member",
    icon: Users,
    accentClass: "text-clay-mint",
    iconTileClass: "bg-clay-mint text-clay-ink",
    eyebrow: "User level · Member",
    title: "课题成员",
    paragraphs: [
      "成为成员后，你将正式开启组内协作。你不仅能查阅完整的研究档案（包含主题简述、研究假设、基础与拓展计划），还能在讨论区与团队碰撞思想，并在证据区上传、梳理实验材料。课题 AI 顾问也将随时待命，辅助你梳理研究思路与实验表述，但最终的学术结论仍需与团队共同审定。",
      "成员可随时选择退出课题。出于课题安全性考虑，成员默认无法修改课题的公开设置、招募规则或执行删除操作。你的「挑战角色」标签代表了你在团队中的专长与分工，请务必与组长约定的方向保持对齐。",
    ],
    bullets: [
      "可深度参与讨论、沉淀研究证据、召唤课题 AI 顾问",
      "可基于所分配的挑战角色，独立推进实验与数据记录",
      "不可修改核心协作设置、审批人员申请或删除课题",
    ],
  },
  {
    id: "leader",
    icon: Crown,
    accentClass: "text-clay-pink",
    iconTileClass: "bg-clay-pink text-white",
    eyebrow: "Team leader",
    title: "组长职责与权限",
    paragraphs: [
      "课题的创建者将自动担任组长。组长不仅是研究方向的掌舵人，更是团队协作的维系者：你需要清晰界定研究问题、合理规划角色与招募标准，并持续推动课题从初步组队走向最终产出。",
      "组长拥有课题的最高管理权限：可编辑课题信息与封面，灵活配置协作规则（公开/私有、审核机制、人数上限等），审批加入申请，清退不活跃成员，并把控课题的生命周期状态。在极端情况下，也可执行课题删除操作（平台管理员亦具备同等管理权限）。",
    ],
    bullets: [
      "统筹课题描述、核心问题、角色设定与封面展示",
      "制定招募规则，审批入组申请，统筹团队分工",
      "把控课题阶段（如：招募中 → 组队中 → 进行中 → 待评审 → 展示等）",
      "引领讨论与证据积累的方向，确保课题持续推进，避免长期停滞",
    ],
  },
  {
    id: "operations",
    icon: Settings,
    accentClass: "text-clay-teal",
    iconTileClass: "bg-clay-teal text-white",
    eyebrow: "Project group operations",
    title: "课题组如何运作",
    paragraphs: [
      "一个典型的课题生命周期始于公开招募或自主创建。「组队阶段」的核心在于明确角色缺口与招募目标；进入「进行中」后，团队在讨论区高频同步问题、假设与实验进展，并在证据区规范沉淀图文材料，确保研究过程可追溯、可复盘。",
      "课题状态会随着研究深入而演进：涵盖草稿、招募中、组队中、进行中、待评审、已展示、接力开放及已归档等。界面徽章将实时映射当前阶段。组长应在团队结构与研究进度达标时，及时推进课题状态。",
      "若当前公开课题均不匹配，鼓励你随时新建课题；若某课题已结束招募，则暂停接收外部申请，但组内成员的协作不受影响（具体以课题的实时设置与状态为准）。",
    ],
    bullets: [
      "发现与匹配：浏览公开课题 → 研读挑战角色与计划 → 申请加入或独立新建",
      "组队与分工：组长梳理角色缺口 → 审批接纳新成员 → 明确初始研究步骤",
      "协作与推进：讨论区实时同步 → 证据区规范留痕 → AI 顾问辅助逻辑梳理",
      "阶段与收束：适时更新生命周期 → 提交展示或接力 → 视情况归档封存",
    ],
  },
  {
    id: "lifecycle",
    icon: Flag,
    accentClass: "text-clay-peach",
    iconTileClass: "bg-clay-peach text-clay-ink",
    eyebrow: "Lifecycle note",
    title: "状态与协作提醒",
    paragraphs: [
      "课题生命周期不仅是状态展示，更是团队协作节奏的指挥棒。「招募中」聚焦于团队构建；「组队中」侧重于角色磨合；「进行中」全力投入实验与论证；「待评审」与「已展示」重在成果梳理；「接力开放」鼓励后来者在现有基础上持续拓展；而「归档」则标志着一段研究旅程的圆满落幕。",
      "无论你身处何种角色，都请始终与课题主页的研究目标与挑战说明保持同频。访客应在明确方向后再申请；成员应在充分沟通后再行动；组长应在规则清晰后再扩充团队。",
    ],
  },
];

export function ResearchGroupGuideDialog({ isOpen, onClose }: ResearchGroupGuideDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      className="max-w-2xl overflow-hidden border-0 bg-transparent shadow-none"
      containerClassName="items-end sm:items-center"
    >
      <div
        className="relative flex flex-col max-h-[min(92vh,44rem)] w-full overflow-hidden rounded-[1.5rem] border border-clay-surface-strong bg-clay-canvas"
        role="document"
        aria-labelledby="research-group-guide-title"
      >
        <div className="flex-none flex items-start justify-between gap-4 border-b border-clay-surface-strong bg-clay-surface-soft px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-clay-pink text-white">
              <BookOpenText className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-clay-pink">
                Research Group Guide
              </p>
              <h2
                id="research-group-guide-title"
                className="mt-1 text-xl font-semibold text-clay-ink sm:text-2xl"
                style={{ fontFamily: "var(--font-ui-display)", letterSpacing: "-0.015em" }}
              >
                研究小组指南
              </h2>
              <p className="mt-1 text-sm leading-6 text-clay-muted">
                全面解析不同身份权限、组长核心职责及课题规范运作流程
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-clay-surface-strong bg-clay-canvas text-clay-ink transition-colors hover:bg-clay-surface-card"
            aria-label="关闭研究小组指南"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-clay-canvas px-5 py-5 sm:px-6">
          <div className="space-y-8">
            {GUIDE_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <section
                  key={section.id}
                  aria-labelledby={`guide-section-${section.id}`}
                  className="border-b border-clay-surface-strong pb-8 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl",
                        section.iconTileClass
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-[12px] font-semibold uppercase tracking-[0.12em]",
                          section.accentClass
                        )}
                      >
                        {section.eyebrow}
                      </p>
                      <h3
                        id={`guide-section-${section.id}`}
                        className="mt-1 text-lg font-semibold text-clay-ink"
                        style={{ fontFamily: "var(--font-ui-display)", letterSpacing: "-0.015em" }}
                      >
                        {section.title}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 pl-0 sm:pl-12">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-sm leading-7 text-clay-body sm:text-[15px]">
                        {paragraph}
                      </p>
                    ))}

                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="mt-1 space-y-2 border-l-2 border-clay-surface-strong pl-4">
                        {section.bullets.map((item) => (
                          <li key={item} className="text-sm leading-6 text-clay-body">
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <div className="flex-none flex flex-col gap-3 border-t border-clay-surface-strong bg-clay-surface-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm leading-6 text-clay-muted">
            在明确自身身份与权限后，欢迎随时探索公开课题或发起全新研究方向。
          </p>
          <button type="button" onClick={onClose} className="clay-button-primary self-start sm:self-auto">
            我已了解，即刻探索
          </button>
        </div>
      </div>
    </Dialog>
  );
}
