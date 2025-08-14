/*************** CONFIG ***************/
const DEFAULT_BACKEND_URL = "http://localhost:3000"; // ← remplace par ton URL Render si déployé
function getBackendUrl() {
  return localStorage.getItem("BACKEND_URL") || DEFAULT_BACKEND_URL;
}

/*************** STOCKAGE ***************/
let clients = JSON.parse(localStorage.getItem("clients")) || [];
let defunts = JSON.parse(localStorage.getItem("defunts")) || [];
let organismes = JSON.parse(localStorage.getItem("organismes")) || [
  { nom: "Banque", docs: ["Acte de décès", "RIB héritier", "Justificatif d'identité", "Lien de parenté"] },
  { nom: "CAF", docs: ["Acte de décès", "Justificatif situation familiale", "RIB"] },
  { nom: "CPAM", docs: ["Acte de décès", "N° sécurité sociale", "RIB"] },
  { nom: "Mairie", docs: ["Acte de décès"] },
  { nom: "Impôts", docs: ["Acte de décès", "Justificatif identité", "RIB"] },
  { nom: "CaisseRetraitePrincipale", docs: ["Acte de décès", "Numéro de retraite", "RIB"] },
  { nom: "CaisseRetraiteComplementaire", docs: ["Acte de décès", "Numéro d'affiliation", "RIB"] },
  { nom: "AssuranceVie", docs: ["Acte de décès", "Contrat d'assurance vie", "RIB"] },
  { nom: "AssuranceHabitation", docs: ["Acte de décès", "Contrat habitation"] },
  { nom: "AssuranceAuto", docs: ["Acte de décès", "Contrat auto"] },
  { nom: "Employeur", docs: ["Acte de décès", "Contrat de travail"] },
  { nom: "Bailleur", docs: ["Acte de décès", "Contrat de location"] },
  { nom: "FournisseurEnergie", docs: ["Acte de décès", "Dernière facture"] },
  { nom: "FournisseurEau", docs: ["Acte de décès", "Dernière facture"] },
  { nom: "OperateurTelecom", docs: ["Acte de décès", "Dernière facture"] },
  { nom: "Notaire", docs: ["Acte de décès", "Testament éventuel"] },
  { nom: "MutuelleSante", docs: ["Acte de décès", "N° adhérent"] },
  { nom: "PoleEmploi", docs: ["Acte de décès", "N° identifiant"] },
  { nom: "SSI", docs: ["Acte de décès", "N° sécurité sociale"] }
];

const saveAll = () => {
  localStorage.setItem("clients", JSON.stringify(clients));
  localStorage.setItem("defunts", JSON.stringify(defunts));
  localStorage.setItem("organismes", JSON.stringify(organismes));
  updateStats();
};

/*************** NAVIGATION ***************/
document.querySelectorAll(".menu button").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".menu button").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const pg = btn.dataset.page;
    document.querySelectorAll(".page").forEach(p=>p.style.display="none");
    document.getElementById(`page-${pg}`).style.display="block";
  });
});
document.getElementById("btnParams").addEventListener("click", ()=>{
  document.querySelectorAll(".menu button").forEach(b=>b.classList.remove("active"));
  document.querySelectorAll(".page").forEach(p=>p.style.display="none");
  document.getElementById("page-parametres").style.display="block";
});

/*************** TABLEAU DE BORD ***************/
function updateStats(){
  document.getElementById("statClients").textContent = clients.length;
  document.getElementById("statDefunts").textContent = defunts.length;
  document.getElementById("statOrganismes").textContent = organismes.length;
}

/*************** CLIENTS ***************/
function renderClients(){
  const box = document.getElementById("liste-clients");
  box.innerHTML = "";
  clients.forEach((c,i)=>{
    const row = document.createElement("div"); row.className="row";
    row.innerHTML = `<div><strong>${c.nom} ${c.prenom}</strong><div class="muted">${c.adresse||""}</div></div>`;
    const actions = document.createElement("div"); actions.className="row-actions";
    const del = document.createElement("button"); del.className="action danger"; del.textContent="Supprimer";
    del.onclick = ()=>{ clients.splice(i,1); saveAll(); renderClients(); renderClientOptions(); };
    actions.appendChild(del);
    row.appendChild(actions); box.appendChild(row);
  });
  renderClientOptions();
}
document.getElementById("form-client").addEventListener("submit", (e)=>{
  e.preventDefault();
  const newClient = {
    nom: nomClient.value.trim(),
    prenom: prenomClient.value.trim(),
    dateNaissance: dateNaissanceClient.value,
    adresse: adresseClient.value.trim(),
    tel: telClient.value.trim(),
    email: emailClient.value.trim(),
    rib: ribClient.value.trim()
  };
  clients.push(newClient); saveAll(); renderClients(); e.target.reset();
});

/*************** DÉFUNTS ***************/
function renderDefunts(){
  const box = document.getElementById("liste-defunts"); box.innerHTML="";
  defunts.forEach((d,i)=>{
    const row = document.createElement("div"); row.className="row";
    const client = clients[d.clientIndex] ? ` (Client: ${clients[d.clientIndex].nom} ${clients[d.clientIndex].prenom})` : "";
    row.innerHTML = `<div><strong>${d.nom} ${d.prenom}</strong>${client}<div class="muted">${d.dateDeces||""} – ${d.lieuDeces||""}</div></div>`;
    const actions = document.createElement("div"); actions.className="row-actions";
    const del = document.createElement("button"); del.className="action danger"; del.textContent="Supprimer";
    del.onclick = ()=>{ defunts.splice(i,1); saveAll(); renderDefunts(); renderDefuntOptions(); };
    actions.appendChild(del); row.appendChild(actions); box.appendChild(row);
  });
  renderDefuntOptions();
}
document.getElementById("form-defunt").addEventListener("submit",(e)=>{
  e.preventDefault();
  const newDefunt = {
    nom: nomDefunt.value.trim(),
    prenom: prenomDefunt.value.trim(),
    dateNaissance: dateNaissanceDefunt.value,
    dateDeces: dateDeces.value,
    lieuDeces: lieuDeces.value.trim(),
    numSecu: numSecuDefunt.value.trim(),
    clientIndex: clientLie.value ? parseInt(clientLie.value,10) : null
  };
  defunts.push(newDefunt); saveAll(); renderDefunts(); e.target.reset();
});
function renderClientOptions(){
  const sel = document.getElementById("clientLie"); sel.innerHTML="";
  clients.forEach((c,i)=>{ const o=document.createElement("option"); o.value=i; o.textContent=`${c.nom} ${c.prenom}`; sel.appendChild(o); });
}
function renderDefuntOptions(){
  const sel = document.getElementById("selectDefuntForDossier"); sel.innerHTML="";
  defunts.forEach((d,i)=>{ const o=document.createElement("option"); o.value=i; o.textContent=`${d.nom} ${d.prenom}`; sel.appendChild(o); });
}

/*************** ORGANISMES ***************/
function renderOrganismes(){
  const box = document.getElementById("liste-organismes"); box.innerHTML="";
  organismes.forEach((o,i)=>{
    const row = document.createElement("div"); row.className="row";
    row.innerHTML = `<div><strong>${o.nom}</strong><div class="muted">${(o.docs||[]).join(", ")}</div></div>`;
    const actions = document.createElement("div"); actions.className="row-actions";
    const del = document.createElement("button"); del.className="action danger"; del.textContent="Supprimer";
    del.onclick = ()=>{ organismes.splice(i,1); saveAll(); renderOrganismes(); };
    actions.appendChild(del); row.appendChild(actions); box.appendChild(row);
  });
}
document.getElementById("form-ajout-organisme").addEventListener("submit",(e)=>{
  e.preventDefault();
  const nom = nomNouvelOrganisme.value.trim();
  const docs = docsNouvelOrganisme.value.split(",").map(s=>s.trim()).filter(Boolean);
  if(!nom) return;
  organismes.push({ nom, docs }); saveAll(); renderOrganismes(); e.target.reset();
});

/*************** MODALE / APERÇU DOCS ***************/
const modal = document.getElementById("organismesModal");
const closeModal = document.querySelector(".modal-close");
document.getElementById("btnOpenOrganismesModal").addEventListener("click", ()=>{
  if(!defunts.length){ alert("Ajoute d’abord un défunt."); return; }
  populateOrganismesChecklist();
  modal.style.display="block";
  updateApercuDocs();
});
closeModal.addEventListener("click", ()=> modal.style.display="none");
window.addEventListener("click", e=>{ if(e.target===modal) modal.style.display="none"; });

function populateOrganismesChecklist(){
  const list = document.getElementById("organismes-list"); list.innerHTML="";
  organismes.forEach(o=>{
    const id = `chk_${o.nom.replace(/\W+/g,'_')}`;
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type="checkbox"; cb.value=o.nom; cb.id=id;
    cb.addEventListener("change", updateApercuDocs);
    label.appendChild(cb);
    label.append(` ${o.nom}`);
    list.appendChild(label);
  });
}
function updateApercuDocs(){
  const chosen = [...document.querySelectorAll("#organismes-list input:checked")].map(cb=>cb.value);
  const docsSet = new Set();
  organismes.filter(o=>chosen.includes(o.nom)).forEach(o=> (o.docs||[]).forEach(d=>docsSet.add(d)));
  const ul = document.getElementById("aperçu-docs"); ul.innerHTML="";
  [...docsSet].forEach(d=>{ const li=document.createElement("li"); li.textContent=d; ul.appendChild(li); });
}

/*************** GÉNÉRATION PDF ***************/
document.getElementById("btnGenererPDF").addEventListener("click", async ()=>{
  const defSel = document.getElementById("selectDefuntForDossier");
  if(!defSel.value){ alert("Choisis un défunt."); return; }
  const defunt = defunts[parseInt(defSel.value,10)];
  const client = (defunt.clientIndex!=null)? clients[defunt.clientIndex] : {};

  const organismesChoisis = [...document.querySelectorAll("#organismes-list input:checked")].map(cb=>cb.value);
  if(!organismesChoisis.length){ alert("Sélectionne au moins un organisme."); return; }

  try{
    const resp = await fetch(`${getBackendUrl()}/generer`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ client, defunt, organismes: organismesChoisis })
    });
    if(!resp.ok) throw new Error("Erreur serveur");
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="dossier_defunt.pdf";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    modal.style.display="none";
  }catch(e){
    alert("Impossible de générer le PDF : "+e.message);
  }
});

/*************** PARAMÈTRES ***************/
document.getElementById("saveBackendUrl").addEventListener("click", ()=>{
  const v = document.getElementById("backendUrlInput").value.trim();
  if(!v){ alert("Saisis une URL valide."); return; }
  localStorage.setItem("BACKEND_URL", v);
  alert("URL backend enregistrée.");
});
document.getElementById("btnUploadTemplate").addEventListener("click", async ()=>{
  const name = document.getElementById("uploadTemplateName").value.trim();
  const file = document.getElementById("uploadTemplateFile").files[0];
  if(!name || !file){ alert("Nom organisme + fichier .docx requis."); return; }
  const fd = new FormData();
  fd.append("name", name);
  fd.append("file", file);
  try{
    const r = await fetch(`${getBackendUrl()}/upload-template`,{ method:"POST", body:fd });
    if(!r.ok) throw new Error("Upload échoué");
    await loadTemplates();
    if(!organismes.find(o=>o.nom===name)){ organismes.push({nom:name, docs:[]}); saveAll(); renderOrganismes(); }
    alert("Modèle importé.");
  }catch(e){ alert(e.message); }
});

async function loadTemplates(){
  try{
    const r = await fetch(`${getBackendUrl()}/templates`);
    if(!r.ok) throw new Error("Liste indisponible");
    const arr = await r.json();
    const ul = document.getElementById("liste-templates"); ul.innerHTML="";
    arr.forEach(t=>{
      const li = document.createElement("li");
      const b = document.createElement("button"); b.className="action danger"; b.textContent="Supprimer";
      b.onclick = async ()=>{
        const ok = confirm(`Supprimer le modèle ${t}?`); if(!ok) return;
        const r2 = await fetch(`${getBackendUrl()}/templates/${encodeURIComponent(t)}`,{ method:"DELETE" });
        if(!r2.ok) { alert("Suppression échouée"); return; }
        await loadTemplates();
      };
      li.textContent = t + " ";
      li.appendChild(b); ul.appendChild(li);
    });
  }catch(_){}
}

/*************** INIT ***************/
function init(){
  renderClients(); renderDefunts(); renderOrganismes(); updateStats(); loadTemplates();
  document.querySelectorAll(".page").forEach(p=>p.style.display="none");
  document.getElementById("page-dashboard").style.display="block";
}
init();
