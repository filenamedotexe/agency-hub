import { decryptApiKey } from "./encryption";

interface GenerateOptions {
  prompt: string;
  service: "anthropic" | "openai";
  apiKey: string; // Encrypted API key
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class AIService {
  static async generate(options: GenerateOptions): Promise<string> {
    const {
      prompt,
      service,
      apiKey,
      model,
      maxTokens = 2000,
      temperature = 0.7,
    } = options;

    try {
      const decryptedKey = decryptApiKey(apiKey);

      if (service === "anthropic") {
        return await this.generateWithAnthropic(
          prompt,
          decryptedKey,
          model,
          maxTokens,
          temperature
        );
      } else if (service === "openai") {
        return await this.generateWithOpenAI(
          prompt,
          decryptedKey,
          model,
          maxTokens,
          temperature
        );
      } else {
        throw new Error(`Unsupported AI service: ${service}`);
      }
    } catch (error) {
      console.error("AI generation error:", error);
      throw new Error("Failed to generate content with AI");
    }
  }

  private static async generateWithAnthropic(
    prompt: string,
    apiKey: string,
    model: string = "claude-3-haiku-20240307",
    maxTokens: number,
    temperature: number
  ): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private static async generateWithOpenAI(
    prompt: string,
    apiKey: string,
    model: string = "gpt-3.5-turbo",
    maxTokens: number,
    temperature: number
  ): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Development/test mode - returns mock content
  static async generateMock(prompt: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Parse the prompt to understand what type of content to generate
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes("blog")) {
      return `# Generated Blog Post

## Introduction
This is a professionally generated blog post based on your requirements. In a production environment with valid API keys, this would contain AI-generated content tailored to your specific needs.

## Main Content
The content would be comprehensive, engaging, and optimized for your target audience. It would incorporate all the variables and requirements you specified.

## Key Points
- Tailored to your business needs
- SEO-optimized content
- Engaging and informative
- Professional tone and style

## Conclusion
This mock content demonstrates the structure and format of what would be generated. Configure your API keys in Settings to enable real AI content generation.`;
    }

    if (lowerPrompt.includes("facebook") && lowerPrompt.includes("video")) {
      return `🎬 Facebook Video Ad Script

**Hook (0-3 seconds):**
"Are you tired of [problem]? Here's the solution you've been waiting for!"

**Problem Identification (3-10 seconds):**
Many businesses struggle with [specific challenge]. This leads to lost opportunities and frustrated customers.

**Solution Presentation (10-20 seconds):**
Introducing [your product/service] - the game-changing solution that helps you [key benefit].

**Call to Action (20-30 seconds):**
Don't wait! Visit our website today and get started with a free consultation.

**Caption:**
🚀 Transform your business with [product/service]! 

✅ [Benefit 1]
✅ [Benefit 2]  
✅ [Benefit 3]

Ready to level up? Click the link in bio! 

#BusinessGrowth #Innovation #Success #Entrepreneur`;
    }

    if (lowerPrompt.includes("google") && lowerPrompt.includes("search")) {
      return `Google Search Ads - 3 Variations

**Variation 1:**
Headlines:
- Professional Services | Trusted
- Get Results Today | Call Now
- Best Prices Guaranteed

Descriptions:
- Expert solutions for your business needs. Fast, reliable service.
- Contact us today for a free consultation. Satisfaction guaranteed.

**Variation 2:**
Headlines:
- Top-Rated Business Solutions
- Save Time & Money | Expert Help
- Free Consultation Available

Descriptions:
- Transform your business with our proven strategies and tools.
- Join thousands of satisfied customers. Get started today!

**Variation 3:**
Headlines:
- Industry-Leading Services
- Trusted by Local Businesses
- Results You Can Count On

Descriptions:
- Professional service with a personal touch. Call now!
- Experience the difference. Quality service at competitive prices.`;
    }

    // Default response
    return `Generated Content

This is AI-generated content based on your specifications. In production with valid API keys, this would contain customized content specifically tailored to your needs.

Your input has been processed and would generate relevant, high-quality content for your use case.

To enable real AI generation:
1. Go to Settings > API Keys
2. Add your Anthropic or OpenAI API key
3. Return here to generate actual AI content`;
  }
}
