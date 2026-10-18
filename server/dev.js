/* Serveur local pour essayer les comptes sans Cloudflare :
 *   node --no-warnings server/dev.js [port] [fichier.sqlite]
 * puis, dans la console du navigateur sur le jeu :
 *   localStorage.setItem("eclat.cloud", "http://localhost:8787")  */
import http from "node:http";
import worker from "./worker.js";
import { localD1 } from "./d1-local.js";

const port = Number(process.argv[2]) || 8787;
const env = { DB: localD1(process.argv[3]), ALLOWED_ORIGIN: "*" };

http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const r = new Request("http://localhost:" + port + req.url, { method: req.method, headers: req.headers, body: hasBody ? Buffer.concat(chunks) : undefined });
  const out = await worker.fetch(r, env);
  res.writeHead(out.status, Object.fromEntries(out.headers));
  res.end(Buffer.from(await out.arrayBuffer()));
}).listen(port, () => console.log("Serveur des comptes : http://localhost:" + port));
