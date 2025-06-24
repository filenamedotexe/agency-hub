// Manual test script for Phase 8 features
const BASE_URL = "http://localhost:3001";

async function testPhase8() {
  console.log("🧪 Testing Phase 8 Features...\n");

  try {
    // Test 1: Content Tools API
    console.log("1️⃣ Testing Content Tools API...");
    const toolsResponse = await fetch(`${BASE_URL}/api/content-tools`);
    const tools = await toolsResponse.json();
    console.log(`✅ Found ${tools.length} content tools`);
    console.log("Tools:", tools.map((t) => t.name).join(", "));

    // Test 2: API Key Management
    console.log("\n2️⃣ Testing API Key Management...");

    // Create an API key
    const apiKeyResponse = await fetch(`${BASE_URL}/api/settings/api-keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: "anthropic",
        apiKey: "sk-ant-test-key-123456789",
      }),
    });

    if (apiKeyResponse.ok) {
      const apiKeyData = await apiKeyResponse.json();
      console.log("✅ API key saved:", apiKeyData.message);

      // List API keys
      const listResponse = await fetch(`${BASE_URL}/api/settings/api-keys`);
      const keyList = await listResponse.json();
      console.log(`✅ Listed ${keyList.keys.length} API keys (masked)`);
    } else {
      console.log("⚠️ API key may already exist");
    }

    // Test 3: Content Generation (with mock)
    console.log("\n3️⃣ Testing Content Generation...");
    if (tools.length > 0) {
      const blogTool = tools.find((t) => t.type === "BLOG_WRITER");
      if (blogTool) {
        // First get a client
        const clientsResponse = await fetch(`${BASE_URL}/api/clients`);
        const clients = await clientsResponse.json();

        if (clients.length > 0) {
          const generateResponse = await fetch(
            `${BASE_URL}/api/content-tools/${blogTool.id}/generate`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                clientId: clients[0].id,
                variables: {
                  topic: "Digital Marketing Trends 2025",
                  wordCount: "1000",
                  tone: "professional",
                  keywords: "AI, marketing automation, personalization",
                  businessContext: "A digital marketing agency",
                },
              }),
            }
          );

          if (generateResponse.ok) {
            const generated = await generateResponse.json();
            console.log("✅ Content generated successfully");
            console.log(
              "Preview:",
              generated.content.substring(0, 200) + "..."
            );
          } else {
            const error = await generateResponse.text();
            console.log("❌ Generation failed:", error);
          }
        }
      }
    }

    // Test 4: Team Management
    console.log("\n4️⃣ Testing Team Management...");
    const teamResponse = await fetch(`${BASE_URL}/api/settings/team`);
    const team = await teamResponse.json();
    console.log(`✅ Found ${team.users.length} team members`);

    // Test 5: Webhook functionality
    console.log("\n5️⃣ Testing Webhook APIs...");
    const webhooksResponse = await fetch(`${BASE_URL}/api/webhooks`);
    const webhooks = await webhooksResponse.json();
    console.log(`✅ Found ${webhooks.length} webhooks`);

    console.log("\n✨ Phase 8 API tests completed!");
    console.log("\nNext steps:");
    console.log("1. Visit http://localhost:3001/content-tools to test UI");
    console.log("2. Visit http://localhost:3001/settings to manage API keys");
    console.log(
      "3. Visit http://localhost:3001/automations to manage webhooks"
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testPhase8();
