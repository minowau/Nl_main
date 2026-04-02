# Hugging Face Deployment Script for NL Main

$HF_TOKEN = $env:HF_TOKEN # Set this in your local environment
if (-not $HF_TOKEN) { $HF_TOKEN = "YOUR_HF_TOKEN_HERE" }
$HF_USERNAME = "minowau" # Guessed from GitHub remote
$SPACE_NAME = "Nlsimulation"

Write-Host "--- 1. Building Frontend ---" -ForegroundColor Cyan
npm run build

Write-Host "--- 2. Setting up Hugging Face Remote ---" -ForegroundColor Cyan
$HF_REMOTE_URL = "https://user:$($HF_TOKEN)@huggingface.co/spaces/$($HF_USERNAME)/$($SPACE_NAME)"

# Check if HF remote already exists
$existingRemote = git remote | Select-String "^hf$"
if ($existingRemote) {
    git remote set-url hf $HF_REMOTE_URL
} else {
    git remote add hf $HF_REMOTE_URL
}

Write-Host "--- 3. Pushing to Hugging Face ---" -ForegroundColor Cyan
# Ensure we are on a branch
$currentBranch = git rev-parse --abbrev-ref HEAD
git push hf "$($currentBranch):main" --force

Write-Host "--- Deployment Request Sent! ---" -ForegroundColor Green
Write-Host "Check your Space at: https://huggingface.co/spaces/$($HF_USERNAME)/$($SPACE_NAME)" -ForegroundColor Yellow
