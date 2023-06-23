const possibleThemes = ['default', 'example'];

const themeParamName = 'theme'
const params = new URLSearchParams(location.search);
let theme = possibleThemes[0];
if (params.has(themeParamName) &&
    possibleThemes.includes(params.get(themeParamName))) {
    theme = params.get(themeParamName);
}
let head  = document.getElementsByTagName('head')[0];
let link  = document.createElement('link');
link.rel  = 'stylesheet';
link.type = 'text/css';
link.href = '/themes/'+ theme +'.theme.css';
head.prepend(link);
let script = document.createElement('script');
script.src = '/themes/'+ theme +'.theme.js';
head.prepend(script);

