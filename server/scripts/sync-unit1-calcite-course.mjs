import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGODB_DB_NAME || 'polarcraft';

const now = new Date();

const unit = {
  id: 'unit1',
  title_zh: '第一单元：光的偏振态及其调制与测量',
  title_en: null,
  description_zh: '围绕冰洲石实验，认识光的偏振态、双折射现象及其观测方法。',
  description_en: null,
  cover_image: '/courses/unit1/冰洲石实验/照片1.1-冰洲石双像.png',
  color: '#C9A227',
  sort_order: 0,
};

const unitMainSlide = {
  id: 'unit1-main-slide-history',
  unit_id: 'unit1',
  url: '/courses/unit1/偏振光发现的历史过程.pdf',
  title_zh: '偏振光发现的历史过程',
  title_en: null,
};

const course = {
  id: 'course1',
  unit_id: 'unit1',
  title_zh: '冰洲石实验',
  title_en: null,
  description_zh: '整理自 resources 中的冰洲石实验素材，包含课件、双像图片和系列实验视频。',
  description_en: null,
  cover_image: '/courses/unit1/冰洲石实验/照片1.1-冰洲石双像.png',
  color: '#C9A227',
  sort_order: 0,
};

const mediaList = [
  {
    id: 'course1-pptx-calcite',
    type: 'pptx',
    url: '/courses/unit1/冰洲石实验/冰洲石实验.pptx',
    title_zh: '冰洲石实验互动课件',
    sort_order: 0,
  },
  {
    id: 'course1-image-double-refraction',
    type: 'image',
    url: '/courses/unit1/冰洲石实验/照片1.1-冰洲石双像.png',
    title_zh: '照片1.1 冰洲石双像',
    sort_order: 1,
  },
  {
    id: 'course1-video-rotate-calcite',
    type: 'video',
    url: '/courses/unit1/冰洲石实验/视频1.1-旋转冰洲石进行观察.mp4',
    title_zh: '视频1.1 旋转冰洲石进行观察',
    sort_order: 2,
  },
  {
    id: 'course1-video-stacked-calcite',
    type: 'video',
    url: '/courses/unit1/冰洲石实验/视频1.2-重叠两块冰洲石实验.mp4',
    title_zh: '视频1.2 重叠两块冰洲石实验',
    sort_order: 3,
  },
  {
    id: 'course1-video-polarizer-calcite',
    type: 'video',
    url: '/courses/unit1/冰洲石实验/视频1.3-偏振片观察冰洲石所成的像.mp4',
    title_zh: '视频1.3 偏振片观察冰洲石所成的像',
    sort_order: 4,
  },
  {
    id: 'course1-video-poincare',
    type: 'video',
    url: '/courses/unit1/冰洲石实验/视频1.4-邦加球表示偏振态.mp4',
    title_zh: '视频1.4 邦加球表示偏振态',
    sort_order: 5,
  },
  {
    id: 'course1-video-green-laser',
    type: 'video',
    url: '/courses/unit1/冰洲石实验/视频1.5-绿色激光穿过冰洲石.mp4',
    title_zh: '视频1.5 绿色激光穿过冰洲石',
    sort_order: 6,
  },
  {
    id: 'course1-video-glycerol',
    type: 'video',
    url: '/courses/unit1/冰洲石实验/视频1.6-冰洲石泡在甘油匹配液中并更改激光入射角.mp4',
    title_zh: '视频1.6 冰洲石泡在甘油匹配液中并更改激光入射角',
    sort_order: 7,
  },
  {
    id: 'course1-video-red-light',
    type: 'video',
    url: '/courses/unit1/冰洲石实验/视频1.7-0.25倍速观察红光滞留现象.mp4',
    title_zh: '视频1.7 0.25倍速观察红光滞留现象',
    sort_order: 8,
  },
];

async function upsertOne(collection, filter, doc) {
  const existing = await collection.findOne(filter, { projection: { _id: 0, created_at: 1 } });
  await collection.updateOne(
    filter,
    {
      $set: {
        ...doc,
        updated_at: now,
      },
      $setOnInsert: {
        created_at: existing?.created_at || now,
      },
    },
    { upsert: true },
  );
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(dbName);
    const mediaIds = mediaList.map((media) => media.id);

    await upsertOne(db.collection('units'), { id: unit.id }, unit);
    await upsertOne(
      db.collection('unit_main_slides'),
      { unit_id: unitMainSlide.unit_id },
      unitMainSlide,
    );
    await upsertOne(db.collection('courses'), { id: course.id }, course);

    await db.collection('course_main_slides').deleteMany({ course_id: course.id });
    await db.collection('course_hyperlinks').deleteMany({ course_id: course.id });
    await db.collection('course_media').deleteMany({
      course_id: course.id,
      id: { $nin: mediaIds },
    });

    for (const media of mediaList) {
      await upsertOne(
        db.collection('course_media'),
        { id: media.id },
        {
          course_id: course.id,
          type: media.type,
          url: media.url,
          title_zh: media.title_zh,
          title_en: null,
          duration: null,
          sort_order: media.sort_order,
        },
      );
    }

    console.log(
      JSON.stringify(
        {
          unitId: unit.id,
          unitMainSlideUrl: unitMainSlide.url,
          courseId: course.id,
          mediaCount: mediaList.length,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
