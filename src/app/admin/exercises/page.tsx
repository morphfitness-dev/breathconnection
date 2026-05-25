import { prisma } from "@/lib/prisma/client";
import ExerciseListClient from "./ExerciseListClient";

export default async function AdminExercisesPage() {
  const exercises = await prisma.exercise.findMany({
    include: {
      video: {
        select: {
          id: true,
          muxStatus: true,
          isPublished: true,
          muxPlaybackId: true,
        },
      },
    },
    orderBy: { code: "asc" },
  });

  return <ExerciseListClient initialExercises={exercises} />;
}
