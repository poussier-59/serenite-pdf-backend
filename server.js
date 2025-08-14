import express from "express";
import cors from "cors";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { PDFDocument } from "pdf-lib";
import { spawn } from "child_process";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit:"10mb" }));

// Dossiers
const templatesDir = path.join(__dirname, "templates");
const workDir = path.join(__dirname, "uploads");
await fs.ensureDir(templatesDir);
await fs.ensureDir(workDir);

// Upload .docx
const upload = multer({ storage: multer.memoryStorage(), limits:{ fileSize: 15*1024*1024 }});

// Santé
app.get("/health", (req,res)=> res.json({ok:true}));

// Lister modèles
app.get("/templates", async (req,res)=>{
  const files = await fs.readdir(templatesDir);
  res.json(files.filter(f=>f.toLowerCase().endsWith(".docx")));
});

// Supprimer modèle
app.delete("/templates/:name", async (req,res)=>{
  const name = req.params.name;
  const p = path.join(templatesDir, name);
  if(!(await fs.pathExists(p))) return res.status(404).send("Not found");
  await fs.remove(p);
  res.json({ok:true});
});

// Upload modèle
app.post("/upload-template", upload.single("file"), async (req,res)=>{
  try{
    const { name } = req.body;
    if(!name || !req.file) return res.status(400).send("name + file requis");
    const filePath = path.join(templatesDir, `${sanitize(name)}.docx`);
    await fs.writeFile(filePath, req.file.buffer);
    res.json({ok:true, file: path.basename(filePath)});
  }catch(e){
    console.error(e);
    res.status(500).send("Erreur upload");
  }
});

// Remplir un DOCX
async function fillDocx(templatePath, data, outPath){
  const content = await fs.readFile(templatePath, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop:true, linebreaks:true });

  const flat = flattenData(data);
  doc.setData(flat);
  doc.render();

  const buf = doc.getZip().generate({ type:"nodebuffer" });
  await fs.writeFile(outPath, buf);
  return outPath;
}

// Convertir DOCX -> PDF avec LibreOffice (soffice)
async function convertDocxToPdf(docxPath, outPdfPath){
  const outDir = path.dirname(outPdfPath);
  await new Promise((resolve, reject)=>{
    const child = spawn("soffice", ["--headless","--convert-to","pdf","--outdir", outDir, docxPath]);
    let stderr = "";
    child.stderr.on("data", d=> stderr += String(d));
    child.on("close", code=> code===0 ? resolve() : reject(new Error(stderr||`LibreOffice code ${code}`)));
  });
  const produced = path.join(outDir, path.basename(docxPath).replace(/\.docx$/i, ".pdf"));
  if(produced !== outPdfPath){ await fs.move(produced, outPdfPath, { overwrite:true }); }
  return outPdfPath;
}

// Fusion PDF
async function mergePdfs(pdfPaths, outPath){
  const merged = await PDFDocument.create();
  for(const p of pdfPaths){
    const bytes = await fs.readFile(p);
    const pdf = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(pg=> merged.addPage(pg));
  }
  const outBytes = await merged.save();
  await fs.writeFile(outPath, outBytes);
  return outPath;
}

function flattenData({ client={}, defunt={} }){
  const out = {};
  for(const [k,v] of Object.entries(client)) out[`${k}Client`] = v ?? "";
  for(const [k,v] of Object.entries(defunt)) out[`${k}Defunt`] = v ?? "";
  out.nom = defunt.nom ?? "";
  out.prenom = defunt.prenom ?? "";
  out.dateDeces = defunt.dateDeces ?? "";
  out.lieuDeces = defunt.lieuDeces ?? "";
  return out;
}
function sanitize(s=""){ return String(s).normalize("NFKD").replace(/[^\w\-.]+/g,"_"); }
async function cleanup(files){ await Promise.all(files.map(async f=>{ try{ await fs.remove(f); }catch{}})); }

// Génération principale
app.post("/generer", async (req,res)=>{
  const { client, defunt, organismes } = req.body || {};
  if(!organismes || !Array.isArray(organismes) || organismes.length===0){
    return res.status(400).send("Aucun organisme sélectionné");
  }

  const temp = new Set();
  try{
    const pdfs = [];
    for(const name of organismes){
      const tpl = path.join(templatesDir, `${name}.docx`);
      if(!(await fs.pathExists(tpl))) { console.warn(`Manquant: ${tpl}`); continue; }
      const base = `${sanitize(name)}-${Date.now()}`;
      const filled = path.join(workDir, `${base}.docx`);
      const pdf    = path.join(workDir, `${base}.pdf`);
      temp.add(filled); temp.add(pdf);

      await fillDocx(tpl, {client, defunt}, filled);
      await convertDocxToPdf(filled, pdf);
      pdfs.push(pdf);
    }
    if(!pdfs.length) return res.status(404).send("Aucun PDF généré (modèles manquants ?)");

    const out = path.join(workDir, `dossier_${Date.now()}.pdf`);
    temp.add(out);
    await mergePdfs(pdfs, out);

    res.setHeader("Content-Type","application/pdf");
    res.setHeader("Content-Disposition",'attachment; filename="dossier_defunt.pdf"');
    const s = fs.createReadStream(out);
    s.on("close", ()=> cleanup([...temp]));
    s.pipe(res);
  }catch(e){
    console.error(e); await cleanup([...temp]);
    res.status(500).send("Erreur serveur");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`✅ Backend Service Sérénité sur http://localhost:${PORT}`));
