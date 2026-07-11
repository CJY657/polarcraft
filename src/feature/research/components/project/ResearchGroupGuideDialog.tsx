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
      "虚拟课题组是 PolariScope 中面向偏振光学问题的协作研究空间。你可以在公开课题中浏览他人方向、申请加入已有小组，也可以自己发起课题并招募同伴。课题页把研究主题、角色分工、讨论推进、证据沉淀与状态流转放在同一处，让学习更接近真实的研究协作过程。",
      "本指南说明不同用户身份能做什么、组长负责什么，以及课题组成立后的日常运作方式。",
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
      "未登录时，你仍可进入「公开课题」页浏览课题列表，查看课题摘要、挑战角色、成员规模与招募状态。公开课题的详情页也支持只读浏览，方便先判断方向是否匹配。",
      "访客不能申请加入、不能新建课题、也不能进入组内讨论或使用课题 AI 顾问。当你准备参与时，系统会在申请或新建入口提示登录。",
    ],
    bullets: [
      "可浏览公开课题列表与公开详情",
      "可按关键词检索、筛选招募中课题，并切换排序方式",
      "不可提交申请、创建课题或参与组内协作功能",
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
      "登录后，你在公开课题页拥有完整的发现与申请能力。若课题开启招募且不需要审核，可直接加入；若需要审核，则提交申请并等待组长处理。你也可以从本页发起「新建课题」，按向导填写名称、研究问题、挑战角色与协作设置。",
      "在尚未成为成员前，课题详情仍以只读为主：你可以了解研究计划与团队构成，但讨论区、证据编辑与 AI 顾问等组内能力会在加入后开放。",
    ],
    bullets: [
      "可申请加入招募中的课题，或创建自己的课题",
      "可在「我的课题」中查看自己创建或已加入的课题",
      "未加入时不能发帖讨论、管理证据或调整课题设置",
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
      "成为成员后，你进入组内协作模式。成员可阅读完整研究信息（主题简述、问题与假设、基础与拓展计划），在讨论区围绕研究问题交流，并上传、整理研究证据材料。课题 AI 顾问也面向成员开放，用于辅助梳理思路与实验表述，具体结论仍需与组员共同确认。",
      "成员可主动退出课题；但默认不能修改课题公开设置、招募规则或删除课题。挑战角色标签会提示你当前承担的分工，请尽量对齐组长约定的角色与进度。",
    ],
    bullets: [
      "可参与讨论、沉淀证据、使用课题 AI 顾问",
      "可按课题约定的挑战角色推进实验与记录",
      "不可修改协作设置、审核申请或删除课题",
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
      "创建课题的人自动成为组长。组长既是研究方向的发起者，也是组队与协作秩序的维护者：需要把问题说清楚，把角色与招募条件写明白，并持续推动课题从组队走向产出。",
      "组长可编辑课题信息与封面，配置协作设置（公开/私有、是否需要审核、招募要求、人数上限、是否继续招募），管理加入申请，移除不合适的成员，并推进课题生命周期状态。必要时也可删除课题。平台管理员在管理场景下可协助处理同类管理操作。",
    ],
    bullets: [
      "维护课题描述、研究问题、挑战角色与封面展示",
      "设定招募规则，审核申请，管理成员与角色分工",
      "推进课题状态（如招募中 → 组队中 → 进行中 → 待评审 → 展示等）",
      "保障讨论与证据区有清晰目标，避免课题长期停滞",
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
      "一个典型课题从公开发现或自行创建开始。组队阶段关注「谁来做、还缺什么角色」；进入进行中后，成员在讨论区同步问题、假设与实验进展，在证据区沉淀图文与过程材料，使协作过程可回看、可复盘。",
      "课题状态会随阶段变化：草稿、招募中、组队中、进行中、待评审、已展示、接力开放、已归档等。徽章会标示当前阶段。组长应在成员结构与研究进度匹配时推进状态，而不是长期停在招募或进行中却无产出。",
      "若现有公开课题都不匹配，可直接新建课题并开放招募；若课题已停止招募，访客与外部用户通常不能再申请加入，组内既有成员仍可继续协作（具体以课题当前设置与状态为准）。",
    ],
    bullets: [
      "发现与匹配：浏览公开课题 → 阅读挑战角色与研究计划 → 申请或新建",
      "组队与分工：组长设定角色与缺口 → 审核/接纳成员 → 明确起步步骤",
      "协作推进：讨论区同步 → 证据区留痕 → AI 顾问辅助梳理",
      "阶段收束：更新生命周期状态 → 展示或接力 → 必要时归档",
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
      "生命周期不是装饰，而是协作节奏的提示。招募中强调补充成员；组队中强调角色磨合；进行中强调实验与讨论；待评审与已展示强调产出整理；接力开放允许后续同学在既有基础上继续延伸；归档表示课题告一段落。",
      "无论你处于哪一身份，优先对齐课题页上的研究问题与挑战角色说明。访客先看清方向再登录申请；成员先同步再实验；组长先把规则与分工写清楚，再扩大招募。",
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
        className="relative max-h-[min(92vh,44rem)] w-full overflow-hidden rounded-[1.5rem] border border-clay-surface-strong bg-clay-canvas"
        role="document"
        aria-labelledby="research-group-guide-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-clay-surface-strong bg-clay-surface-soft px-5 py-4 sm:px-6">
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
                按用户身份、组长职责与课题运作说明能力边界
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

        <div className="max-h-[min(72vh,34rem)] overflow-y-auto bg-clay-canvas px-5 py-5 sm:px-6">
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

        <div className="flex flex-col gap-3 border-t border-clay-surface-strong bg-clay-surface-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm leading-6 text-clay-muted">
            先确认自己的身份与权限，再浏览公开课题或发起新方向。
          </p>
          <button type="button" onClick={onClose} className="clay-button-primary self-start sm:self-auto">
            知道了，开始探索
          </button>
        </div>
      </div>
    </Dialog>
  );
}
