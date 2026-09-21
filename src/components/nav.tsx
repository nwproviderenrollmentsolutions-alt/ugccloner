"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/projects/new", label: "Create" },
  { href: "/library", label: "Viral Library" },
  { href: "/avatars", label: "Avatars" },
  { href: "/settings", label: "Settings" },
];

export function Nav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-border bg-panel/60 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-sm whitespace-nowrap">AI UGC Cloner</span>
          <nav className="flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-sm transition-colors",
                  pathname === l.href || (l.href !== "/dashboard" && pathname.startsWith(l.href))
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:text-slate-100 hover:bg-panel2"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted hidden sm:inline">{userEmail}</span>
          <button onClick={logout} className="btn-secondary text-xs py-1.5">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
