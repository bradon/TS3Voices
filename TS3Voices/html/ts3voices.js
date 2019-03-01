document.addEventListener("DOMContentLoaded", function() {
	es = new EventSource("/sse/sourcename");
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
				if (!existinguser.classList.contains("talking")) {
					existinguser.classList.add("talking");
				}
			}
		}, false);
		
		es.addEventListener(('stop'), function(e) {
			var data = JSON.parse(e.data);
			var existinguser = document.getElementById(data.clientID);
			if (existinguser) {
				if (existinguser.classList.contains("talking")) {
					existinguser.classList.remove("talking");
				}
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
					if (data.users[i].talking == 1) {
						newuser.classList.add("talking"); 
					}
					var maindiv = document.getElementById("maindiv");
					maindiv.appendChild(newuser);
				} else {
					document.getElementById(data.users[i].clientID).childNodes[0].nodeValue = data.users[i].name;
					if (data.users[i].talking == 1) {
						// Talking, ensure has class
						if (!existinguser.classList.contains("talking")) {
							existinguser.classList.add("talking");
						}
					} else {
						// Not talking, ensure class removed
						// 2 is a special case where we ignore the users state
						if (data.users[i].talking != 2) {
							if (existinguser.classList.contains("talking")) {
								existinguser.classList.remove("talking");
							}
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
	
	