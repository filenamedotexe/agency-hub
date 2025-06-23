// This file forces Tailwind to include our custom color utilities
// It's not rendered anywhere, just scanned by Tailwind

export default function ForceColors() {
  return (
    <div>
      {/* Brand Primary */}
      <div className="border-brand-primary bg-brand-primary text-brand-primary" />
      <div className="bg-brand-primary-hover text-brand-primary-hover" />
      <div className="bg-brand-primary-light hover:bg-brand-primary hover:text-brand-primary" />
      <div className="focus:ring-brand-primary focus-visible:ring-brand-primary" />
      <div className="focus-visible:ring-brand-primary/20 focus-visible:ring-brand-primary/50" />
      <div className="focus-visible:border-brand-primary" />

      {/* Brand Success */}
      <div className="border-brand-success bg-brand-success text-brand-success" />
      <div className="border-brand-success/20 bg-brand-success-light" />

      {/* Brand Warning */}
      <div className="border-brand-warning bg-brand-warning text-brand-warning" />
      <div className="border-brand-warning/20 bg-brand-warning-light" />

      {/* Brand Error */}
      <div className="border-brand-error bg-brand-error text-brand-error" />
      <div className="border-brand-error/20 bg-brand-error-light" />

      {/* Gray Scale */}
      <div className="border-gray-50 bg-gray-50 text-gray-50" />
      <div className="border-gray-100 bg-gray-100 text-gray-100" />
      <div className="border-gray-200 bg-gray-200 text-gray-200" />
      <div className="border-gray-300 bg-gray-300 text-gray-300" />
      <div className="border-gray-400 bg-gray-400 text-gray-400" />
      <div className="border-gray-500 bg-gray-500 text-gray-500" />
      <div className="border-gray-600 bg-gray-600 text-gray-600" />
      <div className="border-gray-700 bg-gray-700 text-gray-700" />
      <div className="border-gray-800 bg-gray-800 text-gray-800" />
      <div className="border-gray-900 bg-gray-900 text-gray-900" />
      <div className="border-gray-950 bg-gray-950 text-gray-950" />

      {/* Hover states */}
      <div className="hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900" />
      <div className="hover:-translate-y-0.5 hover:bg-brand-primary-hover" />

      {/* Focus states */}
      <div className="focus:bg-gray-100 focus-visible:bg-gray-100" />
    </div>
  );
}
