"use client";

export default function AutomationsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Automations</h1>

      <div className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-medium">Form Webhooks</h2>
          <p className="text-gray-600">
            Webhooks configured for forms will appear here.
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-medium">Content Tool Webhooks</h2>
          <p className="text-gray-600">
            Webhooks attached to content tools will appear here.
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-medium">General Webhooks</h2>
          <p className="text-gray-600">
            General webhooks created for automation will appear here.
          </p>
          <button className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700">
            Add Webhook
          </button>
        </div>
      </div>
    </div>
  );
}
