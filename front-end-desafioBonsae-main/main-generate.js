import { applySavedTheme, toggleTheme } from "./theme.js";
import { API_BASE_URL, POLL_INTERVAL_MS, ENDPOINT_TURMAS, ENDPOINT_PROFESSORES, ENDPOINT_ATIVIDADES } from "./config.js";
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

const turmaSel = document.querySelector("#turmaSelect");
const profSel  = document.querySelector("#profSelect");
const tipoSel  = document.querySelector("#tipoSelect");
const btnExcel = document.querySelector("#btn-excel");
const btnPdf   = document.querySelector("#btn-pdf");
const feedback = document.querySelector("#feedback");

let pollTimer = null;
let currentSolicitaçãoId = null;
let currentRelatorioId = null;

// A–B options (fallback) - removidos C e D
const makeAB = (prefix) => ["A","B"].map((k,i)=>({ id: i+1, nome: `${prefix} ${k}` }));
const fallbackTurmas = [{ id: 1, nome: "Turma A" }];
const fallbackProfs  = makeAB("Professor");

init();

async function init(){
  const [turmas, profs] = await Promise.all([
    api.fetchList(ENDPOINT_TURMAS, fallbackTurmas),
    api.fetchList(ENDPOINT_PROFESSORES, fallbackProfs),
  ]);
  fillSelect(turmaSel, turmas);
  fillSelect(profSel, [{ id:"", nome:"(opcional)" }, ...profs]);

  btnExcel.addEventListener("click", () => create("excel"));
  btnPdf.addEventListener("click", () => create("pdf"));
}

function fillSelect(el, items){
  el.innerHTML = items.map(i => `<option value="${i.id}">${i.nome}</option>`).join("");
}

function err(msg){ feedback.textContent = msg; }
function ok(msg){ feedback.textContent = msg; }

async function create(formato){
  err(""); btnExcel.disabled = true; btnPdf.disabled = true;
  try{
    const payload = {
      rows: 20000, columns: 12, title: `Relatório ${formato.toUpperCase()}`,
      formato,
      turma_id: Number(turmaSel.value),
      professor_id: profSel.value ? Number(profSel.value) : undefined,
      tipo_relatorio: tipoSel.value
    };
    const resp = await api.createReportJob(payload);
    currentSolicitaçãoId = resp.jobId || resp.id || resp.job_id;
    currentRelatorioId = null;
    ok("Solicitação criada. Gerando relatório…");
    startPolling();
  }catch(e){
    err(e.message || "Falha ao criar relatório");
  }finally{
    btnExcel.disabled = false; btnPdf.disabled = false;
  }
}

function startPolling(){ stopPolling(); pollTimer = setInterval(pollOnce, POLL_INTERVAL_MS); pollOnce(); }
function stopPolling(){ if(pollTimer){ clearInterval(pollTimer); pollTimer = null; }}

async function pollOnce(){
  if(!currentSolicitaçãoId) return;
  try{
    const data = await api.getJobStatus(currentSolicitaçãoId);
    const stRaw = data.state || data.status || "";
    const st = String(stRaw).toLowerCase();
    if(st === "completed" || st === "concluido"){
      const relatorioId = data.relatorioId || data.relatorio_id || data.progress?.relatorioId || data.reportId || data.id;
      ok("Pronto para download.");
      stopPolling();
      if (relatorioId) {
        currentRelatorioId = relatorioId;
        try {
          await api.downloadSavedReport(relatorioId);
          ok("Download iniciado.");
        } catch (e) {
          err(e.message || "Erro no download");
        }
      }
    }else if(st === "failed" || st === "erro"){
      err(data.failedReason || data.error || "Falha ao gerar relatório");
      stopPolling();
    }
  }catch(e){
    err(e.message || "Erro ao consultar andamento");
    stopPolling();
  }
}

// Histórico de baixados
const KEY = "bonsae_downloaded";
function addDownloaded(id){
  const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
  if(!arr.includes(id)) arr.unshift(id);
  localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 50)));
}
