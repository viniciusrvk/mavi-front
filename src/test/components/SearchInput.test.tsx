import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchInput } from "@/components/common/SearchInput";

describe("SearchInput", () => {
  it("renders with placeholder", () => {
    render(
      <SearchInput value="" onChange={() => {}} placeholder="Buscar..." />
    );
    expect(screen.getByPlaceholderText("Buscar...")).toBeInTheDocument();
  });

  it("displays current value", () => {
    render(
      <SearchInput value="test value" onChange={() => {}} />
    );
    expect(screen.getByDisplayValue("test value")).toBeInTheDocument();
  });

  it("calls onChange when typing", () => {
    const handleChange = vi.fn();
    render(
      <SearchInput value="" onChange={handleChange} />
    );
    
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "new value" } });
    
    expect(handleChange).toHaveBeenCalledWith("new value");
  });

  it("renders search icon", () => {
    const { container } = render(
      <SearchInput value="" onChange={() => {}} />
    );
    
    // Check for SVG icon (lucide-react renders as SVG)
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
