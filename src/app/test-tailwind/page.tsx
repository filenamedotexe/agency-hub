export default function TestTailwindPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="mb-4 text-3xl font-bold text-gray-900">
        Tailwind CSS Test
      </h1>

      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <p className="text-gray-700">
            This is a test card with Tailwind classes.
          </p>
        </div>

        <button className="rounded bg-brand-primary px-4 py-2 text-white hover:bg-brand-primary-hover">
          Brand Primary Button
        </button>

        <button className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Standard Tailwind Button
        </button>

        <div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          This is an alert box
        </div>
      </div>
    </div>
  );
}
