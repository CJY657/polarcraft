import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  ChevronDown,
  ImagePlus,
  Loader2,
  LogIn,
  MessageSquare,
  Reply,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DiscussionImageLightbox } from "@/components/discussion/DiscussionImageLightbox";
import { useAuth } from "@/contexts/AuthContext";
import { courseApi, type CourseDiscussionComment } from "@/lib/course.service";
import { formatUserIdentity, getUserIdentityInitial } from "@/lib/identity";
import { useAuthDialogStore } from "@/stores/authDialogStore";
import { cn } from "@/utils/classNames";

interface DiscussionResourceQuestion {
  id: string;
  title: string;
}

interface ExperimentDiscussionSectionProps {
  courseId: string;
  courseTitle: string;
  theme: "dark" | "light";
  accentColor?: string;
  questionResource?: DiscussionResourceQuestion | null;
  questionSignal?: number;
  onResourceClick?: (resourceId: string) => void;
}

interface DiscussionTreeComment extends CourseDiscussionComment {
  replies: DiscussionTreeComment[];
}

interface DraftImage {
  id: string;
  file: File;
  previewUrl: string;
}

const MAX_COMMENT_LENGTH = 2000;
const MAX_COMMENT_IMAGES = 6;
const ZH_COMMENT_TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const EN_COMMENT_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatCommentTime(value: string, locale: string): string {
  const formatter = locale === "zh-CN" ? ZH_COMMENT_TIME_FORMATTER : EN_COMMENT_TIME_FORMATTER;
  return formatter.format(new Date(value));
}

function buildCommentTree(comments: CourseDiscussionComment[]): DiscussionTreeComment[] {
  const grouped = new Map<string | null, CourseDiscussionComment[]>();

  for (const comment of comments) {
    const siblings = grouped.get(comment.parentCommentId) ?? [];
    siblings.push(comment);
    grouped.set(comment.parentCommentId, siblings);
  }

  const buildBranch = (parentId: string | null): DiscussionTreeComment[] => {
    const siblings = [...(grouped.get(parentId) ?? [])];
    siblings.sort((left, right) => {
      const leftTime = new Date(left.createdAt).getTime();
      const rightTime = new Date(right.createdAt).getTime();
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

function buildParentCommentLookup(
  comments: CourseDiscussionComment[],
): Map<string, string | null> {
  const lookup = new Map<string, string | null>();

  for (const comment of comments) {
    lookup.set(comment.id, comment.parentCommentId ?? null);
  }

  return lookup;
}

function expandCommentAncestors(
  commentId: string,
  parentLookup: Map<string, string | null>,
): Record<string, boolean> {
  const expanded: Record<string, boolean> = {};
  let current: string | null = commentId;

  while (current) {
    expanded[current] = true;
    current = parentLookup.get(current) ?? null;
  }

  return expanded;
}

function revokeDraftImages(images: DraftImage[]): void {
  for (const image of images) {
    URL.revokeObjectURL(image.previewUrl);
  }
}

function isSupportedImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return true;
  }

  return /\.(jpe?g|png|gif|webp)$/i.test(file.name);
}

function buildDraftImages(
  files: FileList | null,
  remainingSlots: number,
): {
  acceptedImages: DraftImage[];
  invalidCount: number;
  overflowCount: number;
} {
  const selectedFiles = Array.from(files ?? []);
  const imageFiles = selectedFiles.filter(isSupportedImageFile);
  const acceptedFiles = imageFiles.slice(0, Math.max(remainingSlots, 0));

  return {
    acceptedImages: acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    })),
    invalidCount: selectedFiles.length - imageFiles.length,
    overflowCount: Math.max(imageFiles.length - acceptedFiles.length, 0),
  };
}

function buildImageSelectionMessage(
  invalidCount: number,
  overflowCount: number,
  isZh: boolean,
): string | null {
  const messages: string[] = [];

  if (invalidCount > 0) {
    messages.push(
      isZh
        ? "只支持 JPG、PNG、GIF、WebP 图片"
        : "Only JPG, PNG, GIF, and WebP images are supported",
    );
  }

  if (overflowCount > 0) {
    messages.push(
      isZh
        ? `单条评论最多添加 ${MAX_COMMENT_IMAGES} 张图片`
        : `A comment can include at most ${MAX_COMMENT_IMAGES} images`,
    );
  }

  return messages.length > 0 ? messages.join(isZh ? "；" : "; ") : null;
}

// 将 File 数组转换为类似 FileList 的结构供 buildDraftImages 使用
function createFileListFromArray(files: File[]): FileList {
  const dataTransfer = new DataTransfer();
  files.forEach((file) => dataTransfer.items.add(file));
  return dataTransfer.files;
}

function DraftImagePreviewList({
  images,
  onRemove,
  onPreview,
  theme,
}: {
  images: DraftImage[];
  onRemove: (imageId: string) => void;
  onPreview: (image: DraftImage) => void;
  theme: "dark" | "light";
}) {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {images.map((image) => (
        <div
          key={image.id}
          className={cn(
            "group relative overflow-hidden rounded-[1rem] border",
            theme === "dark" ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white",
          )}
        >
          <button
            type="button"
            onClick={() => onPreview(image)}
            className="block h-28 w-full overflow-hidden bg-slate-100"
          >
            <img
              src={image.previewUrl}
              alt={image.file.name}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            />
          </button>
          <button
            type="button"
            onClick={() => onRemove(image.id)}
            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/68 text-white transition hover:bg-black/82"
            aria-label="remove image"
          >
            <X className="h-4 w-4" />
          </button>
          <div
            className={cn(
              "border-t px-2.5 py-2",
              theme === "dark" ? "border-slate-700" : "border-slate-100",
            )}
          >
            <p
              className={cn(
                "truncate text-xs",
                theme === "dark" ? "text-slate-300" : "text-slate-500",
              )}
            >
              {image.file.name}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CommentImageGrid({
  imageUrls,
  username,
  onPreview,
  theme,
}: {
  imageUrls: string[];
  username: string;
  onPreview: (url: string, alt: string) => void;
  theme: "dark" | "light";
}) {
  if (imageUrls.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 grid max-w-[28rem] grid-cols-2 gap-2 sm:grid-cols-3">
      {imageUrls.map((url, index) => (
        <button
          key={`${url}-${index}`}
          type="button"
          onClick={() => onPreview(url, `${username || "user"} image ${index + 1}`)}
          className={cn(
            "group overflow-hidden rounded-[1rem] border transition hover:-translate-y-0.5",
            theme === "dark"
              ? "border-slate-700 bg-slate-900/80"
              : "border-slate-200 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.06)]",
          )}
        >
          <img
            src={url}
            alt={`${username || "user"} image ${index + 1}`}
            loading="lazy"
            className="h-28 w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        </button>
      ))}
    </div>
  );
}

export function ExperimentDiscussionSection({
  courseId,
  courseTitle,
  theme,
  accentColor = "#C9A227",
  questionResource = null,
  questionSignal = 0,
  onResourceClick,
}: ExperimentDiscussionSectionProps) {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const openDialog = useAuthDialogStore((state) => state.openDialog);
  const isZh = i18n.language.startsWith("zh");
  const locale = isZh ? "zh-CN" : "en-US";

  const [comments, setComments] = useState<CourseDiscussionComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState("");
  const [newCommentImages, setNewCommentImages] = useState<DraftImage[]>([]);
  const [questionTarget, setQuestionTarget] = useState<DiscussionResourceQuestion | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyImages, setReplyImages] = useState<Record<string, DraftImage[]>>({});
  const [replyError, setReplyError] = useState<string | null>(null);
  const [submittingReplyToId, setSubmittingReplyToId] = useState<string | null>(null);

  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expandedCommentIds, setExpandedCommentIds] = useState<Record<string, boolean>>({});
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);

  // 拖拽状态
  const [isDraggingNewComment, setIsDraggingNewComment] = useState(false);
  const [isDraggingReply, setIsDraggingReply] = useState<Record<string, boolean>>({});

  const newCommentImagesRef = useRef<DraftImage[]>([]);
  const replyImagesRef = useRef<Record<string, DraftImage[]>>({});
  const newCommentFileInputRef = useRef<HTMLInputElement | null>(null);
  const replyFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const canParticipate = Boolean(user);
  const { commentTree, parentCommentLookup } = useMemo(() => ({
    commentTree: buildCommentTree(comments),
    parentCommentLookup: buildParentCommentLookup(comments),
  }), [comments]);

  useEffect(() => {
    newCommentImagesRef.current = newCommentImages;
  }, [newCommentImages]);

  useEffect(() => {
    replyImagesRef.current = replyImages;
  }, [replyImages]);

  useEffect(() => {
    return () => {
      revokeDraftImages(newCommentImagesRef.current);
      Object.values(replyImagesRef.current).forEach((images) => revokeDraftImages(images));
    };
  }, []);

  useEffect(() => {
    if (!questionResource) {
      return;
    }

    setQuestionTarget(questionResource);
    setSubmitError(null);
    setReplyTargetId(null);
    setReplyError(null);
  }, [questionSignal, questionResource?.id, questionResource?.title, questionResource]);

  async function loadComments() {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await courseApi.getPublicDiscussionComments(courseId);
      setComments(data);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : isZh
            ? "加载讨论失败"
            : "Failed to load discussion",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setReplyTargetId(null);
    setReplyDrafts({});
    setReplyError(null);
    setDeleteError(null);
    setExpandedCommentIds({});
    setLightboxImage(null);
    setQuestionTarget(questionResource);
    setNewComment("");
    setSubmitError(null);
    setNewCommentImages((current) => {
      revokeDraftImages(current);
      return [];
    });
    setReplyImages((current) => {
      Object.values(current).forEach((images) => revokeDraftImages(images));
      return {};
    });
    void loadComments();
  }, [courseId]);

  function getResourceLabel(comment: CourseDiscussionComment): string | null {
    if (!comment.resourceTitle) {
      return null;
    }

    if (isZh) {
      return comment.resourceTitle["zh-CN"] ?? comment.resourceTitle["en-US"] ?? null;
    }

    return comment.resourceTitle["en-US"] ?? comment.resourceTitle["zh-CN"] ?? null;
  }

  async function uploadDraftImages(images: DraftImage[]): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (const image of images) {
      const result = await courseApi.uploadDiscussionImage(courseId, image.file);
      uploadedUrls.push(result.url);
    }

    return uploadedUrls;
  }

  function clearNewCommentComposer() {
    setNewComment("");
    setSubmitError(null);
    setNewCommentImages((current) => {
      revokeDraftImages(current);
      return [];
    });
  }

  function clearReplyDraft(commentId: string) {
    setReplyDrafts((current) => ({ ...current, [commentId]: "" }));
    setReplyError(null);
    setReplyImages((current) => {
      const existing = current[commentId] ?? [];
      revokeDraftImages(existing);
      const next = { ...current };
      delete next[commentId];
      return next;
    });
  }

  function handleNewCommentImageSelection(event: ChangeEvent<HTMLInputElement>) {
    const { acceptedImages, invalidCount, overflowCount } = buildDraftImages(
      event.target.files,
      MAX_COMMENT_IMAGES - newCommentImages.length,
    );

    if (acceptedImages.length > 0) {
      setNewCommentImages((current) => [...current, ...acceptedImages]);
    }

    const nextMessage = buildImageSelectionMessage(invalidCount, overflowCount, isZh);
    setSubmitError(nextMessage);
    event.target.value = "";
  }

  function handleReplyImageSelection(commentId: string, event: ChangeEvent<HTMLInputElement>) {
    const currentImages = replyImages[commentId] ?? [];
    const { acceptedImages, invalidCount, overflowCount } = buildDraftImages(
      event.target.files,
      MAX_COMMENT_IMAGES - currentImages.length,
    );

    if (acceptedImages.length > 0) {
      setReplyImages((current) => ({
        ...current,
        [commentId]: [...(current[commentId] ?? []), ...acceptedImages],
      }));
    }

    const nextMessage = buildImageSelectionMessage(invalidCount, overflowCount, isZh);
    setReplyError(nextMessage);
    event.target.value = "";
  }

  function handleRemoveNewCommentImage(imageId: string) {
    setNewCommentImages((current) => {
      const imageToRemove = current.find((image) => image.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      return current.filter((image) => image.id !== imageId);
    });
  }

  function handleRemoveReplyImage(commentId: string, imageId: string) {
    setReplyImages((current) => {
      const existingImages = current[commentId] ?? [];
      const imageToRemove = existingImages.find((image) => image.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      const nextImages = existingImages.filter((image) => image.id !== imageId);
      if (nextImages.length === 0) {
        const next = { ...current };
        delete next[commentId];
        return next;
      }

      return {
        ...current,
        [commentId]: nextImages,
      };
    });
  }

  // 处理拖拽图片 - 新评论
  function handleNewCommentDrop(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingNewComment(false);

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const { acceptedImages, invalidCount, overflowCount } = buildDraftImages(
      files,
      MAX_COMMENT_IMAGES - newCommentImages.length,
    );

    if (acceptedImages.length > 0) {
      setNewCommentImages((current) => [...current, ...acceptedImages]);
    }

    const nextMessage = buildImageSelectionMessage(invalidCount, overflowCount, isZh);
    setSubmitError(nextMessage);
  }

  // 处理拖拽图片 - 回复
  function handleReplyDrop(commentId: string, event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingReply((current) => ({ ...current, [commentId]: false }));

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const currentImages = replyImages[commentId] ?? [];
    const { acceptedImages, invalidCount, overflowCount } = buildDraftImages(
      files,
      MAX_COMMENT_IMAGES - currentImages.length,
    );

    if (acceptedImages.length > 0) {
      setReplyImages((current) => ({
        ...current,
        [commentId]: [...(current[commentId] ?? []), ...acceptedImages],
      }));
    }

    const nextMessage = buildImageSelectionMessage(invalidCount, overflowCount, isZh);
    setReplyError(nextMessage);
  }

  // 处理粘贴图片 - 新评论
  function handleNewCommentPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = event.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length === 0) return;

    // 阻止默认粘贴行为（避免图片数据被粘贴为文本）
    event.preventDefault();

    const fileList = createFileListFromArray(imageFiles);
    const { acceptedImages, invalidCount, overflowCount } = buildDraftImages(
      fileList,
      MAX_COMMENT_IMAGES - newCommentImages.length,
    );

    if (acceptedImages.length > 0) {
      setNewCommentImages((current) => [...current, ...acceptedImages]);
    }

    const nextMessage = buildImageSelectionMessage(invalidCount, overflowCount, isZh);
    setSubmitError(nextMessage);
  }

  // 处理粘贴图片 - 回复
  function handleReplyPaste(commentId: string, event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = event.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length === 0) return;

    // 阻止默认粘贴行为
    event.preventDefault();

    const currentImages = replyImages[commentId] ?? [];
    const fileList = createFileListFromArray(imageFiles);
    const { acceptedImages, invalidCount, overflowCount } = buildDraftImages(
      fileList,
      MAX_COMMENT_IMAGES - currentImages.length,
    );

    if (acceptedImages.length > 0) {
      setReplyImages((current) => ({
        ...current,
        [commentId]: [...(current[commentId] ?? []), ...acceptedImages],
      }));
    }

    const nextMessage = buildImageSelectionMessage(invalidCount, overflowCount, isZh);
    setReplyError(nextMessage);
  }

  async function handleSubmitComment() {
    if (!canParticipate) {
      openDialog("login");
      return;
    }

    const content = newComment.trim();
    if (!content && newCommentImages.length === 0) {
      setSubmitError(
        isZh ? "请输入留言内容或至少添加一张图片" : "Please enter text or attach at least one image",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const imageUrls = await uploadDraftImages(newCommentImages);
      await courseApi.addDiscussionComment(courseId, {
        content,
        imageUrls,
        resourceId: questionTarget?.id,
      });
      clearNewCommentComposer();
      setQuestionTarget(null);
      await loadComments();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : isZh ? "发布留言失败" : "Failed to post comment",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitReply(parentCommentId: string) {
    if (!canParticipate) {
      openDialog("login");
      return;
    }

    const content = (replyDrafts[parentCommentId] ?? "").trim();
    const currentReplyImages = replyImages[parentCommentId] ?? [];

    if (!content && currentReplyImages.length === 0) {
      setReplyError(
        isZh ? "请输入回复内容或至少添加一张图片" : "Please enter a reply or attach at least one image",
      );
      return;
    }

    try {
      setSubmittingReplyToId(parentCommentId);
      setReplyError(null);
      const imageUrls = await uploadDraftImages(currentReplyImages);
      await courseApi.addDiscussionComment(courseId, {
        content,
        parentCommentId,
        imageUrls,
      });
      clearReplyDraft(parentCommentId);
      setReplyTargetId(null);
      setExpandedCommentIds((current) => ({
        ...current,
        ...expandCommentAncestors(parentCommentId, parentCommentLookup),
      }));
      await loadComments();
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : isZh ? "回复失败" : "Failed to reply");
    } finally {
      setSubmittingReplyToId(null);
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      setDeletingCommentId(commentId);
      setDeleteError(null);
      await courseApi.deleteDiscussionComment(commentId);
      await loadComments();
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : isZh
            ? "删除留言失败，请稍后再试"
            : "Failed to delete comment",
      );
    } finally {
      setDeletingCommentId(null);
    }
  }

  function canDeleteComment(comment: CourseDiscussionComment): boolean {
    if (comment.isDeleted || !user) {
      return false;
    }

    return comment.userId === user.id || user.role === "admin";
  }

  function renderComment(comment: DiscussionTreeComment, depth = 0) {
    const isReplying = replyTargetId === comment.id;
    const replyDraft = replyDrafts[comment.id] ?? "";
    const attachedReplyImages = replyImages[comment.id] ?? [];
    const hasReplies = comment.replies.length > 0;
    const totalReplyCount = countReplies(comment);
    const isRepliesExpanded = expandedCommentIds[comment.id] ?? depth > 0;
    const displayUsername = formatUserIdentity(comment, isZh ? "未命名用户" : "Unknown user");
    const resourceLabel = getResourceLabel(comment);

    return (
      <div
        key={comment.id}
        className={cn(
          "relative",
          depth === 0
            ? theme === "dark"
              ? "rounded-[1.25rem] border border-slate-700 bg-slate-900/75 p-3.5 md:p-4"
              : "rounded-[1.25rem] border border-slate-200 bg-white p-3.5 shadow-[0_12px_28px_rgba(15,23,42,0.05)] md:p-4"
            : theme === "dark"
              ? "ml-4 border-l border-slate-700 pl-3.5 sm:ml-6 sm:pl-4"
              : "ml-4 border-l border-slate-200 pl-3.5 sm:ml-6 sm:pl-4",
        )}
      >
        <div className="flex items-start gap-2.5">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              theme === "dark" ? "bg-slate-800 text-slate-100" : "bg-amber-50 text-slate-900",
            )}
            style={theme === "light" ? { border: `1px solid ${accentColor}` } : undefined}
          >
            {getUserIdentityInitial(comment)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                className={cn(
                  "text-sm font-semibold",
                  theme === "dark" ? "text-slate-100" : "text-slate-900",
                )}
              >
                {displayUsername}
              </span>
              {comment.userId === user?.id && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    theme === "dark" ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600",
                  )}
                >
                  {isZh ? "你" : "You"}
                </span>
              )}
              <span
                className={cn(
                  "text-xs",
                  theme === "dark" ? "text-slate-400" : "text-slate-500",
                )}
              >
                {formatCommentTime(comment.createdAt, locale)}
              </span>
              {comment.isDeleted && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    theme === "dark" ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500",
                  )}
                >
                  {isZh ? "已删除" : "Deleted"}
                </span>
              )}
              {resourceLabel && !comment.isDeleted && (
                <button
                  type="button"
                  onClick={() => {
                    if (comment.resourceId && onResourceClick) {
                      onResourceClick(comment.resourceId);
                    }
                  }}
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-opacity",
                    onResourceClick && comment.resourceId
                      ? "cursor-pointer hover:opacity-80"
                      : "cursor-default",
                    theme === "dark"
                      ? "bg-cyan-500/15 text-cyan-300"
                      : "bg-cyan-50 text-cyan-700",
                  )}
                  disabled={!onResourceClick || !comment.resourceId}
                >
                  {isZh ? "资源：" : "Resource:"} {resourceLabel}
                </button>
              )}
            </div>

            <div
              className={cn(
                "mt-1.5 text-sm leading-6",
                theme === "dark" ? "text-slate-200" : "text-slate-700",
              )}
            >
              {comment.isDeleted ? (
                <span className={cn("italic", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                  {isZh ? "这条留言已删除" : "This comment has been deleted"}
                </span>
              ) : (
                <>
                  {comment.content.trim() ? (
                    <p className="whitespace-pre-wrap break-words">{comment.content}</p>
                  ) : comment.imageUrls.length > 0 ? (
                    <p className={cn(theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                      {isZh ? `发送了 ${comment.imageUrls.length} 张图片` : `Posted ${comment.imageUrls.length} images`}
                    </p>
                  ) : null}
                  <CommentImageGrid
                    imageUrls={comment.imageUrls}
                    username={displayUsername}
                    onPreview={(url, alt) => setLightboxImage({ url, alt })}
                    theme={theme}
                  />
                </>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs font-medium">
              {canParticipate && !comment.isDeleted && (
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
                  className={cn(
                    "inline-flex items-center gap-1 transition-opacity hover:opacity-80",
                    theme === "dark" ? "text-cyan-300" : "text-cyan-700",
                  )}
                >
                  <Reply className="h-3.5 w-3.5" />
                  {isZh ? "回复" : "Reply"}
                </button>
              )}

              {canDeleteComment(comment) && (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(comment.id)}
                  disabled={deletingCommentId === comment.id}
                  className="inline-flex items-center gap-1 text-[#b33d3d] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingCommentId === comment.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  {isZh ? "删除" : "Delete"}
                </button>
              )}

              {hasReplies && (
                <button
                  type="button"
                  onClick={() => {
                    setExpandedCommentIds((current) => ({
                      ...current,
                      [comment.id]: !(current[comment.id] ?? depth > 0),
                    }));
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors",
                    theme === "dark"
                      ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  )}
                >
                  {isRepliesExpanded
                    ? isZh
                      ? `收起 ${totalReplyCount} 条回复`
                      : `Collapse ${totalReplyCount} replies`
                    : isZh
                      ? `展开 ${totalReplyCount} 条回复`
                      : `Expand ${totalReplyCount} replies`}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      isRepliesExpanded && "rotate-180",
                    )}
                  />
                </button>
              )}
            </div>

            {isReplying && canParticipate && (
              <div
                className={cn(
                  "mt-3 rounded-[1rem] border p-2.5",
                  theme === "dark"
                    ? "border-slate-700 bg-slate-900/60"
                    : "border-slate-200 bg-slate-50/80",
                )}
              >
                {/* 可拖拽区域包裹回复输入框 */}
                <div
                  className={cn(
                    "relative rounded-[0.9rem] transition",
                    isDraggingReply[comment.id] && (theme === "dark" 
                      ? "ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-slate-900" 
                      : "ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-white"),
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingReply((current) => ({ ...current, [comment.id]: true }));
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setIsDraggingReply((current) => ({ ...current, [comment.id]: false }));
                    }
                  }}
                  onDrop={(e) => handleReplyDrop(comment.id, e)}
                >
                  <textarea
                    value={replyDraft}
                    onChange={(event) => {
                      const value = event.target.value;
                      setReplyDrafts((current) => ({ ...current, [comment.id]: value }));
                    }}
                    onPaste={(e) => handleReplyPaste(comment.id, e)}
                    rows={2}
                    maxLength={MAX_COMMENT_LENGTH}
                    placeholder={isZh ? "补充你的看法、建议或追问（支持拖拽或粘贴图片）" : "Add your follow-up (drag or paste images)"}
                    className={cn(
                      "w-full resize-y rounded-[0.9rem] border px-3 py-2 text-sm outline-none transition",
                      theme === "dark"
                        ? "border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500 focus:border-slate-500"
                        : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-400",
                    )}
                  />
                  {isDraggingReply[comment.id] && (
                    <div
                      className={cn(
                        "absolute inset-0 flex items-center justify-center rounded-[0.9rem] pointer-events-none",
                        theme === "dark" ? "bg-cyan-500/10" : "bg-cyan-50/80",
                      )}
                    >
                      <span className={cn(
                        "text-sm font-medium",
                        theme === "dark" ? "text-cyan-300" : "text-cyan-700",
                      )}>
                        {isZh ? "松开鼠标上传图片" : "Drop to upload images"}
                      </span>
                    </div>
                  )}
                </div>

                <input
                  ref={(node) => {
                    replyFileInputRefs.current[comment.id] = node;
                  }}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  className="hidden"
                  onChange={(event) => handleReplyImageSelection(comment.id, event)}
                />

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => replyFileInputRefs.current[comment.id]?.click()}
                    disabled={
                      attachedReplyImages.length >= MAX_COMMENT_IMAGES ||
                      submittingReplyToId === comment.id
                    }
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60",
                      theme === "dark"
                        ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                    )}
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    {isZh ? "添加图片" : "Add image"}
                  </button>
                  <span className={cn("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                    {isZh
                      ? `最多 ${MAX_COMMENT_IMAGES} 张图片`
                      : `Up to ${MAX_COMMENT_IMAGES} images`}
                  </span>
                </div>

                <DraftImagePreviewList
                  images={attachedReplyImages}
                  onRemove={(imageId) => handleRemoveReplyImage(comment.id, imageId)}
                  onPreview={(image) =>
                    setLightboxImage({ url: image.previewUrl, alt: image.file.name })
                  }
                  theme={theme}
                />

                {replyError && <p className="mt-2 text-xs text-[#b33d3d]">{replyError}</p>}

                <div className="mt-2.5 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyTargetId(null);
                      setReplyError(null);
                    }}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium",
                      theme === "dark"
                        ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                    )}
                  >
                    {isZh ? "收起" : "Close"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSubmitReply(comment.id)}
                    disabled={submittingReplyToId === comment.id}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                    style={{ backgroundColor: accentColor }}
                  >
                    {submittingReplyToId === comment.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    {isZh ? "发送回复" : "Send reply"}
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

  const prompts = isZh
    ? ["追问某一页课件", "补充实验现象", "提出改进建议"]
    : ["Ask about a slide", "Add an observation", "Suggest an improvement"];

  return (
    <>
      <section className="px-2 pb-2 pt-2 xl:px-4">
        <div
          className={cn(
            "overflow-hidden rounded-[22px] border",
            theme === "dark"
              ? "border-slate-700/70 bg-slate-900/70"
              : "border-slate-200 bg-white",
          )}
        >
          <div className="grid gap-0 lg:grid-cols-[0.92fr_1.18fr]">
            <div
              className={cn(
                "border-b px-4 py-3 sm:px-5 sm:py-4 lg:border-b-0 lg:border-r",
                theme === "dark"
                  ? "border-slate-700/70 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_46%),linear-gradient(180deg,rgba(15,23,42,0.8),rgba(15,23,42,0.92))]"
                  : "border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_42%),linear-gradient(180deg,rgba(255,251,235,0.92),rgba(255,255,255,0.98))]",
              )}
            >
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                <span className="h-px w-8" style={{ backgroundColor: accentColor }} />
                <span style={{ color: accentColor }}>{isZh ? "实验讨论" : "Discussion"}</span>
              </div>
              <h2
                className={cn(
                  "mt-3 text-xl font-semibold leading-tight",
                  theme === "dark" ? "text-white" : "text-slate-900",
                )}
              >
                {isZh ? "围绕课件和资源直接讨论" : "Discuss the deck and resources in context"}
              </h2>
              <p
                className={cn(
                  "mt-3 text-sm leading-6",
                  theme === "dark" ? "text-slate-300" : "text-slate-600",
                )}
              >
                {isZh
                  ? `你可以围绕课件页面、实验现象和资源细节追问。当前实验：${courseTitle}`
                  : `Ask follow-up questions about slides, observed effects, and resource details. Current experiment: ${courseTitle}`}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {prompts.map((prompt) => (
                  <span
                    key={prompt}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                      theme === "dark"
                        ? "border-slate-600 bg-slate-800/70 text-slate-200"
                        : "border-slate-200 bg-white/90 text-slate-700",
                    )}
                  >
                    {prompt}
                  </span>
                ))}
              </div>

              <div
                className={cn(
                  "mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                  theme === "dark" ? "bg-slate-800/80 text-slate-200" : "bg-slate-100 text-slate-700",
                )}
              >
                <MessageSquare className="h-4 w-4" style={{ color: accentColor }} />
                {isZh ? `${comments.length} 条讨论` : `${comments.length} comments`}
              </div>
            </div>

            <div className="px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      theme === "dark" ? "text-slate-100" : "text-slate-900",
                    )}
                  >
                    {isZh ? "发一条留言" : "Start a comment"}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-sm",
                      theme === "dark" ? "text-slate-400" : "text-slate-500",
                    )}
                  >
                    {isZh
                      ? "支持图文留言、追评和折叠。建议每条留言聚焦一个问题。"
                      : "Supports text/image comments, threaded replies, and collapse. Keep each comment focused on one question."}
                  </p>
                </div>

                {!canParticipate && (
                  <button
                    onClick={() => openDialog("login")}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                      theme === "dark"
                        ? "bg-slate-100 text-slate-900 hover:bg-white"
                        : "bg-slate-900 text-white hover:bg-slate-800",
                    )}
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    {isZh ? "登录后参与" : "Log in to join"}
                  </button>
                )}
              </div>

              {questionTarget && (
                <div
                  className={cn(
                    "mt-3 flex items-center justify-between gap-3 rounded-[12px] border px-3 py-2 text-xs",
                    theme === "dark"
                      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
                      : "border-cyan-200 bg-cyan-50 text-cyan-700",
                  )}
                >
                  <span className="truncate">
                    {isZh ? "正在对资源提问：" : "Asking about resource:"} {questionTarget.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuestionTarget(null)}
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors",
                      theme === "dark" ? "hover:bg-cyan-400/20" : "hover:bg-cyan-100",
                    )}
                    aria-label="clear resource target"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* 可拖拽区域包裹输入框 */}
              <div
                className={cn(
                  "relative mt-4 rounded-[18px] transition",
                  isDraggingNewComment && (theme === "dark" 
                    ? "ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-slate-900" 
                    : "ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-white"),
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingNewComment(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // 只有当离开整个区域时才取消
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setIsDraggingNewComment(false);
                  }
                }}
                onDrop={handleNewCommentDrop}
              >
                <textarea
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  onPaste={handleNewCommentPaste}
                  rows={3}
                  maxLength={MAX_COMMENT_LENGTH}
                  disabled={!canParticipate || isSubmitting}
                  placeholder={
                    canParticipate
                      ? isZh
                        ? "例如：这个资源里的干涉纹路为什么会随角度变化？（支持拖拽或粘贴图片）"
                        : "For example: why do the interference patterns change with angle? (Drag or paste images)"
                      : isZh
                        ? "登录后即可参与实验讨论"
                        : "Log in to participate in the discussion"
                  }
                  className={cn(
                    "w-full resize-y rounded-[18px] border px-4 py-3 text-sm outline-none transition",
                    theme === "dark"
                      ? "border-slate-700 bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:border-slate-500"
                      : "border-slate-200 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:border-slate-400",
                    !canParticipate && "cursor-not-allowed opacity-75",
                  )}
                />
                {isDraggingNewComment && (
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center rounded-[18px] pointer-events-none",
                      theme === "dark" ? "bg-cyan-500/10" : "bg-cyan-50/80",
                    )}
                  >
                    <span className={cn(
                      "text-sm font-medium",
                      theme === "dark" ? "text-cyan-300" : "text-cyan-700",
                    )}>
                      {isZh ? "松开鼠标上传图片" : "Drop to upload images"}
                    </span>
                  </div>
                )}
              </div>

              <input
                ref={newCommentFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                className="hidden"
                onChange={handleNewCommentImageSelection}
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => newCommentFileInputRef.current?.click()}
                  disabled={
                    !canParticipate ||
                    isSubmitting ||
                    newCommentImages.length >= MAX_COMMENT_IMAGES
                  }
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60",
                    theme === "dark"
                      ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  )}
                >
                  <ImagePlus className="h-4 w-4" />
                  {isZh ? "添加图片" : "Add image"}
                </button>
                <span className={cn("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                  {isZh
                    ? `最多 ${MAX_COMMENT_IMAGES} 张图片，支持只发图片`
                    : `Up to ${MAX_COMMENT_IMAGES} images, image-only comments supported`}
                </span>
              </div>

              <DraftImagePreviewList
                images={newCommentImages}
                onRemove={handleRemoveNewCommentImage}
                onPreview={(image) => setLightboxImage({ url: image.previewUrl, alt: image.file.name })}
                theme={theme}
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={cn("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                    {isZh
                      ? `最多 ${MAX_COMMENT_LENGTH} 字`
                      : `Up to ${MAX_COMMENT_LENGTH} characters`}
                  </p>
                  {submitError && <p className="mt-1 text-xs text-red-500">{submitError}</p>}
                </div>

                <button
                  type="button"
                  onClick={() => void handleSubmitComment()}
                  disabled={!canParticipate || isSubmitting}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60 hover:opacity-90"
                  style={{ backgroundColor: accentColor }}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isZh ? "发布讨论" : "Post comment"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          {deleteError && (
            <div className="mb-4 rounded-[1.2rem] bg-red-50 px-4 py-3 text-sm text-[#b33d3d]">
              {deleteError}
            </div>
          )}

          {isLoading ? (
            <div
              className={cn(
                "flex items-center justify-center gap-3 rounded-[18px] border px-4 py-8 text-sm",
                theme === "dark"
                  ? "border-slate-700/70 bg-slate-900/60 text-slate-300"
                  : "border-slate-200 bg-white text-slate-600",
              )}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              {isZh ? "正在加载讨论内容" : "Loading discussion"}
            </div>
          ) : loadError ? (
            <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
              <div>{loadError}</div>
              <button
                onClick={() => void loadComments()}
                className="mt-3 text-sm font-semibold text-red-700 underline underline-offset-4"
              >
                {isZh ? "重新加载" : "Retry"}
              </button>
            </div>
          ) : commentTree.length === 0 ? (
            <div
              className={cn(
                "rounded-[18px] border px-6 py-8 text-center",
                theme === "dark"
                  ? "border-slate-700/70 bg-slate-900/60"
                  : "border-slate-200 bg-white",
              )}
            >
              <p
                className={cn(
                  "text-sm font-semibold",
                  theme === "dark" ? "text-white" : "text-slate-900",
                )}
              >
                {isZh ? "还没有人开场" : "No discussion yet"}
              </p>
              <p
                className={cn(
                  "mx-auto mt-2 max-w-2xl text-sm leading-6",
                  theme === "dark" ? "text-slate-400" : "text-slate-500",
                )}
              >
                {isZh
                  ? "先问一个具体问题，比如某页课件推导、某个资源中的异常现象，后面的讨论会更容易接住。"
                  : "Start with a specific question about a slide or a resource observation so others can reply clearly."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">{commentTree.map((comment) => renderComment(comment))}</div>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        theme={theme}
        title={isZh ? "删除这条留言？" : "Delete this comment?"}
        description={isZh ? "删除后无法恢复。" : "This action cannot be undone."}
        confirmLabel={isZh ? "删除" : "Delete"}
        cancelLabel={isZh ? "取消" : "Cancel"}
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
          close: isZh ? "关闭大图预览" : "Close image preview",
          zoomIn: isZh ? "放大" : "Zoom",
          zoomOut: isZh ? "还原" : "Reset",
          zoomInAriaLabel: isZh ? "放大图片" : "zoom in image",
          zoomOutAriaLabel: isZh ? "还原图片" : "zoom out image",
          hint: isZh ? "点击图片可切换放大/还原" : "Click image to zoom in/out",
          zoomedHint: isZh ? "拖动查看细节，点击图片可还原" : "Drag to pan and click image to reset",
        }}
      />
    </>
  );
}
