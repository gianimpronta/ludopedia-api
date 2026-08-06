import { LudopediaClient } from "../client";
import { LudopediaCollectionItem, LudopediaFetchOptions } from "../types";

/**
 * Itera automaticamente pelas páginas da coleção de um usuário na Ludopedia.
 * Faz requisições de forma preguiçosa (lazy) conforme os itens são consumidos pelo `for await`.
 */
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
