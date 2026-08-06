export interface LudopediaCollectionItem {
  ludopediaId: number;
  ludoCollId?: number;
  name: string;
  image?: string;
  thumbnail?: string;
  yearPublished?: number;
  minPlayers?: number;
  maxPlayers?: number;
  minPlaytime?: number;
  maxPlaytime?: number;
  playingTime?: number;
  ludopediaRating?: number;
  userRating?: number;
  numPlays: number;
  comment?: string;
  status: {
    own: boolean;
    wishlist: boolean;
    wantToPlay: boolean;
    preordered: boolean;
    prevOwned: boolean;
    forTrade: boolean;
  };
}

export interface LudopediaFetchOptions {
  ownOnly?: boolean;
  apiToken?: string;
  fetchFn?: typeof fetch;
}

export interface LudopediaGameSummary {
  id_jogo: number;
  nm_jogo: string;
  nm_original?: string;
  thumb?: string;
  link?: string;
}

export interface LudopediaGameDetails extends LudopediaGameSummary {
  ano_publicacao?: number;
  qt_jogadores_min?: number;
  qt_jogadores_max?: number;
  vl_tempo_min?: number;
  vl_tempo_max?: number;
  nota_media?: number;
  rank?: number;
  descreve?: string;
  mecanicas?: { id_mecanica: number; nm_mecanica: string }[];
  categorias?: { id_categoria: number; nm_categoria: string }[];
  temas?: { id_tema: number; nm_tema: string }[];
}

export interface LudopediaUser {
  id_usuario: number;
  usuario: string;
  thumb?: string;
}

export interface LudopediaTag {
  id_usuario_tag: number;
  nm_tag: string;
}

export interface LudopediaPlay {
  id_partida: number;
  id_jogo: number;
  nm_jogo?: string;
  dt_partida?: string;
  duracao?: number;
  observacao?: string;
  jogadores?: {
    id_usuario?: number;
    nm_jogador?: string;
    fl_vencedor?: number;
    vl_pontos?: number;
  }[];
}

export interface LudopediaPlayStats {
  qt_partidas: number;
  vl_duracao: number;
  qt_duracao: number;
  qt_jogos: number;
  qt_expansoes: number;
  qt_vitorias: number;
  qt_usuarios: number;
  qt_nao_usuarios: number;
}
