$url = "https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v6.1/ffmpeg-6.1-win-64.zip"
$zip = "ffmpeg_temp.zip"
$out = "ffmpeg_extracted"

Write-Host "============================================================"
Write-Host "[*] DANG TAI FFMPEG STATIC BUILD SIEU NHE (25MB)..."
Write-Host "============================================================"

# Download the file using basic parsing for speed
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing

Write-Host "[*] DANG GIAI NEN..."
# Extract the file
Expand-Archive -Path $zip -DestinationPath $out

Write-Host "[*] DANG COPY FFMPEG.EXE VAO THU MUC GO-BACKEND..."
# Find the exe and copy it
if (Test-Path "$out\ffmpeg.exe") {
    Copy-Item -Path "$out\ffmpeg.exe" -Destination "go-backend\ffmpeg.exe" -Force
    Write-Host "[+] DA CAI DAT FFMPEG.EXE THANH CONG!"
} else {
    Write-Host "[!] LOI: Khong tim thay file ffmpeg.exe trong file zip."
}

# Cleanup
Write-Host "[*] DANG DON DEP THU MUC TAM..."
if (Test-Path $zip) { Remove-Item $zip -Force }
if (Test-Path $out) { Remove-Item $out -Recurse -Force }

Write-Host "============================================================"
Write-Host "[+] HOAN THANH!"
Write-Host "============================================================"
