# DX Helpers & Analytics Design Specification

**Data:** 2026-08-06  
**Status:** Approved  
**Topic:** Paginação Assíncrona e Métricas Estatísticas (`dx-helpers`)

---

## 1. Visão Geral

Este documento especifica a adição de utilitários de experiência do desenvolvedor (DX) ao pacote `ludopedia-api`. Para manter o `LudopediaClient` com responsabilidade única (comunicação HTTP puramente isolada), todas as funções auxiliares residirão em submódulos separados dentro de `src/helpers/`.

---

## 2. Arquitetura e Módulos

```
src/
├── helpers/
│   ├── pagination.ts   # Iteradores assíncronos para paginação (Async Generator)
│   └── stats.ts        # Funções puras para cálculo de H-Index e Win Rates
├── client.ts
├── parser.ts
├── errors.ts
├── types.ts
└── index.ts            # Re-exporta helpers
```

---

## 3. Especificação do Módulo de Paginação (`src/helpers/pagination.ts`)

### `streamUserCollection`

Iterador assíncrono para navegar pelas páginas da coleção do usuário na Ludopedia.

- **Parâmetros**:
  - `client: LudopediaClient`
  - `username: string`
  - `options?: LudopediaFetchOptions`
- **Retorno**: `AsyncGenerator<LudopediaCollectionItem, void, unknown>`
- **Comportamento**:
  - Inicia na página 1 e incrementa a cada iteração de `for await`.
  - Encerra quando o retorno for um array vazio ou contiver menos itens do que o `pageSize`.

---

## 4. Especificação do Módulo de Estatísticas (`src/helpers/stats.ts`)

### `calculateHIndex`

Calcula o índice H (H-Index) a partir de uma coleção ou lista contendo quantidade de partidas (`numPlays`).

- **Parâmetros**: `collection: { numPlays: number }[]`
- **Retorno**: `number` (Ex: H-Index 10 significa 10 jogos com no mínimo 10 partidas registradas).

### `calculateWinRate`

Calcula a taxa de vitórias de um determinado usuário dentro de uma lista de partidas (`LudopediaPlay[]`).

- **Parâmetros**:
  - `plays: LudopediaPlay[]`
  - `userId: number`
- **Retorno**: `LudopediaUserWinRate` (`{ totalPlays: number; wins: number; winRate: number }`)

---

## 5. Plano de Testes

- **`__tests__/helpers/pagination.test.ts`**:
  - Testar `streamUserCollection` mockando o cliente para retornar 2 páginas e verificar se o `for await` itera por todos os itens corretamente.
  - Testar encerramento antecipado (quando retorna array vazio).

- **`__tests__/helpers/stats.test.ts`**:
  - Testar `calculateHIndex` com arrays vazios, nulos e listas ordenadas/desordenadas.
  - Testar `calculateWinRate` com vitórias, derrotas e partidas onde o usuário não participou.
