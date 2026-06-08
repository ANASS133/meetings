$text = [System.IO.File]::ReadAllText((Resolve-Path 'src\index.css'), [System.Text.Encoding]::UTF8)
$lines = $text -split "\r?\n"
$startIdx = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i].Trim() -eq 'RESET & BASE') {
        $startIdx = $i - 2
        break
    }
}
if ($startIdx -lt 0) { 
    Write-Output "ERROR: Could not find RESET & BASE"
    exit 1
}
$cleanLines = $lines[$startIdx..($lines.Count - 1)]
$cleanText = ($cleanLines -join [Environment]::NewLine)
[System.IO.File]::WriteAllText((Resolve-Path 'src\index.css'), $cleanText, [System.Text.UTF8Encoding]::new($false))
Write-Output "Cleaned up. Removed $startIdx garbage lines."