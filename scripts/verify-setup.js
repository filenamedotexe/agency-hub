#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔍 Verifying Agency Hub Phase 0 Setup...\n");

const checks = {
  "Next.js app created":
    fs.existsSync("package.json") && fs.existsSync("next.config.mjs"),
  "TypeScript configured": fs.existsSync("tsconfig.json"),
  "Tailwind CSS configured": fs.existsSync("tailwind.config.ts"),
  "ESLint configured": fs.existsSync(".eslintrc.json"),
  "Prettier configured": fs.existsSync(".prettierrc.json"),
  "Husky configured": fs.existsSync(".husky/pre-commit"),
  "Playwright configured": fs.existsSync("playwright.config.ts"),
  "Vitest configured": fs.existsSync("vitest.config.ts"),
  "Prisma configured": fs.existsSync("prisma/schema.prisma"),
  "Environment variables":
    fs.existsSync(".env.local") && fs.existsSync(".env.example"),
  "Supabase client setup": fs.existsSync("src/lib/supabase/client.ts"),
  "Health check endpoint": fs.existsSync("src/app/api/health/route.ts"),
  "E2E tests created": fs.existsSync("tests/e2e/smoke.spec.ts"),
  "Unit tests created": fs.existsSync("src/app/page.test.tsx"),
};

let allPassed = true;

Object.entries(checks).forEach(([check, passed]) => {
  console.log(`${passed ? "✅" : "❌"} ${check}`);
  if (!passed) allPassed = false;
});

console.log(
  "\n" +
    (allPassed
      ? "✨ All checks passed! Phase 0 complete."
      : "❌ Some checks failed.")
);
process.exit(allPassed ? 0 : 1);
