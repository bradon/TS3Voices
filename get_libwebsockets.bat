git clone -q https://github.com/warmcat/libwebsockets.git
REM Specify a specific commit
cd libwebsockets
md build32
REM Add -DCMAKE_SYSTEM_VERSION=8.1 to build for legacy OS, can be removed if not using an old OS
cmake -DCMAKE_BUILD_TYPE=Release -DLWS_WITH_SSL=OFF -DCMAKE_GENERATOR_PLATFORM=win32  -DCMAKE_SYSTEM_VERSION=10.0 -S ./ -B ./build32
cd build32
cmake --build . --config Release

cd ..
md build64
cmake -DCMAKE_BUILD_TYPE=Release -DLWS_WITH_SSL=OFF -DCMAKE_GENERATOR_PLATFORM=x64 -DCMAKE_SYSTEM_VERSION=10.0 -S ./ -B ./build64
cd build64
cmake --build . --config Release

cd ..
cd ..
md TS3Voices\external
xcopy /S  libwebsockets\build32\include TS3Voices\external\include\
md TS3Voices\external\lib
md TS3Voices\external\lib\Release
copy libwebsockets\build32\lib\Release\websockets_static.lib TS3Voices\external\lib\Release\websockets_static.lib

md TS3Voices\external64
xcopy /S  libwebsockets\build64\include TS3Voices\external64\include\
md TS3Voices\external64\lib
md TS3Voices\external64\lib\Release
copy libwebsockets\build64\lib\Release\websockets_static.lib TS3Voices\external64\lib\Release\websockets_static.lib