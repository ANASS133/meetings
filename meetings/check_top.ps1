$lines = Get-Content 'src\index.css' -TotalCount 15
$lines | ForEach-Object { Write-Output $_ }
