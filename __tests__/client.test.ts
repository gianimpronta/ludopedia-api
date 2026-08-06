import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LudopediaClient } from "../src/client";
import { LudopediaError } from "../src/errors";
import * as exportedFns from "../src/client"; // To test bound functions at bottom

// Create a mock fetch implementation
const createMockFetch = (responseInit: ResponseInit & { data?: any; reject?: boolean } = {}) => {
  return vi.fn().mockImplementation(async () => {
    if (responseInit.reject) {
      throw new Error("Network error");
    }
    return {
      ok: responseInit.status ? responseInit.status >= 200 && responseInit.status < 300 : true,
      status: responseInit.status || 200,
      json: async () => responseInit.data || {},
    };
  }) as unknown as typeof fetch;
};

describe("LudopediaClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Constructor & Headers", () => {
    it("should initialize with default config", () => {
      const client = new LudopediaClient();
      expect((client as any).baseUrl).toBe("https://ludopedia.com.br/api/v1");
      expect((client as any).apiToken).toBeUndefined();
    });

    it("should initialize from process.env.LUDOPEDIA_API_TOKEN if available", () => {
      process.env.LUDOPEDIA_API_TOKEN = "env-token";
      const client = new LudopediaClient();
      expect((client as any).apiToken).toBe("env-token");
    });

    it("should generate headers with Bearer token", () => {
      const client = new LudopediaClient({ apiToken: "my-token" });
      const headers = (client as any).getHeaders();
      expect(headers["Authorization"]).toBe("Bearer my-token");
    });
  });

  describe("request method", () => {
    it("should handle 401 Unauthorized", async () => {
      const mockFetch = createMockFetch({ status: 401 });
      const client = new LudopediaClient({ fetchFn: mockFetch });
      await expect(client["request"]("/test")).rejects.toThrowError(LudopediaError);
      await expect(client["request"]("/test")).rejects.toThrow("Acesso não autorizado");
    });

    it("should handle 404 Not Found", async () => {
      const mockFetch = createMockFetch({ status: 404 });
      const client = new LudopediaClient({ fetchFn: mockFetch });
      await expect(client["request"]("/test")).rejects.toThrow("Recurso não encontrado");
    });

    it("should handle generic non-ok status", async () => {
      const mockFetch = createMockFetch({ status: 500 });
      const client = new LudopediaClient({ fetchFn: mockFetch });
      await expect(client["request"]("/test")).rejects.toThrow("Erro na comunicação");
    });

    it("should retry on network error and succeed on second attempt", async () => {
      let attempts = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) throw new Error("Network glitch");
        return { ok: true, status: 200, json: async () => ({ success: true }) };
      }) as any;

      const client = new LudopediaClient({ fetchFn: mockFetch, maxRetries: 2, retryDelayMs: 10 });
      const res = await client["request"]("/test");
      expect(res).toEqual({ success: true });
      expect(attempts).toBe(2);
    });

    it("should handle network errors", async () => {
      const mockFetch = createMockFetch({ reject: true });
      const client = new LudopediaClient({ fetchFn: mockFetch });
      await expect(client["request"]("/test")).rejects.toThrow(
        "Falha na requisição para a API da Ludopedia: Network error"
      );
    });

    it("should retry on 429 and succeed on the second attempt", async () => {
      let attempts = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) return { ok: false, status: 429, json: async () => ({}) };
        return { ok: true, status: 200, json: async () => ({ success: true }) };
      }) as any;

      const client = new LudopediaClient({ fetchFn: mockFetch, maxRetries: 2, retryDelayMs: 10 });
      const res = await client["request"]("/test");
      expect(res).toEqual({ success: true });
      expect(attempts).toBe(2);
    });

    it("should send body as JSON for POST requests", async () => {
      const mockFetch = createMockFetch({ data: { success: true } });
      const client = new LudopediaClient({ fetchFn: mockFetch });
      const res = await client["request"]("/test", { method: "POST", body: { id: 1 } });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://ludopedia.com.br/api/v1/test",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ id: 1 }),
        })
      );
      expect(res).toEqual({ success: true });
    });

    it("should allow custom fetch URL and custom token per request", async () => {
      const mockFetch = createMockFetch({ data: { ok: 1 } });
      const client = new LudopediaClient();
      await client["request"]("http://custom.api/test", {
        apiToken: "temp-token",
        fetchFn: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://custom.api/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer temp-token",
          }),
        })
      );
    });
  });

  describe("API Endpoints", () => {
    let client: LudopediaClient;
    let mockFetch: any;

    beforeEach(() => {
      mockFetch = createMockFetch({ data: { result: "ok", colecao: [{ id: 1, nm_jogo: "A" }] } });
      client = new LudopediaClient({ fetchFn: mockFetch, apiToken: "test" });
    });

    it("fetchUserCollection should throw if username is empty", async () => {
      await expect(client.fetchUserCollection("   ")).rejects.toThrowError(LudopediaError);
    });

    it("fetchUserCollection should fetch own only", async () => {
      await client.fetchUserCollection("john", { ownOnly: true });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("search_usuario=john"),
        expect.anything()
      );
    });

    it("should call fetchCollectionItem", async () => {
      await client.fetchCollectionItem(123);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/colecao/item/123"),
        expect.anything()
      );
    });

    it("should call updateCollectionItem", async () => {
      await client.updateCollectionItem({ id: 1 });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/colecao"),
        expect.objectContaining({ method: "POST", body: JSON.stringify({ id: 1 }) })
      );
    });

    it("should call fetchTags", async () => {
      mockFetch = createMockFetch({ data: { tags: [{ id_usuario_tag: 1 }] } });
      client = new LudopediaClient({ fetchFn: mockFetch });
      const res = await client.fetchTags();
      expect(res).toHaveLength(1);
    });

    it("should call saveTag", async () => {
      await client.saveTag({ nm_tag: "new tag" });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/colecao/tags"),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should call deleteTag", async () => {
      await client.deleteTag(99);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/colecao/tags/99"),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("should call searchGames", async () => {
      mockFetch = createMockFetch({ data: { jogos: [{ id: 1 }] } });
      client = new LudopediaClient({ fetchFn: mockFetch });
      await client.searchGames("catan");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("search=catan"),
        expect.anything()
      );
    });

    it("should call fetchGameDetails", async () => {
      await client.fetchGameDetails(55);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/jogos/55"),
        expect.anything()
      );
    });

    it("should call fetchGameExpansions", async () => {
      mockFetch = createMockFetch({ data: { jogos: [] } });
      client = new LudopediaClient({ fetchFn: mockFetch });
      await client.fetchGameExpansions(55);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/jogos/55/expansoes"),
        expect.anything()
      );
    });

    it("should call fetchUserProfile", async () => {
      await client.fetchUserProfile();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/usuario/me"),
        expect.anything()
      );
    });

    it("should call fetchPlays", async () => {
      mockFetch = createMockFetch({ data: { partidas: [] } });
      client = new LudopediaClient({ fetchFn: mockFetch });
      await client.fetchPlays();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/partidas"),
        expect.anything()
      );
    });

    it("should call recordPlay", async () => {
      await client.recordPlay({ id_jogo: 1 });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/partidas"),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should call fetchPlayStats", async () => {
      await client.fetchPlayStats();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/partidas/estatisticas"),
        expect.anything()
      );
    });

    it("should call fetchMechanics", async () => {
      mockFetch = createMockFetch({ data: { mecanicas: [] } });
      client = new LudopediaClient({ fetchFn: mockFetch });
      await client.fetchMechanics();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/mecanicas"),
        expect.anything()
      );
    });

    it("should call fetchCategories", async () => {
      mockFetch = createMockFetch({ data: { categorias: [] } });
      client = new LudopediaClient({ fetchFn: mockFetch });
      await client.fetchCategories();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/categorias"),
        expect.anything()
      );
    });

    it("should call fetchThemes", async () => {
      mockFetch = createMockFetch({ data: { temas: [] } });
      client = new LudopediaClient({ fetchFn: mockFetch });
      await client.fetchThemes();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/temas"), expect.anything());
    });
  });

  describe("Exported bounds", () => {
    it("should export bound functions that don't crash", () => {
      expect(typeof exportedFns.fetchLudopediaUserCollection).toBe("function");
      expect(typeof exportedFns.fetchLudopediaGameDetails).toBe("function");
      expect(typeof exportedFns.fetchLudopediaThemes).toBe("function");
    });
  });
});
