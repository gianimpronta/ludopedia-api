import { describe, it, expect } from "vitest";
import { calculateHIndex, calculateWinRate } from "../../src/helpers/stats";

describe("calculateHIndex", () => {
  it("should calculate H-Index correctly", () => {
    expect(calculateHIndex([])).toBe(0);
    expect(
      calculateHIndex([
        { numPlays: 10 },
        { numPlays: 8 },
        { numPlays: 5 },
        { numPlays: 4 },
        { numPlays: 3 },
      ])
    ).toBe(4);
    expect(calculateHIndex([{ numPlays: 1 }])).toBe(1);
    expect(calculateHIndex([{ numPlays: 0 }])).toBe(0);
  });
});

describe("calculateWinRate", () => {
  it("should calculate win rate percentage correctly", () => {
    expect(calculateWinRate([], 5)).toEqual({ totalPlays: 0, wins: 0, winRate: 0 });

    const plays = [
      { id_partida: 1, id_jogo: 10, jogadores: [{ id_usuario: 5, fl_vencedor: 1 }] },
      { id_partida: 2, id_jogo: 10, jogadores: [{ id_usuario: 5, fl_vencedor: 0 }] },
      { id_partida: 3, id_jogo: 10, jogadores: [{ id_usuario: 99, fl_vencedor: 1 }] }, // player not present
    ];
    const res = calculateWinRate(plays as any, 5);
    expect(res).toEqual({ totalPlays: 2, wins: 1, winRate: 50 });
  });
});
