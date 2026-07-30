import { useEffect, useRef, useState } from 'react';
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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DiscussionImageLightbox } from '@/components/discussion/DiscussionImageLightbox';
import { cn } from '@/utils/classNames';
import { formatUserIdentity, getUserIdentityInitial } from '@/lib/identity';
import { researchApi, type ProjectDiscussionComment } from '@/lib/research.service';
import { ResearchSectionCard } from '../shared/ResearchSectionCard';

export interface ProjectDiscussionOutline {
  topicSummary: string;
  questions: string[];
  hypotheses: string[];
  basicPlan?: string;
  extendedPlan?: string;
}

export type ProjectDiscussionJumpSection = 'topic' | 'basic' | 'extended' | 'comments';

export interface ProjectDiscussionJumpTarget {
  section: ProjectDiscussionJumpSection;
  index?: number;
}

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
}

interface DiscussionTreeComment extends ProjectDiscussionComment {
  replies: DiscussionTreeComment[];
}

type DiscussionTopic = number | 'general';

type DraftAttachmentType = 'image' | 'video';

interface DraftAttachment {
  id: string;
  file: File;
  previewUrl: string;
  type: DraftAttachmentType;
}

const MAX_COMMENT_LENGTH = 2000;
const MAX_COMMENT_IMAGES = 6;
const MAX_COMMENT_VIDEOS = 2;
/** 首屏渲染的顶层讨论串数量；点击「展开更早的讨论」后每次追加同样数量 */
const INITIAL_VISIBLE_THREADS = 20;

function formatCommentTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function buildCommentTree(comments: ProjectDiscussionComment[]): DiscussionTreeComment[] {
  const grouped = new Map<string | null, ProjectDiscussionComment[]>();

  for (const comment of comments) {
    const siblings = grouped.get(comment.parent_comment_id) ?? [];
    siblings.push(comment);
    grouped.set(comment.parent_comment_id, siblings);
  }

  const buildBranch = (parentId: string | null): DiscussionTreeComment[] => {
    const siblings = [...(grouped.get(parentId) ?? [])];
    siblings.sort((left, right) => {
      const leftTime = new Date(left.created_at).getTime();
      const rightTime = new Date(right.created_at).getTime();
      return parentId === null ? rightTime - leftTime : leftTime - rightTime;
    });

    return siblings.map((comment) => ({
      ...comment,
      replies: buildBranch(comment.id),
    }));
  };

  return buildBranch(null);
}

function countReplies(comment: DiscussionTreeComment): number {
  return comment.replies.reduce((total, reply) => total + 1 + countReplies(reply), 0);
}

function countDiscussionComments(threads: DiscussionTreeComment[]): number {
  return threads.reduce((total, thread) => total + 1 + countReplies(thread), 0);
}

function getLatestDiscussionActivity(threads: DiscussionTreeComment[]): string | null {
  let latest: string | null = null;

  const visit = (comment: DiscussionTreeComment) => {
    const activityAt = comment.updated_at || comment.created_at;
    if (!latest || new Date(activityAt).getTime() > new Date(latest).getTime()) {
      latest = activityAt;
    }
    comment.replies.forEach(visit);
  };

  threads.forEach(visit);
  return latest;
}

function buildParentCommentLookup(
  comments: ProjectDiscussionComment[]
): Map<string, string | null> {
  const parentLookup = new Map<string, string | null>();

  for (const comment of comments) {
    parentLookup.set(comment.id, comment.parent_comment_id ?? null);
  }

  return parentLookup;
}

function findRootCommentId(
  commentId: string,
  parentLookup: Map<string, string | null>
): string {
  let rootId = commentId;
  let parentId = parentLookup.get(rootId) ?? null;

  while (parentId) {
    rootId = parentId;
    parentId = parentLookup.get(rootId) ?? null;
  }

  return rootId;
}

function expandCommentAncestors(
  commentId: string,
  parentLookup: Map<string, string | null>
): Record<string, boolean> {
  const expanded: Record<string, boolean> = {};
  let currentId: string | null = commentId;

  while (currentId) {
    expanded[currentId] = true;
    currentId = parentLookup.get(currentId) ?? null;
  }

  return expanded;
}

function revokeDraftAttachments(attachments: DraftAttachment[]): void {
  for (const attachment of attachments) {
    URL.revokeObjectURL(attachment.previewUrl);
  }
}

function isSupportedImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) {
    return true;
  }

  return /\.(jpe?g|png|gif|webp)$/i.test(file.name);
}

function isSupportedVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) {
    return true;
  }

  return /\.(mp4|webm|mov)$/i.test(file.name);
}

function getDraftAttachmentType(file: File): DraftAttachmentType | null {
  if (isSupportedImageFile(file)) {
    return 'image';
  }

  if (isSupportedVideoFile(file)) {
    return 'video';
  }

  return null;
}

function countDraftAttachments(attachments: DraftAttachment[]): Record<DraftAttachmentType, number> {
  return attachments.reduce(
    (counts, attachment) => ({
      ...counts,
      [attachment.type]: counts[attachment.type] + 1,
    }),
    { image: 0, video: 0 }
  );
}

function buildDraftAttachments(
  files: FileList | null,
  remainingImageSlots: number,
  remainingVideoSlots: number
): {
  acceptedAttachments: DraftAttachment[];
  invalidCount: number;
  imageOverflowCount: number;
  videoOverflowCount: number;
} {
  const selectedFiles = Array.from(files ?? []);
  const acceptedAttachments: DraftAttachment[] = [];
  let invalidCount = 0;
  let imageOverflowCount = 0;
  let videoOverflowCount = 0;
  let remainingImages = Math.max(remainingImageSlots, 0);
  let remainingVideos = Math.max(remainingVideoSlots, 0);

  for (const file of selectedFiles) {
    const type = getDraftAttachmentType(file);

    if (!type) {
      invalidCount += 1;
      continue;
    }

    if (type === 'image') {
      if (remainingImages <= 0) {
        imageOverflowCount += 1;
        continue;
      }
      remainingImages -= 1;
    }

    if (type === 'video') {
      if (remainingVideos <= 0) {
        videoOverflowCount += 1;
        continue;
      }
      remainingVideos -= 1;
    }

    acceptedAttachments.push({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      type,
    });
  }

  return {
    acceptedAttachments,
    invalidCount,
    imageOverflowCount,
    videoOverflowCount,
  };
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

function createFileListFromArray(files: File[]): FileList {
  const dataTransfer = new DataTransfer();
  files.forEach((file) => dataTransfer.items.add(file));
  return dataTransfer.files;
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
              className="block h-28 w-full overflow-hidden bg-[var(--glass-chip)]"
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
            <p className="truncate text-sm text-[var(--glass-text-muted)]">{attachment.file.name}</p>
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
  outline,
  jumpRequest,
}: ProjectDiscussionSectionProps) {
  const [comments, setComments] = useState<ProjectDiscussionComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openDiscussionTopic, setOpenDiscussionTopic] = useState<DiscussionTopic | null>(null);

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
  const newCommentTopicRef = useRef<DiscussionTopic | null>(null);
  const replyAttachmentsRef = useRef<Record<string, DraftAttachment[]>>({});
  const newCommentFileInputRef = useRef<HTMLInputElement | null>(null);
  const replyFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const commentTree = buildCommentTree(comments);
  const parentCommentLookup = buildParentCommentLookup(comments);
  const commentsById = new Map(comments.map((comment) => [comment.id, comment]));
  const questions = outline?.questions ?? [];
  const questionThreads = questions.map((_, questionIndex) =>
    commentTree.filter((comment) => comment.question_index === questionIndex)
  );
  const generalThreads = commentTree.filter((comment) => comment.question_index == null);

  useEffect(() => {
    newCommentAttachmentsRef.current = newCommentAttachments;
  }, [newCommentAttachments]);

  useEffect(() => {
    replyAttachmentsRef.current = replyAttachments;
  }, [replyAttachments]);

  useEffect(() => {
    return () => {
      revokeDraftAttachments(newCommentAttachmentsRef.current);
      Object.values(replyAttachmentsRef.current).forEach((attachments) => revokeDraftAttachments(attachments));
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
      revokeDraftAttachments(current);
      return [];
    });
  }

  function clearReplyDraft(commentId: string) {
    setReplyDrafts((current) => ({ ...current, [commentId]: '' }));
    setReplyError(null);
    setReplyAttachments((current) => {
      const existingAttachments = current[commentId] ?? [];
      revokeDraftAttachments(existingAttachments);
      const next = { ...current };
      delete next[commentId];
      return next;
    });
  }

  function resetDiscussionState() {
    newCommentTopicRef.current = null;
    setOpenDiscussionTopic(null);
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
      Object.values(current).forEach((attachments) => revokeDraftAttachments(attachments));
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
    let targetTopic: DiscussionTopic = 'general';

    if (targetCommentId && parentCommentLookup.has(targetCommentId)) {
      const rootComment = commentsById.get(findRootCommentId(targetCommentId, parentCommentLookup));
      if (
        typeof rootComment?.question_index === 'number'
        && rootComment.question_index >= 0
        && rootComment.question_index < questions.length
      ) {
        targetTopic = rootComment.question_index;
      }

      // 跳转目标可能在未渲染的更早讨论串里，先展开全部顶层讨论串
      setVisibleThreadCount((current) => Math.max(current, comments.length));
      setExpandedCommentIds((current) => ({
        ...current,
        ...expandCommentAncestors(targetCommentId, parentCommentLookup),
      }));
    }

    if (
      newCommentTopicRef.current !== null
      && newCommentTopicRef.current !== targetTopic
    ) {
      clearNewCommentComposer();
    }
    newCommentTopicRef.current = targetTopic;
    setOpenDiscussionTopic(targetTopic);
    const fallbackTargetId = targetTopic === 'general'
      ? 'discussion-comments'
      : `discussion-question-${targetTopic}`;

    const timer = window.setTimeout(() => {
      (document.getElementById(targetId) ?? document.getElementById(fallbackTargetId))?.scrollIntoView({
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
    questions.length,
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
      MAX_COMMENT_IMAGES - counts.image,
      MAX_COMMENT_VIDEOS - counts.video
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
      MAX_COMMENT_IMAGES - counts.image,
      MAX_COMMENT_VIDEOS - counts.video
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

  function handleNewCommentPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
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
      MAX_COMMENT_IMAGES - counts.image,
      MAX_COMMENT_VIDEOS - counts.video
    );

    if (acceptedAttachments.length > 0) {
      setNewCommentAttachments((current) => [...current, ...acceptedAttachments]);
    }

    setSubmitError(buildAttachmentSelectionMessage(invalidCount, imageOverflowCount, videoOverflowCount));
  }

  function handleReplyPaste(
    commentId: string,
    event: React.ClipboardEvent<HTMLTextAreaElement>
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
      MAX_COMMENT_IMAGES - counts.image,
      MAX_COMMENT_VIDEOS - counts.video
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
        ...(typeof openDiscussionTopic === 'number'
          ? { questionIndex: openDiscussionTopic }
          : {}),
      });
      clearNewCommentComposer();
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
            ? 'research-panel-soft rounded-lg p-3.5 md:p-4'
            : 'ml-4 border-l border-[var(--research-line)] pl-3.5 sm:ml-6 sm:pl-4'
        )}
      >
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--research-line)] bg-[var(--glass-chip)] text-sm font-semibold text-[var(--glass-text-muted)]">
            {getUserIdentityInitial(comment)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-base font-semibold text-[var(--paper-foreground)]">
                {displayUsername}
              </span>
              <span className="text-sm text-[var(--glass-text-muted)]">
                {formatCommentTime(comment.created_at)}
              </span>
              {isEdited && (
                <span className="rounded-md bg-[var(--glass-chip)] px-2 py-0.5 text-sm text-[var(--glass-text-muted)]">
                  已编辑
                </span>
              )}
              {comment.is_deleted && (
                <span className="rounded-full bg-[var(--glass-chip)] px-2 py-0.5 text-sm text-[var(--glass-text-muted)]">
                  已删除
                </span>
              )}
            </div>

            <div className="mt-1.5 text-base leading-6 text-[var(--paper-foreground)]">
              {comment.is_deleted ? (
                <span className="italic text-[var(--glass-text-muted)]">这条留言已删除</span>
              ) : isEditingThis ? (
                <div className="rounded-lg border border-[var(--research-line)] bg-[var(--research-head)] p-2.5">
                  <textarea
                    value={editDraft}
                    onChange={(event) => setEditDraft(event.target.value)}
                    rows={3}
                    maxLength={MAX_COMMENT_LENGTH}
                    autoFocus
                    aria-label="编辑留言内容"
                    className="research-input w-full resize-y rounded-xl px-3 py-2 text-base transition"
                  />
                  {(comment.image_urls.length > 0 || commentVideoUrls.length > 0) && (
                    <p className="mt-2 text-sm text-[var(--glass-text-muted)]">
                      编辑只修改文字，已上传的图片和视频保持不变。
                    </p>
                  )}
                  {editError && <p className="mt-2 text-sm text-[var(--color-destructive)]">{editError}</p>}
                  <div className="mt-2.5 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelEditingComment}
                      disabled={savingEditCommentId === comment.id}
                      className="glass-button rounded-full px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveEditedComment(comment)}
                      disabled={savingEditCommentId === comment.id}
                      className="glass-button glass-button-primary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {savingEditCommentId === comment.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Pencil className="h-3.5 w-3.5" />
                      )}
                      保存修改
                    </button>
                  </div>
                  <CommentMediaGrid
                    imageUrls={comment.image_urls}
                    videoUrls={commentVideoUrls}
                    username={displayUsername}
                    onPreview={(url, alt) => setLightboxImage({ url, alt })}
                  />
                </div>
              ) : (
                <>
                  {comment.content.trim() ? (
                    <p className="whitespace-pre-wrap break-words">{comment.content}</p>
                  ) : comment.image_urls.length > 0 || commentVideoUrls.length > 0 ? (
                    <p className="text-[var(--glass-text-muted)]">
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

            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-sm font-medium">
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
                  className="inline-flex items-center gap-1 text-[var(--paper-link)] transition-opacity hover:opacity-80"
                >
                  <Reply className="h-3.5 w-3.5" />
                  回复
                </button>
              )}

              {canEditComment(comment) && !isEditingThis && (
                <button
                  type="button"
                  onClick={() => startEditingComment(comment)}
                  className="inline-flex items-center gap-1 text-[var(--paper-link)] transition-opacity hover:opacity-80"
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
                  className="inline-flex items-center gap-1 text-[var(--color-destructive)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="inline-flex items-center gap-1 rounded-md bg-[var(--glass-chip)] px-2.5 py-1 text-[var(--paper-foreground)] transition-colors hover:bg-[var(--research-head)]"
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
              <div className="mt-3 rounded-lg border border-[var(--research-line)] bg-[var(--research-head)] p-2.5">
                <textarea
                  value={replyDraft}
                  onChange={(event) => {
                    const value = event.target.value;
                    setReplyDrafts((current) => ({ ...current, [comment.id]: value }));
                  }}
                  onPaste={(event) => handleReplyPaste(comment.id, event)}
                  rows={2}
                  maxLength={MAX_COMMENT_LENGTH}
                  placeholder="补充你的看法、建议或追问（支持 Ctrl+V 粘贴图片）"
                  className="research-input w-full resize-y rounded-xl px-3 py-2 text-base transition"
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

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => replyFileInputRefs.current[comment.id]?.click()}
                    disabled={
                      (attachedReplyCounts.image >= MAX_COMMENT_IMAGES
                        && attachedReplyCounts.video >= MAX_COMMENT_VIDEOS)
                      || submittingReplyToId === comment.id
                    }
                    className="glass-button inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ImagePlus className="h-3.5 w-3.5 text-[var(--paper-link)]" />
                    添加附件
                  </button>
                  <span className="text-sm text-[var(--glass-text-muted)]">
                    最多 {MAX_COMMENT_IMAGES} 张图片、{MAX_COMMENT_VIDEOS} 个视频
                  </span>
                </div>

                <DraftAttachmentPreviewList
                  attachments={attachedReplyAttachments}
                  onRemove={(attachmentId) => handleRemoveReplyAttachment(comment.id, attachmentId)}
                  onPreview={(attachment) =>
                    setLightboxImage({ url: attachment.previewUrl, alt: attachment.file.name })
                  }
                />

                {replyError && <p className="mt-2 text-sm text-[var(--color-destructive)]">{replyError}</p>}

                <div className="mt-2.5 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyTargetId(null);
                      setReplyError(null);
                    }}
                    className="glass-button rounded-full px-3 py-1.5 text-sm font-medium"
                  >
                    收起
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSubmitReply(comment.id)}
                    disabled={submittingReplyToId === comment.id}
                    className="glass-button glass-button-primary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
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
            )}
          </div>
        </div>

        {hasReplies && isRepliesExpanded && (
          <div className="mt-3 space-y-2.5">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  const newCommentAttachmentCounts = countDraftAttachments(newCommentAttachments);

  function toggleDiscussionTopic(topic: DiscussionTopic) {
    if (openDiscussionTopic === topic) {
      setOpenDiscussionTopic(null);
    } else {
      if (
        newCommentTopicRef.current !== null
        && newCommentTopicRef.current !== topic
      ) {
        clearNewCommentComposer();
      }
      newCommentTopicRef.current = topic;
      setOpenDiscussionTopic(topic);
    }
    setVisibleThreadCount(INITIAL_VISIBLE_THREADS);
    setReplyTargetId(null);
    setReplyError(null);
    setDeleteError(null);
  }

  function renderDiscussionContent(topic: DiscussionTopic, threads: DiscussionTreeComment[]) {
    const visibleThreads = threads.slice(0, visibleThreadCount);
    const hiddenThreadCount = Math.max(threads.length - visibleThreads.length, 0);
    const contentId = topic === 'general' ? 'discussion-comments' : `discussion-question-${topic}`;

    return (
      <div
        id={contentId}
        role="region"
        aria-labelledby={`${contentId}-trigger`}
        className="scroll-mt-28 border-t border-[var(--research-line)] bg-[var(--research-surface)] p-3 sm:p-4"
      >
        <div className="research-panel-soft rounded-lg p-4">
          <textarea
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            onPaste={handleNewCommentPaste}
            rows={3}
            maxLength={MAX_COMMENT_LENGTH}
            disabled={!canParticipate || isSubmitting}
            placeholder={
              canParticipate
                ? topic === 'general'
                  ? '写下你的问题、观察或建议…（支持 Ctrl+V 粘贴图片）'
                  : '写下你的答案或新观点…（支持 Ctrl+V 粘贴图片）'
                : '只有课题成员可以参与讨论'
            }
            className="research-input w-full resize-y rounded-xl px-4 py-3 text-base transition disabled:cursor-not-allowed disabled:opacity-70"
          />

          <input
            ref={newCommentFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
            multiple
            className="hidden"
            onChange={handleNewCommentAttachmentSelection}
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
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
              className="glass-button inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-base font-medium disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ImagePlus className="h-4 w-4 text-[var(--paper-link)]" />
              <Video className="h-4 w-4 text-[var(--paper-link)]" />
              添加附件
            </button>
            <span className="text-sm text-[var(--glass-text-muted)]">
              最多 {MAX_COMMENT_IMAGES} 张图片、{MAX_COMMENT_VIDEOS} 个视频
            </span>
          </div>

          <DraftAttachmentPreviewList
            attachments={newCommentAttachments}
            onRemove={handleRemoveNewCommentAttachment}
            onPreview={(attachment) =>
              setLightboxImage({ url: attachment.previewUrl, alt: attachment.file.name })
            }
          />

          {submitError && <p className="mt-2 text-base text-[var(--color-destructive)]">{submitError}</p>}
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => void handleSubmitComment()}
              disabled={!canParticipate || isSubmitting}
              className="glass-button glass-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
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
          <div className="research-error mt-4 rounded-2xl px-4 py-3 text-base">
            {deleteError}
          </div>
        )}

        <div className="mt-4">
          {isLoading ? (
            <div className="research-panel-soft flex items-center justify-center gap-3 rounded-2xl px-4 py-8 text-base text-[var(--glass-text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在加载讨论内容
            </div>
          ) : loadError ? (
            <div className="research-error rounded-2xl px-4 py-4 text-base">
              {loadError}
            </div>
          ) : threads.length === 0 ? (
            <div className="research-panel-soft rounded-2xl px-4 py-8 text-center">
              <p className="text-base font-medium text-[var(--paper-foreground)]">
                还没有人开场，来发第一条讨论吧。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleThreads.map((comment) => renderComment(comment))}

              {hiddenThreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => setVisibleThreadCount((current) => current + INITIAL_VISIBLE_THREADS)}
                  className="glass-button flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-medium"
                >
                  展开更早的讨论（还有 {hiddenThreadCount} 条）
                  <ChevronDown className="h-4 w-4 text-[var(--paper-link)]" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderDiscussionRow(
    topic: DiscussionTopic,
    label: string,
    threads: DiscussionTreeComment[]
  ) {
    const isOpen = openDiscussionTopic === topic;
    const contentId = topic === 'general' ? 'discussion-comments' : `discussion-question-${topic}`;
    const discussionCount = countDiscussionComments(threads);
    const latestActivity = getLatestDiscussionActivity(threads);

    return (
      <div
        key={topic}
        className="overflow-hidden rounded-lg border border-[var(--research-line)] bg-[var(--research-head)]"
      >
        <button
          id={`${contentId}-trigger`}
          type="button"
          onClick={() => toggleDiscussionTopic(topic)}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[var(--glass-chip)]"
        >
          <div className="min-w-0 flex-1">
            {typeof topic === 'number' && (
              <span className="mb-1 block text-sm font-semibold text-[var(--glass-text-muted)]">
                核心问题 {topic + 1}
              </span>
            )}
            <p className="text-base font-semibold leading-6 text-[var(--paper-foreground)]">
              {label}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-[var(--glass-text-muted)]">
              <span>{discussionCount} 条讨论</span>
              <span>
                {isLoading
                  ? '正在同步'
                  : latestActivity
                    ? `最近活动 ${formatCommentTime(latestActivity)}`
                    : '暂无活动'}
              </span>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'h-5 w-5 shrink-0 text-[var(--glass-text-muted)] transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>
        {isOpen && renderDiscussionContent(topic, threads)}
      </div>
    );
  }

  return (
    <>
      <ResearchSectionCard
        title="课题讨论区"
        note="围绕研究问题展开的组内讨论"
        actions={
          <span className="research-chip rounded-md px-3 py-1 text-sm font-semibold tabular-nums">
            {comments.length} 条讨论
          </span>
        }
      >
        <div className="space-y-2.5">
          {questions.map((question, questionIndex) =>
            renderDiscussionRow(questionIndex, question, questionThreads[questionIndex])
          )}
          {renderDiscussionRow('general', '其它讨论', generalThreads)}
        </div>
      </ResearchSectionCard>

      <ConfirmDialog
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
