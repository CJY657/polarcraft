/**
 * Research Group Guide Dialog
 * 研究小组指南 - prose sections by user level, leader duties, group operations
 * Visual accents only: DESIGN.md Clay palette (not card grid)
 */

import type { LucideIcon } from "lucide-react";
import {
  BookOpenText,
  ClipboardCheck,
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
      "虚拟课题组是 PolariScope 内面向偏振光学学习者的协作研究空间。你可以浏览和加入现有课题，也可以发起新课题并招募伙伴。课题主页将研究目标、角色分工、讨论进展、证据沉淀、同伴评审和阶段推进集中在一起，帮助团队从组队走到成果展示或接力研究。",
      "本指南按访客、已登录用户、课题成员、组长和同伴评审者说明可执行的操作，并梳理课题组的完整运作方式。",
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
      "作为访客，你可以自由访问「公开课题」大厅，查看课题方向、挑战角色、团队规模、招募状态和已公开的同伴评审记录。公开课题详情页同样提供只读访问，方便你在参与前判断研究方向是否匹配。",
      "访客无法申请加入、创建课题、提交同伴评审，也无法使用组内讨论或课题 AI 顾问。当你尝试进一步操作时，系统会引导你完成登录。",
    ],
    bullets: [
      "可自由浏览公开课题列表及详情",
      "支持关键词检索、招募与待评审筛选，并可调整排序",
      "可阅读公开评审，不可提交申请、评审或组内内容",
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
      "登录后，你可以申请加入招募中的课题，也可发起「新建课题」。免审核的课题可直接加入；需要审核时，提交申请后由组长处理。",
      "你还可以从探索页识别「待评审」课题。如果你不是该课题的成员，可进入详情页提交同伴评审；其他组内功能仍会在成为成员后开放。",
    ],
    bullets: [
      "可申请加入招募中的课题，或自主发起新课题",
      "可在「我的课题」中统一管理已加入或创建的项目",
      "可评审待评审的公开课题，但不能评审自己所在的课题",
    ],
  },
  {
    id: "reviewer",
    icon: ClipboardCheck,
    accentClass: "text-clay-ochre",
    iconTileClass: "bg-clay-ochre text-clay-ink",
    eyebrow: "Peer reviewer",
    title: "同伴评审者（课题组外）",
    paragraphs: [
      "待评审的公开课题会在探索页清楚标出。已登录且不属于该课题的用户，可以根据课题组给出的评审标准，选择「建议通过」或「建议修改」，并写下具体、可执行的意见。",
      "评审提交后仍可修改或删除。课题进入展示后，已提交的评审会作为公开研究记录保留。评审应聚焦证据、论证和改进建议，不替代课题组的最终决策。",
    ],
    bullets: [
      "仅可评审处于「待评审」阶段的公开课题",
      "至少收到 2 份同伴评审后，组长才能将课题推进至「已展示」",
      "访客可查看评审区，登录且为课题组外用户时才可提交",
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
      "可查看本课题收到的同伴评审，但不能评审自己的课题",
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
      "组长拥有课题的最高管理权限：可编辑课题信息与封面，配置公开范围、审核机制与人数上限，审批加入申请，管理成员，并推进课题的生命周期。进入「待评审」前，还应写清评审标准；收到意见后，组织成员修改并决定何时进入展示。",
    ],
    bullets: [
      "统筹课题描述、核心问题、角色设定与封面展示",
      "制定招募规则，审批入组申请，统筹团队分工",
      "把控课题阶段（如：招募中 → 组队中 → 进行中 → 待评审 → 展示等）",
      "写清评审标准，响应组外意见，并在评审数量达标后推进展示",
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
      "课题状态会随着研究深入而演进：草稿、招募中、组队中、进行中、待评审、已展示、接力开放与已归档。「待评审」阶段由组外、已登录用户提交意见；至少收到 2 份评审后，组长才能将课题推进至「已展示」。",
      "若当前公开课题均不匹配，鼓励你随时新建课题；若某课题已结束招募，则暂停接收外部申请，但组内成员的协作不受影响（具体以课题的实时设置与状态为准）。",
    ],
    bullets: [
      "发现与匹配：浏览公开课题 → 研读挑战角色与计划 → 申请加入或独立新建",
      "组队与分工：组长梳理角色缺口 → 审批接纳新成员 → 明确初始研究步骤",
      "协作与推进：讨论区持续同步 → 证据区规范留痕 → AI 顾问辅助逻辑梳理",
      "评审与展示：组长推进待评审 → 组外同学提交意见 → 团队修改并进入展示或接力",
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
      "课题生命周期不只是状态展示，也用来对齐团队当前的任务。「招募中」聚焦角色缺口，「组队中」明确分工，「进行中」推进实验与论证，「待评审」引入组外反馈，「已展示」公开成果，「接力开放」允许后来者继续拓展，「已归档」则保留一段完整研究记录。",
      "每次推进阶段前，请先检查课题主页的目标、证据、团队分工与评审意见是否已对齐。阶段状态应反映当前实际进度，不应只作为展示标签。",
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
                从发现、加入、协作到同伴评审，了解每个角色如何参与
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
            先确认你要浏览、加入、评审还是发起课题，再从公开课题开始。
          </p>
          <button type="button" onClick={onClose} className="clay-button-primary self-start sm:self-auto">
            我已了解，即刻探索
          </button>
        </div>
      </div>
    </Dialog>
  );
}
