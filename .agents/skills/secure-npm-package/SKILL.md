---
name: secure-npm-package
description: Diretrizes e melhores práticas para configurar, validar e publicar pacotes npm com o mais alto nível de segurança e rastreabilidade.
---

# Diretrizes para Criação e Publicação Segura de Pacotes NPM

Sempre que for solicitado a criar, configurar ou preparar a publicação de um pacote npm neste projeto, você **DEVE** aplicar rigorosamente as seguintes práticas de segurança e qualidade:

## 1. Controle Rigoroso de Arquivos Publicados (Whitelist + Defense-in-Depth)
Vazamentos acidentais de arquivos sensíveis (como `.env`, configurações locais ou senhas em testes) são o maior vetor de vazamento de credenciais em pacotes npm.
- **Regra (Whitelist):** Defina explicitamente a propriedade `files` no `package.json`. Inclua apenas a pasta final de build (ex: `dist/`), declarações de tipo, `README.md` e `LICENSE`.
- **Regra (Blacklist):** Como camada dupla de segurança, mantenha um `.npmignore` barrando explicitamente pastas de testes, configurações de CI e arquivos `.env`, caso o `files` seja modificado indevidamente.

## 2. Instalações Determinísticas no CI
- **Regra:** O build responsável por gerar o código que será publicado **nunca** deve usar `npm install`. Exija o uso de `npm ci` (ou `pnpm install --frozen-lockfile`) no pipeline (GitHub Actions). Isso impede atualizações maliciosas indesejadas de dependências transitivas no exato momento da compilação.

## 3. Autenticação, Atestados e NPM Provenance (Supply Chain)
Os consumidores do pacote precisam verificar de forma independente que o artefato publicado corresponde ao código-fonte oficial e que não foi injetado código malicioso no meio do caminho.
- **Regra:** A publicação sempre deve ocorrer em um ambiente de CI (Continuous Integration), utilizando tokens temporários seguros (OIDC) em vez de senhas ou tokens fixos.
- **Regra:** O comando de publicação deve obrigatoriamente incluir a flag `--provenance` para gerar um atestado criptográfico vinculando o artefato ao commit original.
- **Recomendação:** Force o 2FA obrigatório na conta npm executando `npm access 2fa-publishing-required`.

## 4. Prevenção de Publicação Acidental e Trava de Segurança
- **Regra:** Adicione `"private": true` no `package.json` durante o desenvolvimento local. Remova a trava apenas pouco antes da release oficial.
- **Regra:** Implemente verificações estritas no script `"prepublishOnly"` do `package.json`. Se qualquer etapa falhar (inclusive auditorias), a publicação é bloqueada.
```json
"scripts": {
  "build": "tsup src/index.ts --format cjs,esm --dts",
  "test": "vitest run",
  "lint": "eslint src/",
  "audit": "npm audit signatures && npm audit --audit-level=high",
  "check": "publint",
  "prepublishOnly": "npm run audit && npm run lint && npm run test && npm run build && npm run check"
}
```

## 5. Metadados e Namespaces (Prevenção contra Typo-squatting)
- **Regra:** Sempre que possível, crie pacotes utilizando escopos de organização (ex: `@sua-org/pacote`). Isso dificulta severamente ataques de sequestro de nome ou typo-squatting.
- **Regra:** Forneça obrigatoriamente os campos `repository` (URL real do código-fonte) e `bugs` no `package.json`. A rastreabilidade e transparência dão maior segurança e confiança à comunidade.

## 6. Proteção da Superfície de Dependências e Exportações
- **Regra:** Minimize `dependencies`. Se uma dependência não é estritamente necessária em runtime, use `devDependencies`. Para frameworks (React, Zod, etc), use `peerDependencies`.
- **Regra:** Impeça o vazamento de módulos internos usando o campo `exports` para definir explicitamente os únicos pontos de entrada autorizados para uso público.
```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js",
    "require": "./dist/index.cjs"
  }
}
```

## 7. Inspeção Manual Final (Tarball Check)
- Sempre que a estrutura de build for modificada, instrua a execução de `npm pack`. Esse comando não publica nada, mas cria localmente um arquivo `.tgz` simulando a publicação, permitindo inspecionar o pacote bit a bit para garantir que nada confidencial vazou.
