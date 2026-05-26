import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { getUserBySupabaseId } from "@/lib/prisma/helpers";
import { TRPCError } from "@trpc/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as { value?: unknown };
    const rawValue = body.value;
    if (
      typeof rawValue !== "number" ||
      rawValue < 1 ||
      rawValue > 5 ||
      !Number.isInteger(rawValue)
    ) {
      return NextResponse.json(
        { error: "value must be an integer 1–5" },
        { status: 400 }
      );
    }

    const user = await getUserBySupabaseId(supabaseUser.id);

    await prisma.metric.create({
      data: {
        userId: user.id,
        type: "SUBJECTIVE_STRESS",
        value: rawValue,
        unit: "scale",
        source: "manual",
        recordedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
