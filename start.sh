#!/bin/bash
cd ~/farcaster-dapp
pkill -9 node 2>/dev/null
sleep 1
node server.js &
sleep 2
npx serve . -p 8080 &
echo ""
echo "✅ Backend:  http://localhost:3000"
echo "✅ Frontend: http://localhost:8080"
echo ""
