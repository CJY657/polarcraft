// @vitest-environment jsdom

import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthDialogStore } from "@/stores/authDialogStore";

import { ProtectedRoute } from "./ProtectedRoute";

const mockUseAuth = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

function renderProtectedRoute(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<div>home</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/feedback" element={<div>protected feedback</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    act(() => {
      useAuthDialogStore.setState({
        isOpen: false,
        mode: "login",
        returnTo: null,
      });
    });
  });

  it("opens the login dialog with the current path as returnTo", async () => {
    renderProtectedRoute("/feedback?feedback=product#feedback");

    await waitFor(() => {
      expect(useAuthDialogStore.getState().isOpen).toBe(true);
    });

    expect(useAuthDialogStore.getState().returnTo).toBe("/feedback?feedback=product#feedback");
    expect(screen.queryByText("protected feedback")).toBeNull();
  });

  it("navigates to the home page when the login dialog is closed", async () => {
    renderProtectedRoute("/feedback");

    await waitFor(() => {
      expect(useAuthDialogStore.getState().isOpen).toBe(true);
    });

    act(() => {
      useAuthDialogStore.getState().closeDialog();
    });

    await waitFor(() => {
      expect(screen.getByText("home")).toBeDefined();
    });
  });

  it("renders protected content for authenticated users", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    renderProtectedRoute("/feedback");

    expect(screen.getByText("protected feedback")).toBeDefined();
    expect(useAuthDialogStore.getState().isOpen).toBe(false);
  });
});
