function setVarFromURL(params, varname, vardefault) {
    if (params.has(varname)) {
        return params.get(varname);
    } else {
        return vardefault;
    }
}

function setCSSFromURL(params, varname) {
    if (params.has(varname)) {
        setCSSByVarname(varname, decodeURIComponent(params.get(varname)));
    }
}

function setCSSByVarname(varname, val) {
    let valTrim = val.trimLeft();
    switch (paramToCssVar[varname].type)
    {
        case 'rgba':
            if(!val.trimLeft().startsWith('rgba')) {
                //Not much we can do here aside from warn
                console.log("ERROR: rgba(,,,) value expected but '"+ valTrim +"' received.")
            }
            break;
        case 'color':
            if(!valTrim.startsWith('#') && !valTrim.startsWith('rgb')) {
                val = '#' + val;
            }
            break;
        case 'txt':
            val = '"' + val + '"';
            break;
        case 'size':
        case 'weight':
        default:
            break;
    }
    document.documentElement.style.setProperty(paramToCssVar[varname].name, val);
}

function setAllFromURL(params) {
    let streamer_name = setVarFromURL(params, "streamer_name", default_streamer_name);
    let hide_silent = setVarFromURL(params, "hide_silent", default_hide_silent);
    Object.keys(paramToCssVar).forEach( function(key) {
        setCSSFromURL(params, key);
    });
    return { streamer_name: streamer_name, hide_silent: hide_silent };
}

/***
 * Returns the CSS value by the given param name
 *
 * In case 'background' parameter is given it will return an object with r,g,b,a & full(full rgba(,,,) notation)
 ***/
function getCSSVariableByParam(varname) {
    let cssMapping = paramToCssVar[varname];
    let ret = getComputedStyle(document.documentElement).getPropertyValue(cssMapping.name).trim();
    if(cssMapping.type === 'txt') {
        ret = ret.replace(/"/g, '');
    }
    return ret;
}