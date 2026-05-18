import { useAuthStore } from "@/store/auth";
import { act } from "@testing-library/react";
import axios from "axios";

jest.mock("@/lib/axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import api from "@/lib/axios";
const mockApi = api as jest.Mocked<typeof api>;

const mockUser = {
  id: 1,
  email: "landlord@test.com",
  firstName: "Ion",
  lastName: "Popescu",
  role: "Landlord",
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: null, isLoading: false });
});

// ── LOGIN ──────────────────────────────────────────────────────────────────

describe("auth store — login", () => {
  test("sets user on successful login", async () => {
    mockApi.post.mockResolvedValueOnce({ data: mockUser });

    await act(async () => {
      await useAuthStore.getState().login("landlord@test.com", "Test123!");
    });

    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  test("calls POST /api/auth/login with correct credentials", async () => {
    mockApi.post.mockResolvedValueOnce({ data: mockUser });

    await act(async () => {
      await useAuthStore.getState().login("landlord@test.com", "Test123!");
    });

    expect(mockApi.post).toHaveBeenCalledWith("/api/auth/login", {
      email: "landlord@test.com",
      password: "Test123!",
    });
  });

  test("throws on failed login (401)", async () => {
    mockApi.post.mockRejectedValueOnce({ response: { status: 401 } });

    await expect(
      useAuthStore.getState().login("wrong@test.com", "bad")
    ).rejects.toBeDefined();

    expect(useAuthStore.getState().user).toBeNull();
  });

  test("does not mutate user state if login fails", async () => {
    useAuthStore.setState({ user: null });
    mockApi.post.mockRejectedValueOnce(new Error("Unauthorized"));

    try {
      await useAuthStore.getState().login("x@x.com", "wrong");
    } catch {}

    expect(useAuthStore.getState().user).toBeNull();
  });
});

// ── REGISTER ────────────────────────────────────────────────────────────────

describe("auth store — register", () => {
  test("sets user on successful register", async () => {
    const newUser = { ...mockUser, email: "new@test.com", role: "Tenant" };
    mockApi.post.mockResolvedValueOnce({ data: newUser });

    await act(async () => {
      await useAuthStore.getState().register({
        email: "new@test.com",
        password: "Test123!",
        confirmPassword: "Test123!",
        firstName: "Maria",
        lastName: "Ionescu",
        role: "Tenant",
      });
    });

    expect(useAuthStore.getState().user).toEqual(newUser);
  });

  test("calls POST /api/auth/register with correct payload", async () => {
    mockApi.post.mockResolvedValueOnce({ data: mockUser });

    const payload = {
      email: "new@test.com",
      password: "Test123!",
      confirmPassword: "Test123!",
      firstName: "Ion",
      lastName: "Pop",
      role: "Landlord",
    };

    await act(async () => {
      await useAuthStore.getState().register(payload);
    });

    expect(mockApi.post).toHaveBeenCalledWith("/api/auth/register", payload);
  });

  test("throws on register conflict (409)", async () => {
    mockApi.post.mockRejectedValueOnce({ response: { status: 409 } });

    await expect(
      useAuthStore.getState().register({
        email: "dup@test.com",
        password: "Test123!",
        confirmPassword: "Test123!",
        firstName: "A",
        lastName: "B",
        role: "Landlord",
      })
    ).rejects.toBeDefined();
  });
});

// ── LOGOUT ──────────────────────────────────────────────────────────────────

describe("auth store — logout", () => {
  test("clears user on logout", async () => {
    useAuthStore.setState({ user: mockUser });
    mockApi.post.mockResolvedValueOnce({});

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    expect(useAuthStore.getState().user).toBeNull();
  });

  test("calls POST /api/auth/logout", async () => {
    useAuthStore.setState({ user: mockUser });
    mockApi.post.mockResolvedValueOnce({});

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    expect(mockApi.post).toHaveBeenCalledWith("/api/auth/logout");
  });
});

// ── FETCH ME ────────────────────────────────────────────────────────────────

describe("auth store — fetchMe", () => {
  test("populates user when session is valid", async () => {
    mockApi.get.mockResolvedValueOnce({ data: mockUser });

    await act(async () => {
      await useAuthStore.getState().fetchMe();
    });

    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  test("sets user to null when unauthenticated", async () => {
    useAuthStore.setState({ user: mockUser });
    mockApi.get.mockRejectedValueOnce({ response: { status: 401 } });

    await act(async () => {
      await useAuthStore.getState().fetchMe();
    });

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
