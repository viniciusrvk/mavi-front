import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";

describe("PageHeader", () => {
  it("renders title correctly", () => {
    render(<PageHeader title="Test Title" />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<PageHeader title="Title" description="Test description" />);
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<PageHeader title="Title" />);
    expect(screen.queryByText("Test description")).not.toBeInTheDocument();
  });

  it("renders action button when provided", () => {
    render(
      <PageHeader
        title="Title"
        action={<Button>Action</Button>}
      />
    );
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });
});
