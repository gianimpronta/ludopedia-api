# DX Helpers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar utilitários de paginação assíncrona (`streamUserCollection`) e cálculo estatístico (`calculateHIndex`, `calculateWinRate`) em um submódulo isolado `src/helpers/`.

**Architecture:** Separar lógica HTTP de utilitários em `src/helpers/pagination.ts` e `src/helpers/stats.ts`. Manter 100% de cobertura de código e publicar exportações agregadas em `src/index.ts`.

**Tech Stack:** TypeScript, Vitest, Node.js Async Generators.

## Global Constraints

- Nenhuma dependência externa adicional.
- Cobertura de testes (`pnpm test:coverage`) mantida acima de 90%.
- Sem warnings ou erros de ESLint/Prettier (`pnpm run lint`, `pnpm run format`).

---

### Task 1: Módulo de Paginação (`src/helpers/pagination.ts`)

**Files:**

- Create: `src/helpers/pagination.ts`
- Create: `__tests__/helpers/pagination.test.ts`

**Interfaces:**

- Consumes: `LudopediaClient.fetchUserCollection(username, options)`
- Produces: `export async function* streamUserCollection(client, username, options)`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/helpers/pagination.test.ts
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run __tests__/helpers/pagination.test.ts`  
Expected: FAIL (Cannot find module)

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/helpers/pagination.ts
import { LudopediaClient } from "../client";
import { LudopediaCollectionItem, LudopediaFetchOptions } from "../types";

export async function* streamUserCollection(
  client: LudopediaClient,
  username: string,
  options: LudopediaFetchOptions = {}
): AsyncGenerator<LudopediaCollectionItem, void, unknown> {
  let page = 1;
  let hasMore = true;
  const pageSize = options.pageSize ?? 100;

  if (pageSize <= 0 || !Number.isInteger(pageSize)) {
    throw new Error("pageSize deve ser um número inteiro positivo.");
  }

  while (hasMore) {
    const items = await client.fetchUserCollection(username, { ...options, page, pageSize });
    if (!items || items.length === 0) {
      break;
    }
    for (const item of items) {
      yield item;
    }
    if (items.length < pageSize) {
      hasMore = false;
    } else {
      page++;
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run __tests__/helpers/pagination.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/helpers/pagination.ts __tests__/helpers/pagination.test.ts
git commit -m "feat: add streamUserCollection async iterator helper"
```

---

### Task 2: Módulo de Estatísticas (`src/helpers/stats.ts`)

**Files:**

- Create: `src/helpers/stats.ts`
- Create: `__tests__/helpers/stats.test.ts`

**Interfaces:**

- Produces: `calculateHIndex(collection)`, `calculateWinRate(plays, userId)`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/helpers/stats.test.ts
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
  });
});

describe("calculateWinRate", () => {
  it("should calculate win rate percentage correctly", () => {
    const plays = [
      { id_partida: 1, id_jogo: 10, jogadores: [{ id_usuario: 5, fl_vencedor: 1 }] },
      { id_partida: 2, id_jogo: 10, jogadores: [{ id_usuario: 5, fl_vencedor: 0 }] },
    ];
    const res = calculateWinRate(plays as any, 5);
    expect(res).toEqual({ totalPlays: 2, wins: 1, winRate: 50 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run __tests__/helpers/stats.test.ts`  
Expected: FAIL (Cannot find module)

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/helpers/stats.ts
import { LudopediaPlay } from "../types";

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run __tests__/helpers/stats.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/helpers/stats.ts __tests__/helpers/stats.test.ts
git commit -m "feat: add calculateHIndex and calculateWinRate stats helpers"
```

---

### Task 3: Exportações & Documentação

**Files:**

- Modify: `src/index.ts`
- Modify: `README.md`

**Interfaces:**

- Consumes: `src/helpers/pagination.ts`, `src/helpers/stats.ts`
- Produces: Re-exporta helpers na raiz do pacote.

- [ ] **Step 1: Write failing export test or verify exports**

Atualizar `src/index.ts`:

```typescript
export * from "./types";
export * from "./errors";
export * from "./parser";
export * from "./client";
export * from "./helpers/pagination";
export * from "./helpers/stats";
```

- [ ] **Step 2: Update README.md with DX Helpers usage section**

Adicionar exemplos de `streamUserCollection` e `calculateHIndex` no `README.md`.

- [ ] **Step 3: Run full verification**

Run: `pnpm test:coverage && pnpm run lint && pnpm run format`  
Expected: PASS (100% test coverage)

- [ ] **Step 4: Commit**

```bash
git add src/index.ts README.md
git commit -m "docs: export dx helpers from root and document usage in README"
```
