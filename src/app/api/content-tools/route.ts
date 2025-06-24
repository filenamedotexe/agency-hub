import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Pre-populate content tools if they don't exist
const DEFAULT_TOOLS = [
  {
    type: "BLOG_WRITER",
    name: "Blog Writer",
    description: "Generate engaging blog posts for your clients",
    prompt: `Write a blog post about {{topic}} for {{businessName}}.
The blog should be:
- Informative and engaging
- SEO-friendly
- Approximately {{wordCount}} words
- Written in a {{tone}} tone
- Include relevant keywords: {{keywords}}

Business context: {{businessContext}}`,
  },
  {
    type: "FACEBOOK_VIDEO_AD",
    name: "Facebook Video Ad Script & Caption Writer",
    description: "Create compelling video ad scripts and captions for Facebook",
    prompt: `Create a Facebook video ad script and caption for {{businessName}}.

Product/Service: {{productService}}
Target Audience: {{targetAudience}}
Campaign Goal: {{campaignGoal}}
Video Length: {{videoLength}} seconds

The script should include:
- Hook (first 3 seconds)
- Problem identification
- Solution presentation
- Call to action

Also provide:
- Engaging caption with emojis
- Relevant hashtags`,
  },
  {
    type: "FACEBOOK_IMAGE_AD",
    name: "Facebook Image Ad & Caption Writer",
    description: "Create engaging image ad copy and captions for Facebook",
    prompt: `Create Facebook image ad copy and caption for {{businessName}}.

Product/Service: {{productService}}
Target Audience: {{targetAudience}}
Campaign Goal: {{campaignGoal}}
Key Benefits: {{keyBenefits}}

Provide:
- Headline (25 characters max)
- Primary text
- Caption with emojis
- Call to action
- Relevant hashtags`,
  },
  {
    type: "GOOGLE_SEARCH_AD",
    name: "Google Search Ad Writer",
    description: "Write effective Google Search ads",
    prompt: `Create Google Search ads for {{businessName}}.

Product/Service: {{productService}}
Target Keywords: {{targetKeywords}}
Unique Selling Points: {{uniqueSellingPoints}}
Landing Page: {{landingPage}}

Create 3 variations with:
- Headlines (30 characters max each, up to 3)
- Descriptions (90 characters max each, up to 2)
- Display paths
- Sitelink extensions`,
  },
  {
    type: "SEO_KEYWORD_RESEARCH",
    name: "SEO Keyword Research",
    description: "Discover relevant keywords for SEO optimization",
    prompt: `Conduct SEO keyword research for {{businessName}}.

Industry: {{industry}}
Target Location: {{location}}
Main Services/Products: {{servicesProducts}}
Competitors: {{competitors}}

Provide:
- Primary keywords (high search volume)
- Long-tail keywords
- Local SEO keywords
- Content topic ideas
- Estimated difficulty levels`,
  },
];

// GET /api/content-tools - List all content tools
export async function GET(request: NextRequest) {
  try {
    // Check if tools exist, if not create them
    const existingTools = await prisma.contentTool.count();

    if (existingTools === 0) {
      await prisma.contentTool.createMany({
        data: DEFAULT_TOOLS.map((tool) => ({
          type: tool.type as any,
          name: tool.name,
          description: tool.description,
          prompt: tool.prompt,
        })),
      });
    }

    const tools = await prisma.contentTool.findMany({
      include: {
        _count: {
          select: { generatedContent: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(tools);
  } catch (error) {
    console.error("Error fetching content tools:", error);
    return NextResponse.json(
      { error: "Failed to fetch content tools" },
      { status: 500 }
    );
  }
}

// PUT /api/content-tools - Update a content tool (for prompt editing)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, prompt, webhookId } = body;

    if (!id || !prompt) {
      return NextResponse.json(
        { error: "Tool ID and prompt are required" },
        { status: 400 }
      );
    }

    const tool = await prisma.contentTool.update({
      where: { id },
      data: {
        prompt,
        ...(webhookId !== undefined && { webhookId }),
      },
    });

    return NextResponse.json(tool);
  } catch (error) {
    console.error("Error updating content tool:", error);
    return NextResponse.json(
      { error: "Failed to update content tool" },
      { status: 500 }
    );
  }
}
