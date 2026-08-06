import {
  LudopediaCollectionItem,
  LudopediaGameDetails,
  LudopediaPlay,
  LudopediaUser,
} from "./types";

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

    const flTem =
      item.fl_tem === 1 || item.fl_tem === "1" || item.status_posse === "tem" || item.own === true;
    const flQuero =
      item.fl_desejo === 1 ||
      item.fl_desejo === "1" ||
      item.status_posse === "quero" ||
      item.wishlist === true;
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

/**
 * Normaliza os detalhes de um jogo retornados pela LudoAPI v1.
 */
export function parseLudopediaGameDetails(raw: any): LudopediaGameDetails {
  if (!raw || typeof raw !== "object") {
    return { id_jogo: 0, nm_jogo: "Desconhecido" };
  }

  return {
    ...raw,
    id_jogo: parseOptionalInt(raw.id_jogo || raw.id) ?? 0,
    nm_jogo: raw.nm_jogo || raw.nome || "Jogo sem nome",
    ano_publicacao: parseOptionalInt(raw.ano_publicacao || raw.ano),
    qt_jogadores_min: parseOptionalInt(raw.qt_jogadores_min),
    qt_jogadores_max: parseOptionalInt(raw.qt_jogadores_max),
    vl_tempo_min: parseOptionalInt(raw.vl_tempo_min),
    vl_tempo_max: parseOptionalInt(raw.vl_tempo_max),
    nota_media: parseOptionalFloat(raw.nota_media || raw.nota_ludopedia),
    rank: parseOptionalInt(raw.rank),
    mecanicas: Array.isArray(raw.mecanicas) ? raw.mecanicas : [],
    categorias: Array.isArray(raw.categorias) ? raw.categorias : [],
    temas: Array.isArray(raw.temas) ? raw.temas : [],
  };
}

/**
 * Normaliza uma lista de partidas registradas.
 */
export function parseLudopediaPlays(rawPlays: any[]): LudopediaPlay[] {
  if (!Array.isArray(rawPlays)) return [];

  return rawPlays.map((play) => ({
    ...play,
    id_partida: parseOptionalInt(play.id_partida || play.id) ?? 0,
    id_jogo: parseOptionalInt(play.id_jogo) ?? 0,
    duracao: parseOptionalInt(play.duracao),
    jogadores: Array.isArray(play.jogadores)
      ? play.jogadores.map((j: any) => ({
          ...j,
          id_usuario: parseOptionalInt(j.id_usuario),
          fl_vencedor: parseOptionalInt(j.fl_vencedor),
          vl_pontos: parseOptionalFloat(j.vl_pontos),
        }))
      : [],
  }));
}

/**
 * Normaliza o perfil de usuário retornado.
 */
export function parseLudopediaUser(raw: any): LudopediaUser {
  if (!raw || typeof raw !== "object") {
    return { id_usuario: 0, usuario: "" };
  }

  return {
    ...raw,
    id_usuario: parseOptionalInt(raw.id_usuario || raw.id) ?? 0,
    usuario: raw.usuario || raw.nm_usuario || "",
  };
}
