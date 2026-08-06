import {
  LudopediaCollectionItem,
  LudopediaFetchOptions,
  LudopediaGameSummary,
  LudopediaGameDetails,
  LudopediaUser,
  LudopediaTag,
  LudopediaPlay,
  LudopediaPlayStats,
} from "./types";
import { LudopediaError } from "./errors";
import {
  parseLudopediaItems,
  parseLudopediaGameDetails,
  parseLudopediaPlays,
  parseLudopediaUser,
} from "./parser";

export interface LudopediaClientConfig {
  apiToken?: string;
  baseUrl?: string;
  fetchFn?: typeof fetch;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class LudopediaClient {
  private apiToken?: string;
  private baseUrl: string;
  private fetchFn: typeof fetch;
  private maxRetries: number;
  private retryDelayMs: number;

  constructor(config: LudopediaClientConfig = {}) {
    this.apiToken =
      config.apiToken ||
      (typeof globalThis !== "undefined" && (globalThis as any).process?.env?.LUDOPEDIA_API_TOKEN);
    this.baseUrl = config.baseUrl || "https://ludopedia.com.br/api/v1";
    this.fetchFn = config.fetchFn || globalThis.fetch;
    this.maxRetries = config.maxRetries ?? 0;
    this.retryDelayMs = config.retryDelayMs ?? 500;
  }

  private getHeaders(customToken?: string): Record<string, string> {
    const token = customToken || this.apiToken;
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token.trim()}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: { method?: string; body?: any; apiToken?: string; fetchFn?: typeof fetch } = {}
  ): Promise<T> {
    const { method = "GET", body, apiToken, fetchFn = this.fetchFn } = options;
    const url = endpoint.startsWith("http") ? endpoint : `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders(apiToken);

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const res = await fetchFn(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        if ((res.status === 429 || res.status >= 500) && attempt < this.maxRetries) {
          await new Promise((r) => setTimeout(r, this.retryDelayMs * Math.pow(2, attempt)));
          continue;
        }

        if (res.status === 401) {
          throw new LudopediaError(
            "Acesso não autorizado à API da Ludopedia. Informe um Bearer token válido.",
            401
          );
        }

        if (res.status === 404) {
          throw new LudopediaError("Recurso não encontrado na Ludopedia.", 404);
        }

        if (!res.ok) {
          throw new LudopediaError(
            `Erro na comunicação com a Ludopedia (Status HTTP ${res.status}).`,
            res.status
          );
        }

        return await res.json();
      } catch (err: unknown) {
        if (err instanceof LudopediaError) throw err;
        if (attempt < this.maxRetries) {
          await new Promise((r) => setTimeout(r, this.retryDelayMs * Math.pow(2, attempt)));
          continue;
        }
        throw new LudopediaError(
          `Falha na requisição para a API da Ludopedia: ${
            err instanceof Error ? err.message : "Erro desconhecido"
          }`
        );
      }
    }

    throw new LudopediaError("Falha na requisição após tentativas excedidas.");
  }

  // 1. Coleção
  /**
   * Busca a coleção de jogos de um determinado usuário na Ludopedia.
   * @param username O nome de usuário na plataforma.
   * @param options Opções adicionais de busca (ex: ownOnly, token customizado).
   */
  async fetchUserCollection(
    username: string,
    options: LudopediaFetchOptions = {}
  ): Promise<LudopediaCollectionItem[]> {
    const { ownOnly = false, apiToken, fetchFn } = options;
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      throw new LudopediaError("Nome de usuário da Ludopedia não fornecido.");
    }

    const endpoint = `/colecao?search_usuario=${encodeURIComponent(
      cleanUsername
    )}&lista=${ownOnly ? "colecao" : "colecao"}`;

    const data = await this.request<any>(endpoint, { apiToken, fetchFn });
    const items = data.colecao || data.jogos || data.items || data;
    return parseLudopediaItems(items);
  }

  /**
   * Obtém as informações completas de um item da coleção por ID do jogo.
   * @param idJogo ID numérico do jogo.
   */
  async fetchCollectionItem(idJogo: number, options: LudopediaFetchOptions = {}): Promise<any> {
    return this.request<any>(`/colecao/item/${idJogo}`, options);
  }

  /**
   * Atualiza ou adiciona um item na coleção de um usuário.
   */
  async updateCollectionItem(
    jogoUsuarioData: any,
    options: LudopediaFetchOptions = {}
  ): Promise<any> {
    return this.request<any>(`/colecao`, { method: "POST", body: jogoUsuarioData, ...options });
  }

  /**
   * Lista as tags cadastradas pelo usuário.
   */
  async fetchTags(options: LudopediaFetchOptions = {}): Promise<LudopediaTag[]> {
    const data = await this.request<any>(`/colecao/tags`, options);
    return data.tags || [];
  }

  /**
   * Salva ou cria uma nova tag.
   */
  async saveTag(
    tag: { id_usuario_tag?: number; nm_tag: string },
    options: LudopediaFetchOptions = {}
  ): Promise<LudopediaTag> {
    return this.request<LudopediaTag>(`/colecao/tags`, { method: "POST", body: tag, ...options });
  }

  /**
   * Remove uma tag pelo ID.
   */
  async deleteTag(idUsuarioTag: number, options: LudopediaFetchOptions = {}): Promise<void> {
    await this.request<void>(`/colecao/tags/${idUsuarioTag}`, { method: "DELETE", ...options });
  }

  // 2. Jogos
  /**
   * Pesquisa jogos no catálogo da Ludopedia pelo nome.
   */
  async searchGames(
    query: string,
    options: LudopediaFetchOptions = {}
  ): Promise<LudopediaGameSummary[]> {
    const data = await this.request<any>(`/jogos?search=${encodeURIComponent(query)}`, options);
    return data.jogos || [];
  }

  /**
   * Busca a ficha detalhada de um jogo na Ludopedia.
   */
  async fetchGameDetails(
    idJogo: number,
    options: LudopediaFetchOptions = {}
  ): Promise<LudopediaGameDetails> {
    const raw = await this.request<any>(`/jogos/${idJogo}`, options);
    return parseLudopediaGameDetails(raw);
  }

  /**
   * Lista todas as expansões vinculadas a um jogo específico.
   */
  async fetchGameExpansions(
    idJogo: number,
    options: LudopediaFetchOptions = {}
  ): Promise<LudopediaGameSummary[]> {
    const data = await this.request<any>(`/jogos/${idJogo}/expansoes`, options);
    return data.jogos || [];
  }

  // 3. Usuários
  /**
   * Obtém os dados do perfil do usuário autenticado no token atual.
   */
  async fetchUserProfile(options: LudopediaFetchOptions = {}): Promise<LudopediaUser> {
    const raw = await this.request<any>(`/usuario/me`, options);
    return parseLudopediaUser(raw);
  }

  // 4. Partidas
  /**
   * Obtém a lista de partidas registradas pelo usuário.
   */
  async fetchPlays(options: LudopediaFetchOptions = {}): Promise<LudopediaPlay[]> {
    const data = await this.request<any>(`/partidas`, options);
    const plays = data.partidas || data.items || data;
    return parseLudopediaPlays(Array.isArray(plays) ? plays : []);
  }

  /**
   * Registra uma nova partida na plataforma.
   */
  async recordPlay(playData: any, options: LudopediaFetchOptions = {}): Promise<LudopediaPlay> {
    return this.request<LudopediaPlay>(`/partidas`, { method: "POST", body: playData, ...options });
  }

  /**
   * Obtém as estatísticas gerais de partidas registradas.
   */
  async fetchPlayStats(options: LudopediaFetchOptions = {}): Promise<LudopediaPlayStats> {
    return this.request<LudopediaPlayStats>(`/partidas/estatisticas`, options);
  }

  // 5. Extra
  /**
   * Lista todas as mecânicas cadastradas no banco de dados da Ludopedia.
   */
  async fetchMechanics(options: LudopediaFetchOptions = {}): Promise<any[]> {
    const data = await this.request<any>(`/mecanicas`, options);
    return data.mecanicas || [];
  }

  /**
   * Lista todas as categorias cadastradas na Ludopedia.
   */
  async fetchCategories(options: LudopediaFetchOptions = {}): Promise<any[]> {
    const data = await this.request<any>(`/categorias`, options);
    return data.categorias || [];
  }

  /**
   * Lista todos os temas cadastrados na Ludopedia.
   */
  async fetchThemes(options: LudopediaFetchOptions = {}): Promise<any[]> {
    const data = await this.request<any>(`/temas`, options);
    return data.temas || [];
  }
}

const defaultClient = new LudopediaClient();
export const fetchLudopediaUserCollection = defaultClient.fetchUserCollection.bind(defaultClient);
export const fetchLudopediaCollectionItem = defaultClient.fetchCollectionItem.bind(defaultClient);
export const updateLudopediaCollectionItem = defaultClient.updateCollectionItem.bind(defaultClient);
export const fetchLudopediaTags = defaultClient.fetchTags.bind(defaultClient);
export const saveLudopediaTag = defaultClient.saveTag.bind(defaultClient);
export const deleteLudopediaTag = defaultClient.deleteTag.bind(defaultClient);
export const searchLudopediaGames = defaultClient.searchGames.bind(defaultClient);
export const fetchLudopediaGameDetails = defaultClient.fetchGameDetails.bind(defaultClient);
export const fetchLudopediaGameExpansions = defaultClient.fetchGameExpansions.bind(defaultClient);
export const fetchLudopediaUserProfile = defaultClient.fetchUserProfile.bind(defaultClient);
export const fetchLudopediaPlays = defaultClient.fetchPlays.bind(defaultClient);
export const recordLudopediaPlay = defaultClient.recordPlay.bind(defaultClient);
export const fetchLudopediaPlayStats = defaultClient.fetchPlayStats.bind(defaultClient);
export const fetchLudopediaMechanics = defaultClient.fetchMechanics.bind(defaultClient);
export const fetchLudopediaCategories = defaultClient.fetchCategories.bind(defaultClient);
export const fetchLudopediaThemes = defaultClient.fetchThemes.bind(defaultClient);
