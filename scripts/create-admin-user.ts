import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createAdminUser() {
  try {
    console.log("🧪 Creating admin user...");

    // First, create a Supabase Auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: "admin@example.com",
        password: "password123",
        email_confirm: true,
      });

    if (
      authError &&
      !authError.message.includes("already registered") &&
      authError.code !== "email_exists"
    ) {
      console.error("❌ Failed to create auth user:", authError);
      return;
    }

    const userId = authData?.user?.id;
    if (!userId) {
      console.log(
        "🔍 User might already exist, trying to get existing user..."
      );

      // Try to get existing user
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users.users.find(
        (u) => u.email === "admin@example.com"
      );

      if (existingUser) {
        console.log("✅ Found existing auth user:", existingUser.email);
        await createDatabaseUser(existingUser.id, existingUser.email!);
      } else {
        console.error("❌ Could not find or create user");
        return;
      }
    } else {
      console.log("✅ Created auth user:", authData.user?.email);
      await createDatabaseUser(userId, authData.user?.email!);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createDatabaseUser(userId: string, email: string) {
  try {
    // Create or update the user in the database
    const user = await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: email,
        role: "ADMIN",
      },
      update: {
        role: "ADMIN",
      },
    });

    console.log("✅ Database user created/updated:", {
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("❌ Database error:", error);
  }
}

createAdminUser();
