import { pathToFileURL } from 'url';
import { closeDatabase, connectDatabase } from '../database/connection.js';
import type { KnowledgeTag } from '../types/course.types.js';

const DEVICE_KEYWORDS = [
  '3种仪器',
  '仪器',
  '设备',
  '缪勒',
  'mueller',
  '显微镜',
  '偏振散射仪',
  '散射仪',
  '原位检测',
  '全偏振相机',
];

const MISSING_KNOWLEDGE_TAG_FILTER = {
  $or: [
    { knowledge_tag: { $exists: false } },
    { knowledge_tag: null },
    { knowledge_tag: '' as const },
  ],
};

type CourseTagCandidate = {
  id: string;
  title_zh?: string | null;
  title_en?: string | null;
  description_zh?: string | null;
  description_en?: string | null;
};

type CourseKnowledgeTagDocument = CourseTagCandidate & {
  knowledge_tag?: KnowledgeTag | '' | null;
};

type BackfillKnowledgeTag = Extract<KnowledgeTag, 'foundation' | 'optical_device'>;

export function inferCourseKnowledgeTag(course: CourseTagCandidate): BackfillKnowledgeTag {
  const searchableText = [
    course.title_zh,
    course.title_en,
    course.description_zh,
    course.description_en,
  ]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();

  return DEVICE_KEYWORDS.some((keyword) => searchableText.includes(keyword.toLowerCase()))
    ? 'optical_device'
    : 'foundation';
}

export function buildSetKnowledgeTagUpdate(knowledgeTag: KnowledgeTag) {
  return { $set: { knowledge_tag: knowledgeTag } };
}

async function main(): Promise<void> {
  const db = await connectDatabase();
  const courses = db.collection<CourseKnowledgeTagDocument>('courses');
  const mainSlides = db.collection('course_main_slides');
  const media = db.collection('course_media');

  const missingTagCourses = await courses
    .find(MISSING_KNOWLEDGE_TAG_FILTER, {
      projection: {
        _id: 0,
        id: 1,
        title_zh: 1,
        title_en: 1,
        description_zh: 1,
        description_en: 1,
      },
    })
    .toArray();

  const courseIdsByTag: Record<BackfillKnowledgeTag, string[]> = {
    foundation: [],
    optical_device: [],
  };

  for (const course of missingTagCourses) {
    courseIdsByTag[inferCourseKnowledgeTag(course)].push(course.id);
  }

  const courseUpdateResults = await Promise.all(
    (Object.keys(courseIdsByTag) as BackfillKnowledgeTag[]).map((knowledgeTag) => {
      const ids = courseIdsByTag[knowledgeTag];
      if (ids.length === 0) {
        return Promise.resolve({ knowledgeTag, modifiedCount: 0 });
      }

      return courses
        .updateMany(
          { id: { $in: ids }, ...MISSING_KNOWLEDGE_TAG_FILTER },
          buildSetKnowledgeTagUpdate(knowledgeTag)
        )
        .then((result) => ({ knowledgeTag, modifiedCount: result.modifiedCount }));
    })
  );

  const taggedCourses = await courses
    .find(
      {},
      {
        projection: {
          _id: 0,
          id: 1,
          knowledge_tag: 1,
        },
      }
    )
    .toArray();

  const taggedCourseIdsByTag: Record<BackfillKnowledgeTag, string[]> = {
    foundation: [],
    optical_device: [],
  };
  const taggedCourseIds = new Set<string>();

  for (const course of taggedCourses) {
    taggedCourseIds.add(course.id);
    if (course.knowledge_tag === 'foundation' || course.knowledge_tag === 'optical_device') {
      taggedCourseIdsByTag[course.knowledge_tag].push(course.id);
    }
  }

  const resourceUpdateResults = await Promise.all(
    (Object.keys(taggedCourseIdsByTag) as BackfillKnowledgeTag[]).flatMap((knowledgeTag) => {
      const ids = taggedCourseIdsByTag[knowledgeTag];
      if (ids.length === 0) {
        return [
          Promise.resolve({ collection: 'course_main_slides', knowledgeTag, modifiedCount: 0 }),
          Promise.resolve({ collection: 'course_media', knowledgeTag, modifiedCount: 0 }),
        ];
      }

      return [
        mainSlides
          .updateMany(
            { course_id: { $in: ids }, ...MISSING_KNOWLEDGE_TAG_FILTER },
            buildSetKnowledgeTagUpdate(knowledgeTag)
          )
          .then((result) => ({
            collection: 'course_main_slides',
            knowledgeTag,
            modifiedCount: result.modifiedCount,
          })),
        media
          .updateMany(
            { course_id: { $in: ids }, ...MISSING_KNOWLEDGE_TAG_FILTER },
            buildSetKnowledgeTagUpdate(knowledgeTag)
          )
          .then((result) => ({
            collection: 'course_media',
            knowledgeTag,
            modifiedCount: result.modifiedCount,
          })),
      ];
    })
  );

  const orphanedResourceResults = await Promise.all([
    mainSlides.updateMany(
      { course_id: { $nin: [...taggedCourseIds] }, ...MISSING_KNOWLEDGE_TAG_FILTER },
      buildSetKnowledgeTagUpdate('foundation')
    ),
    media.updateMany(
      { course_id: { $nin: [...taggedCourseIds] }, ...MISSING_KNOWLEDGE_TAG_FILTER },
      buildSetKnowledgeTagUpdate('foundation')
    ),
  ]);

  console.info(
    JSON.stringify(
      {
        courses: Object.fromEntries(
          courseUpdateResults.map((result) => [result.knowledgeTag, result.modifiedCount])
        ),
        resources: resourceUpdateResults,
        orphanedResourcesDefaultedToFoundation: {
          course_main_slides: orphanedResourceResults[0].modifiedCount,
          course_media: orphanedResourceResults[1].modifiedCount,
        },
      },
      null,
      2
    )
  );

  await closeDatabase();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(async (error) => {
    console.error(error);
    try {
      await closeDatabase();
    } catch {
      // Ignore shutdown failures in the backfill script.
    }
    process.exitCode = 1;
  });
}
