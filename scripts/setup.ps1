param([switch]$NoPathUpdate=$false)

Write-Host "Checking Node..."
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js not found. Install Node 20+ first."
  exit 1
}
$major = node -p "process.versions.node.split('.')[0]"
if ([int]$major -lt 20) {
  Write-Error "Node >= 20 required. Found: $(node -v)"
  exit 1
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  if (Get-Command corepack -ErrorAction SilentlyContinue) {
    corepack enable
    corepack prepare pnpm@9 --activate
  } else {
    npm i -g pnpm
  }
}

Write-Host "Installing deps..."
pnpm install

Write-Host "Building codex-cli..."
pnpm -C codex-cli build

Write-Host "Linking globally..."
pnpm link -g ./codex-cli

if (-not $NoPathUpdate) {
  $pnpmBin = pnpm bin -g
  $envPath = [Environment]::GetEnvironmentVariable("PATH", "User")
  if ($envPath -notlike "*$pnpmBin*") {
    [Environment]::SetEnvironmentVariable("PATH", "$pnpmBin;$envPath", "User")
    Write-Host "Added PNPM bin to PATH. Restart your shell."
  }
}

Write-Host "✅ Done. Try: codex-flow --help"
