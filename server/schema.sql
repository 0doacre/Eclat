-- ÉCLAT — base des comptes joueurs (Cloudflare D1).
-- À exécuter une fois, dans la console de la base (onglet « Console ») ou avec :
--   npx wrangler d1 execute eclat-comptes --remote --file=schema.sql
-- Si la base existe déjà (une seule sauvegarde par compte), exécuter à la place
-- le fichier migration-2.sql, qui garde les parties existantes.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pseudo TEXT UNIQUE NOT NULL,   -- en minuscules, pour l’unicité
  display TEXT NOT NULL,         -- tel que le joueur l’a écrit
  auth TEXT NOT NULL,            -- empreinte de la clé de connexion (jamais le mot de passe)
  salt TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,        -- empreinte du jeton
  user INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user);
CREATE TABLE IF NOT EXISTS saves (
  user INTEGER NOT NULL,
  slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 3),  -- trois emplacements par compte
  data TEXT NOT NULL,            -- sauvegarde chiffrée par le jeu
  iv TEXT NOT NULL,
  rev INTEGER NOT NULL,
  updated INTEGER NOT NULL,
  PRIMARY KEY (user, slot)
);
CREATE TABLE IF NOT EXISTS attempts (
  key TEXT PRIMARY KEY,
  n INTEGER NOT NULL,
  reset INTEGER NOT NULL
);
