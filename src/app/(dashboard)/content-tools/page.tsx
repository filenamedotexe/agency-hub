"use client";

export default function ContentToolsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Content Tools</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="cursor-pointer rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md">
          <h3 className="mb-2 text-lg font-medium">Blog Writer</h3>
          <p className="text-sm text-gray-600">
            Generate blog content using AI
          </p>
        </div>

        <div className="cursor-pointer rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md">
          <h3 className="mb-2 text-lg font-medium">Facebook Video Ad Script</h3>
          <p className="text-sm text-gray-600">
            Create video ad scripts and captions
          </p>
        </div>

        <div className="cursor-pointer rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md">
          <h3 className="mb-2 text-lg font-medium">Facebook Image Ad</h3>
          <p className="text-sm text-gray-600">
            Create image ad copy and captions
          </p>
        </div>

        <div className="cursor-pointer rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md">
          <h3 className="mb-2 text-lg font-medium">Google Search Ad Writer</h3>
          <p className="text-sm text-gray-600">Generate Google Ads copy</p>
        </div>

        <div className="cursor-pointer rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md">
          <h3 className="mb-2 text-lg font-medium">SEO Keyword Research</h3>
          <p className="text-sm text-gray-600">Research and analyze keywords</p>
        </div>
      </div>
    </div>
  );
}
