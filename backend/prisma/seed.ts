import { PrismaClient } from '@prisma/client';
import { VIDEO_LIBRARY } from '../src/data/videoLibrary';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding video library…');

  let created = 0;
  let skipped = 0;

  for (const video of VIDEO_LIBRARY) {
    const existing = await prisma.video.findUnique({ where: { id: video.id } });
    if (existing) { skipped++; continue; }

    await prisma.video.create({
      data: {
        id: video.id,
        title: video.title,
        description: video.description,
        pillar: video.pillar,
        tier: video.tier,
        durationSeconds: video.durationSeconds,
        technique: video.technique,
        instructorStyle: video.instructorStyle,
        biometricFeedbackType: video.biometricFeedbackType,
        nsScoreMin: video.nsScoreMin ?? null,
        gamificationEvent: video.gamificationEvent,
        fourWeekAnchor: video.fourWeekAnchor,
        tags: JSON.stringify(video.tags),
        contraindicated: JSON.stringify(video.contraindicated),
      },
    });
    created++;
  }

  console.log(`Video library: ${created} created, ${skipped} already existed.`);
  console.log(`Total: ${VIDEO_LIBRARY.length} videos in library.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
