"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  Home,
  FileText,
  Briefcase,
  LogOut,
  ChevronDown,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/client-dashboard",
    icon: Home,
  },
  {
    label: "Forms",
    href: "/client-dashboard/forms",
    icon: FileText,
  },
  {
    label: "Services",
    href: "/client-dashboard/services",
    icon: Briefcase,
  },
];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Focus management for sidebar
  useEffect(() => {
    if (sidebarOpen && sidebarRef.current) {
      const firstLink = sidebarRef.current.querySelector("a");
      if (firstLink) {
        (firstLink as HTMLElement).focus();
      }
    }
  }, [sidebarOpen]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-300">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <h2 className="text-xl font-semibold text-gray-900">Client Portal</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-2 transition-colors duration-150 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <nav className="space-y-1 px-4 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn("nav-item text-sm", isActive && "active")}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col lg:bg-white lg:shadow-lg">
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <h2 className="text-xl font-semibold text-gray-900">Client Portal</h2>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("nav-item text-sm", isActive && "active")}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content area */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Top header */}
        <header className="border-b border-gray-200 bg-white shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-2 transition-colors duration-150 hover:bg-gray-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>

            {/* Welcome message */}
            <div className="hidden lg:block">
              <h1 className="text-xl font-semibold text-gray-900">
                Welcome back!
              </h1>
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center rounded-md p-2 transition-colors duration-150 hover:bg-gray-100"
                aria-label="User menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-primary)] font-medium text-white transition-colors duration-150 hover:bg-[var(--brand-primary-hover)]">
                  {user.email[0].toUpperCase()}
                </div>
                <ChevronDown
                  className={cn(
                    "ml-2 h-4 w-4 text-gray-600 transition-transform duration-150",
                    userMenuOpen && "rotate-180"
                  )}
                />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-40 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-xl duration-200 animate-in fade-in slide-in-from-top-2">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-500">Client</p>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="flex w-full items-center px-4 py-2.5 text-left text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <LogOut className="mr-2 h-4 w-4 text-gray-500" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

        {/* Mobile bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white shadow-lg lg:hidden">
          <div className="grid grid-cols-3 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center py-3 text-xs font-medium transition-colors duration-150",
                    isActive
                      ? "text-[var(--brand-primary)]"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-1/2 top-0 h-0.5 w-12 -translate-x-1/2 rounded-full bg-[var(--brand-primary)]" />
                  )}
                  <Icon className="mb-1 h-5 w-5" />
                  <span className="max-w-[64px] truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
