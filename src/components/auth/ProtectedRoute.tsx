import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { useAuthDialogStore } from "@/stores/authDialogStore";

export function buildAuthReturnTo(location: {
  pathname: string;
  search?: string;
  hash?: string;
}) {
  return `${location.pathname}${location.search ?? ""}${location.hash ?? ""}`;
}

function RouteGateFallback() {
  return (
    <div className="glass-page flex min-h-screen items-center justify-center px-6">
      <div className="glass-panel-strong flex min-w-[240px] flex-col items-center gap-4 rounded-[2rem] px-8 py-8 text-center">
        <div className="glass-chip flex h-14 w-14 items-center justify-center rounded-[1.4rem] border">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--paper-accent)] border-t-transparent" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--paper-foreground)]">登录后继续</p>
          <p className="mt-1 text-xs text-[var(--glass-text-muted)]">
            正在检查你的学习空间访问权限
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isDialogOpen = useAuthDialogStore((state) => state.isOpen);
  const openDialog = useAuthDialogStore((state) => state.openDialog);
  const requestedLoginRef = useRef(false);
  const sawDialogOpenRef = useRef(false);
  const returnTo = buildAuthReturnTo(location);

  useEffect(() => {
    if (isLoading || isAuthenticated || requestedLoginRef.current) {
      return;
    }

    requestedLoginRef.current = true;
    sawDialogOpenRef.current = false;
    openDialog("login", { returnTo });
  }, [isAuthenticated, isLoading, openDialog, returnTo]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isAuthenticated) {
      requestedLoginRef.current = false;
      sawDialogOpenRef.current = false;
      return;
    }

    if (isDialogOpen) {
      sawDialogOpenRef.current = true;
      return;
    }

    if (requestedLoginRef.current && sawDialogOpenRef.current) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isDialogOpen, isLoading, navigate]);

  if (isLoading || !isAuthenticated) {
    return <RouteGateFallback />;
  }

  return <Outlet />;
}
