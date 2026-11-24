# Installer OpenMontage · Calebasse sur un nouveau PC

Ce dépôt privé (`Steph125/openmontage-calebasse`) contient **tout le nécessaire** :

- OpenMontage, la version officielle à jour au 24/11/2026 ;
- tous tes projets dans `projects/` : les pubs Calebasse, les shorts MTC, le catalogue des 1 011 produits, le workflow des pubs et les scripts de travail ;
- la mémoire de Claude, pour qu'il retrouve le contexte de tes projets ;
- la liste exacte des paquets Python de l'ancien PC.

**Ce qui n'est pas dedans :**

| Élément | Pourquoi | Que faire |
|---|---|---|
| Fichier `.env` (clés API) | secret, jamais sur GitHub | le recréer à l'étape 4 |
| `horloge-organes_v1.mp4` et `_v2.mp4` (156 Mo chacun) | GitHub refuse les fichiers de plus de 100 Mo | récupérer sur onedrive.com (`Bureau\OpenMontage\projects\horloge-organes\renders\`) si besoin |
| Environnement Python, `node_modules`, caches | propres à chaque PC | recréés par le script |

## Installation (environ 30 min, surtout des téléchargements)

### 1. Installer Git
Ouvre **PowerShell** et tape :
```powershell
winget install --id Git.Git -e
```
Puis ferme et rouvre PowerShell.

### 2. Récupérer le projet
Conseil : installe-le **en dehors de OneDrive**. Remotion fonctionne mal avec les fichiers synchronisés.
```powershell
git clone https://github.com/Steph125/openmontage-calebasse.git "$env:USERPROFILE\OpenMontage"
```
La première fois, une fenêtre GitHub s'ouvre : connecte-toi avec ton compte **Steph125**. Le dépôt est privé.

### 3. Lancer l'installation automatique
```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\OpenMontage\projects\calebasse-brand\setup\setup_nouveau_pc.ps1"
```
Le script installe ce qui manque et vérifie chaque étape :
- Python 3.13, Node.js (version 22.23.4 ou plus) et FFmpeg ;
- l'environnement Python (rembg, OpenCV, Whisper…) ;
- Remotion et HyperFrames ;
- la mémoire de Claude.

Si Windows demande une autorisation, accepte. Si le script signale un problème, corrige-le puis **relance-le** : ce qui est déjà fait est sauté.

### 4. Remettre tes clés API
Le script ouvre le fichier `.env` dans le Bloc-notes. Renseigne les deux clés que tu utilises, puis enregistre :
```
PEXELS_API_KEY=...
PIXABAY_API_KEY=...
```
Tu les retrouves dans ton compte Pexels et ton compte Pixabay. Tu peux aussi les copier depuis le `.env` de l'ancien PC avant de l'effacer.

### 5. Ton identité git (une seule fois)
```powershell
git config --global user.name "Steph125"
git config --global user.email "<ton e-mail GitHub>"
```

### 6. Ouvrir le projet
Ouvre le dossier `OpenMontage` dans **VS Code** avec l'extension **Claude Code**. Claude retrouve la mémoire de tes projets, tes séries et le workflow des pubs.

Pour vérifier que tout marche, demande-lui : *« vérifie que Remotion et HyperFrames fonctionnent »*.

## Au quotidien

**Sauvegarder ton travail sur GitHub** (après chaque séance, ou demande à Claude : *« sauvegarde sur GitHub »*) :
```powershell
git add projects
git commit -m "Séance du <date>"
git push
```

**Mettre à jour OpenMontage** quand une nouvelle version sort (tes projets ne sont pas touchés) :
```powershell
git fetch upstream
git merge upstream/main
git push
```

**Règles à respecter :**
- ne jamais ajouter le fichier `.env` ;
- un fichier de plus de 100 Mo doit être ajouté au `.gitignore`, sinon GitHub refuse l'envoi.

## Problèmes connus

- **Whisper** (sous-titres à partir de tes enregistrements voix) : la combinaison `av 19` + `faster-whisper 1.2.1` plantait sur l'ancien PC. Demande à Claude de la réparer avant le premier projet avec ta voix.
- **HyperFrames** : `hyperframes doctor` met environ 25 s à répondre ; l'outil peut croire à tort qu'HyperFrames est absent. La parade est notée dans la mémoire de Claude.
- **Si le projet est malgré tout dans OneDrive** : copier `public/` dans un dossier temporaire avant chaque rendu Remotion, avec `projects/calebasse-brand/scripts/localpub.py`.

## Ancien PC

Une fois tout vérifié sur le nouveau PC (un rendu test, les clés API), l'ancien peut être effacé. Tes fichiers restent aussi sur OneDrive tant que tu ne les supprimes pas.
