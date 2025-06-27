"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Breadcrumbs,
  CommandPalette,
} from "@/components/navigation/navigation-utils";
import {
  Menu,
  X,
  Home,
  Users,
  FileText,
  Edit3,
  Settings,
  LogOut,
  ChevronDown,
  Bot,
  Webhook,
  Calendar,
  Package,
  Search,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: [
      UserRole.ADMIN,
      UserRole.SERVICE_MANAGER,
      UserRole.COPYWRITER,
      UserRole.EDITOR,
      UserRole.VA,
    ],
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Users,
    roles: [UserRole.ADMIN, UserRole.SERVICE_MANAGER],
  },
  {
    label: "Services",
    href: "/services",
    icon: Package,
    roles: [UserRole.ADMIN, UserRole.SERVICE_MANAGER, UserRole.CLIENT],
  },
  {
    label: "Requests",
    href: "/requests",
    icon: FileText,
    roles: [
      UserRole.ADMIN,
      UserRole.SERVICE_MANAGER,
      UserRole.COPYWRITER,
      UserRole.EDITOR,
      UserRole.VA,
    ],
  },
  {
    label: "Forms",
    href: "/forms",
    icon: Edit3,
    roles: [UserRole.ADMIN, UserRole.SERVICE_MANAGER],
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: Calendar,
    roles: [UserRole.ADMIN, UserRole.SERVICE_MANAGER],
  },
  {
    label: "Content Tools",
    href: "/content-tools",
    icon: Bot,
    roles: [UserRole.ADMIN, UserRole.SERVICE_MANAGER, UserRole.COPYWRITER],
  },
  {
    label: "Automations",
    href: "/automations",
    icon: Webhook,
    roles: [UserRole.ADMIN, UserRole.SERVICE_MANAGER],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: [UserRole.ADMIN],
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut, isLoading } = useAuth();
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

  // Click outside handler for user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [userMenuOpen]);

  // Use a stable loading state for SSR to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-muted-foreground">Not authenticated</p>
        </div>
      </div>
    );
  }

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

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
      <motion.div
        ref={sidebarRef}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl lg:hidden"
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -256 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        drag="x"
        dragConstraints={{ left: -256, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, { offset, velocity }) => {
          if (offset.x < -100 || velocity.x < -500) {
            setSidebarOpen(false);
          }
        }}
        role="navigation"
        aria-label="Mobile navigation"
        data-testid="mobile-menu"
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <h2 className="text-xl font-semibold text-gray-900">Agency Hub</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-2 transition-colors duration-150 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <nav className="space-y-1 px-4 py-4">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <motion.div
                key={item.href}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn("nav-item text-sm", isActive && "active")}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              </motion.div>
            );
          })}

          {/* Mobile Sign Out Button */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("[DashboardLayout] Mobile logout button clicked");
                setSidebarOpen(false);
                signOut();
              }}
              className="nav-item w-full text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
              type="button"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </motion.button>
          </div>
        </nav>
      </motion.div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col lg:bg-white lg:shadow-lg">
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <h2 className="text-xl font-semibold text-gray-900">Agency Hub</h2>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
          {filteredNavItems.map((item) => {
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
            <motion.button
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-2 transition-colors duration-150 hover:bg-gray-100 lg:hidden"
              aria-label="Toggle navigation"
              data-testid="mobile-menu-trigger"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </motion.button>

            {/* Breadcrumbs and title */}
            <div className="flex flex-1 items-center justify-between">
              <div className="flex flex-col">
                <Breadcrumbs />
                <h1 className="text-xl font-semibold text-gray-900 lg:hidden">
                  {filteredNavItems.find((item) => item.href === pathname)
                    ?.label || "Dashboard"}
                </h1>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Command palette trigger */}
              <button
                onClick={() => {}}
                className="hidden items-center gap-2 rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-200 md:flex"
                title="Press ⌘K to open command palette"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
                <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium opacity-100">
                  <span className="text-xs">⌘K</span>
                </kbd>
              </button>

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
                        <p className="text-xs capitalize text-gray-500">
                          {user.role.toLowerCase().replace("_", " ")}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log(
                            "[DashboardLayout] Desktop logout button clicked"
                          );
                          signOut();
                        }}
                        className="flex w-full cursor-pointer items-center px-4 py-2.5 text-left text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900"
                        type="button"
                      >
                        <LogOut className="mr-2 h-4 w-4 text-gray-500" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 pb-20 sm:p-6 sm:pb-24 lg:p-8 lg:pb-8">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white shadow-lg lg:hidden">
          <div className="grid grid-cols-4 gap-1">
            {filteredNavItems.slice(0, 4).map((item) => {
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

      {/* Command Palette */}
      <CommandPalette />
    </div>
  );
}
