const paramToCssVar = {
    'tc'    : {name: '--talking-color',         type: 'color',  label: 'Talking Color:'},
    'sc'    : {name: '--silent-color',          type: 'color',  label: 'Silent Color:'},
    'tfw'   : {name: '--talking-font-weight',   type: 'weight', label: 'Talking Font-Weight:'},
    'sfw'   : {name: '--silent-font-weight',    type: 'weight', label: 'Silent Font-Weight:'},
    'font'  : {name: '--font-family',           type: 'txt',    label: 'Font Family:'},
    'fs'    : {name: '--font-size',             type: 'size',   label: 'Font Size:'},
    'width' : {name: '--container-width',       type: 'size',   label: 'Width:'},
    'margin': {name: '--margin',                type: 'size',   label: 'Margin:'},
    'pad'   : {name: '--padding',               type: 'size',   label: 'Padding:'},
    'br'    : {name: '--border-radius',         type: 'size',   label: 'Border Radius:'},
    'tp'    : {name: '--talking-prefix',        type: 'txt',    label: 'Talking Prefix:'},
    'ts'    : {name: '--talking-suffix',        type: 'txt',    label: 'Talking Suffix:'},
    'sp'    : {name: '--silent-prefix',         type: 'txt',    label: 'Talking Prefix:'},
    'ss'    : {name: '--silent-suffix',         type: 'txt',    label: 'Talking Suffix:'},
    'background' : {name: '--background-color', type: 'rgba',   label: 'Client Label Color:'}
};

const default_streamer_name = '';
const default_hide_silent = 1;