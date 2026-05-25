import { type NextRequest } from "next/server";
import Mux from "@mux/mux-node";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  exerciseCode: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin access
  const adminEmails = (process.env.ADMIN_EMAIL ?? "").split(",").map((e) => e.trim());
  if (!adminEmails.includes(user.email ?? "")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { exerciseCode, title, description } = parsed.data;

  // 1. Create a Video record in DB with muxStatus=PENDING
  const video = await prisma.video.create({
    data: {
      title,
      description,
      exerciseCode,
      muxStatus: "PENDING",
      uploadedById: user.id,
    },
  });

  // 2. Create a Mux direct upload URL
  const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
  });

  const upload = await mux.video.uploads.create({
    cors_origin: "*",
    new_asset_settings: {
      playback_policies: ["public"],
      mp4_support: "standard",
    },
  });

  if (!upload.url) {
    // Clean up the video record since we can't proceed
    await prisma.video.delete({ where: { id: video.id } });
    return Response.json({ error: "Mux did not return an upload URL" }, { status: 502 });
  }

  // 3. Update Video record with mux upload ID and set status to PROCESSING
  await prisma.video.update({
    where: { id: video.id },
    data: {
      muxAssetId: upload.id,
      muxStatus: "PROCESSING",
    },
  });

  // 4. Return uploadUrl and videoId
  return Response.json({
    uploadUrl: upload.url,
    videoId: video.id,
  });
}
