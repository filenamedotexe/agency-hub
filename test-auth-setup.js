// Test script to verify auth setup
const { createClient } = require("@supabase/supabase-js");

console.log("Testing Auth Setup...\n");

// Check environment variables
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "DATABASE_URL",
];

let allEnvVarsPresent = true;
requiredEnvVars.forEach((varName) => {
  if (process.env[varName]) {
    console.log(`✓ ${varName} is set`);
  } else {
    console.log(`✗ ${varName} is NOT set`);
    allEnvVarsPresent = false;
  }
});

if (!allEnvVarsPresent) {
  console.log(
    "\n❌ Missing environment variables. Please check your .env.local file."
  );
  process.exit(1);
}

console.log("\nTesting Supabase connection...");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Test auth connection
supabase.auth
  .getSession()
  .then(({ data, error }) => {
    if (error) {
      console.log("❌ Supabase connection error:", error.message);
    } else {
      console.log("✓ Supabase connection successful");
      console.log(
        "Session data:",
        data.session ? "Session exists" : "No active session"
      );
    }
  })
  .catch((err) => {
    console.log("❌ Unexpected error:", err.message);
  });
