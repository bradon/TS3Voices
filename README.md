# TS3Voices
For making an OBS overlay showing teamspeak channel members and speakers.

A list of people in the channel is shown, with current speakers in bold.

This is currently a fairly basic project, and might have some bugs.
It is far enough along that it is usable, and ready for requests/feedback.

This plugin currently does not search for or censor bad names.
User names are sanitized to prevent problems/exploits, but more testing/dev is needed.

![Example Overlay over ArmA](examplearma.png)
# Usage
[Download the 32 or 64bit plugin](https://github.com/bradon/TS3Voices/releases), depending on your setup, and double click to install.
If you are unsure, try both. Teamspeak will only let you install the correct one.

Enable the plugin.
Add http://localhost:8079 or http://127.0.0.1:8079 as a browser source in OBS.

Enjoy your stream!

This plugin currently requires obs and teamspeak to be on the same machine.
If you feel comfortable compiling yourself, just remove the binding to loopback to change this.
Otherwise, request I change this if you need it (or wait, it is on the to-do list!)

# Changing Styles
Feel free to make requests.
If you know some css or feel adventurous you can edit styles.css in the
teamspeak plugins folder/TS3Voices/html to change styles yourself

# Compiling Yourself
This is my first C++ project, feedback on any issues/advice is much appreciated.
A proper build system to will come later, for now clone libwebsockets and build.

The following snippets might help:
git clone -q https://github.com/warmcat/libwebsockets.git
cd libwebsockets
md build32
cmake -DCMAKE_BUILD_TYPE=Release -DLWS_WITH_SSL=OFF  -S ./ -B ./build32
md build64
cmake -DCMAKE_BUILD_TYPE=Release -DLWS_WITH_SSL=OFF -DCMAKE_GENERATOR_PLATFORM=x64 -S ./ -B ./build64

Place lib, headers and bin for libwebsockets in external and external64, inside root/TS3Voices
external(64)
|
bin-Release-websockets.dll

external(64)
|
include- various headers

external(64)
|
lib-Release-websockets.lib

Refer to a one of the released plugin files for the structure of the final plugin.
Ts3_plugin files are just zip files. Rename it to .zip, or use software like 7-zip to open it

# Credits
This plugin is based in part on the work of the libwebsockets project (https://libwebsockets.org)
as well as the teamspeak plugins sdk.
