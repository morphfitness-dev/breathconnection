import { prisma } from "@/lib/prisma/client";
import type { User } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export async function getUserBySupabaseId(supabaseId: string): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { supabaseId },
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  return user;
}
