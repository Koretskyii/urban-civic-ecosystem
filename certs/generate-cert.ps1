# Generates a self-signed certificate for local HTTPS development
# Run from server/ directory: .\certs\generate-cert.ps1

$certsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$openssl = "C:\Program Files\Git\usr\bin\openssl.exe"

if (-not (Test-Path $openssl)) {
    Write-Error "openssl not found at $openssl. Install Git for Windows."
    exit 1
}

& $openssl req -x509 -newkey rsa:2048 -nodes `
    -keyout "$certsDir\key.pem" `
    -out "$certsDir\cert.pem" `
    -days 365 `
    -subj "/CN=localhost"

Write-Host "Certificate generated in $certsDir"
