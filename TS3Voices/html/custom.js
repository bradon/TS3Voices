document.addEventListener("DOMContentLoaded", function() {
	const queryString = location.search;
	const params = new URLSearchParams(location.search);
	
	
	// Defaults
	var default_tc = "#ffffff", default_sc = "#ffffff";
	var default_tfw = 900, default_sfw = 400;
	var p_r = 0, p_g = 0, p_b = 0, p_a = 0.5;
	var default_fs = 22, default_width = 400;
	var default_background = "rgba("+p_r+","+p_g+","+p_b+","+p_a+")";
	var default_tp = "", default_sp = "";
	var default_ts = "", default_ss = "";
	var default_margin = "5px", default_br = "5px"; default_padding = "5px";
	var default_font = "Arial,Helvetica Neue,Helvetica,sans-serif";
	
	function setVarFromURL(varname, vardefault) {
		if (params.has(varname)) {
			return params.get(varname);
		} else {
			return vardefault;
		};
	};
	// Possible way to validate params:
	// Set to a p element, fetch, see if it
	// holds the set value
	var talking_color = setVarFromURL("tc", default_tc);
	document.getElementById("tc").value = talking_color;
	var talking_font_weight = setVarFromURL("tfw",default_tfw);
	var tfw_option = document.createElement("option");
	tfw_option.value = talking_font_weight;
	tfw_option.text = talking_font_weight;
	document.getElementById("tfw").add(tfw_option,0);
	document.getElementById("tfw").selectedIndex = 0;
	var silent_color = setVarFromURL("sc", default_sc);
	document.getElementById("sc").value = silent_color;
	var silent_font_weight = setVarFromURL("sfw", default_sfw);
	var sfw_option = document.createElement("option");
	sfw_option.value = silent_font_weight;
	sfw_option.text = silent_font_weight;
	document.getElementById("sfw").add(sfw_option,0);
	document.getElementById("sfw").selectedIndex = 0;
	if (params.has("r") && params.has("g") && params.has("b") && params.has("a")) {
		p_r = params.get("r");
		p_g = params.get("g");
		p_b = params.get("b");
		p_a = params.get("a");
	};
	var p_background = "rgba("+p_r+","+p_g+","+p_b+","+p_a+")";
	document.getElementById("p_r").value = p_r;
	document.getElementById("p_g").value = p_g;
	document.getElementById("p_b").value = p_b;
	document.getElementById("p_a").value = p_a * 10;
	
	var font_size = setVarFromURL("fs", default_fs);
	document.getElementById("fs").value = font_size;
	var p_padding = setVarFromURL("pad", default_padding);
	document.getElementById("pad").value = p_padding;
	var p_border_radius = setVarFromURL("br", default_br);
	document.getElementById("br").value = p_border_radius;
	var p_font = setVarFromURL("font", default_font);
	document.getElementById("font").value = p_font;
	var div_width = setVarFromURL("width", default_width);
	document.getElementById("divwidth").value = div_width;
	var p_margin = setVarFromURL("margin", default_margin);
	document.getElementById("margin").value = p_margin;
	var talking_prefix = setVarFromURL("tp", default_tp);
	document.getElementById("tp").value = talking_prefix;
	var talking_suffix = setVarFromURL("ts", default_ts);
	document.getElementById("ts").value = talking_suffix;
	var silent_prefix = setVarFromURL("sp", default_sp);
	document.getElementById("sp").value = silent_prefix;
	var silent_suffix = setVarFromURL("ss", default_ss);
	document.getElementById("ss").value = silent_suffix;
	var maindiv = document.getElementById("maindiv");
	maindiv.style.width = div_width;
	
	function create_p(p_text, talking) {
		var newp = document.createElement("p");
		newp.style.backgroundColor = p_background;
		newp.style.fontSize = font_size;
		newp.style.padding = p_padding;
		newp.style.borderRadius = p_border_radius;
		newp.style.fontFamily = p_font;
		newp.style.margin = p_margin;
		if (talking) {
			newp.classList.add("talking");
			var prefix = document.createTextNode(talking_prefix);
			var suffix = document.createTextNode(talking_suffix);
			newp.style.color=talking_color;
			newp.style.fontWeight=talking_font_weight;
		} else {
			newp.classList.add("silent");
			var prefix = document.createTextNode(silent_prefix);
			var suffix = document.createTextNode(silent_suffix);
			newp.style.color=silent_color;
			newp.style.fontWeight=silent_font_weight;
		};
		
		var node = document.createTextNode(p_text);
		
		newp.appendChild(prefix);
		newp.appendChild(node);
		newp.appendChild(suffix);
		var maindiv = document.getElementById("maindiv");
		maindiv.appendChild(newp);
	}

	function update_urls() {
		const url_start = "http://localhost:8079/index.html?";
		const custom_start = "http://localhost:8079/custom.html?";
		var url_end = "";
		if (font_size != default_fs) {
			url_end += "fs=" + font_size + "&";
		};
		if (p_font != default_font) {
			url_end += "font=" + encodeURI(p_font) + "&";
		};
		if (talking_color != default_tc) {
			url_end += "tc=" + encodeURIComponent(talking_color) + "&";
		};
		if (silent_color != default_sc) {
			url_end += "sc=" + encodeURIComponent(silent_color) + "&";
		};
		if (talking_font_weight != default_tfw) {
			url_end += "tfw=" + talking_font_weight + "&";
		};
		if (silent_font_weight != default_sfw) {
			url_end += "sfw=" + silent_font_weight + "&";
		};
		if (p_background != default_background) {
			url_end += "r=" +p_r+"&g="+p_g+"&b="+p_b+"&a="+p_a+"&";
		};
		if (talking_prefix != default_tp) {
			url_end += "tp=" + encodeURIComponent(talking_prefix) + "&";
		};
		if (silent_prefix != default_sp) {
			url_end += "sp=" + encodeURIComponent(silent_prefix) + "&";
		};
		if (talking_suffix != default_ts) {
			url_end += "ts=" + encodeURIComponent(talking_suffix) + "&";
		};
		if (silent_suffix != default_ss) {
			url_end += "ss=" + encodeURIComponent(silent_suffix) + "&";
		};
		if (p_margin != default_margin) {
			url_end += "margin=" + p_margin + "&";
		};
		if (p_border_radius != default_br) {
			url_end += "br=" + p_border_radius + "&";
		};
		if (p_padding != default_padding) {
			url_end += "pad=" + p_padding + "&";
		};
		if (div_width != default_width) {
			url_end += "width=" + div_width + "&";
		};
		document.getElementById("obsurl").value= url_start + url_end;
		document.getElementById("customurl").value= custom_start + url_end;
	};
	// Default settings
	function talking_color_change(event) {
		var talking_ps = document.getElementsByClassName("talking");
		talking_color = event.target.value;
		for (i=0; i<talking_ps.length; i++) {
			talking_ps[i].style.color = talking_color;
		};
		update_urls();
	}
	
	function talking_font_weight_change(event) {
		var talking_ps = document.getElementsByClassName("talking");
		talking_font_weight = event.target.value;
		console.log(event.target.value);
		for (i=0; i<talking_ps.length; i++) {
			talking_ps[i].style.fontWeight = talking_font_weight;
		};
		update_urls();
	};
	
	function silent_color_change(event) {
		var talking_ps = document.getElementsByClassName("silent");
		silent_color = event.target.value;
		for (i=0; i<talking_ps.length; i++) {
			talking_ps[i].style.color = silent_color;
		};
		update_urls();
	};
	
	function silent_font_weight_change(event) {
		var silent_ps = document.getElementsByClassName("silent");
		silent_font_weight = event.target.value;
		console.log(event.target.value);
		for (i=0; i<silent_ps.length; i++) {
			silent_ps[i].style.fontWeight = silent_font_weight;
		};
		update_urls();
	};

	function background_color_change(event) {
		p_r = document.getElementById("p_r").value;
		p_g = document.getElementById("p_g").value;
		p_b = document.getElementById("p_b").value;
		p_a = document.getElementById("p_a").value / 10;
		p_background = "rgba(" + p_r + "," + p_g +"," + p_b +"," +  p_a + ")";
		var p_list = document.getElementsByTagName("p");
		for (i=0; i<p_list.length; i++) {
			p_list[i].style.backgroundColor = p_background;
		};
		update_urls();
	}
	
	function content_example_change(event) {
		if (event.target.value != "None") {
			document.getElementById("maindiv").style.backgroundImage="url('"+event.target.value+"')";
		} else {
			document.getElementById("maindiv").style.backgroundImage="";
		}
	}
	
	function font_size_change(event) {
		font_size = event.target.value;
		var p_list = document.getElementsByTagName("p");
		for (i=0; i<p_list.length; i++) {
			p_list[i].style.fontSize = font_size;
		};
		update_urls();
	}
	
	function font_style_change(event) {
		p_font = event.target.value;
		var p_list = document.getElementsByTagName("p");
		for (i=0; i<p_list.length; i++) {
			p_list[i].style.fontFamily = p_font;
		};
		update_urls();
	}
	
	function talking_prefix_change(event) {
		talking_prefix = event.target.value;
		var p_list = document.getElementsByTagName("p");
		for (i=0; i<p_list.length; i++) {
			p_list[i].childNodes[0].nodeValue = talking_prefix;
		};
		update_urls();
	}
	
	function div_width_change(event) {
		div_width = event.target.value;
		document.getElementById("maindiv").style.width = div_width;
		console.log(div_width);
		update_urls();
	}
	
	function border_radius_change(event) {
		p_border_radius = event.target.value;
		if (!(""+p_border_radius).endsWith("px")) {
			p_border_radius = p_border_radius + "px";
		};
		var p_list = document.getElementsByTagName("p");
		for (i=0; i<p_list.length; i++) {
			p_list[i].style.borderRadius = p_border_radius;
		};
		update_urls();
	}
	
	function margin_change(event) {
		p_margin = event.target.value;
		var p_list = document.getElementsByTagName("p");
		for (i=0; i<p_list.length; i++) {
			p_list[i].style.margin = p_margin;
		};
		update_urls();
	}
	
	function talking_suffix_change(event) {
		talking_suffix = event.target.value;
		var p_list = document.getElementsByTagName("p");
		for (i=0; i<p_list.length; i++) {
			p_list[i].childNodes[2].nodeValue = talking_suffix;
		};
		update_urls();
	}
	
	function silent_prefix_change(event) {
		silent_prefix = event.target.value;
		var p_list = document.getElementsByTagName("p");
		for (i=0; i<p_list.length; i++) {
			p_list[i].childNodes[0].nodeValue = silent_prefix;
		};
		update_urls();
	}
	
	function silent_suffix_change(event) {
		silent_suffix = event.target.value;
		var p_list = document.getElementsByTagName("p");
		for (i=0; i<p_list.length; i++) {
			p_list[i].childNodes[2].nodeValue = silent_suffix;
		};
		update_urls();
	}
	
	function padding_change(event) {
		p_padding = event.target.value;
		var p_list = document.getElementsByTagName("p");
		for (i=0; i<p_list.length; i++) {
			p_list[i].style.padding = p_padding;
		};
		update_urls();
	}
	
	create_p("MAX_LENGTH_NAME_WHOS_TALKING12", true);
	create_p("MAX_LENGTH_NAME_WHOS_SILENT123", false);
	create_p("Normal Silent User", false);
	create_p("Normal Talking User", true);
	create_p("EmojiName🙃💩", false);
	
	tc = document.getElementById("tc");
	tc.addEventListener("change", talking_color_change, false);
	sc = document.getElementById("sc");
	sc.addEventListener("change", silent_color_change, false);
	document.getElementById("tfw").addEventListener("change", talking_font_weight_change, false);
	sfw = document.getElementById("sfw");
	sfw.addEventListener("change", silent_font_weight_change, false);
	document.getElementById("p_r").addEventListener("change", background_color_change, false);
	document.getElementById("p_g").addEventListener("change", background_color_change, false);
	document.getElementById("p_b").addEventListener("change", background_color_change, false);
	document.getElementById("p_a").addEventListener("change", background_color_change, false);
	document.getElementById("content_example").addEventListener("change", content_example_change, false);
	document.getElementById("fs").addEventListener("change", font_size_change, false);
	document.getElementById("font").addEventListener("change", font_style_change, false);
	document.getElementById("tp").addEventListener("change", talking_prefix_change, false);
	document.getElementById("divwidth").addEventListener("change", div_width_change, false);
	document.getElementById("br").addEventListener("change", border_radius_change, false);
	document.getElementById("margin").addEventListener("change", margin_change, false);
	document.getElementById("ts").addEventListener("change", talking_suffix_change, false);
	document.getElementById("sp").addEventListener("change", silent_prefix_change, false);
	document.getElementById("ss").addEventListener("change", silent_suffix_change, false);
	document.getElementById("pad").addEventListener("change", padding_change, false);
	update_urls();
}, false);