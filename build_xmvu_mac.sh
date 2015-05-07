#!/bin/bash
cp /Applications/IMVU.app/Contents/MacOS/imvuContent.jar  ./build/
jar -uf ./build/imvuContent.jar ./XMVU/imvuContent.jar/*
cp ./build/imvuContent.jar /Applications/IMVU.app/Contents/MacOS/
cp $(pwd)/xmvu/IMVUClient/resources/Splash_AutoLogIn.bmp /Applications/IMVU.app/Contents/MacOS
sleep 5
exit