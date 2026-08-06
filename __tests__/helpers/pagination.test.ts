import { describe, it, expect, vi } from "vitest";
import { streamUserCollection } from "../../src/helpers/pagination";

describe("streamUserCollection", () => {
  it("should iterate through all pages of user collection until empty", async () => {
    const mockClient = {
      fetchUserCollection: vi
        .fn()
        .mockResolvedValueOnce([
          { ludopediaId: 1, name: "Game 1" },
          { ludopediaId: 2, name: "Game 2" },
        ])
        .mockResolvedValueOnce([]),
    } as any;

    const items = [];
    for await (const item of streamUserCollection(mockClient, "testuser", { pageSize: 2 })) {
      items.push(item);
    }

    expect(items).toHaveLength(2);
    expect(items[0].name).toBe("Game 1");
    expect(mockClient.fetchUserCollection).toHaveBeenCalledTimes(2);
  });

  it("should stop immediately if fetchUserCollection returns null or empty", async () => {
    const mockClient = {
      fetchUserCollection: vi.fn().mockResolvedValueOnce(null),
    } as any;

    const items = [];
    for await (const item of streamUserCollection(mockClient, "testuser")) {
      items.push(item);
    }

    expect(items).toHaveLength(0);
  });
});
