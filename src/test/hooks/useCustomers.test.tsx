import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCustomers, useCreateCustomer, useDeleteCustomer } from "@/hooks/api/useCustomers";
import { api } from "@/lib/api";
import type { Customer } from "@/types/api";

// Mock the API
vi.mock("@/lib/api", () => ({
  api: {
    getCustomers: vi.fn(),
    getCustomer: vi.fn(),
    createCustomer: vi.fn(),
    updateCustomer: vi.fn(),
    deleteCustomer: vi.fn(),
  },
}));

// Mock useToast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockCustomers: Customer[] = [
  { id: "1", tenantId: "t1", cpf: "12345678901", phone: "11999998888", name: "Maria Silva", createdAt: "2024-01-15", active: true },
  { id: "2", tenantId: "t1", cpf: "98765432109", phone: "11888887777", name: "João Santos", createdAt: "2024-02-20", active: true },
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

describe("useCustomers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches customers successfully", async () => {
    vi.mocked(api.getCustomers).mockResolvedValueOnce(mockCustomers);

    const { result } = renderHook(() => useCustomers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockCustomers);
    expect(api.getCustomers).toHaveBeenCalledTimes(1);
  });

  it("handles error when fetching customers fails", async () => {
    vi.mocked(api.getCustomers).mockRejectedValueOnce(new Error("API Error"));

    const { result } = renderHook(() => useCustomers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("API Error");
  });
});

describe("useCreateCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates customer successfully", async () => {
    const newCustomer: Customer = {
      id: "3",
      tenantId: "t1",
      cpf: "11122233344",
      phone: "11777776666",
      name: "Paula Costa",
      createdAt: "2024-03-10",
      active: true,
    };

    vi.mocked(api.createCustomer).mockResolvedValueOnce(newCustomer);

    const { result } = renderHook(() => useCreateCustomer(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      cpf: "11122233344",
      phone: "11777776666",
      name: "Paula Costa",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.createCustomer).toHaveBeenCalledWith({
      cpf: "11122233344",
      phone: "11777776666",
      name: "Paula Costa",
    });
  });
});

describe("useDeleteCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes customer successfully", async () => {
    vi.mocked(api.deleteCustomer).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useDeleteCustomer(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.deleteCustomer).toHaveBeenCalledWith("1");
  });
});
