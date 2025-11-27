# Bonsae · Frontend (2 páginas, Pro)

- `generate.html` — criar/baixar relatórios  
- `downloads.html` — lista de baixados (histórico local)  
- Dark/Light com toggle; responsivo; selects A–D de exemplo  

---

## 1. Pré-requisitos

- Node.js instalado (para usar `npx` ou instalar o `http-server`)
- API backend rodando em `http://localhost:3000` via Docker Compose  

---

## 2. Rodar o frontend (modo mock, sem backend)

Este modo usa o arquivo `api.js` (mock) apenas para preview visual.

1. No diretório do projeto:

   ```bash
   npx http-server . -p 5173
   ```

2. Abra no navegador:

   - `http://localhost:5173/generate.html`  
   - `http://localhost:5173/downloads.html`  

---

## 3. Conectar ao backend real (API na porta 3000)

Para usar a API real (já rodando em `http://localhost:3000`), siga os passos:

### 3.1. Apontar para a API real nos scripts

Nos arquivos `main-generate.js` e `main-downloads.js`, troque o import:

```js
// de
import * as api from "./api.js";
// para
import * as api from "./api.real.js";
```

### 3.2. Configurar a URL base da API

No arquivo `config.js`, defina a URL base da API para a porta 3000:

```js
export const API_BASE_URL = "http://localhost:3000";
```

(Se houver outros endpoints ou paths específicos, ajuste aqui também.)

### 3.3. Servir o frontend

Ainda no diretório do projeto, sirva os arquivos estáticos (pode usar o mesmo comando):

```bash
npx http-server . -p 5173
```

Abra no navegador:

- `http://localhost:5173/generate.html`  
- `http://localhost:5173/downloads.html`  

Agora as páginas irão chamar a API real em `http://localhost:3000`.

> Se estiver usando Docker Compose, garanta que o serviço da API está expondo a porta 3000 para o host, por exemplo:
>
> ```yaml
> services:
>   api:
>     ports:
>       - "3000:3000"
> ```

---

## 4. Estrutura principal dos arquivos

- `generate.html` — tela para gerar/baixar relatórios  
- `downloads.html` — histórico local de relatórios baixados  
- `api.js` — implementação mock (sem backend)  
- `api.real.js` — integração com API real  
- `config.js` — configuração de `API_BASE_URL` e endpoints  
- `main-generate.js` — lógica da tela de geração  
- `main-downloads.js` — lógica da tela de downloads  
- `styles.css` — estilos globais  
- `theme.js` — controle de tema (Dark/Light)  
