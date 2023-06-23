window.onload =  function() {
	es = new EventSource("/sse/sourcename");
	const params = new URLSearchParams(location.search);

	let varsFromURL = setAllFromURL(params);
	let streamer_name = varsFromURL.streamer_name;
	let hide_silent = varsFromURL.hide_silent;

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
};
