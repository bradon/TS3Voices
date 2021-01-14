document.addEventListener("DOMContentLoaded", function() {
	es = new EventSource("/sse/sourcename");
	const params = new URLSearchParams(location.search);

	function setVarFromURL(varname, vardefault) {
		if (params.has(varname)) {
			return params.get(varname);
		} else {
			return vardefault;
		}
	}

	var streamer_name = setVarFromURL("name", '');
	var hide_silent = setVarFromURL("hide_silent", 1);

	// Map Parameters to css vars
	const paramToCssVar = {
		'tc'	: {name: '--talking-color',			type: 'color'},
		'sc'	: {name: '--silent-color',			type: 'color'},
		'tfw'	: {name: '--talking-font-weight',	type: 'int'},
		'sfw'	: {name: '--silent-font-weight',	type: 'int'},
		'font'	: {name: '--font-family',			type: 'font'},
		'fs'	: {name: '--font-size',				type: 'int'},
		'width'	: {name: '--container-width',		type: 'int'},
		'margin': {name: '--margin',				type: 'int'},
		'pad'	: {name: '--padding',				type: 'int'},
		'br'	: {name: '--border-radius',			type: 'int'},
		'tp'	: {name: '--talking-prefix',		type: 'txt'},
		'ts'	: {name: '--talking-suffix',		type: 'txt'},
		'sp'	: {name: '--silent-prefix',			type: 'txt'},
		'ss'	: {name: '--silent-suffix',			type: 'txt'},
		// Special case since currently background parameter is split into r, g, b & a
		'background' : {name: '--background-color', type: 'color'}
	};

	function setCSSFromURL(varname) {
		if (params.has(varname)) {
			let val = params.get(varname);
			switch (paramToCssVar[varname].type)
			{
				case 'color':
					if(!val.startsWith('#') && !val.startsWith('rgb')) {
						val = '#' + val;
					}
					break;
				case 'txt':
					val = '"' + val + '"';
					break;
				case 'int':
				case 'font':
				default:
					break;
			}
			document.documentElement.style.setProperty(paramToCssVar[varname].name, val);
		}
	}

	setCSSFromURL('tc');
	setCSSFromURL('sc');
	setCSSFromURL('tfw');
	setCSSFromURL('sfw');
	setCSSFromURL('font');
	setCSSFromURL('fs');
	setCSSFromURL('width');
	setCSSFromURL('margin');
	setCSSFromURL('pad');
	setCSSFromURL('br');
	setCSSFromURL('tp');
	setCSSFromURL('ts');
	setCSSFromURL('sp');
	setCSSFromURL('ss');
	if (params.has('r') && params.has('g') && params.has('b') && params.has('a')) {
		let bg = 'rgba(' + params.get('r') + ',' + params.get('g') + ',' + params.get('b') + ',' + params.get('a') + ')';
		document.documentElement.style.setProperty(paramToCssVar['background'].name, bg);
	}

	function talking(p_element) {
		if (hide_silent === 1) {
			p_element.classList.remove('hidden');
		}
		if (!(p_element.classList.contains("talking"))) {
			p_element.classList.add("talking");
		}
	}
	
	function silent(p_element) {
		if (hide_silent === 1) {
			if(!p_element.classList.contains('hidden')) {
				p_element.classList.add('hidden');
			}
		}
		p_element.classList.remove('talking')
	}
	
	try {
		es.onopen = function() {
			console.log("opened");
		};
		
		es.onmessage = function got_packet(msg) {
			console.log("Non standard message");
		};
		
		es.addEventListener(('talk'), function(e) {
			var data = JSON.parse(e.data);
			var existinguser = document.getElementById(data.clientID);
			if (existinguser) {
				talking(existinguser);
			}
		}, false);
		
		es.addEventListener(('stop'), function(e) {
			var data = JSON.parse(e.data);
			var existinguser = document.getElementById(data.clientID);
			if (existinguser) {
				silent(existinguser);
			}
		}, false);
		
		es.addEventListener(('userlist'), function(e) {
			var dict = {};
			//Populate with ids
			const list = document.getElementsByTagName("p");
			for (i in list) {
				if (list[i].id) {
					//console.log(i);
					dict[String(list[i].id)]=false;
				}
			}
			var data = JSON.parse(e.data);
			for (i in data.users) {
				dict[String(data.users[i].clientID)] = true;
				var existinguser = document.getElementById(data.users[i].clientID);
				if (!existinguser) {
					var newuser = document.createElement("p");
					newuser.id = data.users[i].clientID;
					var node = document.createTextNode(data.users[i].name);
					newuser.appendChild(node);
					if(data.users[i].name === streamer_name) {
						newuser.classList.add('always-visible');
					}
					if (data.users[i].talking == 1) {
						talking(newuser);
					} else { // special own user case does not apply at first update
						silent(newuser);
					}
					var maindiv = document.getElementById("maindiv");
					maindiv.appendChild(newuser);
				} else {
					document.getElementById(data.users[i].clientID).childNodes[0].nodeValue = data.users[i].name;
					if (data.users[i].talking == 1) {
						talking(existinguser);
					} else {
						silent(existinguser);
					}
				}
			}
			// Remove expired
			for (var key in dict) {
				if (!dict[key]) {
					var element = document.getElementById(key);
					element.parentNode.removeChild(element);
				}
			}
		}, false);
	
	} catch (exception) {
		alert("<p>Error" + exception);
	}
}, false);
	
	