/* Compare le BUILD du dépôt avec les octets du checkout et leur version LF.
 * Audit en lecture seule des règles du jeu ; résultats JSON sur stdout. */
const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),ref='4a76184';
const git=f=>cp.execFileSync('git',['show',ref+':'+f],{cwd:root});
const sw=git('sw.js').toString(),files=JSON.parse('['+sw.match(/const FILES = \[([\s\S]*?)\];/)[1].replace(/\s+/g,'')+']').filter(f=>f!=='./');
const hGit=crypto.createHash('sha256'),hWork=crypto.createHash('sha256'),hLF=crypto.createHash('sha256'),diff=[];
for(const f of files){const g=git(f),w=fs.readFileSync(path.join(root,f)),lf=/\.(html|js|css|json|svg|webmanifest)$/.test(f)?Buffer.from(w.toString('utf8').replace(/\r\n/g,'\n')):w;
 hGit.update(f+'\n').update(g);hWork.update(f+'\n').update(w);hLF.update(f+'\n').update(lf);
 if(!g.equals(w))diff.push({file:f,gitCRLF:(g.toString().match(/\r\n/g)||[]).length,workCRLF:(w.toString().match(/\r\n/g)||[]).length,onlyEOL:g.equals(lf)});
}
const r={ref,stored:sw.match(/const BUILD = "([^"]*)"/)[1],git:hGit.digest('hex').slice(0,10),work:hWork.digest('hex').slice(0,10),normalized:hLF.digest('hex').slice(0,10),differences:diff};
console.log(JSON.stringify(r,null,2));
