$files = @(
    'fout el tanfeef.html',
    'natural products & soap.html',
    'packages.html',
    'perfumes & bags.html',
    'skin care.html'
)

foreach ($f in $files) {
    $p = Join-Path 'm:\asmaa ecoway' $f
    if (Test-Path $p) {
        $content = [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)
        if ($content -match 'products-loader\.js' -and $content -notmatch 'cart\.js') {
            $content = $content -replace '(<script src="products-loader\.js"></script>)', '$1
    <script src="cart.js"></script>'
            [System.IO.File]::WriteAllText($p, $content, [System.Text.Encoding]::UTF8)
            Write-Host "Updated: $f"
        } else {
            Write-Host "Skipped (already has cart.js): $f"
        }
    } else {
        Write-Host "Not found: $f"
    }
}
