"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Staff dashboard content is shown on /dashboard by user type.
 * This route redirects to the single dashboard.
 */
export default function StaffDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
    </div>
  );
}
