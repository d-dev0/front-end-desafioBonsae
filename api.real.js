import { API_BASE_URL } from "./config.js";

// Prepara dados do relatório chamando o backend assíncrono
export async function createReportJob(payload) {
  const { formato, turma_id, professor_id, tipo_relatorio } = payload || {};

  // Define qual tipo de relatório: horas x notas
  const isHoras = tipo_relatorio === "detalhado" || tipo_relatorio === "detalhado_estatisticas";

  let path;
  if (isHoras) {
    // Relatórios de horas
    if (formato === "excel") {
      path = "/async/relatorios/horas-excel";
    } else {
      path = "/async/relatorios/horas-pdf";
    }
  } else {
    // Relatórios de notas
    if (formato === "excel") {
      path = "/async/relatorios/notas-excel";
    } else {
      path = "/async/relatorios/notas-pdf";
    }
  }

  const params = new URLSearchParams();
  if (turma_id != null) params.append("turma_id", turma_id);
  if (professor_id != null) params.append("professor_id", professor_id);

  const url = `${API_BASE_URL}${path}?${params.toString()}`;

  const resp = await fetch(url, { method: "GET" });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status} - ${text || resp.statusText}`);
  }

  const data = await resp.json();
  const jobId = data.jobId || data.id || data.job_id;

  if (!jobId) {
    throw new Error("Resposta do backend não contém jobId");
  }

  return { jobId, ...data };
}

// Consulta o status de uma solicitação de relatório
export async function getSolicitaçãoStatus(id) {
  const url = `${API_BASE_URL}/jobs/${encodeURIComponent(id)}/status`;
  const resp = await fetch(url);

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status} - ${text || resp.statusText}`);
  }

  return await resp.json();
}

// Alias para compatibilidade
export async function getJobStatus(id) {
  return getSolicitaçãoStatus(id);
}

// Baixa relatório por ID
export async function downloadById(id) {
  // Recupera dados salvos no sessionStorage (caso o relatório tenha sido acabado de gerar)
  const jobData = sessionStorage.getItem(id);

  if (jobData) {
    const { url, formato } = JSON.parse(jobData);
    const fullUrl = `${API_BASE_URL}${url}`;

    const response = await fetch(fullUrl);

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status} - ${text || response.statusText}`);
    }

    const blob = await response.blob();

    // tenta usar o mesmo nome que o backend envia no Content-Disposition
    const cd = response.headers.get("content-disposition") || "";
    let filename;
    const match = cd.match(/filename="?([^";]+)"?/i);
    if (match && match[1]) {
      filename = match[1];
    } else {
      // se o backend não mandou nome, tenta derivar da URL
      try {
        const u = new URL(fullUrl);
        const last = u.pathname.split("/").filter(Boolean).pop() || "download";
        if (last.includes(".")) {
          filename = last;
        } else {
          const ext = formato === "pdf" ? "pdf" : "xlsx";
          filename = `${last}.${ext}`;
        }
      } catch {
        const ext = formato === "pdf" ? "pdf" : "xlsx";
        filename = `download.${ext}`;
      }
    }

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    return;
  }

  // Fallback: tenta baixar de relatórios salvos
  const url = `${API_BASE_URL}/relatorios/salvos/${encodeURIComponent(id)}/download`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const blob = await response.blob();

  let filename;
  const cd = response.headers.get("content-disposition") || "";
  const match = cd.match(/filename="?([^";]+)"?/i);
  if (match && match[1]) {
    filename = match[1];
  } else {
    // sem Content-Disposition: tenta derivar da URL final da resposta
    try {
      const u = new URL(response.url);
      const last = u.pathname.split("/").filter(Boolean).pop() || "download";
      filename = last;
    } catch {
      filename = "download";
    }
  }

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Baixa relatório já salvo por ID (sem usar sessionStorage)
export async function downloadSavedReport(id, filenameHint) {
  const url = `${API_BASE_URL}/relatorios/salvos/${encodeURIComponent(id)}/download`;
  const resp = await fetch(url);

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status} - ${text || resp.statusText}`);
  }

  const blob = await resp.blob();

  // prioridade: nome sugerido pelo frontend (arquivo_nome vindo de /relatorios/salvos)
  let filename = filenameHint || undefined;

  if (!filename) {
    // tenta usar o mesmo nome de arquivo que o backend envia no Content-Disposition
    const cd = resp.headers.get("content-disposition") || "";
    const match = cd.match(/filename="?([^";]+)"?/i);
    if (match && match[1]) {
      filename = match[1];
    } else {
      // sem hint nem Content-Disposition: deriva da URL final
      try {
        const u = new URL(resp.url);
        const last = u.pathname.split("/").filter(Boolean).pop() || "download";
        filename = last;
      } catch {
        filename = "download";
      }
    }
  }

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Remove relatório salvo por ID
export async function deleteSavedReport(id) {
  const url = `${API_BASE_URL}/relatorios/salvos/${encodeURIComponent(id)}`;
  const resp = await fetch(url, { method: "DELETE" });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status} - ${text || resp.statusText}`);
  }

  return await resp.json();
}

// Busca listas de turmas/professores/atividades
export async function fetchList(path, fallback) {
  try {
    if (!path) throw new Error("No path");
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch {
    return fallback;
  }
}
