import { prisma } from "../src/lib/prisma";

async function updateClientUserId() {
  try {
    const supabaseUserId = "150b612f-263b-4427-8eb2-ee5f256e9406";

    // Update client metadata with correct Supabase user ID
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

    console.log("✅ Updated client with Supabase user ID");
  } catch (error) {
    console.error("Error updating client:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateClientUserId();
