import { describe, it, expect } from "vitest";

describe("Backend Health Check", () => {
    it("should say 1 + 1 is 2", () => {
        expect(1 + 1).toBe(2);
    });
    
    it("should have a Vitest environment", () => {
        expect(true).toBe(true);
    });
});
