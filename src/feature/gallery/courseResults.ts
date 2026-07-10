import type { Course, CourseMedia, KnowledgeTag, LabelI18n as CourseLabelI18n } from '@/lib/course.service';
import type { GalleryMedia, GalleryMediaType, GalleryWork } from '@/data/gallery';

export const GALLERY_RESULTS_UNIT_ID = 'gallery-results';

export type GalleryResultTag = Extract<
  KnowledgeTag,
  'student_ppt' | 'student_poster' | 'student_project'
>;

export const GALLERY_RESULT_TAGS: readonly GalleryResultTag[] = [
  'student_ppt',
  'student_poster',
  'student_project',
];

export const GALLERY_RESULT_LABELS: Record<GalleryResultTag, LabelI18n> = {
  student_ppt: { 'zh-CN': '学生PPT', 'en-US': 'Student PPT' },
  student_poster: { 'zh-CN': '学生海报', 'en-US': 'Student poster' },
  student_project: { 'zh-CN': '学生项目', 'en-US': 'Student project' },
};

interface GalleryCourseWorkId {
  tag: GalleryResultTag;
  courseId: string;
}

const PLACEHOLDER_COVER =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22480%22 viewBox=%220 0 800 480%22%3E%3Crect width=%22800%22 height=%22480%22 fill=%22%23ece3d3%22/%3E%3Cpath d=%22M96 352h608v32H96zM128 112h544v184H128z%22 fill=%22%23d0bfa3%22/%3E%3Ccircle cx=%22640%22 cy=%22160%22 r=%2238%22 fill=%22%23264653%22/%3E%3Ctext x=%22400%22 y=%22258%22 fill=%22%23264653%22 font-family=%22Arial,sans-serif%22 font-size=%2238%22 font-weight=%22700%22 text-anchor=%22middle%22%3EGallery Result%3C/text%3E%3C/svg%3E';

function isGalleryResultTag(tag?: string | null): tag is GalleryResultTag {
  return Boolean(tag && GALLERY_RESULT_TAGS.includes(tag as GalleryResultTag));
}

export function isGalleryResultCourse(course: Pick<Course, 'unitId' | 'knowledgeTag'>): boolean {
  return course.unitId === GALLERY_RESULTS_UNIT_ID && isGalleryResultTag(course.knowledgeTag);
}

export function parseGalleryCourseWorkId(workId: string): GalleryCourseWorkId | null {
  const [prefix, tag, ...courseIdParts] = workId.split(':');
  const courseId = courseIdParts.join(':');

  if (prefix !== 'course' || !isGalleryResultTag(tag) || !courseId) {
    return null;
  }

  return { tag, courseId };
}

function getGalleryResultTagLabel(tag: GalleryResultTag, isZh: boolean): string {
  return GALLERY_RESULT_LABELS[tag][isZh ? 'zh-CN' : 'en-US'] || GALLERY_RESULT_LABELS[tag]['zh-CN'] || tag;
}

function getLabel(label: CourseLabelI18n | undefined, isZh = true): string {
  return label?.[isZh ? 'zh-CN' : 'en-US'] || label?.['zh-CN'] || label?.['en-US'] || '';
}

function toGalleryLabel(label: CourseLabelI18n, fallback: string): LabelI18n {
  return {
    'zh-CN': label['zh-CN'] || label['en-US'] || fallback,
    ...Object.fromEntries(
      Object.entries(label).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    ),
  };
}

function toGalleryMediaType(type: CourseMedia['type']): GalleryMediaType {
  return type === 'pptx' || type === 'pdf' || type === 'image' || type === 'video' ? type : 'other';
}

function mapCourseMediaToGalleryMedia(media: CourseMedia, uploadedAt: string): GalleryMedia {
  return {
    id: media.id,
    type: toGalleryMediaType(media.type),
    url: media.url,
    title: toGalleryLabel(media.title, media.url.split('/').pop() || '成果文件'),
    duration: media.duration,
    uploadedAt,
  };
}

export function mapCourseToGalleryWork(course: Course): GalleryWork {
  const tag = isGalleryResultTag(course.knowledgeTag) ? course.knowledgeTag : 'student_project';
  const mediaResources = course.media.map((media) =>
    mapCourseMediaToGalleryMedia(media, course.updatedAt || course.createdAt)
  );
  const firstImage = course.media.find((media) => media.type === 'image')?.url;
  const coverImage = course.coverImage || firstImage || PLACEHOLDER_COVER;
  const gallery = [coverImage, ...course.media.filter((media) => media.type === 'image').map((media) => media.url)];
  const titleZh = getLabel(course.title, true) || getGalleryResultTagLabel(tag, true);
  const titleEn = getLabel(course.title, false) || getGalleryResultTagLabel(tag, false);
  const descriptionZh = getLabel(course.description, true) || '学生成果展示';
  const descriptionEn = getLabel(course.description, false) || 'Student result display';

  return {
    id: `course:${tag}:${course.id}`,
    title: { 'zh-CN': titleZh, 'en-US': titleEn },
    subtitle: GALLERY_RESULT_LABELS[tag],
    description: { 'zh-CN': descriptionZh, 'en-US': descriptionEn },
    authors: [
      {
        id: 'gallery-results',
        name: { 'zh-CN': '课程成果', 'en-US': 'Course results' },
        role: GALLERY_RESULT_LABELS[tag],
      },
    ],
    coverImage,
    gallery: [...new Set(gallery)],
    mediaResources,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    status: 'public',
    views: 0,
    likes: 0,
  };
}
