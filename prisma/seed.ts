import { PrismaClient, UserRole } from "@prisma/client";
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

const testUsers = [
  {
    email: "admin@example.com",
    password: "password123",
    role: UserRole.ADMIN,
    profileData: { name: "Admin User" },
  },
  {
    email: "manager@example.com",
    password: "password123",
    role: UserRole.SERVICE_MANAGER,
    profileData: { name: "Service Manager" },
  },
  {
    email: "copywriter@example.com",
    password: "password123",
    role: UserRole.COPYWRITER,
    profileData: { name: "Copywriter User" },
  },
  {
    email: "editor@example.com",
    password: "password123",
    role: UserRole.EDITOR,
    profileData: { name: "Editor User" },
  },
  {
    email: "va@example.com",
    password: "password123",
    role: UserRole.VA,
    profileData: { name: "Virtual Assistant" },
  },
  {
    email: "client@example.com",
    password: "password123",
    role: UserRole.CLIENT,
    profileData: { name: "Test Client" },
  },
];

async function main() {
  console.log("Seeding database...");

  // Create test users in Supabase Auth
  for (const userData of testUsers) {
    try {
      // Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
        });

      if (authError) {
        console.error(`Error creating auth user ${userData.email}:`, authError);
        continue;
      }

      if (authData.user) {
        // Create or update user in database
        await prisma.user.upsert({
          where: { id: authData.user.id },
          update: {
            email: userData.email,
            role: userData.role,
            profileData: userData.profileData,
          },
          create: {
            id: authData.user.id,
            email: userData.email,
            role: userData.role,
            profileData: userData.profileData,
          },
        });
        console.log(`Created user: ${userData.email}`);
      }
    } catch (error) {
      console.error(`Error processing user ${userData.email}:`, error);
    }
  }

  // Create some test clients
  const adminUser = await prisma.user.findFirst({
    where: { email: "admin@example.com" },
  });

  if (adminUser) {
    const testClients = [
      {
        name: "Acme Corporation",
        businessName: "Acme Corp",
        address: "123 Main St\nAnytown, USA 12345",
        dudaSiteId: "acme_site_123",
      },
      {
        name: "Tech Innovations",
        businessName: "Tech Innovations LLC",
        address: "456 Tech Blvd\nSilicon Valley, CA 94025",
        dudaSiteId: "tech_site_456",
      },
      {
        name: "Green Energy Solutions",
        businessName: "Green Energy Co",
        address: "789 Eco Drive\nPortland, OR 97201",
        dudaSiteId: null,
      },
    ];

    for (const clientData of testClients) {
      const client = await prisma.client.create({
        data: clientData,
      });

      // Create activity log
      await prisma.activityLog.create({
        data: {
          userId: adminUser.id,
          entityType: "client",
          entityId: client.id,
          clientId: client.id,
          action: "created",
          metadata: { clientName: client.name },
        },
      });

      console.log(`Created client: ${client.name}`);
    }
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
