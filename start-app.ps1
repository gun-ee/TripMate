# TripMate 애플리케이션 시작 스크립트
Write-Host "🐳 TripMate 애플리케이션을 시작합니다..." -ForegroundColor Cyan
Write-Host ""

Write-Host "📦 도커 컨테이너를 시작합니다..." -ForegroundColor Yellow
docker-compose up -d

Write-Host ""
Write-Host "⏳ 서비스가 준비될 때까지 대기합니다..." -ForegroundColor Green
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "🌐 브라우저를 엽니다..." -ForegroundColor Blue
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "✅ 완료! localhost:5173에서 애플리케이션을 확인하세요." -ForegroundColor Green
Write-Host ""
Write-Host "📊 서비스 상태 확인: docker-compose ps" -ForegroundColor White
Write-Host "📝 로그 확인: docker-compose logs" -ForegroundColor White
Write-Host "🛑 서비스 중지: docker-compose down" -ForegroundColor White

Read-Host "`n아무 키나 누르면 종료됩니다"
