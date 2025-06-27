import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://rznvmbxhfnyqcyanxptq.supabase.co";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bnZtYnhoZm55cWN5YW54cHRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU3NDkxNSwiZXhwIjoyMDY2MTUwOTE1fQ.f7hiuiv4XazS0Ksn8eXcimMVNDoHuWRm7E_1e8g1Phw";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createSupabaseUser() {
  try {
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: "zwieder22@gmail.com",
      password: "Test123!",
      email_confirm: true,
      user_metadata: {
        name: "Test User",
        role: "CLIENT",
      },
    });

    if (error) {
      console.error("Error creating Supabase user:", error);
      return;
    }

    console.log("✅ Created Supabase user:", {
      id: data.user?.id,
      email: data.user?.email,
    });

    console.log("\n🔐 Login credentials:");
    console.log("Email: zwieder22@gmail.com");
    console.log("Password: Test123!");
  } catch (error) {
    console.error("Error:", error);
  }
}

createSupabaseUser();
