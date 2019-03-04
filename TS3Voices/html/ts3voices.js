document.addEventListener("DOMContentLoaded", function() {
	es = new EventSource("/sse/sourcename");
	const queryString = location.search;
	const params = new URLSearchParams(location.search);
	
	
	function setVarFromURL(varname, vardefault) {
		if (params.has(varname)) {
			return params.get(varname);
		} else {
			return vardefault;
		};
	};
	var talking_color = setVarFromURL("tc", "#ffffff");
	// Possible way to validate params:
	// Set to a p element, fetch, see if it
	// holds the set value
	var talking_font_weight = setVarFromURL("tfw",900);
	var silent_color = setVarFromURL("sc", "#ffffff");
	var silent_font_weight = setVarFromURL("sfw", 400);
	if (params.has("r") && params.has("g") && params.has("b") && params.has("a")) {
		var p_background = "rgba(" + params.get("r") + "," + params.get("g") + "," + params.get("b") + "," +params.get("a") + ")"; 
	} else {
		var p_background = "rgba(0,0,0,0.5)";
	};
	var font_size = setVarFromURL("fs", "22px");
	var p_padding = setVarFromURL("pad", "5px");
	var p_border_radius = setVarFromURL("br", "5px");
	var p_font = setVarFromURL("font", "Arial,Helvetica Neue,Helvetica,sans-serif");
	var div_width = setVarFromURL("width", "400px");
	var p_margin = setVarFromURL("margin", "5px");
	var talking_prefix = setVarFromURL("tp", ">>");
	var talking_suffix = setVarFromURL("ts", "");
	var silent_prefix = setVarFromURL("sp", "");
	var silent_suffix = setVarFromURL("ss", "");
	var maindiv = document.getElementById("maindiv");
	maindiv.style.width = div_width;
	
	function talking(p_element) {
		if (!(p_element.classList.contains("talking"))) {
			p_element.childNodes[0].nodeValue = talking_prefix;
			p_element.childNodes[2].nodeValue = talking_suffix;
			p_element.classList.add("talking");
			p_element.style.color=talking_color;
			p_element.style.fontWeight=talking_font_weight;
		}
	}
	
	function silent(p_element) {
		if ((p_element.classList.contains("talking"))) {
			p_element.childNodes[0].nodeValue = silent_prefix;
			p_element.childNodes[2].nodeValue = silent_suffix;
			p_element.classList.remove("talking");
			p_element.style.color=silent_color;
			p_element.style.fontWeight=silent_font_weight;
		}
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
					newuser.style.backgroundColor = p_background;
					newuser.style.fontSize = font_size;
					newuser.style.padding = p_padding;
					newuser.style.borderRadius = p_border_radius;
					newuser.style.fontFamily = p_font;
					newuser.style.margin = p_margin;
					var node = document.createTextNode(data.users[i].name);
					var prefixnode = document.createTextNode(silent_prefix);
					var suffixnode = document.createTextNode(silent_suffix);
					newuser.appendChild(prefixnode);
					newuser.appendChild(node);
					newuser.appendChild(suffixnode);
					if (data.users[i].talking == 1) {
						talking(newuser);
					} else { // special own user case does not apply at first update
						silent(newuser);
						newuser.style.color=silent_color;
						newuser.style.fontWeight=silent_font_weight;
					}
					var maindiv = document.getElementById("maindiv");
					maindiv.appendChild(newuser);
				} else {
					document.getElementById(data.users[i].clientID).childNodes[1].nodeValue = data.users[i].name;
					if (data.users[i].talking == 1) {
						talking(existinguser);

					} else {
						// Not talking, change color back
						// 2 is a special case where we ignore the users state
						if (data.users[i].talking != 2) {
							silent(existinguser);
						}
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
			//document.getElementById("r").value += data.users[0].clientID + " userlisted \n";
		}, false);
	
	} catch (exception) {
		alert("<p>Error" + exception);
	}
}, false);
	
	