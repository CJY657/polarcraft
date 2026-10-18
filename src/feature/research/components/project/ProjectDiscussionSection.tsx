import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ImagePlus,
  Loader2,
  Pencil,
  Reply,
  Send,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { ResearchConfirmDialog } from '../shared/ResearchConfirmDialog';
import { DiscussionImageLightbox } from '@/components/discussion/DiscussionImageLightbox';
import TopicReferenceText from '../shared/TopicReferenceText';
import TopicReferenceTextarea from '../shared/TopicReferenceTextarea';
import {
  buildCommentTree,
  buildParentCommentLookup,
  countReplies,
  expandCommentAncestors,
} from '@/components/discussion/commentTree';
import {
  buildDraftAttachments,
  countDraftAttachments,
  createFileListFromArray,
  revokeDraftPreviewUrls,
  type DraftAttachment,
  type DraftAttachmentType,
} from '@/components/discussion/draftAttachments';
import { cn } from '@/utils/classNames';
import { formatUserIdentity, getUserIdentityInitial } from '@/lib/identity';
import { capturePostHogEvent } from '@/lib/posthog';
import { researchApi, type ProjectDiscussionComment } from '@/lib/research.service';

export interface ProjectDiscussionOutline {
  topicSummary: string;
  questions: string[];
  hypotheses: string[];
  basicPlan?: string;
  extendedPlan?: string;
}

export type ProjectDiscussionJumpSection = 'topic' | 'basic' | 'extended' | 'comments';

export interface ProjectDiscussionJumpRequest {
  section: ProjectDiscussionJumpSection;
  index?: number;
  commentId?: string;
  version: number;
}

interface ProjectDiscussionSectionProps {
  projectId: string;
  canParticipate: boolean;
  canModerate?: boolean;
  currentUserId?: string;
  outline?: ProjectDiscussionOutline;
  jumpRequest?: ProjectDiscussionJumpRequest | null;
  onCountChange?: (count: number) => void;
}

interface DiscussionTreeComment extends ProjectDiscussionComment {
  replies: DiscussionTreeComment[];
}

const PROJECT_COMMENT_ACCESSORS = {
  idOf: (comment: ProjectDiscussionComment) => comment.id,
  parentIdOf: (comment: ProjectDiscussionComment) => comment.parent_comment_id,
  createdAtOf: (comment: ProjectDiscussionComment) => comment.created_at,
};
const DRAFT_ATTACHMENT_TYPES: DraftAttachmentType[] = ['image', 'video'];

const MAX_COMMENT_LENGTH = 2000;
const MAX_COMMENT_IMAGES = 6;
const MAX_COMMENT_VIDEOS = 2;
/** 首屏渲染的顶层讨论串数量；点击「展开更早的讨论」后每次追加同样数量 */
const INITIAL_VISIBLE_THREADS = 20;
const COMMENT_TIME_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatCommentTime(value: string): string {
  return COMMENT_TIME_FORMATTER.format(new Date(value));
}

function buildAttachmentSelectionMessage(
  invalidCount: number,
  imageOverflowCount: number,
  videoOverflowCount: number
): string | null {
  const messages: string[] = [];

  if (invalidCount > 0) {
    messages.push('只支持 JPG、PNG、GIF、WebP 图片和 MP4、WebM、MOV 视频');
  }

  if (imageOverflowCount > 0) {
    messages.push(`单条评论最多添加 ${MAX_COMMENT_IMAGES} 张图片`);
  }

  if (videoOverflowCount > 0) {
    messages.push(`单条评论最多添加 ${MAX_COMMENT_VIDEOS} 个视频`);
  }

  return messages.length > 0 ? messages.join('；') : null;
}

function DraftAttachmentPreviewList({
  attachments,
  onRemove,
  onPreview,
}: {
  attachments: DraftAttachment[];
  onRemove: (attachmentId: string) => void;
  onPreview: (attachment: DraftAttachment) => void;
}) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="group relative overflow-hidden rounded-lg border border-[var(--research-line)]"
        >
          {attachment.type === 'image' ? (
            <button
              type="button"
              onClick={() => onPreview(attachment)}
              className="block h-28 w-full overflow-hidden bg-[var(--research-chip)]"
            >
              <img
                src={attachment.previewUrl}
                alt={attachment.file.name}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
              />
            </button>
          ) : (
            <div className="h-28 w-full overflow-hidden bg-slate-950">
              <video
                src={attachment.previewUrl}
                controls
                preload="metadata"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => onRemove(attachment.id)}
            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/68 text-white transition hover:bg-black/82"
            aria-label={attachment.type === 'image' ? '移除图片' : '移除视频'}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="border-t border-[var(--research-line)] bg-[var(--research-head)] px-2.5 py-2">
            <p className="truncate text-sm text-[var(--research-muted)]">{attachment.file.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CommentMediaGrid({
  imageUrls,
  videoUrls,
  username,
  onPreview,
}: {
  imageUrls: string[];
  videoUrls: string[];
  username: string;
  onPreview: (url: string, alt: string) => void;
}) {
  if (imageUrls.length === 0 && videoUrls.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 grid max-w-[28rem] grid-cols-2 gap-2 sm:grid-cols-3">
      {imageUrls.map((url, index) => (
        <button
          key={`${url}-${index}`}
          type="button"
          onClick={() => onPreview(url, `${username || '用户'} 上传的图片 ${index + 1}`)}
          className="group overflow-hidden rounded-lg border border-[var(--research-line)]"
        >
          <img
            src={url}
            alt={`${username || '用户'} 上传的图片 ${index + 1}`}
            loading="lazy"
            className="h-28 w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        </button>
      ))}
      {videoUrls.map((url, index) => (
        <div
          key={`${url}-${index}`}
          className="overflow-hidden rounded-lg border border-[var(--research-line)] bg-slate-950"
        >
          <video
            src={url}
            controls
            preload="metadata"
            className="h-28 w-full object-cover"
            aria-label={`${username || '用户'} 上传的视频 ${index + 1}`}
          />
        </div>
      ))}
    </div>
  );
}

export function ProjectDiscussionSection({
  projectId,
  canParticipate,
  canModerate = false,
  currentUserId,
  jumpRequest,
  onCountChange,
}: ProjectDiscussionSectionProps) {
  const [comments, setComments] = useState<ProjectDiscussionComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [newCommentAttachments, setNewCommentAttachments] = useState<DraftAttachment[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyAttachments, setReplyAttachments] = useState<Record<string, DraftAttachment[]>>({});
  const [replyError, setReplyError] = useState<string | null>(null);
  const [submittingReplyToId, setSubmittingReplyToId] = useState<string | null>(null);

  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expandedCommentIds, setExpandedCommentIds] = useState<Record<string, boolean>>({});
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEditCommentId, setSavingEditCommentId] = useState<string | null>(null);
  const [visibleThreadCount, setVisibleThreadCount] = useState(INITIAL_VISIBLE_THREADS);

  const newCommentAttachmentsRef = useRef<DraftAttachment[]>([]);
  const replyAttachmentsRef = useRef<Record<string, DraftAttachment[]>>({});
  const newCommentFileInputRef = useRef<HTMLInputElement | null>(null);
  const replyFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { commentTree, parentCommentLookup } = useMemo(() => ({
    commentTree: buildCommentTree(comments, PROJECT_COMMENT_ACCESSORS),
    parentCommentLookup: buildParentCommentLookup(comments, PROJECT_COMMENT_ACCESSORS),
  }), [comments]);

  useEffect(() => {
    newCommentAttachmentsRef.current = newCommentAttachments;
  }, [newCommentAttachments]);

  useEffect(() => {
    replyAttachmentsRef.current = replyAttachments;
  }, [replyAttachments]);

  useEffect(() => {
    onCountChange?.(comments.length);
  }, [comments.length, onCountChange]);

  useEffect(() => {
    return () => {
      revokeDraftPreviewUrls(newCommentAttachmentsRef.current);
      Object.values(replyAttachmentsRef.current).forEach((attachments) => revokeDraftPreviewUrls(attachments));
    };
  }, []);

  async function loadComments() {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await researchApi.getProjectDiscussionComments(projectId);
      setComments(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : '加载讨论区失败');
    } finally {
      setIsLoading(false);
    }
  }

  function clearNewCommentComposer() {
    setNewComment('');
    setSubmitError(null);
    setNewCommentAttachments((current) => {
      revokeDraftPreviewUrls(current);
      return [];
    });
  }

  function clearReplyDraft(commentId: string) {
    setReplyDrafts((current) => ({ ...current, [commentId]: '' }));
    setReplyError(null);
    setReplyAttachments((current) => {
      const existingAttachments = current[commentId] ?? [];
      revokeDraftPreviewUrls(existingAttachments);
      const next = { ...current };
      delete next[commentId];
      return next;
    });
  }

  function resetDiscussionState() {
    setSubmitError(null);
    setReplyTargetId(null);
    setReplyDrafts({});
    setReplyError(null);
    setDeleteError(null);
    setExpandedCommentIds({});
    setLightboxImage(null);
    setEditingCommentId(null);
    setEditDraft('');
    setEditError(null);
    setVisibleThreadCount(INITIAL_VISIBLE_THREADS);
    clearNewCommentComposer();
    setReplyAttachments((current) => {
      Object.values(current).forEach((attachments) => revokeDraftPreviewUrls(attachments));
      return {};
    });
  }

  useEffect(() => {
    resetDiscussionState();
    void loadComments();
  }, [projectId]);

  useEffect(() => {
    if (!jumpRequest) {
      return;
    }

    const commentTargetId = jumpRequest.section === 'comments' && jumpRequest.commentId
      ? `discussion-comment-${jumpRequest.commentId}`
      : null;
    const targetId = commentTargetId ?? 'discussion-comments';
    if (commentTargetId && isLoading) {
      return;
    }

    const targetCommentId = jumpRequest.commentId;

    if (targetCommentId && parentCommentLookup.has(targetCommentId)) {
      // 跳转目标可能在未渲染的更早讨论串里，先展开全部顶层讨论串
      setVisibleThreadCount((current) => Math.max(current, comments.length));
      setExpandedCommentIds((current) => ({
        ...current,
        ...expandCommentAncestors(targetCommentId, parentCommentLookup),
      }));
    }

    const timer = window.setTimeout(() => {
      (document.getElementById(targetId) ?? document.getElementById('discussion-comments'))?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    comments,
    isLoading,
    jumpRequest?.commentId,
    jumpRequest?.index,
    jumpRequest?.section,
    jumpRequest?.version,
    parentCommentLookup,
  ]);

  async function uploadDraftAttachments(attachments: DraftAttachment[]): Promise<{
    imageUrls: string[];
    videoUrls: string[];
  }> {
    const imageUrls: string[] = [];
    const videoUrls: string[] = [];

    for (const attachment of attachments) {
      if (attachment.type === 'image') {
        const result = await researchApi.uploadProjectDiscussionImage(projectId, attachment.file);
        imageUrls.push(result.url);
      } else {
        const result = await researchApi.uploadProjectDiscussionVideo(projectId, attachment.file);
        videoUrls.push(result.url);
      }
    }

    return { imageUrls, videoUrls };
  }

  function handleNewCommentAttachmentSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const counts = countDraftAttachments(newCommentAttachments);
    const { acceptedAttachments, invalidCount, imageOverflowCount, videoOverflowCount } = buildDraftAttachments(
      event.target.files,
      {
        allowedTypes: DRAFT_ATTACHMENT_TYPES,
        remainingImageSlots: MAX_COMMENT_IMAGES - counts.image,
        remainingVideoSlots: MAX_COMMENT_VIDEOS - counts.video,
      }
    );

    if (acceptedAttachments.length > 0) {
      setNewCommentAttachments((current) => [...current, ...acceptedAttachments]);
    }

    const nextMessage = buildAttachmentSelectionMessage(
      invalidCount,
      imageOverflowCount,
      videoOverflowCount
    );
    if (nextMessage) {
      setSubmitError(nextMessage);
    } else {
      setSubmitError(null);
    }

    event.target.value = '';
  }

  function handleReplyAttachmentSelection(
    commentId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const currentAttachments = replyAttachments[commentId] ?? [];
    const counts = countDraftAttachments(currentAttachments);
    const { acceptedAttachments, invalidCount, imageOverflowCount, videoOverflowCount } = buildDraftAttachments(
      event.target.files,
      {
        allowedTypes: DRAFT_ATTACHMENT_TYPES,
        remainingImageSlots: MAX_COMMENT_IMAGES - counts.image,
        remainingVideoSlots: MAX_COMMENT_VIDEOS - counts.video,
      }
    );

    if (acceptedAttachments.length > 0) {
      setReplyAttachments((current) => ({
        ...current,
        [commentId]: [...(current[commentId] ?? []), ...acceptedAttachments],
      }));
    }

    const nextMessage = buildAttachmentSelectionMessage(
      invalidCount,
      imageOverflowCount,
      videoOverflowCount
    );
    if (nextMessage) {
      setReplyError(nextMessage);
    } else {
      setReplyError(null);
    }

    event.target.value = '';
  }

  function handleNewCommentPaste(event: React.ClipboardEvent<HTMLElement>) {
    const items = event.clipboardData?.items;
    if (!items) {
      return;
    }

    const imageFiles: File[] = [];
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length === 0) {
      return;
    }

    event.preventDefault();

    const fileList = createFileListFromArray(imageFiles);
    const counts = countDraftAttachments(newCommentAttachments);
    const { acceptedAttachments, invalidCount, imageOverflowCount, videoOverflowCount } = buildDraftAttachments(
      fileList,
      {
        allowedTypes: DRAFT_ATTACHMENT_TYPES,
        remainingImageSlots: MAX_COMMENT_IMAGES - counts.image,
        remainingVideoSlots: MAX_COMMENT_VIDEOS - counts.video,
      }
    );

    if (acceptedAttachments.length > 0) {
      setNewCommentAttachments((current) => [...current, ...acceptedAttachments]);
    }

    setSubmitError(buildAttachmentSelectionMessage(invalidCount, imageOverflowCount, videoOverflowCount));
  }

  function handleReplyPaste(
    commentId: string,
    event: React.ClipboardEvent<HTMLElement>
  ) {
    const items = event.clipboardData?.items;
    if (!items) {
      return;
    }

    const imageFiles: File[] = [];
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length === 0) {
      return;
    }

    event.preventDefault();

    const currentAttachments = replyAttachments[commentId] ?? [];
    const fileList = createFileListFromArray(imageFiles);
    const counts = countDraftAttachments(currentAttachments);
    const { acceptedAttachments, invalidCount, imageOverflowCount, videoOverflowCount } = buildDraftAttachments(
      fileList,
      {
        allowedTypes: DRAFT_ATTACHMENT_TYPES,
        remainingImageSlots: MAX_COMMENT_IMAGES - counts.image,
        remainingVideoSlots: MAX_COMMENT_VIDEOS - counts.video,
      }
    );

    if (acceptedAttachments.length > 0) {
      setReplyAttachments((current) => ({
        ...current,
        [commentId]: [...(current[commentId] ?? []), ...acceptedAttachments],
      }));
    }

    setReplyError(buildAttachmentSelectionMessage(invalidCount, imageOverflowCount, videoOverflowCount));
  }

  function handleRemoveNewCommentAttachment(attachmentId: string) {
    setNewCommentAttachments((current) => {
      const attachmentToRemove = current.find((attachment) => attachment.id === attachmentId);
      if (attachmentToRemove) {
        URL.revokeObjectURL(attachmentToRemove.previewUrl);
      }
      return current.filter((attachment) => attachment.id !== attachmentId);
    });
  }

  function handleRemoveReplyAttachment(commentId: string, attachmentId: string) {
    setReplyAttachments((current) => {
      const existingAttachments = current[commentId] ?? [];
      const attachmentToRemove = existingAttachments.find((attachment) => attachment.id === attachmentId);
      if (attachmentToRemove) {
        URL.revokeObjectURL(attachmentToRemove.previewUrl);
      }

      const nextAttachments = existingAttachments.filter((attachment) => attachment.id !== attachmentId);
      if (nextAttachments.length === 0) {
        const next = { ...current };
        delete next[commentId];
        return next;
      }

      return {
        ...current,
        [commentId]: nextAttachments,
      };
    });
  }

  async function handleSubmitComment() {
    const content = newComment.trim();
    if (!content && newCommentAttachments.length === 0) {
      setSubmitError('请输入留言内容或至少添加一张图片或视频');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const { imageUrls, videoUrls } = await uploadDraftAttachments(newCommentAttachments);
      await researchApi.addProjectDiscussionComment(projectId, {
        content,
        imageUrls,
        videoUrls,
      });
      clearNewCommentComposer();
      capturePostHogEvent('research_discussion_posted', {
        project_id: projectId,
        kind: 'comment',
        has_attachment: imageUrls.length > 0 || videoUrls.length > 0,
      });
      await loadComments();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '发布留言失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitReply(parentCommentId: string) {
    const content = (replyDrafts[parentCommentId] ?? '').trim();
    const currentReplyAttachments = replyAttachments[parentCommentId] ?? [];

    if (!content && currentReplyAttachments.length === 0) {
      setReplyError('请输入回复内容或至少添加一张图片或视频');
      return;
    }

    try {
      setSubmittingReplyToId(parentCommentId);
      setReplyError(null);
      const { imageUrls, videoUrls } = await uploadDraftAttachments(currentReplyAttachments);
      await researchApi.addProjectDiscussionComment(projectId, {
        content,
        parentCommentId,
        imageUrls,
        videoUrls,
      });
      clearReplyDraft(parentCommentId);
      capturePostHogEvent('research_discussion_posted', {
        project_id: projectId,
        kind: 'reply',
        has_attachment: imageUrls.length > 0 || videoUrls.length > 0,
      });
      setReplyTargetId(null);
      setExpandedCommentIds((current) => ({
        ...current,
        ...expandCommentAncestors(parentCommentId, parentCommentLookup),
      }));
      await loadComments();
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : '回复失败');
    } finally {
      setSubmittingReplyToId(null);
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      setDeletingCommentId(commentId);
      setDeleteError(null);
      await researchApi.deleteProjectDiscussionComment(commentId);
      await loadComments();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : '删除留言失败');
    } finally {
      setDeletingCommentId(null);
    }
  }

  function startEditingComment(comment: ProjectDiscussionComment) {
    setEditingCommentId(comment.id);
    setEditDraft(comment.content);
    setEditError(null);
    setReplyTargetId(null);
  }

  function cancelEditingComment() {
    setEditingCommentId(null);
    setEditDraft('');
    setEditError(null);
  }

  async function handleSaveEditedComment(comment: ProjectDiscussionComment) {
    const content = editDraft.trim();
    const hasAttachments = comment.image_urls.length > 0 || (comment.video_urls?.length ?? 0) > 0;

    if (!content && !hasAttachments) {
      setEditError('留言内容不能为空');
      return;
    }

    try {
      setSavingEditCommentId(comment.id);
      setEditError(null);
      await researchApi.updateProjectDiscussionComment(comment.id, content);
      cancelEditingComment();
      await loadComments();
    } catch (error) {
      setEditError(error instanceof Error ? error.message : '编辑留言失败');
    } finally {
      setSavingEditCommentId(null);
    }
  }

  function canEditComment(comment: ProjectDiscussionComment): boolean {
    return !comment.is_deleted && canParticipate && currentUserId === comment.user_id;
  }

  function canDeleteComment(comment: ProjectDiscussionComment): boolean {
    if (comment.is_deleted) {
      return false;
    }

    return currentUserId === comment.user_id || canModerate;
  }

  function renderComment(comment: DiscussionTreeComment, depth = 0) {
    const isReplying = replyTargetId === comment.id;
    const replyDraft = replyDrafts[comment.id] ?? '';
    const attachedReplyAttachments = replyAttachments[comment.id] ?? [];
    const attachedReplyCounts = countDraftAttachments(attachedReplyAttachments);
    const commentVideoUrls = comment.video_urls ?? [];
    const hasReplies = comment.replies.length > 0;
    const totalReplyCount = countReplies(comment);
    const isRepliesExpanded = expandedCommentIds[comment.id] ?? false;
    const displayUsername = formatUserIdentity(comment, '未命名用户');
    const isEditingThis = editingCommentId === comment.id;
    const isEdited = !comment.is_deleted && comment.updated_at !== comment.created_at;

    return (
      <div
        key={comment.id}
        id={`discussion-comment-${comment.id}`}
        className={cn(
          'scroll-mt-28 relative',
          depth === 0
            ? 'border-b border-[var(--research-line)] py-4 first:pt-2 last:border-b-0 last:pb-1'
            : 'ml-4 mt-3 border-l-2 border-[var(--research-line)] pl-4 sm:ml-5'
        )}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--research-line)] bg-[var(--research-head)] text-xs font-bold text-[var(--paper-foreground)]">
            {getUserIdentityInitial(comment)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="text-sm font-bold text-[var(--paper-foreground)]">
                {displayUsername}
              </span>
              <span className="text-xs text-[var(--research-muted)]">
                {formatCommentTime(comment.created_at)}
              </span>
              {isEdited && (
                <span className="text-xs text-[var(--research-muted)]">
                  已编辑
                </span>
              )}
              {comment.is_deleted && (
                <span className="text-xs text-[var(--research-muted)]">
                  已删除
                </span>
              )}
            </div>

            <div className="mt-1 text-base leading-6 text-[var(--paper-foreground)]">
              {comment.is_deleted ? (
                <span className="italic text-[var(--research-muted)]">这条留言已删除</span>
              ) : isEditingThis ? (
                <div className="mt-2 overflow-hidden rounded-xl border border-[var(--research-line)] bg-[var(--research-head)] focus-within:border-[var(--research-edge)]">
                  <TopicReferenceTextarea
                    value={editDraft}
                    onValueChange={setEditDraft}
                    excludeProjectId={projectId}
                    references={comment.references}
                    rows={3}
                    maxLength={MAX_COMMENT_LENGTH}
                    autoFocus
                    aria-label="编辑留言内容"
                    className="w-full resize-y border-0 bg-transparent px-3.5 py-2.5 text-base outline-none"
                  />
                  {editError && (
                    <p className="px-3.5 pb-2 text-sm text-[var(--color-destructive)]">{editError}</p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--research-line)] px-3 py-2">
                    <span className="text-xs text-[var(--research-muted)]">
                      {comment.image_urls.length > 0 || commentVideoUrls.length > 0
                        ? '已上传的图片和视频保持不变'
                        : ''}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={cancelEditingComment}
                        disabled={savingEditCommentId === comment.id}
                        className="research-button rounded-md px-3 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSaveEditedComment(comment)}
                        disabled={savingEditCommentId === comment.id}
                        className="research-button research-button-primary inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {savingEditCommentId === comment.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Pencil className="h-3.5 w-3.5" />
                        )}
                        保存修改
                      </button>
                    </div>
                  </div>
                  <div className="px-3.5 pb-2.5">
                    <CommentMediaGrid
                      imageUrls={comment.image_urls}
                      videoUrls={commentVideoUrls}
                      username={displayUsername}
                      onPreview={(url, alt) => setLightboxImage({ url, alt })}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {comment.content.trim() ? (
                    <p className="whitespace-pre-wrap break-words">
                      <TopicReferenceText
                        text={comment.content}
                        references={comment.references}
                      />
                    </p>
                  ) : comment.image_urls.length > 0 || commentVideoUrls.length > 0 ? (
                    <p className="text-[var(--research-muted)]">
                      发送了 {comment.image_urls.length} 张图片、{commentVideoUrls.length} 个视频
                    </p>
                  ) : null}
                  <CommentMediaGrid
                    imageUrls={comment.image_urls}
                    videoUrls={commentVideoUrls}
                    username={displayUsername}
                    onPreview={(url, alt) => setLightboxImage({ url, alt })}
                  />
                </>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-[var(--research-muted)]">
              {canParticipate && !comment.is_deleted && (
                <button
                  type="button"
                  onClick={() => {
                    setExpandedCommentIds((current) => ({
                      ...current,
                      ...expandCommentAncestors(comment.id, parentCommentLookup),
                    }));
                    setReplyTargetId((current) => (current === comment.id ? null : comment.id));
                    setReplyError(null);
                    setDeleteError(null);
                  }}
                  className="inline-flex items-center gap-1 hover:text-[var(--paper-foreground)]"
                >
                  <Reply className="h-3.5 w-3.5" />
                  回复
                </button>
              )}

              {canEditComment(comment) && !isEditingThis && (
                <button
                  type="button"
                  onClick={() => startEditingComment(comment)}
                  className="inline-flex items-center gap-1 hover:text-[var(--paper-foreground)]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  编辑
                </button>
              )}

              {canDeleteComment(comment) && (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(comment.id)}
                  disabled={deletingCommentId === comment.id}
                  className="inline-flex items-center gap-1 text-[var(--color-destructive)] hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingCommentId === comment.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  删除
                </button>
              )}

              {hasReplies && (
                <button
                  type="button"
                  onClick={() => {
                    setExpandedCommentIds((current) => ({
                      ...current,
                      [comment.id]: !(current[comment.id] ?? false),
                    }));
                  }}
                  className="inline-flex items-center gap-1 text-[var(--paper-foreground)] hover:underline"
                >
                  {isRepliesExpanded ? `收起 ${totalReplyCount} 条回复` : `展开 ${totalReplyCount} 条回复`}
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform duration-200',
                      isRepliesExpanded && 'rotate-180'
                    )}
                  />
                </button>
              )}
            </div>

            {isReplying && canParticipate && (
              <div className="mt-3 overflow-hidden rounded-xl border border-[var(--research-line)] bg-[var(--research-head)] focus-within:border-[var(--research-edge)]">
                <TopicReferenceTextarea
                  value={replyDraft}
                  onValueChange={(value) => {
                    setReplyDrafts((current) => ({ ...current, [comment.id]: value }));
                  }}
                  excludeProjectId={projectId}
                  onPaste={(event) => handleReplyPaste(comment.id, event)}
                  rows={2}
                  maxLength={MAX_COMMENT_LENGTH}
                  placeholder="补充你的看法、建议或追问（支持 Ctrl+V 粘贴图片）"
                  className="w-full resize-y border-0 bg-transparent px-3.5 py-2.5 text-base outline-none"
                />

                <input
                  ref={(node) => {
                    replyFileInputRefs.current[comment.id] = node;
                  }}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                  multiple
                  className="hidden"
                  onChange={(event) => handleReplyAttachmentSelection(comment.id, event)}
                />

                <div className="px-3.5">
                  <DraftAttachmentPreviewList
                    attachments={attachedReplyAttachments}
                    onRemove={(attachmentId) => handleRemoveReplyAttachment(comment.id, attachmentId)}
                    onPreview={(attachment) =>
                      setLightboxImage({ url: attachment.previewUrl, alt: attachment.file.name })
                    }
                  />
                </div>

                {replyError && (
                  <p className="px-3.5 pb-2 text-sm text-[var(--color-destructive)]">{replyError}</p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--research-line)] px-3 py-2">
                  <button
                    type="button"
                    onClick={() => replyFileInputRefs.current[comment.id]?.click()}
                    disabled={
                      (attachedReplyCounts.image >= MAX_COMMENT_IMAGES
                        && attachedReplyCounts.video >= MAX_COMMENT_VIDEOS)
                      || submittingReplyToId === comment.id
                    }
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-[var(--research-muted)] hover:bg-[var(--research-chip)] hover:text-[var(--paper-foreground)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    添加附件
                  </button>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTargetId(null);
                        setReplyError(null);
                      }}
                      className="research-button rounded-md px-3 py-1 text-xs font-semibold"
                    >
                      收起
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSubmitReply(comment.id)}
                      disabled={submittingReplyToId === comment.id}
                      className="research-button research-button-primary inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {submittingReplyToId === comment.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      发送回复
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {hasReplies && isRepliesExpanded && (
          <div>
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  const newCommentAttachmentCounts = countDraftAttachments(newCommentAttachments);
  const visibleThreads = commentTree.slice(0, visibleThreadCount);
  const hiddenThreadCount = Math.max(commentTree.length - visibleThreads.length, 0);

  return (
    <>
      <section
        id="discussion-comments"
        aria-label="评论区"
        className="scroll-mt-28"
      >
        {/* 直接发评论的一体化输入框（无外层大卡片包裹） */}
        <div className="overflow-hidden rounded-xl border border-[var(--research-line)] bg-[var(--research-surface)] focus-within:border-[var(--research-edge)]">
          <TopicReferenceTextarea
            value={newComment}
            onValueChange={setNewComment}
            excludeProjectId={projectId}
            onPaste={handleNewCommentPaste}
            rows={3}
            maxLength={MAX_COMMENT_LENGTH}
            disabled={!canParticipate || isSubmitting}
            placeholder={
              canParticipate
                ? '写下你的问题、观察或建议…（支持 Ctrl+V 粘贴图片）'
                : '只有课题成员可以参与讨论'
            }
            className="w-full resize-y border-0 bg-transparent px-4 py-3 text-base outline-none disabled:cursor-not-allowed disabled:opacity-70"
          />

          <input
            ref={newCommentFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
            multiple
            className="hidden"
            onChange={handleNewCommentAttachmentSelection}
          />

          <div className="px-4">
            <DraftAttachmentPreviewList
              attachments={newCommentAttachments}
              onRemove={handleRemoveNewCommentAttachment}
              onPreview={(attachment) =>
                setLightboxImage({ url: attachment.previewUrl, alt: attachment.file.name })
              }
            />
          </div>

          {submitError && (
            <p className="px-4 pb-2 text-sm text-[var(--color-destructive)]">{submitError}</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--research-line)] bg-[var(--research-head)] px-3.5 py-2">
            <button
              type="button"
              onClick={() => newCommentFileInputRef.current?.click()}
              disabled={
                !canParticipate
                || isSubmitting
                || (
                  newCommentAttachmentCounts.image >= MAX_COMMENT_IMAGES
                  && newCommentAttachmentCounts.video >= MAX_COMMENT_VIDEOS
                )
              }
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-[var(--research-muted)] hover:bg-[var(--research-chip)] hover:text-[var(--paper-foreground)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ImagePlus className="h-4 w-4" />
              <Video className="h-4 w-4" />
              添加附件
            </button>

            <button
              type="button"
              onClick={() => void handleSubmitComment()}
              disabled={!canParticipate || isSubmitting}
              className="research-button research-button-primary inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              发布
            </button>
          </div>
        </div>

        {deleteError && (
          <div className="research-error mt-3 rounded-lg px-3.5 py-2.5 text-sm">
            {deleteError}
          </div>
        )}

        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-[var(--research-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在加载讨论内容
            </div>
          ) : loadError ? (
            <div className="research-error rounded-lg px-3.5 py-3 text-sm">
              {loadError}
            </div>
          ) : commentTree.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--research-muted)]">
              还没有人开场，来发第一条讨论吧
            </p>
          ) : (
            <div>
              {visibleThreads.map((comment) => renderComment(comment))}

              {hiddenThreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => setVisibleThreadCount((current) => current + INITIAL_VISIBLE_THREADS)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--research-line)] py-2.5 text-sm font-semibold text-[var(--research-muted)] hover:border-[var(--research-edge)] hover:text-[var(--paper-foreground)]"
                >
                  展开更早的讨论（还有 {hiddenThreadCount} 条）
                  <ChevronDown className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <ResearchConfirmDialog
        open={confirmDeleteId !== null}
        title="删除这条留言？"
        description="删除后无法恢复。"
        confirmLabel="删除"
        cancelLabel="取消"
        isPending={deletingCommentId !== null && deletingCommentId === confirmDeleteId}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={async () => {
          if (confirmDeleteId) {
            await handleDeleteComment(confirmDeleteId);
          }
          setConfirmDeleteId(null);
        }}
      />

      <DiscussionImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
        labels={{
          close: '关闭大图预览',
          zoomIn: '放大',
          zoomOut: '还原',
          zoomInAriaLabel: '放大图片',
          zoomOutAriaLabel: '还原图片',
          hint: '点击图片可切换放大/还原',
          zoomedHint: '拖动查看细节，点击图片可还原',
        }}
      />
    </>
  );
}
