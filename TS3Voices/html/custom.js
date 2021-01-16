window.onload =  function() {
    const params = new URLSearchParams(location.search);

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
     * OnChange Event Functions *
     ****************************/
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

    /****************************
     * Generate Config Elements *
     ****************************/
    document.getElementById("streamer_name").value = currentValues.streamer_name;
    document.getElementById("silent_selector").selectedIndex = currentValues.hide_silent;
    document.getElementById("streamer_name").addEventListener("change", streamer_name_change, false);
    document.getElementById("silent_selector").addEventListener("change", hide_silent_change, false);

    let containerElement = document.getElementById('config');
    let pickr = {};
    function createColorPickr(varname, paramToCssVarElement) {
        containerElement.insertAdjacentHTML('beforeend',''+
            '<tr>' +
                '<td><label for="' + varname +'">' + paramToCssVarElement.label + '</label></td>' +
                '<td><button id="'+ varname +'"></button></td>' +
            '</tr>');
        let hasOpacity =  paramToCssVarElement.type === 'rgba';
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
        pickr[varname].on('change', function (color, source, instance) {
            let colorVal = hasOpacity ? color.toRGBA().toString(1) : color.toHEXA().toString();
            updateCurrentValues(varname, colorVal);
            instance.applyColor();
        });
    }
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
    function createWeightElement(varname, paramToCssVarElement ) {
        containerElement.insertAdjacentHTML('beforeend', '' +
            '<tr>' +
                '<td><label for="' + varname + '">' + paramToCssVarElement.label + '</label></td>' +
                '<td><select id="' + varname + '">' +
                    '<option value=100>100 = Thin (Hairline)</option>' +
                    '<option value=400>400 = Normal (Regular)</option>' +
                    '<option value=700>700 = Bold</option>' +
                    '<option value=900>900 = Black (Heavy)</option>' +
                '</select></td>' +
            '</tr>');
        setOrAddOptionByValue(document.getElementById(varname), currentValues[varname]);
        document.getElementById(varname).addEventListener("change", function (event) {
            updateCurrentValues(varname, event.target.value);
        }, false);
    }
    function createTextElement(varname, paramToCssVarElement) {
        containerElement.insertAdjacentHTML('beforeend', '' +
            '<tr>' +
                '<td><lable for="' + varname + '">' + paramToCssVarElement.label + '</lable></td>' +
                '<td><input type="text" id="' + varname + '" value="' + currentValues[varname] + '"/></td>' +
            '</tr>');
        document.getElementById(varname).addEventListener("change", function (event) {
                updateCurrentValues(varname, event.target.value);
            }, false);
    }

    for (const [key, value] of Object.entries(paramToCssVar)){
        switch (value.type) {
            case 'color':
            case 'rgba':
                createColorPickr(key, value);
                break;
            case 'weight':
                createWeightElement(key, value);
                break;
            case 'font':
            case 'size':
            case 'txt':
                createTextElement(key, value);
                break;
            default:
                createTextElement(key, value);
                document.getElementById(key).insertAdjacentHTML('afterend',
                    ' <b class="warning">Unknown variable type: '+ value.type +'</b>');
                break;
        }
    }

    update_urls();
}