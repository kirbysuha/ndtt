"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const isPublic = pathname?.startsWith("/apply") || pathname === "/login";

  useEffect(() => {
    if (isPublic) {
      setIsAuthenticated(true);
      return;
    }

    const token = localStorage.getItem("ndtt_admin_token");
    if (!token) {
      setIsAuthenticated(false);
      router.replace(`/login?from=${encodeURIComponent(pathname || "/")}`);
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, isPublic, router]);

  if (isPublic) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        {children}
      </main>
    );
  }

  if (isAuthenticated === null || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 p-4 sm:p-6 lg:p-8 overflow-x-auto min-w-0">
        {children}
      </main>
    </div>
  );
}