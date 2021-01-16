window.onload =  function() {
	const params = new URLSearchParams(location.search);
	console.log(params);
	/*****************
	 * Load Defaults *
	 *****************/
	function getCSSValues() {
		let ret = {};
		Object.keys(paramToCssVar).forEach( function(key) {
			ret[key] = getCSSVariableByParam(key);
		});
		return ret;
	}

	let defaultValues = getCSSValues();
	defaultValues.streamer_name = default_streamer_name;
	defaultValues.hide_silent = default_hide_silent;
	console.log("default values:");
	console.log(defaultValues);

	/***********************
	 * Load Current Values *
	 ***********************/
	let varsFromURL = setAllFromURL(params);
	let currentValues = getCSSValues();
	currentValues.streamer_name = varsFromURL.streamer_name;
	currentValues.hide_silent = varsFromURL.hide_silent;

	/************************
	 * Create Example Users *
	 ************************/
	function create_p(p_text, talking, streamer=false) {
		let newp = document.createElement("p");
		if (talking) {
			newp.classList.add("talking");
		} else {
			if (currentValues.hide_silent === 1) {
				newp.classList.add("hidden");
			}
			newp.classList.add('silent');
		}
		if(streamer) {
			newp.classList.add('always-visible');
		}
		newp.appendChild(document.createTextNode(p_text));
		document.getElementById("maindiv").appendChild(newp);
	}

	create_p("Streamer Name NotTalking", false, true);
	create_p("MAX_LENGTH_NAME_WHOS_TALKING12", true);
	create_p("MAX_LENGTH_NAME_WHOS_SILENT123", false);
	create_p("Normal Silent User", false);
	create_p("Normal Talking User", true);
	create_p("EmojiName🙃💩", true);

	/****************************
	 * Generate Config Elements *
	 ****************************/
	var pickr = {};
	function createColorPickr(varname) {
		let hasOpacity =  paramToCssVar[varname].type === 'rgba';
		pickr[varname] = Pickr.create({
				el: '#'+varname,
				theme: 'monolith', //'classic' or 'monolith', or 'nano'
				silent: false,
			  	default: currentValues[varname],
				defaultRepresentation: (hasOpacity ? 'RGBA' : 'HEX'),
				components: {
					// Main components
					preview: true,
					opacity: hasOpacity,
					hue: true,
					// Input / output Options
					interaction: {
						rgba: hasOpacity,
						hex: true,
						hsla: false,
						hsva: false,
						cmyk: false,
						input: true,
						clear: false,
						save: false
					}
				}
			});
	}
	createColorPickr('background');

	/**********************************
	 * Set Elements to current Values *
	 **********************************/
	function setOrAddOptionByValue(element, value) {
		let exists = false;
		for (let i = 0; i < element.options.length; ++i) {
			if (element.options[i].value === value) {
				element.options[i].selected = true;
				exists = true;
			}
		}
		if(!exists) {
			let option = document.createElement("option");
			option.value = value;
			option.text = value;
			element.add(option,0);
			element.selectedIndex = 0;
		}
	}
	document.getElementById("streamer_name").value = currentValues.streamer_name;
	document.getElementById("silent_selector").selectedIndex = currentValues.hide_silent;
	document.getElementById("tc").value = currentValues.tc;
	document.getElementById("sc").value = currentValues.sc;

	setOrAddOptionByValue(document.getElementById("tfw"), currentValues.tfw);
	setOrAddOptionByValue(document.getElementById("sfw"), currentValues.sfw);

	document.getElementById("font").value = currentValues.font;
	document.getElementById("fs").value = currentValues.fs;
	/* TODO: I think we should use an input text like margin,pad,br,font_size */
	document.getElementById("divwidth").value =
		currentValues.width.replace(/px|em|cm|mm|in|pt|pc/g, '');
	document.getElementById("margin").value = currentValues.margin;
	document.getElementById("pad").value = currentValues.pad;
	document.getElementById("br").value = currentValues.br;
	document.getElementById("tp").value = currentValues.tp;
	document.getElementById("ts").value = currentValues.ts;
	document.getElementById("sp").value = currentValues.sp;
	document.getElementById("ss").value = currentValues.ss;

	/*******************
	 * OnChange Events *
	 *******************/
	function compareAndReturnQuery(varname) {
		let ret = '';
		if(defaultValues[varname] !== currentValues[varname]) {
			ret += varname + '=' + encodeURIComponent(currentValues[varname]) + '&';
		}
		return ret;
	}
	function update_urls() {
		const url_start = "http://localhost:8079/index.html?";
		const custom_start = "http://localhost:8079/custom.html?";
		let url_end = "";
		url_end += compareAndReturnQuery('hide_silent');
		url_end += compareAndReturnQuery('streamer_name');
		Object.keys(paramToCssVar).forEach( function(key) {
			url_end += compareAndReturnQuery(key);
		});
		url_end = url_end.replace(/&$/, "");
		document.getElementById("obsurl").value= url_start + url_end;
		document.getElementById("customurl").value= custom_start + url_end;
	}
	function updateCurrentValues(varname, value) {
		currentValues[varname] = value;
		if(varname !== 'hide_silent' && varname !== 'streamer_name') {
			setCSSByVarname(varname, value);
		}
		update_urls();
	}
	function resetCurrentValues(varname) {
		if (params.has(varname)) {
			setCSSByVarname(varname, decodeURIComponent(params.get(varname)));
			currentValues[varname] = getCSSVariableByParam(varname);
		} else {
			setCSSByVarname(varname, defaultValues[varname]);
			currentValues[varname] = defaultValues[varname];
		}
	}

	function streamer_name_change(event) {
		updateCurrentValues('streamer_name', event.target.value);
	}
	function hide_silent_change(event) {
		let hide_silent = document.getElementById("silent_selector").selectedIndex;
		let p_list = document.getElementsByClassName("silent");
		for (let i=0; i<p_list.length; i++) {
			if (hide_silent===1) {
				p_list[i].classList.add('hidden');
			} else {
				p_list[i].classList.remove('hidden');
			}
		}
		updateCurrentValues('hide_silent', hide_silent);
	}
	function talking_color_change(event) {
		updateCurrentValues('tc', event.target.value);
	}
	function silent_color_change(event) {
		updateCurrentValues('sc', event.target.value);
	}
	function talking_font_weight_change(event) {
		updateCurrentValues('tfw', event.target.value);
	}
	function silent_font_weight_change(event) {
		updateCurrentValues('sfw', event.target.value);
	}
	function font_style_change(event) {
		updateCurrentValues('font', event.target.value);
	}
	function font_size_change(event) {
		updateCurrentValues('fs', event.target.value);
	}
	function div_width_change(event) {
		updateCurrentValues('width', event.target.value);
	}
	function margin_change(event) {
		updateCurrentValues('margin', event.target.value);
	}
	function padding_change(event) {
		updateCurrentValues('pad', event.target.value);
	}
	function border_radius_change(event) {
		updateCurrentValues('br', event.target.value);
	}
	function talking_prefix_change(event) {
		updateCurrentValues('tp', event.target.value);
	}
	function talking_suffix_change(event) {
		updateCurrentValues('ts', event.target.value);
	}
	function silent_prefix_change(event) {
		updateCurrentValues('sp', event.target.value);
	}
	function silent_suffix_change(event) {
		updateCurrentValues('ss', event.target.value);
	}

	pickr['background'].on('change', function (color, source, instance) {
		updateCurrentValues('background', color.toRGBA().toString(1));
		instance.applyColor();
	});
	//function content_example_change(event) {
	//	if (event.target.value != "None") {
	//		document.getElementById("maindiv").style.backgroundImage="url('"+event.target.value+"')";
	//	} else {
	//		document.getElementById("maindiv").style.backgroundImage="";
	//	}
	//}
	// Example removed

	/**************************
	 * Attach OnChange Events *
	 **************************/
	document.getElementById("streamer_name").addEventListener("change", streamer_name_change, false);
	document.getElementById("silent_selector").addEventListener("change", hide_silent_change, false);
	document.getElementById("tc").addEventListener("change", talking_color_change, false);
	document.getElementById("sc").addEventListener("change", silent_color_change, false);
	document.getElementById("tfw").addEventListener("change", talking_font_weight_change, false);
	document.getElementById("sfw").addEventListener("change", silent_font_weight_change, false);
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
	//document.getElementById('background').addEventListener('colorChange', background_color_change,false);
	// disable as example removed document.getElementById("content_example").addEventListener("change", content_example_change, false);
	update_urls();
}