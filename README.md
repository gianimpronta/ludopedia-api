# ludopedia-api

> Cliente TypeScript / Node.js não-oficial para a **LudoAPI v1** da Ludopedia (OpenAPI 3.0).

[![npm version](https://img.shields.io/npm/v/ludopedia-api.svg)](https://www.npmjs.com/package/ludopedia-api)
[![license](https://img.shields.io/npm/l/ludopedia-api.svg)](LICENSE)

## 📦 Instalação

```bash
npm install ludopedia-api
# ou
pnpm add ludopedia-api
# ou
yarn add ludopedia-api
```

---

## 🔑 Autenticação

Para utilizar a API oficial da Ludopedia, é necessário cadastrar uma aplicação em [https://ludopedia.com.br/aplicativos](https://ludopedia.com.br/aplicativos) e obter um `access_token` de usuário via OAuth 2.0.

Pode passar o token via variável de ambiente `LUDOPEDIA_API_TOKEN` ou diretamente ao instanciar o cliente:

```ts
import { LudopediaClient } from "ludopedia-api";

const ludopedia = new LudopediaClient({
  apiToken: "SEU_LUDOPEDIA_ACCESS_TOKEN",
});
```

---

## 🚀 Exemplos de Uso

### 1. Importar Coleção de Usuário
```ts
import { LudopediaClient } from "ludopedia-api";

const ludopedia = new LudopediaClient();

async function main() {
  const collection = await ludopedia.fetchUserCollection("nome_do_usuario", {
    ownOnly: true,
  });

  console.log(`Encontrados ${collection.length} jogos:`);
  for (const item of collection) {
    console.log(`- ${item.name} (ID Ludopedia: ${item.ludopediaId})`);
  }
}

main();
```

### 2. Pesquisar Jogos no Catálogo
```ts
const games = await ludopedia.searchGames("Catan");
console.log(games);
```

### 3. Ficha Detalhada do Jogo
```ts
const details = await ludopedia.fetchGameDetails(397);
console.log(details);
```

### 4. Partidas e Estatísticas
```ts
const plays = await ludopedia.fetchPlays();
const stats = await ludopedia.fetchPlayStats();
console.log(stats);
```

---

## 📄 Licença
MIT © BGHub
