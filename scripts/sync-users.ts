import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

// Initialize Supabase client for auth
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function syncUsers() {
  console.log("Syncing users between Supabase Auth and database...");

  // Get all users from Supabase Auth
  const { data: authUsers, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error("Error fetching auth users:", error);
    return;
  }

  console.log(`Found ${authUsers.users.length} users in Supabase Auth`);

  // Sync each user to the database
  for (const authUser of authUsers.users) {
    try {
      // Check if user exists in database
      const dbUser = await prisma.user.findUnique({
        where: { id: authUser.id },
      });

      if (!dbUser && authUser.email) {
        // Determine role based on email
        let role = "CLIENT";
        if (authUser.email.includes("admin@")) role = "ADMIN";
        else if (authUser.email.includes("manager@")) role = "SERVICE_MANAGER";
        else if (authUser.email.includes("copywriter@")) role = "COPYWRITER";
        else if (authUser.email.includes("editor@")) role = "EDITOR";
        else if (authUser.email.includes("va@")) role = "VA";

        // Create user in database
        await prisma.user.create({
          data: {
            id: authUser.id,
            email: authUser.email,
            role: role as any,
            profileData: { name: authUser.email.split("@")[0] },
          },
        });
        console.log(`Created database user for: ${authUser.email}`);
      } else if (dbUser) {
        console.log(`User already exists in database: ${authUser.email}`);
      }
    } catch (error) {
      console.error(`Error syncing user ${authUser.email}:`, error);
    }
  }

  // List all demo users
  console.log("\n=== Demo User Accounts ===");
  const demoUsers = await prisma.user.findMany({
    where: {
      email: {
        endsWith: "@example.com",
      },
    },
    orderBy: {
      role: "asc",
    },
  });

  for (const user of demoUsers) {
    console.log(`${user.role}: ${user.email} (password: password123)`);
  }
}

syncUsers()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
