/* Tests unitaires et structurels : Refonte du menu et interfaces façon jeu vidéo */
"use strict";

const assert = require("assert");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");

function test(name, fn) {
  try {
    fn();
    console.log("  ✓ " + name);
  } catch (e) {
    console.error("  ✗ " + name);
    console.error(e);
    process.exit(1);
  }
}

console.log("Refonte du Menu (Jeu Vidéo & diverses interfaces) :");

test("D.VERSION et constantes cohérentes", () => {
  assert.ok(D.VERSION, "Version définie");
  assert.ok(D.AGES && D.AGES.length > 0, "Ages définis");
});

test("Structure et balisage du menu 'Jeu Vidéo'", () => {
  let modalOpened = null;
  const mockApi = {
    E: createEngine(),
    ENGINE: {},
    A: { init() {}, click() {}, setVolumes() {}, setEnabled() {} },
    D,
    U: { compact: () => false, setCompact() {}, dirty: false, Ambiance: { update() {} } },
    Cloud: {},
    Tuto: { doneCount: () => 3, chapters: () => [1, 2, 3, 4, 5], enabled: () => true, restart() {} },
    esc: (s) => String(s),
    fmt: (n) => String(Math.floor(n)),
    fmtTime: (s) => Math.floor(s / 60) + " min",
    fmtDate: () => "aujourd'hui",
    toast() {},
    openModal(o) { modalOpened = o; },
    closeModal() {},
    swapModal() {},
    simpleModal() {},
    save() {},
    backups: () => [],
    pushBackup() {},
    setTab() {},
    applyTheme() {},
    applyLargeText() {},
    volumes: () => ({ music: 0.8, amb: 0.7, sfx: 0.9 }),
    intro() {},
    openMemoire() {},
    visiteurFin() {},
    App: { ecranPossible: () => true, installable: () => true },
    Dom: { comptoirSheet() {} }
  };

  const CompteModule = require("../js/compte.js");
  const Cpt = CompteModule.create(mockApi);
  assert.ok(typeof Cpt.openMenu === "function", "Cpt.openMenu est une fonction");

  Cpt.openMenu();
  assert.ok(modalOpened, "openModal a été appelé");
  assert.strictEqual(modalOpened.cls, "menu-modal", "Classe menu-modal présente");
  const h = modalOpened.html;
  assert.ok(h.includes("menu-game-header"), "HUD d'en-tête présent");
  assert.ok(h.includes("menu-nav-bar"), "Navigation par onglets présente");
  assert.ok(h.includes('id="msec-jeu"'), "Section Jeu présente");
  assert.ok(h.includes('id="msec-affichage"'), "Section Affichage présente");
  assert.ok(h.includes('id="msec-audio"'), "Section Audio présente");
  assert.ok(h.includes('id="msec-systeme"'), "Section Système présente");
  assert.ok(h.includes('data-m="mem"'), "Bouton Mémoire présent");
  assert.ok(h.includes('data-m="sound"'), "Bouton Son présent");
  assert.ok(h.includes('data-m="compact"'), "Bouton Compact présent");
  assert.ok(h.includes('data-m="reset"'), "Bouton Reset présent");
});

test("Vérification que les boutons requis par les tests d'accessibilité sont tous présents dans le menu", () => {
  let modalOpened = null;
  const mockApi = {
    E: createEngine(),
    ENGINE: {},
    A: { init() {}, click() {}, setVolumes() {}, setEnabled() {} },
    D,
    U: { compact: () => false, setCompact() {}, dirty: false, Ambiance: { update() {} } },
    Cloud: {},
    Tuto: { doneCount: () => 3, chapters: () => [1, 2, 3, 4, 5], enabled: () => true, restart() {} },
    esc: (s) => String(s),
    fmt: (n) => String(Math.floor(n)),
    fmtTime: (s) => Math.floor(s / 60) + " min",
    fmtDate: () => "aujourd'hui",
    toast() {},
    openModal(o) { modalOpened = o; },
    closeModal() {},
    swapModal() {},
    simpleModal() {},
    save() {},
    backups: () => [],
    pushBackup() {},
    setTab() {},
    applyTheme() {},
    applyLargeText() {},
    volumes: () => ({ music: 0.8, amb: 0.7, sfx: 0.9 }),
    intro() {},
    openMemoire() {},
    visiteurFin() {},
    App: { ecranPossible: () => true, installable: () => true },
    Dom: { comptoirSheet() {} }
  };

  const CompteModule = require("../js/compte.js");
  const Cpt = CompteModule.create(mockApi);
  Cpt.openMenu();
  const h = modalOpened.html;

  const requiredDataM = [
    "theme", "largeText", "compact", "carnet2", "ambiance", "ecran",
    "sound", "vibe", "visiteurs", "tuto", "tutoAgain", "mem",
    "saves", "account", "installer", "help", "news", "credits", "reset", "close"
  ];

  requiredDataM.forEach((dm) => {
    assert.ok(h.includes('data-m="' + dm + '"'), "Bouton data-m=\"" + dm + "\" présent dans le HTML du menu");
  });

  // Vérifier la présence des sections Jeu Vidéo et de l'en-tête HUD
  assert.ok(h.includes("menu-game-header"), "En-tête HUD jeu vidéo présent");
  assert.ok(h.includes("menu-nav-bar"), "Barre de navigation rapide présente");
  assert.ok(h.includes("msec-jeu"), "Section Jeu présente");
  assert.ok(h.includes("msec-affichage"), "Section Affichage présente");
  assert.ok(h.includes("msec-audio"), "Section Audio présente");
  assert.ok(h.includes("msec-systeme"), "Section Système présente");
});

test("Style CSS du Menu Jeu Vidéo et composants tactiles", () => {
  const fs = require("fs");
  const path = require("path");
  const css = fs.readFileSync(path.join(__dirname, "../css/style.css"), "utf8");

  assert.ok(css.includes(".menu-game-header"), "Style .menu-game-header présent");
  assert.ok(css.includes(".menu-nav-bar"), "Style .menu-nav-bar présent");
  assert.ok(css.includes(".btn.sw::before"), "Style de voyant LED pour les interrupteurs présent");
  assert.ok(css.includes(".btn.sw.on"), "Style activé avec halo néon présent");
  assert.ok(css.includes(".menu-grid .btn.m-card-btn"), "Style des cartes console présent");
  assert.ok(css.includes(".menu-danger-zone"), "Zone de danger stylisée");
});

test("Structure et lisibilité des fenêtres de Sauvegardes", () => {
  let modalOpened = null;
  const eng = createEngine();
  const mockApi = {
    E: eng,
    ENGINE: {},
    A: { init() {}, click() {}, setVolumes() {}, setEnabled() {} },
    D,
    U: { persist: "accordee", sync: {} },
    Cloud: {},
    esc: (s) => String(s),
    fmtTime: (s) => Math.floor(s / 60) + " min",
    fmtDate: () => "aujourd'hui 12:00",
    toast() {},
    openModal(o) { modalOpened = o; },
    closeModal() {},
    swapModal(o) { modalOpened = o; },
    simpleModal() {},
    save() {},
    backups: () => [
      { t: Date.now() - 3600000, why: "Avant relève", v: 11, data: eng.serialize() }
    ],
    pushBackup() {},
    downloadSave() {}
  };

  const CompteModule = require("../js/compte.js");
  const Cpt = CompteModule.create(mockApi);

  Cpt.openSaves();
  assert.ok(modalOpened, "Modal de sauvegardes ouverte");
  const h = modalOpened.html;
  assert.ok(h.includes("saves-actions-grid"), "Grille des actions de sauvegarde présente");
  assert.ok(h.includes('data-m="dl"'), "Bouton télécharger sauvegarde présent");
  assert.ok(h.includes('data-m="up"'), "Bouton charger fichier présent");
  assert.ok(h.includes('data-m="code"'), "Bouton code texte présent");
  assert.ok(h.includes("backup-card"), "Cartes de copies de sauvegarde présentes");
  assert.ok(h.includes("bk-chips"), "Puces d'informations (Âge, Semeur, Temps de jeu) présentes");
  assert.ok(h.includes('data-m="bdl"'), "Bouton de téléchargement d'une copie présent");
  assert.ok(h.includes('data-m="brs"'), "Bouton de restauration d'une copie présent");
});

test("Structure et lisibilité des fenêtres de Compte et Emplacements en ligne", async () => {
  let modalOpened = null;
  let accountData = { pseudo: "Explorateur", token: "tok123", slot: 1, last: Date.now() - 60000, auto: true, revs: { 1: { rev: 4, updated: Date.now() - 60000 } } };
  const mockApi = {
    E: createEngine(),
    ENGINE: {},
    A: { init() {}, click() {}, setVolumes() {}, setEnabled() {} },
    D,
    U: { sync: {} },
    Cloud: {
      configured: () => true,
      account: () => accountData,
      slots: async () => [{ slot: 1, rev: 4, updated: Date.now() - 60000 }],
      setAuto() {}
    },
    esc: (s) => String(s),
    fmtTime: (s) => Math.floor(s / 60) + " min",
    fmtDate: () => "aujourd'hui 12:00",
    toast() {},
    openModal(o) { modalOpened = o; },
    closeModal() {},
    swapModal(o) { modalOpened = o; },
    simpleModal() {},
    save() {},
    backups: () => []
  };

  const CompteModule = require("../js/compte.js");
  const Cpt = CompteModule.create(mockApi);

  await Cpt.openAccount();
  assert.ok(modalOpened, "Modal de compte ouverte");
  const h = modalOpened.html;
  assert.ok(h.includes("account-user-card"), "Carte de profil Semeur en ligne présente");
  assert.ok(h.includes("slots-container"), "Conteneur des 3 emplacements cloud présent");
  assert.ok(h.includes("slot-card"), "Cartes d'emplacements présentes");
  assert.ok(h.includes("slot-active"), "Emplacement actif mis en avant");
  assert.ok(h.includes('data-m="slot"'), "Boutons de gestion de slot présents");
  assert.ok(h.includes('data-m="push"'), "Bouton synchroniser/envoyer présent");
  assert.ok(h.includes('data-m="pull"'), "Bouton récupérer présent");
  assert.ok(h.includes('data-m="auto"'), "Bouton bascule envoi automatique présent");
});

test("Style CSS des sauvegardes, comptes et duels de version", () => {
  const fs = require("fs");
  const path = require("path");
  const css = fs.readFileSync(path.join(__dirname, "../css/style.css"), "utf8");

  assert.ok(css.includes(".save-status"), "Style .save-status présent");
  assert.ok(css.includes(".saves-actions-grid"), "Style .saves-actions-grid présent");
  assert.ok(css.includes(".backup-card"), "Style .backup-card présent");
  assert.ok(css.includes(".save-duel"), "Style .save-duel présent");
  assert.ok(css.includes(".duel-card"), "Style .duel-card présent");
  assert.ok(css.includes(".account-user-card"), "Style .account-user-card présent");
  assert.ok(css.includes(".slot-card"), "Style .slot-card présent");
  assert.ok(css.includes(".slot-status-pill"), "Style .slot-status-pill présent");
});

console.log("✓ Tous les tests de la refonte du menu sont réussis.");
