echo Testing API endpoints...
echo.
echo Testing health endpoint...
curl http://localhost:3000/api/health
echo.
echo Testing login endpoint...
curl -X POST http://localhost:3000/api/admin/login -H Content-Type: application/json -d {"username":"admin","password":"admin"}
echo.
echo If you see errors above, make sure the server is running.
start  http://localhost:3000
pause
