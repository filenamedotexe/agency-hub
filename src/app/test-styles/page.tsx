export default function TestStyles() {
  return (
    <div className="p-8">
      <h1 className="mb-4 text-3xl font-bold">Style Test Page</h1>

      <div className="space-y-4">
        <div className="rounded bg-red-500 p-4 text-white">
          Standard Tailwind: bg-red-500
        </div>

        <div className="rounded bg-gray-200 p-4 text-gray-800">
          Custom Gray: bg-gray-200
        </div>

        <div className="rounded bg-brand-primary p-4 text-white">
          Brand Primary: bg-brand-primary
        </div>

        <div className="rounded border-2 border-brand-primary p-4 text-brand-primary">
          Brand Primary Border: border-brand-primary
        </div>

        <button className="rounded bg-brand-primary px-4 py-2 text-white hover:bg-brand-primary-hover">
          Brand Button
        </button>
      </div>
    </div>
  );
}
