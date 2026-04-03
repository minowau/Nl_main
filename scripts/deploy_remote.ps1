
$SERVER_IP = "172.16.193.4"
$SERVER_PORT = "22" 
$SERVER_USER = "suhan" 
$SERVER_PASS = "Test@123"
$REMOTE_PATH = "/home/suhan/nl_main" 
$ZIP_FILE = "nl_main_deployment.tar.gz"
$PASS = $SERVER_PASS

Write-Host "--- 1. Cleaning up previous bundles ---" -ForegroundColor Cyan
if (Test-Path $ZIP_FILE) { Remove-Item $ZIP_FILE }

Write-Host "--- 2. Building Frontend ---" -ForegroundColor Cyan
npm run build

Write-Host "--- 3. Bundling Source Code with Tar ---" -ForegroundColor Cyan
tar -czf $ZIP_FILE backend dist Dockerfile docker-compose.yml package.json scripts

Write-Host "--- 4. Transferring to Server ($SERVER_IP) ---" -ForegroundColor Cyan
scp -P $SERVER_PORT $ZIP_FILE "$($SERVER_USER)@$($SERVER_IP):$REMOTE_PATH/"

Write-Host "--- 5. Remote Execution: Untar & Restart ---" -ForegroundColor Cyan
$remoteCmd = @"
echo $PASS | sudo -S mkdir -p $REMOTE_PATH
cd $REMOTE_PATH
echo $PASS | sudo -S rm -rf *
echo $PASS | sudo -S tar -xzf $ZIP_FILE
echo $PASS | sudo -S docker-compose down
echo $PASS | sudo -S docker-compose up --build -d
"@

ssh -p $SERVER_PORT "$($SERVER_USER)@$($SERVER_IP)" $remoteCmd

Write-Host "--- Deployment Complete! ---" -ForegroundColor Green
