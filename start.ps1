# Função para verificar se um processo está rodando na porta específica
function Test-PortInUse {
    param($Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
    return $connection.TcpTestSucceeded
}

Write-Host "Iniciando o sistema escola..." -ForegroundColor Green

# Diretório do projeto
$projectDir = $PSScriptRoot

# Iniciar o backend
Write-Host "Iniciando o backend..." -ForegroundColor Yellow
$pythonPath = "C:/Users/valerya_abygail/AppData/Local/Programs/Python/Python311/python.exe"
$backendPath = Join-Path $projectDir "backend"
Start-Process -FilePath $pythonPath -ArgumentList "-m", "uvicorn", "main:app", "--reload" -WorkingDirectory $backendPath -NoNewWindow

# Aguardar o backend iniciar
Write-Host "Aguardando o backend iniciar..." -ForegroundColor Yellow
do {
    Start-Sleep -Seconds 1
} until (Test-PortInUse -Port 8000)

# Iniciar o servidor para o frontend
Write-Host "Iniciando o frontend..." -ForegroundColor Yellow
$frontendPath = Join-Path $projectDir "frontend"
Start-Process -FilePath $pythonPath -ArgumentList "-m", "http.server", "8080" -WorkingDirectory $frontendPath -NoNewWindow

Write-Host "`nSistema iniciado com sucesso!" -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:8080" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "`nPressione Ctrl+C para parar todos os serviços" -ForegroundColor Yellow

# Manter o script rodando
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    # Ao pressionar Ctrl+C, este bloco será executado
    Write-Host "`nParando os serviços..." -ForegroundColor Yellow
    Get-Process | Where-Object { $_.CommandLine -like "*uvicorn*" -or $_.CommandLine -like "*http.server*" } | Stop-Process
    Write-Host "Serviços parados com sucesso!" -ForegroundColor Green
}
