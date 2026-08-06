import { LudopediaCollectionItem } from "./types";

function parseOptionalInt(val: unknown): number | undefined {
  if (val === undefined || val === null || val === "" || val === "N/A") {
    return undefined;
  }
  const parsed = parseInt(String(val), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseOptionalFloat(val: unknown): number | undefined {
  if (val === undefined || val === null || val === "" || val === "N/A") {
    return undefined;
  }
  const parsed = parseFloat(String(val));
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * Normaliza os itens retornados pela LudoAPI v1 em LudopediaCollectionItem.
 */
export function parseLudopediaItems(rawItems: any[]): LudopediaCollectionItem[] {
  if (!Array.isArray(rawItems)) return [];

  const collection: LudopediaCollectionItem[] = [];

  for (const item of rawItems) {
    const ludopediaId = parseOptionalInt(item.id_jogo || item.id_produto || item.id);
    if (!ludopediaId) continue;

    const name = item.nm_jogo || item.nome || item.name || "Jogo sem nome";

    const thumbnail =
      item.thumb ||
      item.thumb_url ||
      item.thumbnail ||
      item.imagem ||
      item.image ||
      item.url_imagem ||
      item.capa ||
      `https://storage.googleapis.com/ludopedia-capas/${ludopediaId}_t.jpg`;

    const image =
      item.thumb ||
      item.thumb_url ||
      item.imagem ||
      item.image ||
      item.url_imagem ||
      item.capa ||
      `https://storage.googleapis.com/ludopedia-capas/${ludopediaId}_m.jpg`;

    const yearPublished = parseOptionalInt(item.ano_publicacao || item.ano);
    const minPlayers = parseOptionalInt(item.qt_jogadores_min);
    const maxPlayers = parseOptionalInt(item.qt_jogadores_max);
    const minPlaytime = parseOptionalInt(item.vl_tempo_min);
    const maxPlaytime = parseOptionalInt(item.vl_tempo_max);
    const playingTime = parseOptionalInt(item.vl_tempo);
    const ludopediaRating = parseOptionalFloat(item.nota_media || item.nota_ludopedia);
    const userRating = parseOptionalFloat(item.nota_usuario || item.fl_nota);
    const numPlays = parseOptionalInt(item.qt_partidas) ?? 0;
    const comment = item.comentario || item.ds_comentario;

    const flTem = item.fl_tem === 1 || item.fl_tem === "1" || item.status_posse === "tem" || item.own === true;
    const flQuero = item.fl_desejo === 1 || item.fl_desejo === "1" || item.status_posse === "quero" || item.wishlist === true;
    const flJaTive = item.fl_jative === 1 || item.fl_jative === "1";
    const flTroca = item.fl_troca === 1 || item.fl_troca === "1";

    collection.push({
      ludopediaId,
      ludoCollId: parseOptionalInt(item.id_colecao),
      name,
      image,
      thumbnail,
      yearPublished,
      minPlayers,
      maxPlayers,
      minPlaytime,
      maxPlaytime,
      playingTime,
      ludopediaRating,
      userRating,
      numPlays,
      comment,
      status: {
        own: Boolean(flTem),
        wishlist: Boolean(flQuero),
        wantToPlay: Boolean(flQuero),
        preordered: false,
        prevOwned: Boolean(flJaTive),
        forTrade: Boolean(flTroca),
      },
    });
  }

  return collection;
}
