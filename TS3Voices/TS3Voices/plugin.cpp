/*
 * TS3Voices 
 * Expose current channel users, speakers via a webserver
 * for OBS to use as a browser source.
 */

/*
 * Based on TeamSpeak 3 demo plugin
 *
 * Copyright (c) 2008-2017 TeamSpeak Systems GmbH
 */

 /*
 * Based on lws-minimal-http-server-sse
 *
 * Copyright (C) 2018 Andy Green <andy@warmcat.com>
 *
 * lws-minimal-http-server-sse is made available under the Creative Commons CC0 1.0
 * Universal Public Domain Dedication.
 */


// Demo plugin includes

#ifdef _WIN32
#pragma warning (disable : 4100)  /* Disable Unreferenced parameter warning */
#include <Windows.h>
#endif

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include "teamspeak/public_errors.h"
#include "teamspeak/public_errors_rare.h"
#include "teamspeak/public_definitions.h"
#include "teamspeak/public_rare_definitions.h"
#include "teamspeak/clientlib_publicdefinitions.h"
#include "ts3_functions.h"
#include "plugin.h"

// TS3Voices Includes
#include <libwebsockets.h>
#include <condition_variable>
#include <signal.h>
#include <thread>
#include <string>
#include <vector>

static struct TS3Functions ts3Functions;

#ifdef _WIN32
#define _strcpy(dest, destSize, src) strcpy_s(dest, destSize, src)
#define snprintf sprintf_s
#else
#define _strcpy(dest, destSize, src) { strncpy(dest, src, destSize-1); (dest)[destSize-1] = '\0'; }
#endif

#define PLUGIN_API_VERSION 23

#define PATH_BUFSIZE 512
#define COMMAND_BUFSIZE 128
#define INFODATA_BUFSIZE 128
#define SERVERINFO_BUFSIZE 256
#define CHANNELINFO_BUFSIZE 512
#define RETURNCODE_BUFSIZE 128

// Buffer size where I haven't determined what it needs to be (large enough that it is excessive, not lacking)
#define GENERIC_BUFSIZE 256

#define PORT_MESSAGE "TS3Voices: Use http://localhost:8079 as a browser source in OBS"
#define PORT 8079

static char* pluginID = NULL;
static int count = 0;

//TODO: Tweak until optimal
static const int frequency = 4;

#ifdef _WIN32
/* Helper function to convert wchar_T to Utf-8 encoded strings on Windows */
static int wcharToUtf8(const wchar_t* str, char** result) {
	int outlen = WideCharToMultiByte(CP_UTF8, 0, str, -1, 0, 0, 0, 0);
	*result = (char*)malloc(outlen);
	if (WideCharToMultiByte(CP_UTF8, 0, str, -1, *result, outlen, 0, 0) == 0) {
		*result = NULL;
		return -1;
	}
	return 0;
}
#endif

// TS3 Voices statics
static int interrupted = 0;
static lws_context *context;
// Message 'queue' of one. Testing so far, this looks sufficient.
// Future changes might make it not the case
static char *message = nullptr;
static std::mutex m;
static std::condition_variable cv;
static std::mutex m_cv;

static char html_path[PATH_BUFSIZE];


// Build userlist by querying the teamspeak client
// TODO: Rexamine choices for building strings
// TODO: Rexamine choice to poll users
//		 Implementing other ts functions we could instead
//		 flag when a refresh is needed.
static char* build_userlist() {
	uint64 serverID = ts3Functions.getCurrentServerConnectionHandlerID();
	int result;
	if ((ts3Functions.getConnectionStatus(serverID, &result)) == ERROR_ok) {
		std::string prepend = "{\nevent:userlist\ndata:\"users\":[";
		std::string userlist = prepend;
		std::string append = "]}";
		std::string user_format = "{\"name\":\"%s\", \"clientID\":%d,\"talking\":%d}";
		anyID myID;
		uint64 channelID;
		if (ts3Functions.getClientID(serverID, &myID) != ERROR_ok) {
			return nullptr;
		}
		if (ts3Functions.getChannelOfClient(serverID, myID, &channelID) != ERROR_ok) {
			return nullptr;
		}
		anyID* clientList;
		if (ts3Functions.getChannelClientList(serverID, channelID, &clientList) != ERROR_ok) {
			return nullptr;
		}
		for (int i = 0; clientList[i]; i++) {
			if (i > 0) {
				userlist.append(",");
			}
			char current_user[GENERIC_BUFSIZE];
			char clientName[GENERIC_BUFSIZE];
			int talking;
			//If current user is talking, different call
			if (clientList[i] == myID) {
				// Function is reliable; previous problems were due to incorrect flag
				ts3Functions.getClientSelfVariableAsInt(serverID, CLIENT_FLAG_TALKING, &talking);
			} 
			else {
				ts3Functions.getClientVariableAsInt(serverID, clientList[i], CLIENT_FLAG_TALKING, &talking);
			}
			// Display name length 
			// Can this call error in these circumstances?
			ts3Functions.getClientDisplayName(serverID, clientList[i], clientName, GENERIC_BUFSIZE);
			// ClientName -> replace " and \, simple escape only
			// TODO: better sanitization
			for (char* p = clientName; p = strchr(p, '\"');++p) {
				*p = '\'';
			}
			for (char* p = clientName; p = strchr(p, '\\');++p) {
				*p = '/';
			}
			sprintf_s(current_user, user_format.c_str(), clientName, clientList[i], talking);
			userlist.append(current_user);
		}
		userlist.append(append);
		char* userlist_c = new char[userlist.size() + 2];
		strcpy_s(userlist_c, userlist.size() + 1, userlist.c_str());
		return userlist_c;
	}
	return nullptr;
}

// Write string to web socket
// TODO: Size checks, lws_ptr_diff check
static int write_string(char* to_write, struct lws *wsi) {
	uint8_t buf[LWS_PRE + LWS_RECOMMENDED_MIN_HEADER_SPACE+ sizeof(to_write)],
		*start = &buf[LWS_PRE],
		*p = start, *end = &buf[sizeof(buf) - 1];
	p += lws_snprintf((char *)p, end - p, "data: %s\x0d\x0a\x0d\x0a", to_write);
	//ts3Functions.printMessageToCurrentTab(to_write);
	return lws_write(wsi, (uint8_t *)start, lws_ptr_diff(p, start), LWS_WRITE_HTTP);
}

// Webserver callbacks
static int callback_sse(struct lws *wsi, enum lws_callback_reasons reason, void *user, void *in, size_t len) {
	uint8_t buf[LWS_PRE + LWS_RECOMMENDED_MIN_HEADER_SPACE], *start = &buf[LWS_PRE],
		*p = start, *end = &buf[sizeof(buf) - 1];
	switch (reason) {
	case LWS_CALLBACK_HTTP:

		lwsl_notice("%s: LWS_CALLBACK_HTTP: '%s'\n", __func__,
			(const char *)in);

		/* SSE requires a response with this content-type */

		if (lws_add_http_common_headers(wsi, HTTP_STATUS_OK,
			"text/event-stream",
			LWS_ILLEGAL_HTTP_CONTENT_LEN,
			&p, end))
			return 1;

		if (lws_finalize_write_http_header(wsi, start, &p, end))
			return 1;

		/* Unlike a normal http connection, we don't want any specific
		* timeout.  We want to stay up until the client drops us */


		lws_set_timeout(wsi, NO_PENDING_TIMEOUT, 0);

		/* write the body separately */
		lws_callback_on_writable(wsi);

		return 0;

	case LWS_CALLBACK_HTTP_WRITEABLE:
		// Wait for mutex to be ready and handle message
		if (m.try_lock()) {
			if (message != nullptr) {
				//Message ready immediately
				write_string(message, wsi);
				message = nullptr;
				m.unlock();
			}
			else {
				count++;
				// Occasionally do a clientList update
				if (count > frequency) {
					m.unlock();
					count = 0;
					
					uint64 serverID = ts3Functions.getCurrentServerConnectionHandlerID();
					int result;
					// ^ Check if the above is actually a connection
					if ((ts3Functions.getConnectionStatus(serverID, &result)) == ERROR_ok) {
						if (result != 0) {
							// Connected
							char* userlist;
							userlist = build_userlist();
							if (userlist != nullptr) {
								write_string(userlist, wsi);
							}
						}
					}

				} 
				else
				{
					m.unlock();
					// Wait for a message
					std::unique_lock<std::mutex> lck(m_cv);
					// Wait 100ms at most, to keep some responsiveness for new initial requests

					cv.wait_for(lck, std::chrono::milliseconds(100));
					if (m.try_lock()) {
						if (message != nullptr) {
							// Message recieved after waiting
							write_string(message, wsi);
							message = nullptr;
						}
						else {
							// No message available on wakeup
						}
						m.unlock();
					}
					else {
						// Lock busy on wakeup
					}
				}
			}
		}

		lws_set_timer_usecs(wsi, 0);
		return 0;

	case LWS_CALLBACK_TIMER:
		lws_callback_on_writable(wsi);
		return 0;
	}

	return lws_callback_http_dummy(wsi, reason, user, in, len);
}

// Callback sizeof struct param?
static struct lws_protocols protocols[] = {
	{"http", lws_callback_http_dummy, 0, 0},
	{"sse", callback_sse, 0, 0},
	{ NULL, NULL, 0, 0}
};

static const struct lws_http_mount mount_sse = {
	/* .mount_next */		NULL,		/* linked-list "next" */
	/* .mountpoint */		"/sse",		/* mountpoint URL */
	/* .origin */			NULL,		/* protocol */
	/* .def */			NULL,
	/* .protocol */			"sse",
	/* .cgienv */			NULL,
	/* .extra_mimetypes */		NULL,
	/* .interpret */		NULL,
	/* .cgi_timeout */		0,
	/* .cache_max_age */		0,
	/* .auth_mask */		0,
	/* .cache_reusable */		0,
	/* .cache_revalidate */		0,
	/* .cache_intermediaries */	0,
	/* .origin_protocol */		LWSMPRO_CALLBACK, /* dynamic */
	/* .mountpoint_len */		4,		  /* char count */
	/* .basic_auth_login_file */	NULL,
};


// Basic http request to serve the 'clientside' part
static struct lws_http_mount mount = {
	/* .mount_next */		&mount_sse,	/* linked-list "next" */
	/* .mountpoint */		"/",		/* mountpoint URL */
	/* .origin */			html_path, /* serve from dir */
	/* .def */			"index.html",	/* default filename */
	/* .protocol */			NULL,
	/* .cgienv */			NULL,
	/* .extra_mimetypes */		NULL,
	/* .interpret */		NULL,
	/* .cgi_timeout */		0,
	/* .cache_max_age */		0,
	/* .auth_mask */		0,
	/* .cache_reusable */		0,
	/* .cache_revalidate */		0,
	/* .cache_intermediaries */	0,
	/* .origin_protocol */		LWSMPRO_FILE,	/* files in a dir */
	/* .mountpoint_len */		1,		/* char count */
	/* .basic_auth_login_file */	NULL,
};

void sigint_handler(int sig) {
	interrupted = sig;
}


// Setup and service requests
static int main_loop() {
	struct lws_context_creation_info info;
	struct lws_context *context;
	int n = 0;
	signal(SIGINT, sigint_handler);
	memset(&info, 0, sizeof info);
	info.port = PORT;
	info.protocols = protocols;
	info.mounts = &mount;
	info.options = LWS_SERVER_OPTION_HTTP_HEADERS_SECURITY_BEST_PRACTICES_ENFORCE;
	// TODO: allow not binding for 2 computer streamers
	info.bind_iface;
	info.iface = "loopback";
	context = lws_create_context(&info);

	if (!context) {
		return 1;
	}

	lws_service(context, 1000);
	
	while (n >= 0 && !interrupted)
	{
		n = lws_service(context, 1000);
	}

	lws_context_destroy(context);
	return 0;
}

/*********************************** Required functions ************************************/
/*
 * If any of these required functions is not implemented, TS3 will refuse to load the plugin
 */

/* Unique name identifying this plugin */
const char* ts3plugin_name() {
	return "TS3 Voices";

}

/* Plugin version */
const char* ts3plugin_version() {
    return "0.1";
}

/* Plugin API version. Must be the same as the clients API major version, else the plugin fails to load. */
int ts3plugin_apiVersion() {
	return PLUGIN_API_VERSION;
}

/* Plugin author */
const char* ts3plugin_author() {
	/* If you want to use wchar_t, see ts3plugin_name() on how to use */
    return "bradon";
}

/* Plugin description */
const char* ts3plugin_description() {
	/* If you want to use wchar_t, see ts3plugin_name() on how to use */
    return "Expose channel members/speakers to HTML for OBS\nTS3 Voices is based in part on the work of the libwebsockets project (https://libwebsockets.org)";
}

/* Set TeamSpeak 3 callback functions */
void ts3plugin_setFunctionPointers(const struct TS3Functions funcs) {
    ts3Functions = funcs;
}

/*
 * Custom code called right after loading the plugin. Returns 0 on success, 1 on failure.
 * If the function returns 1 on failure, the plugin will be unloaded again.
 */
int ts3plugin_init() {
    char appPath[PATH_BUFSIZE];
    char resourcesPath[PATH_BUFSIZE];
    char configPath[PATH_BUFSIZE];
	char pluginPath[PATH_BUFSIZE];
	//ts3Functions.printMessageToCurrentTab("Main Init occuring");
    /* Your plugin init code here */
    printf("PLUGIN: init\n");
	// TODO: Init webserver, start main loop
	std::thread web_server_thread(main_loop);
	//TODO: Wait for web server to be ready?
	web_server_thread.detach();
    /* Example on how to query application, resources and configuration paths from client */
    /* Note: Console client returns empty string for app and resources path */
    ts3Functions.getAppPath(appPath, PATH_BUFSIZE);
    ts3Functions.getResourcesPath(resourcesPath, PATH_BUFSIZE);
    ts3Functions.getConfigPath(configPath, PATH_BUFSIZE);
	ts3Functions.getPluginPath(pluginPath, PATH_BUFSIZE, pluginID);
	strcpy_s(html_path, pluginPath);
	strcat_s(html_path, "TS3Voices/html");
	ts3Functions.printMessageToCurrentTab(PORT_MESSAGE);
	printf("PLUGIN: App path: %s\nResources path: %s\nConfig path: %s\nPlugin path: %s\n", appPath, resourcesPath, configPath, pluginPath);

    return 0;  /* 0 = success, 1 = failure, -2 = failure but client will not show a "failed to load" warning */
	/* -2 is a very special case and should only be used if a plugin displays a dialog (e.g. overlay) asking the user to disable
	 * the plugin again, avoiding the show another dialog by the client telling the user the plugin failed to load.
	 * For normal case, if a plugin really failed to load because of an error, the correct return value is 1. */
}

/* Custom code called right before the plugin is unloaded */
void ts3plugin_shutdown() {
    /* Your plugin cleanup code here */
	
	// TODO: Interrupt threads
    printf("PLUGIN: shutdown\n");
	interrupted = 1; // Might need to make sure context is destroyed here.
	/*
	 * Note:
	 * If your plugin implements a settings dialog, it must be closed and deleted here, else the
	 * TeamSpeak client will most likely crash (DLL removed but dialog from DLL code still open).
	 */

	/* Free pluginID if we registered it */
	if(pluginID) {
		free(pluginID);
		pluginID = NULL;
	}
}

/****************************** Optional functions ********************************/
/*
 * Following functions are optional, if not needed you don't need to implement them.
 */

/*
 * If the plugin wants to use error return codes, plugin commands, hotkeys or menu items, it needs to register a command ID. This function will be
 * automatically called after the plugin was initialized. This function is optional. If you don't use these features, this function can be omitted.
 * Note the passed pluginID parameter is no longer valid after calling this function, so you must copy it and store it in the plugin.
 */
void ts3plugin_registerPluginID(const char* id) {
	const size_t sz = strlen(id) + 1;
	pluginID = (char*)malloc(sz * sizeof(char));
	_strcpy(pluginID, sz, id);  /* The id buffer will invalidate after exiting this function */
	printf("PLUGIN: registerPluginID: %s\n", pluginID);
}

/* Required to release the memory for parameter "data" allocated in ts3plugin_infoData and ts3plugin_initMenus */
void ts3plugin_freeMemory(void* data)
{
	free(data);
}


 /* Helper function to create a menu item */
static struct PluginMenuItem* createMenuItem(enum PluginMenuType type, int id, const char* text, const char* icon)
{
	struct PluginMenuItem* menuItem = (struct PluginMenuItem*)malloc(sizeof(struct PluginMenuItem));
	menuItem->type = type;
	menuItem->id = id;
	_strcpy(menuItem->text, PLUGIN_MENU_BUFSZ, text);
	_strcpy(menuItem->icon, PLUGIN_MENU_BUFSZ, icon);
	return menuItem;
}

/* Some makros to make the code to create menu items a bit more readable */
#define BEGIN_CREATE_MENUS(x) const size_t sz = x + 1; size_t n = 0; *menuItems = (struct PluginMenuItem**)malloc(sizeof(struct PluginMenuItem*) * sz);
#define CREATE_MENU_ITEM(a, b, c, d) (*menuItems)[n++] = createMenuItem(a, b, c, d);
#define END_CREATE_MENUS (*menuItems)[n++] = NULL; assert(n == sz);


 /*
  * Menu IDs for this plugin. Pass these IDs when creating a menuitem to the TS3 client. When the menu item is triggered,
  * ts3plugin_onMenuItemEvent will be called passing the menu ID of the triggered menu item.
  * These IDs are freely choosable by the plugin author. It's not really needed to use an enum, it just looks prettier.
  */
enum {
	MENU_ID_SHOW_CONFIG = 1
};

 /*
  * Initialize plugin menus.
  * This function is called after ts3plugin_init and ts3plugin_registerPluginID. A pluginID is required for plugin menus to work.
  * Both ts3plugin_registerPluginID and ts3plugin_freeMemory must be implemented to use menus.
  * If plugin menus are not used by a plugin, do not implement this function or return NULL.
  */
void ts3plugin_initMenus(struct PluginMenuItem*** menuItems, char** menuIcon)
{
	/*
	 * Create the menus
	 * There are three types of menu items:
	 * - PLUGIN_MENU_TYPE_CLIENT:  Client context menu
	 * - PLUGIN_MENU_TYPE_CHANNEL: Channel context menu
	 * - PLUGIN_MENU_TYPE_GLOBAL:  "Plugins" menu in menu bar of main window
	 *
	 * Menu IDs are used to identify the menu item when ts3plugin_onMenuItemEvent is called
	 *
	 * The menu text is required, max length is 128 characters
	 *
	 * The icon is optional, max length is 128 characters. When not using icons, just pass an empty string.
	 * Icons are loaded from a subdirectory in the TeamSpeak client plugins folder. The subdirectory must be named like the
	 * plugin filename, without dll/so/dylib suffix
	 * e.g. for "test_plugin.dll", icon "1.png" is loaded from <TeamSpeak 3 Client install dir>\plugins\test_plugin\1.png
	 */
	BEGIN_CREATE_MENUS(1);  /* IMPORTANT: Number of menu items must be correct! */
	CREATE_MENU_ITEM(PLUGIN_MENU_TYPE_GLOBAL, MENU_ID_SHOW_CONFIG, "Open Configuration", "");
	END_CREATE_MENUS;  /* Includes an assert checking if the number of menu items matched */

		/*
	 * Specify an optional icon for the plugin. This icon is used for the plugins submenu within context and main menus
	 * If unused, set menuIcon to NULL
	 */
	//*menuIcon = (char*)malloc(PLUGIN_MENU_BUFSZ * sizeof(char));
	//_strcpy(*menuIcon, PLUGIN_MENU_BUFSZ, "some.png");


	/*
	 * Menus can be enabled or disabled with: ts3Functions.setPluginMenuEnabled(pluginID, menuID, 0|1);
	 * Test it with plugin command: /test enablemenu <menuID> <0|1>
	 * Menus are enabled by default. Please note that shown menus will not automatically enable or disable when calling this function to
	 * ensure Qt menus are not modified by any thread other the UI thread. The enabled or disable state will change the next time a
	 * menu is displayed.
	 */
	 /* For example, this would disable MENU_ID_GLOBAL_2: */
	 /* ts3Functions.setPluginMenuEnabled(pluginID, MENU_ID_GLOBAL_2, 0); */

	 /* All memory allocated in this function will be automatically released by the TeamSpeak client later by calling ts3plugin_freeMemory */
}

/************************** TeamSpeak callbacks ***************************/
/*
 * Following functions are optional, feel free to remove unused callbacks.
 * See the clientlib documentation for details on each function.
 */

/* Clientlib */


// Update talk status (if message is empty)
void ts3plugin_onTalkStatusChangeEvent(uint64 serverConnectionHandlerID, int status, int isReceivedWhisper, anyID clientID) {
	/* Demonstrate usage of getClientDisplayName */
	char name[100];
	char event_str[5];
	if(ts3Functions.getClientDisplayName(serverConnectionHandlerID, clientID, name, 512) == ERROR_ok) {
		if(status == STATUS_TALKING) {
			strcpy_s(event_str, "talk");
			printf("--> %s starts talking\n", name);
		} else {
			strcpy_s(event_str, "stop");
			printf("--> %s stops talking\n", name);
		}
		if (m.try_lock()) {
			message = new char[512];
			sprintf_s(message,200, "{\nevent: %s\ndata: \"clientID\":%d}", event_str, clientID);
			m.unlock();
			// Is there a race condition with my mutexes?
			std::unique_lock<std::mutex> lck(m_cv);
			cv.notify_all();
		}
		//else {
		//	ts3Functions.printMessageToCurrentTab("Could not unlock");
		//}
	}
}

/*
 * Called when a plugin menu item (see ts3plugin_initMenus) is triggered. Optional function, when not using plugin menus, do not implement this.
 *
 * Parameters:
 * - serverConnectionHandlerID: ID of the current server tab
 * - type: Type of the menu (PLUGIN_MENU_TYPE_CHANNEL, PLUGIN_MENU_TYPE_CLIENT or PLUGIN_MENU_TYPE_GLOBAL)
 * - menuItemID: Id used when creating the menu item
 * - selectedItemID: Channel or Client ID in the case of PLUGIN_MENU_TYPE_CHANNEL and PLUGIN_MENU_TYPE_CLIENT. 0 for PLUGIN_MENU_TYPE_GLOBAL.
 */
void ts3plugin_onMenuItemEvent(uint64 serverConnectionHandlerID, enum PluginMenuType type, int menuItemID, uint64 selectedItemID)
{
	switch (type) {
	case PLUGIN_MENU_TYPE_GLOBAL:
		/* Global menu item was triggered. selectedItemID is unused and set to zero. */
		switch (menuItemID)
		{
		case MENU_ID_SHOW_CONFIG:
			system("start http://localhost:8079/custom.html");
			break;
		default:
			break;
		}
		break;
	default:
		break;
	}
}

/* Clientlib rare */
// None used




