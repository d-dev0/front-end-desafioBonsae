const KEY="bonsae_theme"; const root=document.documentElement;
export function applySavedTheme(){try{localStorage.setItem(KEY,"light");}catch(e){} root.setAttribute("data-theme","light"); return "light";}
export function toggleTheme(){root.setAttribute("data-theme","light"); try{localStorage.setItem(KEY,"light");}catch(e){} return "light";}
