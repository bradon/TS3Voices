del ts3voices.ts3_plugin
md plugins
md plugins\TS3Voices
xcopy /S TS3Voices\html plugins\TS3Voices\html\
copy TS3Voices\Release\TS3Voices.dll plugins\TS3Voices_win32.dll
copy TS3Voices\x64\Release\TS3Voices.dll plugins\TS3Voices_win64.dll
"C:\Program Files\7-Zip\7z.exe" a ts3voices.zip plugins\ package.ini
ren ts3voices.zip ts3voice.ts3_plugin