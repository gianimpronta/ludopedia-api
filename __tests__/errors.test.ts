import { describe, it, expect } from "vitest";
import { LudopediaError } from "../src/errors";

describe("LudopediaError", () => {
  it("should create an error with a message and without statusCode", () => {
    const error = new LudopediaError("Test error");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(LudopediaError);
    expect(error.message).toBe("Test error");
    expect(error.name).toBe("LudopediaError");
    expect(error.statusCode).toBeUndefined();
  });

  it("should create an error with a message and statusCode", () => {
    const error = new LudopediaError("Not found", 404);
    expect(error.message).toBe("Not found");
    expect(error.statusCode).toBe(404);
  });
});
