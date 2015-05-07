title XMVU Builder
taskkill /f /im imvuclient.exe
robocopy %appdata%\imvuclient\ui\chrome\imvucontent.jar  .\build\
.\tools\jar.exe -uf .\build\imvucontent.jar .\XMVU\imvucontent.jar\*
robocopy .\build\imvucontent.jar %appdata%\imvuclient\ui\chrome\
robocopy %cd%\xmvu\imvuclient\resources\Splash_AutoLogIn.bmp %appdata%\imvuclient\resources\
pause
exit