import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";

const replace = vi.fn();
const login = vi.fn();
let authStatus = "anonymous";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams("next=/admin/projects"),
}));
vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({ login, status: authStatus, user: null, logout: vi.fn() }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    replace.mockReset();
    login.mockReset();
    authStatus = "anonymous";
  });

  it("validates that both fields are filled", async () => {
    render(<LoginForm />);
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter your username and password.");
    expect(login).not.toHaveBeenCalled();
  });

  it("submits trimmed credentials", async () => {
    login.mockResolvedValue(undefined);
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText("Username"), "  admin ");
    await userEvent.type(screen.getByLabelText("Password"), "secret-pass");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(login).toHaveBeenCalledWith("admin", "secret-pass"));
  });

  it("shows the server error when sign in fails", async () => {
    login.mockRejectedValue(new Error("No active account found with the given credentials"));
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText("Username"), "admin");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No active account found");
  });

  it("redirects an already authenticated user to the requested admin page", () => {
    authStatus = "authenticated";
    render(<LoginForm />);
    expect(replace).toHaveBeenCalledWith("/admin/projects");
  });
});
