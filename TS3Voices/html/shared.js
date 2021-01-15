/*
 * TODO: I was thinking we could make it easy to add new themes,
 *    by letting this map be split of and generate the custom.html settings depending on it.
 * In custom.js we generate the settings file depending on the param name & type given in this map.
 * We create a select depending on all the the <Name>.theme.js files in the folder and their associated <Name>.theme.css
 * When starting index we inject the theme depending on a URL param with the theme name.
 * Also maybe add "label" to create custom.html settings page
 */
// Map Parameters to css vars
const paramToCssVar = {
    'tc'	: {name: '--talking-color',			type: 'color'},
    'sc'	: {name: '--silent-color',			type: 'color'},
    'tfw'	: {name: '--talking-font-weight',	type: 'weight'},
    'sfw'	: {name: '--silent-font-weight',	type: 'weight'},
    'font'	: {name: '--font-family',			type: 'font'},
    'fs'	: {name: '--font-size',				type: 'size'},
    'width'	: {name: '--container-width',		type: 'size'},
    'margin': {name: '--margin',				type: 'size'},
    'pad'	: {name: '--padding',				type: 'size'},
    'br'	: {name: '--border-radius',			type: 'size'},
    'tp'	: {name: '--talking-prefix',		type: 'txt'},
    'ts'	: {name: '--talking-suffix',		type: 'txt'},
    'sp'	: {name: '--silent-prefix',			type: 'txt'},
    'ss'	: {name: '--silent-suffix',			type: 'txt'},
    // Special case since currently background parameter is split into r, g, b & a
    'background' : {name: '--background-color', type: 'rgba'}
};

const default_streamer_name = '';
const default_hide_silent = 1;

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

function getRGBAString(r,g,b,a) {
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
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
        case 'font':
        default:
            break;
    }
    document.documentElement.style.setProperty(paramToCssVar[varname].name, val);
}

function setAllFromURL(params) {
    let streamer_name = setVarFromURL(params, "streamer_name", default_streamer_name);
    let hide_silent = setVarFromURL(params, "hide_silent", default_hide_silent);
    Object.keys(paramToCssVar).forEach( function(key) {
        if(paramToCssVar[key].type !== 'rgba') {
            setCSSFromURL(params, key);
        }
    });
    if (params.has('r') && params.has('g') && params.has('b') && params.has('a')) {
        let bg = getRGBAString(params.get('r'),params.get('g'),params.get('b'),params.get('a'));
        document.documentElement.style.setProperty(paramToCssVar['background'].name, bg);
    }

    return { streamer_name: streamer_name, hide_silent: hide_silent};
}
function getRGBAColor(varname) {
    let ret = {r: 0, g: 0, b: 0, a: 0.5}
    let cssVal = getComputedStyle(document.documentElement).getPropertyValue(paramToCssVar[varname].name).trim();
    ret.full = cssVal;
    cssVal = cssVal.replace(/rgba\(|\)| /g, '');
    let split = cssVal.split(',');
    ret.r  = split[0];
    ret.g  = split[1];
    ret.b  = split[2];
    ret.a  = split[3];
    return ret;
}

/***
 * Returns the CSS value by the given param name
 *
 * In case 'background' parameter is given it will return an object with r,g,b,a & full(full rgba(,,,) notation)
 ***/
function getCSSVariableByParam(varname) {
    let cssMapping = paramToCssVar[varname];
    if(cssMapping.type === 'rgba') {
        return getRGBAColor(varname);
    }
    let ret = getComputedStyle(document.documentElement).getPropertyValue(cssMapping.name).trim();
    if(cssMapping.type === 'txt') {
        ret = ret.replace(/"/g, '');
    }
    return ret;
}