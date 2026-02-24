import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/common/EmptyState";
import { Users } from "lucide-react";

describe("EmptyState", () => {
  it("renders title correctly", () => {
    render(
      <EmptyState
        icon={Users}
        title="Nenhum resultado"
        description="Tente uma busca diferente"
      />
    );
    expect(screen.getByText("Nenhum resultado")).toBeInTheDocument();
  });

  it("renders description correctly", () => {
    render(
      <EmptyState
        icon={Users}
        title="Nenhum resultado"
        description="Tente uma busca diferente"
      />
    );
    expect(screen.getByText("Tente uma busca diferente")).toBeInTheDocument();
  });

  it("renders icon", () => {
    const { container } = render(
      <EmptyState
        icon={Users}
        title="Nenhum resultado"
        description="Tente uma busca diferente"
      />
    );
    
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
