/**
 * Education Timeline Component
 * 教育经历时间线组件
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Plus, GraduationCap } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/classNames';
import { UserEducation } from '@/lib/profile.service';
import { EducationFormDialog } from './EducationFormDialog';

interface EducationTimelineProps {
  educations: UserEducation[];
  onAdd: (data: any) => Promise<void>;
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function EducationTimeline({
  educations,
  onAdd,
  onUpdate,
  onDelete,
  isLoading,
}: EducationTimelineProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<UserEducation | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingEducation(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (education: UserEducation) => {
    setEditingEducation(education);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEducation(null);
  };

  const handleSubmit = async (data: any) => {
    if (editingEducation) {
      await onUpdate(editingEducation.id, data);
    } else {
      await onAdd(data);
    }
    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('profile.education.confirmDelete'))) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return t('profile.education.present');
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const getDegreeLabel = (level: string | null) => {
    if (!level) return '';
    const labels: Record<string, string> = {
      bachelor: t('profile.education.bachelor'),
      master: t('profile.education.master'),
      phd: t('profile.education.phd'),
      other: t('profile.education.other'),
    };
    return labels[level] || level;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={cn(
          "text-lg font-semibold",
          theme === "dark" ? "text-white" : "text-gray-900"
        )}>
          {t('profile.education.title')}
        </h3>
        <button
          onClick={handleOpenAdd}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            theme === "dark"
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          )}
        >
          <Plus className="w-4 h-4" />
          {t('profile.education.add')}
        </button>
      </div>

      {/* Timeline */}
      {educations.length === 0 ? (
        <div className={cn(
          "text-center py-8 rounded-lg border-2 border-dashed",
          theme === "dark"
            ? "border-gray-700 text-gray-400"
            : "border-gray-300 text-gray-500"
        )}>
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('profile.education.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {educations.map((education) => (
            <div
              key={education.id}
              className={cn(
                "relative p-4 rounded-lg border transition-all",
                theme === "dark"
                  ? "bg-gray-800/50 border-gray-700 hover:border-gray-600"
                  : "bg-white border-gray-200 hover:border-gray-300",
                (isLoading && deletingId === education.id) && "opacity-50"
              )}
            >
              {/* Timeline connector */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
                education.is_current
                  ? theme === "dark" ? "bg-green-500" : "bg-green-500"
                  : theme === "dark" ? "bg-gray-600" : "bg-gray-300"
              )} />

              {/* Content */}
              <div className="pl-3">
                {/* Date range */}
                <div className={cn(
                  "text-sm mb-1",
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                )}>
                  {formatDate(education.start_date)} - {formatDate(education.end_date)}
                  {education.is_current && (
                    <span className={cn(
                      "ml-2 px-2 py-0.5 rounded-full text-xs",
                      theme === "dark"
                        ? "bg-green-900/50 text-green-400"
                        : "bg-green-100 text-green-700"
                    )}>
                      {t('profile.education.present')}
                    </span>
                  )}
                </div>

                {/* Organization and Major */}
                <div className={cn(
                  "font-medium",
                  theme === "dark" ? "text-white" : "text-gray-900"
                )}>
                  {education.organization} | {education.major}
                </div>

                {/* Degree level */}
                {education.degree_level && (
                  <div className={cn(
                    "text-sm mt-1",
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  )}>
                    {getDegreeLabel(education.degree_level)}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleOpenEdit(education)}
                    disabled={isLoading}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      theme === "dark"
                        ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                        : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(education.id)}
                    disabled={isLoading}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      theme === "dark"
                        ? "hover:bg-red-900/30 text-gray-400 hover:text-red-400"
                        : "hover:bg-red-50 text-gray-500 hover:text-red-500"
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <EducationFormDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        education={editingEducation}
        isLoading={isLoading}
      />
    </div>
  );
}
