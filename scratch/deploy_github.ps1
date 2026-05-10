$token = "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"
$headers = @{ 
    Authorization = "Bearer $token"
    "Accept" = "application/vnd.github.v3+json"
}

$body = @{ 
    name = "Arbolia"
    description = "Sistema de Gestão de Arborização Urbana"
    private = $false 
} | ConvertTo-Json

try {
    Write-Host "Tentando criar o repositório..."
    $response = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers -Body $body
    Write-Host "Repositório criado com sucesso: $($response.html_url)"
} catch {
    if ($_.Exception.Message -match "422") {
        Write-Host "O repositório Arbolia já existe na sua conta."
    } else {
        Write-Error "Erro ao criar repositório: $($_.Exception.Message)"
        exit 1
    }
}

# Configuração do Git
git remote remove origin 2>$null
git remote add origin "https://rafaelcaetite:$token@github.com/rafaelcaetite/Arbolia.git"
git branch -M main
Write-Host "Fazendo push para o GitHub..."
git push -u origin main
