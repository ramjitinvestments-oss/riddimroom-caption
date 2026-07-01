import React from 'react';

interface ProtectedRouteProps {
  currentUser: any;
  isAuthLoading: boolean;
  requiredRole?: string;
  requiredFeature?: string;
  userQuota: any;
  redirectTo: (path: string) => void;
  children: React.ReactNode;
}

export function ProtectedRoute({
  currentUser,
  isAuthLoading,
  requiredRole,
  requiredFeature,
  userQuota,
  redirectTo,
  children
}: ProtectedRouteProps) {
  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070707] text-white">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-white/50 tracking-wider uppercase font-mono animate-pulse">
          Synchronizing Secure Protocol...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    // Delay routing update slightly to prevent infinite React render loop warnings
    setTimeout(() => {
      redirectTo('/login');
    }, 0);
    return null;
  }

  if (requiredRole && userQuota?.role !== requiredRole && userQuota?.role !== 'admin') {
    setTimeout(() => {
      redirectTo('/dashboard');
    }, 0);
    return null;
  }

  if (requiredFeature && userQuota && userQuota[requiredFeature] === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070707] text-white p-6">
        <div className="max-w-md w-full bg-[#111116] border border-red-500/20 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center mx-auto border border-red-500/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0-8V5m0 11h.01M12 2a10 10 0 110 20 10 10 0 010-20z" />
            </svg>
          </div>
          <h2 className="text-base font-black text-white tracking-tight uppercase">Feature Access Restricted</h2>
          <p className="text-xs text-white/60 leading-relaxed">
            The administrator has temporarily disabled this feature for your account. Please contact system support for permissions.
          </p>
          <button
            onClick={() => redirectTo('/dashboard')}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold rounded-lg transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
