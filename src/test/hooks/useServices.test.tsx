import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useServices, useCreateService } from "@/hooks/api/useServices";
import { api } from "@/lib/api";
import type { Service } from "@/types/api";

// Mock the API
vi.mock("@/lib/api", () => ({
  api: {
    getServices: vi.fn(),
    getService: vi.fn(),
    createService: vi.fn(),
    updateService: vi.fn(),
    deleteService: vi.fn(),
  },
}));

// Mock useToast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockServices: Service[] = [
  { id: "1", name: "Corte Feminino", durationMinutes: 60, price: 80, active: true, tenantId: "t1" },
  { id: "2", name: "Corte Masculino", durationMinutes: 30, price: 50, active: true, tenantId: "t1" },
];

function createWrapper(): ({ children }: { children: ReactNode }) => JSX.Element {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("useServices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches services successfully", async () => {
    vi.mocked(api.getServices).mockResolvedValueOnce(mockServices);

    const { result } = renderHook(() => useServices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockServices);
    expect(api.getServices).toHaveBeenCalledTimes(1);
  });

  it("handles error when fetching services fails", async () => {
    vi.mocked(api.getServices).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useServices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Network error");
  });
});

describe("useCreateService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates service successfully", async () => {
    const newService: Service = {
      id: "3",
      name: "Barba",
      durationMinutes: 20,
      price: 35,
      active: true,
      tenantId: "t1",
    };

    vi.mocked(api.createService).mockResolvedValueOnce(newService);

    const { result } = renderHook(() => useCreateService(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: "Barba",
      durationMinutes: 20,
      price: 35,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.createService).toHaveBeenCalledWith({
      name: "Barba",
      durationMinutes: 20,
      price: 35,
    });
  });
});
