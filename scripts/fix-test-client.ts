import { prisma } from "../src/lib/prisma";

async function fixTestClient() {
  try {
    // The Supabase user ID we created
    const supabaseUserId = "150b612f-263b-4427-8eb2-ee5f256e9406";

    // First, delete any existing user with this email
    await prisma.user.deleteMany({
      where: { email: "zwieder22@gmail.com" },
    });

    // Create the user with the correct Supabase ID
    await prisma.user.create({
      data: {
        id: supabaseUserId,
        email: "zwieder22@gmail.com",
        role: "CLIENT",
      },
    });
    console.log("✅ User record created with Supabase ID");

    // Update the client to have the correct userId in metadata
    const client = await prisma.client.updateMany({
      where: {
        name: "Test User",
        businessName: "Test Company",
      },
      data: {
        metadata: {
          userId: supabaseUserId,
          email: "zwieder22@gmail.com",
        },
      },
    });

    console.log("✅ Client record updated with correct user ID");

    // Verify the setup
    const verifyClient = await prisma.client.findFirst({
      where: {
        metadata: {
          path: ["userId"],
          equals: supabaseUserId,
        },
      },
    });

    if (verifyClient) {
      console.log("\n✅ Setup verified:");
      console.log("Client ID:", verifyClient.id);
      console.log("Client Name:", verifyClient.name);
      console.log("Email: zwieder22@gmail.com");
      console.log("Password: Test123!");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTestClient();
