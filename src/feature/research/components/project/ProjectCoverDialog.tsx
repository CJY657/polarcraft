import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { AlertTriangle, Check, ImagePlus, Loader2, Trash2, UploadCloud, X } from "lucide-react";

import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/utils/classNames";
import {
  researchApi,
  type ProjectWithMembers,
  type ResearchProject,
} from "@/lib/research.service";
import { ProjectCoverImage } from "../shared/ProjectCoverImage";

interface ProjectCoverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectWithMembers | null;
  onSuccess: (project: ResearchProject) => void;
}

function getUniqueCommentImages(comments: Awaited<ReturnType<typeof researchApi.getProjectDiscussionComments>>) {
  const urls = new Set<string>();

  for (const comment of comments) {
    if (comment.is_deleted) {
      continue;
    }

    for (const url of comment.image_urls) {
      const trimmed = url.trim();
      if (trimmed) {
        urls.add(trimmed);
      }
    }
  }

  return [...urls];
}

export function ProjectCoverDialog({ isOpen, onClose, project, onSuccess }: ProjectCoverDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCoverUrl, setSelectedCoverUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [discussionImages, setDiscussionImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !project) {
      return;
    }

    setSelectedCoverUrl(project.thumbnail || null);
    setSelectedFile(null);
    setLocalPreviewUrl(null);
    setDiscussionImages([]);
    setIsConfirmingDelete(false);
    setError(null);
    setIsLoadingImages(true);

    let cancelled = false;
    researchApi
      .getProjectDiscussionComments(project.id)
      .then((comments) => {
        if (!cancelled) {
          setDiscussionImages(getUniqueCommentImages(comments));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "加载讨论图片失败");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingImages(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, project]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const effectivePreviewUrl = useMemo(() => {
    return localPreviewUrl || selectedCoverUrl || project?.cover_image || discussionImages[0] || null;
  }, [discussionImages, localPreviewUrl, project?.cover_image, selectedCoverUrl]);

  function clearLocalPreview() {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    setLocalPreviewUrl(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }

    clearLocalPreview();
    setSelectedFile(file);
    setSelectedCoverUrl(null);
    setLocalPreviewUrl(URL.createObjectURL(file));
    setIsConfirmingDelete(false);
    setError(null);
  }

  function handleSelectDiscussionImage(url: string) {
    clearLocalPreview();
    setSelectedFile(null);
    setSelectedCoverUrl(url);
    setIsConfirmingDelete(false);
    setError(null);
  }

  function handleClearManualCover() {
    clearLocalPreview();
    setSelectedFile(null);
    setSelectedCoverUrl(null);
    setIsConfirmingDelete(false);
    setError(null);
  }

  async function handleDeleteCover() {
    if (!project) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updatedProject = await researchApi.updateProject(project.id, {
        thumbnail: null,
      });
      onSuccess(updatedProject);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除封面失败");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSave() {
    if (!project) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let nextCoverUrl = selectedCoverUrl;
      if (selectedFile) {
        const uploaded = await researchApi.uploadProjectCoverImage(project.id, selectedFile);
        nextCoverUrl = uploaded.url;
      }

      const updatedProject = await researchApi.updateProject(project.id, {
        thumbnail: nextCoverUrl || null,
      });
      onSuccess(updatedProject);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存封面失败");
    } finally {
      setIsSaving(false);
    }
  }

  if (!project) {
    return null;
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} showCloseButton={false} className="max-w-2xl border-0 bg-transparent shadow-none">
      <div className="research-panel max-h-[88vh] overflow-y-auto rounded-[1.65rem] p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-xl font-semibold text-[var(--paper-foreground)]"
              style={{ fontFamily: "var(--font-ui-display)" }}
            >
              课题封面
            </h2>
            <p className="mt-1 text-base text-[var(--glass-text-muted)]">{project.name_zh}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="glass-button rounded-full p-2 text-[var(--glass-text-muted)] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ProjectCoverImage
          src={effectivePreviewUrl}
          alt={`${project.name_zh} 封面预览`}
          className="aspect-[16/9] rounded-[1.25rem]"
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSaving}
            className="glass-button inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-base font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UploadCloud className="h-4 w-4 text-[var(--paper-link)]" />
            上传封面
          </button>
          <button
            type="button"
            onClick={handleClearManualCover}
            disabled={isSaving}
            className="glass-button inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-base font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ImagePlus className="h-4 w-4 text-[var(--paper-link)]" />
            使用自动封面
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {selectedFile && (
          <p className="mt-3 text-sm text-[var(--glass-text-muted)]">
            已选择：<span className="font-medium text-[var(--paper-foreground)]">{selectedFile.name}</span>
          </p>
        )}

        {project.thumbnail && (
          <div className="mt-5">
            {!isConfirmingDelete ? (
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingDelete(true);
                  setError(null);
                }}
                disabled={isSaving}
                className="glass-button inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-base font-medium text-[#a24432] transition-colors hover:text-[#892c1d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                删除封面
              </button>
            ) : (
              <div
                className="rounded-[1.2rem] border px-4 py-3"
                style={{
                  borderColor: "color-mix(in srgb, #cb6a4f 30%, var(--glass-stroke))",
                  background: "color-mix(in srgb, #cb6a4f 8%, var(--paper-surface-strong))",
                }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#cb6a4f]/12 text-[#a24432]">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-[var(--paper-foreground)]">确认删除当前封面</p>
                      <p className="mt-1 text-base leading-6 text-[var(--glass-text-muted)]">
                        删除后会恢复自动封面（讨论区图片或画布图片）。
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      disabled={isSaving}
                      className="glass-button rounded-full px-4 py-2 text-base font-medium disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteCover()}
                      disabled={isSaving}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#a24432] px-4 py-2 text-base font-semibold text-white transition-colors hover:bg-[#892c1d] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      {isSaving ? "删除中..." : "确认删除封面"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-[var(--paper-foreground)]">讨论区图片</h3>
            {isLoadingImages && (
              <span className="inline-flex items-center gap-2 text-sm text-[var(--glass-text-muted)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                加载中
              </span>
            )}
          </div>

          {!isLoadingImages && discussionImages.length === 0 && (
            <div className="research-panel-soft rounded-[1.2rem] px-4 py-5 text-center text-base text-[var(--glass-text-muted)]">
              暂无可用图片
            </div>
          )}

          {discussionImages.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {discussionImages.map((url) => {
                const isSelected = selectedCoverUrl === url && !selectedFile;
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => handleSelectDiscussionImage(url)}
                    disabled={isSaving}
                    className={cn(
                      "group relative overflow-hidden rounded-[1rem] border transition disabled:cursor-not-allowed disabled:opacity-60",
                      isSelected
                        ? "border-[var(--paper-link)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--paper-link)_18%,transparent)]"
                        : "border-[var(--glass-stroke)] hover:border-[var(--paper-link)]/60"
                    )}
                  >
                    <ProjectCoverImage src={url} alt="讨论区图片" className="aspect-[16/10]" />
                    {isSelected && (
                      <span className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--paper-link)] text-white shadow-lg">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-[1rem] bg-red-50 px-4 py-3 text-base text-red-600 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="glass-button rounded-full px-5 py-2.5 text-base font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            保存封面
          </button>
        </div>
      </div>
    </Dialog>
  );
}
