import { type NextRequest } from "next/server";
import Mux from "@mux/mux-node";
import { prisma } from "@/lib/prisma/client";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const secret = process.env.WEBHOOK_SECRET ?? "";

  const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
    webhookSecret: secret,
  });

  try {
    await mux.webhooks.verifySignature(rawBody, request.headers, secret);
  } catch {
    return new Response("Bad signature", { status: 400 });
  }

  let event: ReturnType<typeof JSON.parse>;
  try {
    event = JSON.parse(rawBody) as { type: string; data: Record<string, unknown> };
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const type = event.type as string;
  const data = event.data as Record<string, unknown>;

  if (type === "video.asset.ready") {
    const assetId = data.id as string;
    const playbackIds = data.playback_ids as Array<{ id: string; policy: string }> | undefined;
    const playbackId = playbackIds?.find((p) => p.policy === "public")?.id ?? null;
    const duration = typeof data.duration === "number" ? Math.round(data.duration) : null;

    // Look for a Video record with this mux asset ID
    const video = await prisma.video.findFirst({
      where: { muxAssetId: assetId },
    });

    if (video) {
      await prisma.video.update({
        where: { id: video.id },
        data: {
          muxStatus: "READY",
          muxPlaybackId: playbackId,
          durationSeconds: duration,
          // Thumbnail is generated from the playback ID
          thumbnailUrl: playbackId
            ? `https://image.mux.com/${playbackId}/thumbnail.jpg`
            : null,
        },
      });
    }
  } else if (type === "video.asset.errored") {
    const assetId = data.id as string;

    const video = await prisma.video.findFirst({
      where: { muxAssetId: assetId },
    });

    if (video) {
      await prisma.video.update({
        where: { id: video.id },
        data: { muxStatus: "ERRORED" },
      });
    }
  }

  return new Response("OK", { status: 200 });
}
