import { describe, it, expect } from "vitest";
import { parseLudopediaItems } from "../src/parser";

describe("parseLudopediaItems", () => {
  it("should return an empty array if input is not an array", () => {
    expect(parseLudopediaItems(null as any)).toEqual([]);
    expect(parseLudopediaItems(undefined as any)).toEqual([]);
    expect(parseLudopediaItems({} as any)).toEqual([]);
  });

  it("should skip items without a valid ID", () => {
    const input = [
      { nm_jogo: "Jogo 1" }, // missing ID
      { id: "abc", nm_jogo: "Jogo 2" }, // invalid ID
      { id: "123", nm_jogo: "Jogo 3" }, // valid ID
    ];
    const result = parseLudopediaItems(input);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Jogo 3");
  });

  it("should parse a valid item fully", () => {
    const input = [
      {
        id_jogo: "123",
        id_colecao: "456",
        nm_jogo: "Super Board Game",
        thumb_url: "http://example.com/thumb.jpg",
        image: "http://example.com/image.jpg",
        ano_publicacao: "2020",
        qt_jogadores_min: "2",
        qt_jogadores_max: "4",
        vl_tempo_min: "30",
        vl_tempo_max: "60",
        vl_tempo: "45",
        nota_ludopedia: "8.5",
        nota_usuario: "9.0",
        qt_partidas: "5",
        comentario: "Ótimo jogo!",
        fl_tem: 1,
        fl_desejo: "1",
        fl_jative: 0,
        fl_troca: "0",
      },
    ];

    const result = parseLudopediaItems(input);
    expect(result).toHaveLength(1);
    const item = result[0];

    expect(item).toEqual({
      ludopediaId: 123,
      ludoCollId: 456,
      name: "Super Board Game",
      thumbnail: "http://example.com/thumb.jpg",
      image: "http://example.com/thumb.jpg",
      yearPublished: 2020,
      minPlayers: 2,
      maxPlayers: 4,
      minPlaytime: 30,
      maxPlaytime: 60,
      playingTime: 45,
      ludopediaRating: 8.5,
      userRating: 9.0,
      numPlays: 5,
      comment: "Ótimo jogo!",
      status: {
        own: true,
        wishlist: true,
        wantToPlay: true,
        preordered: false,
        prevOwned: false,
        forTrade: false,
      },
    });
  });

  it("should use default fallback image URLs if missing", () => {
    const input = [{ id: 999, nome: "Fallback Game" }];
    const result = parseLudopediaItems(input);
    expect(result[0].thumbnail).toBe("https://storage.googleapis.com/ludopedia-capas/999_t.jpg");
    expect(result[0].image).toBe("https://storage.googleapis.com/ludopedia-capas/999_m.jpg");
  });

  it("should handle edge case formats in ownership and wishlist", () => {
    const input = [
      { id: 1, own: true, wishlist: true }, // Boolean format
      { id: 2, status_posse: "tem" }, // string status
      { id: 3, status_posse: "quero" }, // string status
    ];

    const result = parseLudopediaItems(input);
    expect(result[0].status.own).toBe(true);
    expect(result[0].status.wishlist).toBe(true);

    expect(result[1].status.own).toBe(true);
    expect(result[1].status.wishlist).toBe(false);

    expect(result[2].status.own).toBe(false);
    expect(result[2].status.wishlist).toBe(true);
  });
});
