# Prompts sonores : une ambiance et une musique par terre

À donner à des générateurs de son : **ambiances et bruitages** (ElevenLabs Sound Effects, Stable Audio,
AudioGen, Freesound pour les vraies prises…) et **musique** (Suno, Udio, Stable Audio Music, MusicGen…).
Les prompts sont en anglais (les outils le comprennent mieux), avec un résumé en français.

Aucun secret du récit dans ce document. Pour le Caveau, on ne s'appuie que sur ce que le jeu en dit dès
qu'on le trouve (« une salle immense baignée de lumière bleue »).

## 0. Où ça s'insère

Aujourd'hui le jeu **génère** sa musique et ses ambiances (`js/audio.js`, Web Audio) : la musique suit les
âges, l'ambiance suit l'endroit (vent, eau, oiseaux, machines). Ces nouveaux fichiers viennent **en plus**
(ou à la place, terre par terre). Trois voies restent réglables séparément : effets, musique, ambiance.
Chaque terre aurait donc **deux fichiers** :
- `assets/audio/<id>-ambiance.ogg` : un **lit sonore** qui boucle sans couture ;
- `assets/audio/<id>-musique.ogg` : une **musique de fond** très discrète qui boucle sans couture.

Identifiants : `lisiere`, `plaine`, `riviere`, `collines`, `mine`, `desert`, `gisement`, `montagnes`,
`orbite`, `lune`, `mercure`, `caveau`.

## 1. Cahier des charges technique (à vérifier avant d'accepter un fichier)

- **Boucle sans couture.** Le début et la fin se raccordent sans clic ni coupure (crossfade de 1 à 2 s fait
  dans l'éditeur, ou fichier généré « loopable »). Test : écouter la jonction cinq fois de suite.
- **Durées.** Ambiance : **30 à 45 s**. Musique : **60 à 90 s**. Plus long ne sert à rien : le jeu se joue
  en sessions longues, mais une boucle trop courte lasse ; on fait varier le mélange (ambiance + musique à
  des durées différentes) pour que la répétition ne s'entende pas.
- **Format et poids.** OGG Opus (ou MP3 en secours pour Safari), **mono** pour les ambiances,
  stéréo légère pour la musique, **48 kbit/s** pour l'ambiance (environ 200 Ko) et **64 kbit/s** pour la
  musique (environ 600 Ko). Les 24 fichiers pèseraient environ **10 Mo** : **jamais dans le précache** du
  service worker ; chargés **à la demande** (la terre où l'on est, plus la suivante) puis gardés en cache.
  Le jeu doit rester jouable sans audio, sans erreur, si un fichier manque.
- **Volume.** Musique : **−23 LUFS** intégrés ; ambiance : **−26 LUFS** ; aucune crête au-dessus de −3 dBFS.
  Jamais de pic soudain ni de basse qui fait trembler un haut-parleur de téléphone (rien sous 60 Hz).
- **Fréquences utiles.** Un téléphone reproduit mal le grave : garder l'énergie entre 150 Hz et 8 kHz.
- **Aucune voix, aucun mot, aucune mélodie accrocheuse.** C'est un jeu qu'on laisse tourner : la musique doit
  être **agréable à la millième écoute** (lente, peu dense, sans thème qui s'installe dans la tête).
- **Fondu entre terres.** Le jeu fait un fondu enchaîné de 2 à 3 s : éviter les sons qui commencent ou
  finissent par un transitoire fort.

## 2. Le fil sonore du jeu

Le jeu part du **bois et de la peau** (instruments acoustiques, ton chaleureux), traverse **le métal et la
machine**, puis finit dans **le vide** (peu de notes, beaucoup d'espace). Les terres suivent ce chemin :
acoustique → modal et minéral → industriel sombre → espace. Les tempos descendent, le silence entre les
notes grandit.

## 3. Les prompts par terre

### Gabarit

**Ambiance** = `PROMPT_AMBIANCE` + « seamless loop, 40 seconds, no music, no voices, no sudden sounds, mono ».
**Musique** = `PROMPT_MUSIQUE` + « instrumental, no vocals, seamless loop, 75 seconds, very sparse, calm, background
music for a long idle game, no strong melodic hook ».
Quand l'outil a un champ « negative prompt » : `vocals, lyrics, drums fill, loud hit, sudden stop, melody hook, distortion`.

### Les douze terres

| Terre | Ambiance (lit sonore) | Musique (fond) |
|---|---|---|
| **La Lisière**<br>forêt calme, feu de camp, sécurité | `edge of a forest at dawn: soft wind in leaves, two or three distant birds far apart, tiny crackle of a small campfire very quiet` | `warm acoustic: solo wooden flute with fingerpicked nylon guitar and a soft hand drum, D Dorian, 70 BPM, gentle, curious, safe` |
| **La Plaine**<br>herbes hautes, vent, espace | `wind moving through tall grass, wide open space, faint distant animal calls, occasional low gust` | `open fifths: bowed lyre drone, frame drum, light fiddle phrases, A minor pentatonic, 78 BPM, wide, pastoral` |
| **La Rivière Lente**<br>eau paresseuse, galets | `slow wide river flowing, soft water over pebbles, reeds rustling, a frog now and then at dusk` | `floating: harp arpeggios, soft cello long notes, felt piano, F Lydian, 60 BPM, calm, flowing like water` |
| **Les Collines**<br>pentes douces, escaliers de pierre | `light breeze over hills, distant sheep bell far away, grasshoppers, sparse and airy` | `pastoral waltz feel in 3/4: recorder, plucked strings, wooden mallet percussion, G major, 88 BPM, light, climbing` |
| **Les Profondeurs**<br>cavernes, tiède et étrange | `cave interior: slow water drips with long reverb, deep low room tone, faint wing flutter of bats far away, a warm unexplained hum` | `sparse dark ambient: low bowed metal, deep drone, soft sub-bass swell, hand-struck stone, E Phrygian, 50 BPM, mysterious but warm` |
| **Le Désert de Verre**<br>vent chaud, verre qui tinte | `hot desert wind, sand shifting, very faint glass chimes tinkling in the distance, dry air, no animals` | `shimmering: glass harmonica, duduk-like reed, faint metallic shimmer, D Phrygian dominant, 66 BPM, translucent, vast and hot` |
| **Le Gisement Noir**<br>bitume, huile, métal | `bubbling thick tar, slow oil seeping, creaking metal, low industrial hum, faint gas hiss` | `dark and heavy: low cello drone, analog bass pulse, distant metallic scrapes, C minor, 70 BPM, oppressive but slow` |
| **Les Pics Fracturés**<br>vent de crête, éboulis | `strong cold wind through rock gaps, distant rockfall echoing, thin whistle in the cracks` | `austere epic, restrained: low alphorn, throat-like drone, soft timpani, tubular bell, B minor, 56 BPM, cold, majestic` |
| **L'Orbite Basse**<br>silence, débris | `near silence in space: faint radio static, slow soft metallic ticks of drifting debris, a barely audible hum` | `weightless: ethereal pads, music-box notes, sparse piano, Lydian, 60 BPM, floating, lonely, lots of silence` |
| **La Lune**<br>silence solennel | `almost total silence: an extremely soft low pad, the faintest slow pulse far away, no wind, no noise` | `solo piano with long reverb, slow single notes and open intervals, A minor, 48 BPM, solemn, glassy, very lonely` |
| **Mercure**<br>chaleur, métal coulant | `roaring heat shimmer, flowing molten metal, slow crackle and pop, deep distant rumble` | `incandescent: slow analog synth arpeggios, bowed metal, soft pulsing low bass, F# minor, 84 BPM, intense but calm, glowing` |
| **Le Caveau des Semeurs**<br>salle immense, lumière bleue | `vast empty hall: very long reverberation, faint electrical hum, slow low resonance like air in a huge space, nothing else` | `crystalline: sparse glass bells, soft long pad, a single low tone, D minor, 40 BPM, solemn, still, enormous space` |

## 4. Variantes utiles (à générer en plus, si le budget le permet)

- **Nuit** (une variante d'ambiance par terre habitée : Lisière, Plaine, Rivière, Collines) : mêmes prompts avec
  `at night, crickets, owl far away, cooler air, quieter`.
- **Moments forts** (très courts, 3 à 6 s, hors boucle) pour la fête de découverte, le passage ouvert, le changement
  d'âge, la relève : `short warm chime rising, wooden and bell, resolves softly, no reverb tail longer than 2 s`.
  Ils s'ajoutent aux sons existants, sans les remplacer.
- **Stems** de la musique (si l'outil le permet) : une version avec seulement la couche rythmique, une avec
  seulement les nappes, pour que le jeu les mélange selon l'activité (plus de matière quand on récolte, plus
  de silence quand on est inactif).

## 5. Vérifications avant d'intégrer

- Écouter **au casque et sur un haut-parleur de téléphone**, volume réglé comme en jeu.
- Écouter **10 minutes de suite** : rien d'agaçant, aucune mélodie qui s'installe, la jonction de boucle
  ne s'entend pas.
- Les 12 terres **côte à côte** : même niveau de volume, même couleur sonore de famille.
- Mesurer le niveau (ffmpeg `ebur128`, ou Audacity « Analyse > Mesure de la sonie »).
- **Droits.** Note l'outil, le modèle, la date et la licence de chaque fichier dans `docs/CREDITS.md` ;
  vérifie que l'usage commercial est autorisé par l'abonnement utilisé (Suno, Udio et d'autres ont des conditions
  différentes selon l'offre).
