-- ÉCLAT — migration vers les trois emplacements de sauvegarde en ligne.
-- À exécuter UNE FOIS, uniquement si la base `eclat-comptes` existe déjà avec
-- l’ancienne table `saves` (une sauvegarde par compte). Dans la console de la
-- base (onglet « Console »), colle tout ce fichier puis « Execute ».
--
-- La partie déjà en ligne est conservée : elle devient l’emplacement 1, et les
-- deux autres emplacements sont vides. Rien n’est effacé.

ALTER TABLE saves RENAME TO saves_v1;

CREATE TABLE saves (
  user INTEGER NOT NULL,
  slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 3),
  data TEXT NOT NULL,
  iv TEXT NOT NULL,
  rev INTEGER NOT NULL,
  updated INTEGER NOT NULL,
  PRIMARY KEY (user, slot)
);

INSERT OR IGNORE INTO saves (user, slot, data, iv, rev, updated)
  SELECT user, 1, data, iv, rev, updated FROM saves_v1;

DROP TABLE saves_v1;
