const wait=ms=>new Promise(r=>setTimeout(r,ms)); const jobs=new Map(); const makeId=()=>Math.random().toString(36).slice(2,8)+"-"+Date.now().toString(36);
export async function createReportJob(payload){await wait(300); const id=makeId(); jobs.set(id,{status:"queued",progress:0,payload}); (async()=>{for(const p of [10,35,65,90,100]){await wait(450); const it=jobs.get(id); if(!it) break; it.progress=p; it.status=p>=100?"completed":(p<40?"queued":"active"); jobs.set(id,it);}})(); return {jobId:id};}
export async function getJobStatus(id){await wait(150); const it=jobs.get(id); return it?{status:it.status,progress:it.progress}:{status:"not-found"};}
export async function getSolicitaçãoStatus(id){return getJobStatus(id);} 
export async function downloadById(id){await wait(150); const it=jobs.get(id); if(!it||it.status!=="completed") throw new Error("Relatório ainda não está pronto"); const blob=new Blob([`Relatório Bonsae\nID da solicitação: ${id}\nPrévia local (mock).`],{type:"text/plain"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="relatorio.txt"; a.click(); URL.revokeObjectURL(a.href);} 
export async function fetchList(_p,fallback){await wait(80); return fallback;}
export async function listSavedReports(){await wait(80); return {total:0,relatorios:[]};}
export async function downloadSavedReport(id,filenameHint){await wait(80); const blob=new Blob([`Relatório salvo mock ID: ${id}`],{type:"text/plain"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filenameHint||"download"; a.click(); URL.revokeObjectURL(a.href);} 
export async function deleteSavedReport(_id){await wait(80); return {ok:true};}
