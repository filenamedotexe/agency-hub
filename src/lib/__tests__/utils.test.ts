import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("Utils", () => {
  describe("cn (classname utility)", () => {
    it("should merge class names", () => {
      const result = cn("base-class", "additional-class");
      expect(result).toBe("base-class additional-class");
    });

    it("should handle conditional classes", () => {
      const isActive = true;
      const isDisabled = false;

      const result = cn("base", isActive && "active", isDisabled && "disabled");

      expect(result).toBe("base active");
    });

    it("should handle undefined and null values", () => {
      const result = cn("base", undefined, null, "end");
      expect(result).toBe("base end");
    });

    it("should merge Tailwind classes correctly", () => {
      const result = cn("px-2 py-1", "px-4");
      // tailwind-merge will override px-2 with px-4 but keep the order
      expect(result).toContain("px-4");
      expect(result).toContain("py-1");
    });

    it("should handle arrays of classes", () => {
      const classes = ["class1", "class2"];
      const result = cn("base", classes);
      expect(result).toBe("base class1 class2");
    });

    it("should handle empty inputs", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("should handle object syntax", () => {
      const result = cn({
        base: true,
        active: true,
        disabled: false,
      });
      expect(result).toBe("base active");
    });

    it("should override conflicting Tailwind classes", () => {
      const result = cn("text-red-500", "text-blue-500");
      // Should only contain the latter color class
      expect(result).toContain("text-blue-500");
      expect(result).not.toContain("text-red-500");
    });

    it("should preserve non-conflicting classes", () => {
      const result = cn(
        "bg-white text-black border rounded",
        "bg-gray-100 p-4"
      );
      expect(result).toContain("bg-gray-100");
      expect(result).toContain("text-black");
      expect(result).toContain("border");
      expect(result).toContain("rounded");
      expect(result).toContain("p-4");
    });
  });
});
