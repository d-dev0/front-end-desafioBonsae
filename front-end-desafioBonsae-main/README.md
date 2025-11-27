# Bonsae · Frontend (2 páginas, Pro)
- `generate.html` — criar/baixar relatórios
- `downloads.html` — lista de baixados (histórico local)
- Dark/Light com toggle; responsivo; selects A–D de exemplo

## Preview sem backend (mock)
Já vem com `api.js` (mock). Sirva a pasta:
```bash
npx http-server . -p 5173
```
Abra `http://localhost:5173/generate.html`.

## Conectar ao backend real
Troque nos `main-*.js` o import:
```js
// de
import * as api from "./api.js";
// para
import * as api from "./api.real.js";
```
E ajuste `config.js` com `API_BASE_URL` e endpoints (se existirem).
