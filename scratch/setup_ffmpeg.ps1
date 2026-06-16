$url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$zip = "ffmpeg_temp.zip"
$out = "ffmpeg_extracted"

Write-Host "============================================================"
Write-Host "[*] DANG TAI FFMPEG STATIC BUILD (Khoang 90MB)..."
Write-Host "============================================================"

# Download the file
Invoke-WebRequest -Uri $url -OutFile $zip

Write-Host "[*] DANG GIAI NEN..."
# Extract the file
Expand-Archive -Path $zip -DestinationPath $out

Write-Host "[*] DANG COPY FFMPEG.EXE VAO THU MUC GO-BACKEND..."
# Find the exe and copy it
$exe = Get-ChildItem -Path "$out\ffmpeg-*\bin\ffmpeg.exe" | Select-Object -First 1
if ($exe) {
    Copy-Item -Path $exe.FullName -Destination "go-backend\ffmpeg.exe" -Force
    Write-Host "[+] DA CAI DAT FFMPEG.EXE THANH CONG!"
} else {
    Write-Host "[!] LOI: Khong tim thay file ffmpeg.exe trong file zip da giai nen."
}

# Cleanup
Write-Host "[*] DANG DON DEP THU MUC TAM..."
if (Test-Path $zip) { Remove-Item $zip -Force }
if (Test-Path $out) { Remove-Item $out -Recurse -Force }

Write-Host "============================================================"
Write-Host "[+] HOAN THANH!"
Write-Host "============================================================"
