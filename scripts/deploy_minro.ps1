# deploy_minro.ps1
# PowerShell script to bundle and deploy the application to MINRO server

$SERVER_IP = "113.30.156.94"
$SERVER_PORT = "33010"
$SERVER_USER = "ubuntu"
$REMOTE_PATH = "/home/ubuntu/nl_main"
$ZIP_FILE = "nl_main_deployment.zip"

Write-Host "--- 1. Cleaning up previous bundles ---" -ForegroundColor Cyan
if (Test-Path $ZIP_FILE) { Remove-Item $ZIP_FILE }

Write-Host "--- 2. Building Frontend ---" -ForegroundColor Cyan
npm run build

Write-Host "--- 3. Bundling Source Code (Excluding large/sensitive files) ---" -ForegroundColor Cyan
# Create a temporary list for inclusion
$include = @(
    "backend/*",
    "dist/*",
    "Dockerfile",
    "docker-compose.yml",
    "package.json",
    "render.yaml",
    "scripts/*"
)

# Use Compress-Archive to create the bundle
Compress-Archive -Path $include -DestinationPath $ZIP_FILE -Force

Write-Host "--- 4. Transferring to Server ($SERVER_IP) ---" -ForegroundColor Cyan
scp -P $SERVER_PORT $ZIP_FILE "$($SERVER_USER)@$($SERVER_IP):$REMOTE_PATH/"

Write-Host "--- 5. Remote Execution: Unzip & Restart ---" -ForegroundColor Cyan
$remoteCmd = @"
cd $REMOTE_PATH
unzip -o $ZIP_FILE
docker-compose down
docker-compose up --build -d
"@

ssh -p $SERVER_PORT "$($SERVER_USER)@$($SERVER_IP)" $remoteCmd

Write-Host "--- Deployment Complete! ---" -ForegroundColor Green
Write-Host "App should be running on: http://113.30.156.101:5000" -ForegroundColor Yellow
