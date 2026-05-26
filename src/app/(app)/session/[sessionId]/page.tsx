import { notFound, redirect } from "next/navigation";
import { appRouter } from "@/server/routers";
import { createTRPCContext, createCallerFactory } from "@/server/trpc/init";
import SessionPlayer from "@/components/session/SessionPlayer";

const createCaller = createCallerFactory(appRouter);

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function SessionPage({ params }: PageProps) {
  const { sessionId } = await params;

  const ctx = await createTRPCContext();
  if (!ctx.user) {
    redirect("/login");
  }

  const caller = createCaller(ctx);

  let sessionData;
  try {
    sessionData = await caller.session.getSession({ sessionId });
  } catch {
    notFound();
  }

  return (
    <SessionPlayer
      sessionId={sessionData.id}
      exercises={sessionData.exercises}
    />
  );
}
