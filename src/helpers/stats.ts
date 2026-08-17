import { LudopediaPlay } from "../types";

/**
 * Calcula o H-Index (índice H) de partidas jogadas.
 * O H-Index é o maior número N tal que N jogos foram jogados pelo menos N vezes.
 */
export function calculateHIndex(collection: { numPlays: number }[]): number {
  if (!collection || collection.length === 0) return 0;

  const plays = collection.map((item) => item.numPlays || 0).sort((a, b) => b - a);
  let hIndex = 0;
  for (let i = 0; i < plays.length; i++) {
    if (plays[i] >= i + 1) {
      hIndex = i + 1;
    } else {
      break;
    }
  }
  return hIndex;
}

export interface LudopediaUserWinRate {
  totalPlays: number;
  wins: number;
  winRate: number;
}

/**
 * Calcula a taxa de vitória de um determinado usuário numa lista de partidas.
 */
export function calculateWinRate(plays: LudopediaPlay[], userId: number): LudopediaUserWinRate {
  if (!plays || plays.length === 0) {
    return { totalPlays: 0, wins: 0, winRate: 0 };
  }

  let totalPlays = 0;
  let wins = 0;

  for (const play of plays) {
    if (!play.jogadores) continue;
    const player = play.jogadores.find((j) => j.id_usuario === userId);
    if (player) {
      totalPlays++;
      if (player.fl_vencedor === 1) {
        wins++;
      }
    }
  }

  const winRate = totalPlays > 0 ? (wins / totalPlays) * 100 : 0;
  return { totalPlays, wins, winRate: Number(winRate.toFixed(2)) };
}
