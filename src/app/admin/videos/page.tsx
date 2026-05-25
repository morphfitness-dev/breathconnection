import { prisma } from "@/lib/prisma/client";
import VideoListClient from "./VideoListClient";

export default async function AdminVideosPage() {
  const videos = await prisma.video.findMany({
    include: {
      exercise: {
        select: { code: true },
      },
    },
    orderBy: { uploadedAt: "desc" },
  });

  return <VideoListClient initialVideos={videos} />;
}
