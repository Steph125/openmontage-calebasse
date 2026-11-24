<#
  OpenMontage · Calebasse — installation complète sur un nouveau PC Windows.

  À lancer une fois le dépôt cloné (PowerShell, depuis n'importe quel dossier) :
      powershell -ExecutionPolicy Bypass -File <dossier OpenMontage>\projects\calebasse-brand\setup\setup_nouveau_pc.ps1

  Relançable sans risque : chaque étape déjà faite est sautée.
  Installe : Git, Python 3.13, Node.js >= 22.23.4, FFmpeg (via winget), l'environnement Python .venv
  (mêmes paquets que l'ancien PC), Remotion, HyperFrames, le fichier .env et la mémoire Claude.
#>
$ErrorActionPreference = "Continue"   # les codes de sortie des programmes sont vérifiés un par un
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
Set-Location $Root
$Failures = New-Object System.Collections.Generic.List[string]

function Write-Step($msg) { Write-Host ""; Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Done($msg) { Write-Host "    [ok] $msg" -ForegroundColor Green }
function Write-Note($msg) { Write-Host "    [!] $msg" -ForegroundColor Yellow }
function Add-Failure($msg) { $Failures.Add($msg); Write-Host "    [ERREUR] $msg" -ForegroundColor Red }
function Test-Command($name) { $null -ne (Get-Command $name -ErrorAction SilentlyContinue) }
function Update-SessionPath {
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
}
function Install-WithWinget($id, $label) {
    if (-not (Test-Command winget)) {
        Add-Failure "winget introuvable : installe « App Installer » depuis le Microsoft Store, puis relance ce script."
        return $false
    }
    Write-Host "    installation de $label ($id)..."
    winget install --id $id -e --silent --accept-package-agreements --accept-source-agreements
    $code = $LASTEXITCODE
    Update-SessionPath
    return ($code -eq 0)
}
function Get-Python313 {
    if (Test-Command py) {
        $p = & py -3.13 -c "import sys; print(sys.executable)" 2>$null
        if ($LASTEXITCODE -eq 0 -and $p) { return "$p".Trim() }
    }
    foreach ($c in @("$env:LOCALAPPDATA\Programs\Python\Python313\python.exe", "C:\Python313\python.exe", "$env:ProgramFiles\Python313\python.exe")) {
        if (Test-Path $c) { return $c }
    }
    return $null
}
function Get-NodeVersion {
    if (-not (Test-Command node)) { return $null }
    try { return [version]((& node --version).Trim().TrimStart("v")) } catch { return $null }
}

Write-Host "OpenMontage · Calebasse — installation dans $Root" -ForegroundColor White
if ($Root -match "OneDrive") {
    Write-Note "Ce dossier est dans OneDrive : Remotion peut ne pas trouver les fichiers de public/ (erreurs 404)."
    Write-Note "Conseil : cloner plutôt dans C:\Users\<toi>\OpenMontage. Sinon, copier public/ dans %TEMP% avant chaque rendu (scripts\localpub.py)."
}

# ---------------------------------------------------------------- 1. outils de base
Write-Step "1/8  Outils de base (Git, FFmpeg, Python 3.13, Node.js)"
if (Test-Command git) { Write-Done "Git $((& git --version) -replace 'git version ', '')" }
elseif (-not (Install-WithWinget "Git.Git" "Git")) { Add-Failure "Installation de Git impossible." }

if (Test-Command ffmpeg) { Write-Done "FFmpeg déjà installé" }
elseif (Install-WithWinget "Gyan.FFmpeg" "FFmpeg") { Write-Done "FFmpeg installé" }
else { Add-Failure "Installation de FFmpeg impossible (winget install Gyan.FFmpeg)." }

$Py = Get-Python313
if (-not $Py) { [void](Install-WithWinget "Python.Python.3.13" "Python 3.13"); $Py = Get-Python313 }
if ($Py) { Write-Done "Python 3.13 : $Py" } else { Add-Failure "Python 3.13 introuvable après installation : rouvre PowerShell puis relance ce script." }

$NodeMin = [version]"22.23.4"
$nv = Get-NodeVersion
if (-not $nv -or $nv -lt $NodeMin) {
    if ($nv) { Write-Note "Node.js $nv trop ancien (il faut >= $NodeMin)." }
    [void](Install-WithWinget "OpenJS.NodeJS.22" "Node.js 22")
    $nv = Get-NodeVersion
    if (-not $nv -or $nv -lt $NodeMin) { [void](Install-WithWinget "OpenJS.NodeJS.LTS" "Node.js LTS"); $nv = Get-NodeVersion }
}
if ($nv -and $nv -ge $NodeMin) { Write-Done "Node.js $nv" }
else { Add-Failure "Node.js >= $NodeMin introuvable : installe-le depuis https://nodejs.org puis relance ce script." }

# ---------------------------------------------------------------- 2. dépôt git
Write-Step "2/8  Dépôt git (version officielle d'OpenMontage en « upstream »)"
if (Test-Command git) {
    $remotes = & git remote
    if ($remotes -notcontains "upstream") { & git remote add upstream https://github.com/calesthio/OpenMontage.git; Write-Done "remote upstream ajouté" }
    else { Write-Done "remote upstream déjà présent" }
    if (-not (& git config --global user.name)) { Write-Note "Identité git absente : git config --global user.name ""Steph125"" puis git config --global user.email ""<ton e-mail>""" }
}

# ---------------------------------------------------------------- 3. environnement Python
Write-Step "3/8  Environnement Python .venv (mêmes paquets que l'ancien PC : rembg, OpenCV, Whisper...)"
$VenvPy = Join-Path $Root ".venv\Scripts\python.exe"
if ($Py -and -not (Test-Path $VenvPy)) { & $Py -m venv (Join-Path $Root ".venv") }
if (Test-Path $VenvPy) {
    & $VenvPy -m pip install --upgrade "pip>=26.2.2" --quiet
    & $VenvPy -m pip install -r (Join-Path $Root "projects\calebasse-brand\setup\requirements-venv-lock.txt")
    if ($LASTEXITCODE -ne 0) {
        Write-Note "La liste exacte n'a pas pu s'installer en entier : repli sur requirements.txt + outils de détourage."
        & $VenvPy -m pip install -r (Join-Path $Root "requirements.txt")
        & $VenvPy -m pip install rembg onnxruntime opencv-python
        if ($LASTEXITCODE -ne 0) { Add-Failure "Installation des paquets Python incomplète (voir les messages pip ci-dessus)." }
    }
    & $VenvPy -m pip install --upgrade "pip>=26.2.2" "certifi>=2026.10.19" --quiet
    Write-Done "Python prêt : $VenvPy"
} else { Add-Failure "Environnement .venv non créé (Python 3.13 manquant)." }

# ---------------------------------------------------------------- 4. Remotion
Write-Step "4/8  Remotion (remotion-composer : dépendances npm + navigateur de rendu)"
if (Test-Command npm) {
    Push-Location (Join-Path $Root "remotion-composer")
    & npm ci
    if ($LASTEXITCODE -ne 0) { Write-Note "npm ci a échoué : essai avec npm install"; & npm install }
    if ($LASTEXITCODE -ne 0) { Add-Failure "Installation de Remotion impossible (npm)." }
    else {
        & npx remotion browser ensure
        Write-Done "Remotion prêt"
    }
    Pop-Location
} else { Add-Failure "npm introuvable (Node.js pas installé) : Remotion sauté." }

# ---------------------------------------------------------------- 5. HyperFrames
Write-Step "5/8  HyperFrames (téléchargement du CLI 0.9.86 + Chrome de rendu ; la 1re fois prend quelques minutes)"
if (Test-Command npx) {
    & npx --yes hyperframes@0.9.86 doctor
    if ($LASTEXITCODE -eq 0) { Write-Done "HyperFrames prêt" }
    else { Write-Note "hyperframes doctor signale un problème (voir ci-dessus). Relancer : npx --yes hyperframes@0.9.86 doctor" }
} else { Add-Failure "npx introuvable (Node.js pas installé) : HyperFrames sauté." }

# ---------------------------------------------------------------- 6. clés API
Write-Step "6/8  Fichier .env (clés API)"
$EnvFile = Join-Path $Root ".env"
if (-not (Test-Path $EnvFile)) {
    Copy-Item (Join-Path $Root ".env.example") $EnvFile
    Write-Note "Fichier .env créé. Renseigne PEXELS_API_KEY et PIXABAY_API_KEY (les deux seules clés utilisées), puis enregistre."
    Start-Process notepad.exe $EnvFile
} else { Write-Done ".env déjà présent (non modifié)" }

# ---------------------------------------------------------------- 7. mémoire Claude
Write-Step "7/8  Mémoire Claude Code (contexte des projets Calebasse / MTC)"
$MemSrc = Join-Path $Root "projects\calebasse-brand\claude-memory"
$Key = $Root -replace "[^A-Za-z0-9]", "-"
$Keys = @(($Key.Substring(0, 1).ToLower() + $Key.Substring(1)), ($Key.Substring(0, 1).ToUpper() + $Key.Substring(1))) | Select-Object -Unique
foreach ($k in $Keys) {
    $dst = Join-Path $env:USERPROFILE ".claude\projects\$k\memory"
    New-Item -ItemType Directory -Force $dst | Out-Null
    foreach ($f in Get-ChildItem $MemSrc -Filter *.md) {
        $target = Join-Path $dst $f.Name
        if (-not (Test-Path $target)) { Copy-Item $f.FullName $target }   # ne jamais écraser une mémoire écrite sur ce PC
    }
}
Write-Done "mémoire installée pour ce dossier ($($Keys -join ', '))"

# ---------------------------------------------------------------- 8. vérification
Write-Step "8/8  Vérification des moteurs de rendu"
if (Test-Path $VenvPy) {
    & $VenvPy -c "from tools.tool_registry import registry; registry.discover(); print('    moteurs :', registry.provider_menu_summary().get('composition_runtimes'))"
}

Write-Host ""
if ($Failures.Count -eq 0) {
    Write-Host "Installation terminée sans erreur." -ForegroundColor Green
} else {
    Write-Host "Installation terminée avec $($Failures.Count) problème(s) :" -ForegroundColor Red
    foreach ($m in $Failures) { Write-Host "  - $m" -ForegroundColor Red }
    Write-Host "Corrige-les puis relance ce script (les étapes déjà faites seront sautées)." -ForegroundColor Yellow
}
Write-Host "Ensuite : ouvre ce dossier dans VS Code avec Claude Code. Python du projet : .venv\Scripts\python.exe"
