import { applySavedTheme, toggleTheme } from "./theme.js";
import { API_BASE_URL } from "./config.js";
import * as api from "./api.real.js"; // API REAL conectada ao backend


document.getElementById("themeLabel").textContent = applySavedTheme() === "light" ? "Claro" : "Escuro";

// Função para atualizar a logo com base no tema
function updateLogoForTheme(theme) {
  const logo = document.getElementById("main-logo");
  if (logo) {
    if (theme === "light") {
      logo.src = "./assets/logo_reporting_branco.jpeg";
    } else {
      logo.src = "./assets/logo_reporting_preto.jpeg";
    }
  }
}

// Atualiza a logo com o tema salvo
updateLogoForTheme(applySavedTheme());

document.getElementById("themeToggle").addEventListener("click", () => {
  const next = toggleTheme();
  document.getElementById("themeLabel").textContent = next === "light" ? "Claro" : "Escuro";
  // Atualiza a logo quando o tema muda
  updateLogoForTheme(next);
});

const list = document.getElementById("list");

async function loadReports() {
  list.innerHTML = '<p class="muted">Carregando relatórios salvos…</p>';
  try {
    const resp = await fetch(`${API_BASE_URL}/relatorios/salvos?limite=50`);
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`HTTP ${resp.status} - ${text || resp.statusText}`);
    }
    const data = await resp.json();
    console.log("[bonsae] /relatorios/salvos data:", data);
    const arr = data?.relatorios || [];
    console.log("[bonsae] relatorios encontrados:", arr.length);

    if (!arr.length) {
      list.innerHTML = '<p class="muted">Nenhum relatório salvo encontrado.</p>';
      return;
    }

    list.innerHTML = arr.map((r, idx) => {
      const displayIndex = arr.length - idx; // numeração decrescente: mais recente com número maior
      return `
      <div class="row">
        <div style="flex:1; min-width:0">
          <div><code>${displayIndex}</code> — ${r.nome ?? r.arquivo_nome}</div>
          <div class="small muted">
            ${r.tipo?.toUpperCase() || ""}
            ${r.tamanho_mb ? ` • ${r.tamanho_mb} MB` : ""}
            ${typeof r.downloads === "number" ? ` • downloads: ${r.downloads}` : ""}
          </div>
        </div>
        <button class="btn" data-act="download" data-id="${r.id}" data-name="${r.arquivo_nome}">Baixar</button>
        <button class="btn" data-act="remove" data-id="${r.id}" title="Remover">×</button>
      </div>
    `; }).join("");

    list.querySelectorAll("button").forEach(btn => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const act = btn.dataset.act;
      btn.addEventListener("click", async () => {
        if (act === "download") {
          try { await api.downloadSavedReport(id, name); }
          catch (e) { alert(`Erro no download: ${e.message}`); }
        } else if (act === "remove") {
          if (!confirm("Remover este relatório salvo?")) return;
          try {
            await api.deleteSavedReport(id);
            await loadReports();
          } catch (e) {
            alert(`Erro ao remover relatório: ${e.message}`);
          }
        }
      });
    });
  } catch (e) {
    list.innerHTML = `<p class="muted">Erro ao carregar relatórios: ${e.message}</p>`;
  }
}

function init(){ loadReports(); }

// inicia carregando a lista de relatórios salvos
init();
