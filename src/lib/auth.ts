import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getServerSession() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser) {
    return null;
  }

  return {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      profileData: dbUser.profileData,
    },
  };
}
