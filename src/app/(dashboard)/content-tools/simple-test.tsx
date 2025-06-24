"use client";

export default function SimpleContentToolsTest() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Tools - Simple Test</h1>
        <p className="text-muted-foreground">
          This is a simple test to see if React components load
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4">
          <h3 className="font-bold">Blog Writer</h3>
          <p>Generate engaging blog posts</p>
          <button className="mt-2 rounded bg-blue-500 px-4 py-2 text-white">
            Test Button
          </button>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-bold">Facebook Ad Writer</h3>
          <p>Create Facebook ad copy</p>
          <button className="mt-2 rounded bg-blue-500 px-4 py-2 text-white">
            Test Button
          </button>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-bold">Google Search Ad</h3>
          <p>Write Google search ads</p>
          <button className="mt-2 rounded bg-blue-500 px-4 py-2 text-white">
            Test Button
          </button>
        </div>
      </div>

      <div>
        <p>If you can see this, React components are working!</p>
      </div>
    </div>
  );
}
