import type { ReactNode } from 'react';

/**
 * Shared layout for public (pre-login) pages: login, forgot/reset password,
 * activate account, error pages. Theme-aware background with animated orbs.
 */
export default function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-clip bg-gradient-to-br from-slate-50 via-indigo-50/50 to-slate-100 dark:from-[#070b24] dark:via-[#0a0f2e] dark:to-[#070b24] p-4 transition-colors">
      {/* Animated gradient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-indigo-300/20 dark:bg-indigo-600/15 blur-[100px] animate-blob" />
        <div className="absolute bottom-0 -left-32 h-[350px] w-[350px] rounded-full bg-violet-300/15 dark:bg-violet-600/10 blur-[90px] animate-blob-slow" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(100,100,120,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,120,.15) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
