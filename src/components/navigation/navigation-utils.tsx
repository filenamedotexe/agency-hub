"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { uiDebug } from "@/lib/ui-debug";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Breadcrumb component
export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav
      className="hidden items-center space-x-2 text-sm md:flex"
      aria-label="Breadcrumb"
    >
      <Link
        href="/dashboard"
        className="text-gray-500 transition-colors hover:text-gray-700"
      >
        Home
      </Link>
      {segments.map((segment, idx) => {
        const href = `/${segments.slice(0, idx + 1).join("/")}`;
        const isLast = idx === segments.length - 1;
        const label = segment
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());

        return (
          <React.Fragment key={idx}>
            <ChevronRight
              className="h-4 w-4 text-gray-400"
              aria-hidden="true"
            />
            {isLast ? (
              <span className="font-medium text-gray-900" aria-current="page">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="capitalize text-gray-500 transition-colors hover:text-gray-700"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// Command Palette component
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
        uiDebug.log("CommandPalette", "Toggle", { open: !open });
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  // Quick actions based on current page
  const quickActions = [
    { label: "Go to Dashboard", href: "/dashboard" },
    { label: "View Clients", href: "/clients" },
    { label: "Manage Services", href: "/services" },
    { label: "View Requests", href: "/requests" },
    { label: "Settings", href: "/settings" },
  ].filter((action) => action.href !== pathname);

  const filteredActions = quickActions.filter((action) =>
    action.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        <div className="flex items-center border-b px-4">
          <Search className="mr-3 h-4 w-4 text-gray-500" />
          <input
            className="flex-1 px-3 py-4 text-sm outline-none"
            placeholder="Search for anything..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">ESC</span>
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {filteredActions.length > 0 ? (
            <div className="space-y-1">
              <p className="px-2 py-1 text-xs font-medium text-gray-500">
                Quick Actions
              </p>
              {filteredActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-500">
              No results found for &quot;{search}&quot;
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
