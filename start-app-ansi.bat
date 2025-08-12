@echo off
chcp 949 > nul
echo TripMate 애플리케이션을 시작합니다...
echo.
echo 도커 컨테이너를 시작합니다...
docker-compose up -d

echo.
echo 서비스가 준비될 때까지 대기합니다...
timeout /t 30 /nobreak > nul

echo.
echo 브라우저를 엽니다...
start http://localhost:5173

echo.
echo 완료! localhost:5173에서 애플리케이션을 확인하세요.
echo.
echo 서비스 상태 확인: docker-compose ps
echo 로그 확인: docker-compose logs
echo 서비스 중지: docker-compose down
pause
