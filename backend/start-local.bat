@echo off
echo === INICIANDO BACKEND LOCAL COM BANCO DO FLY.IO ===
set "DATABASE_URL=postgresql://fly-user:OlIPAZB5MyM3ackZ3o4fbchM@pgbouncer.82ylg01n6pmozx19.flympg.net/fly-db"
set "NODE_ENV=development"
npm run dev
