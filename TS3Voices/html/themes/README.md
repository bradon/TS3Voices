# Working with Themes

## How to select a Theme

If you implemented the Theme correctly, you will be able to select it on <http://localhost:8079/custom.html>

Changing the theme will add a 'theme' parameter to the URL with its name.  
e.g.: <http://localhost:8079/custom.html?theme=example>

## Creating your own Theme

Every theme needs 3 things to work:

1. /themes/<theme_name>.theme.js
2. /themes/<theme_name>.theme.css
3. Adding <theme_name> to the `possibleThemes` array in themes.js

It is best to copy and rename the existing example.theme.* files to get started.

### 1. JavaScript

This file contains a mapping for parameter names to CSS-variable names, their type & label for the configuration page.

```javascript
const paramToCssVar = {
    'tc':     {name: '--talking-color',    type: 'color',  label: 'Talking Color:'},
    'width' : {name: '--container-width',  type: 'size',   label: 'Width:'},
    [...]
};
```

- Key: name of the parameter that will be used in the URL
- `name`: name of the css variable used in <theme_name>.theme.css
- `label`: label that will be displayed on the configuration page
- `type`: type of input expected: 

| Type   | Possible Values           | Description |
| :----: |:-------------------------:| -----------|
| color  | HEX & rgb()               | Color values without Alpha (e.g.: font color) |
| rgba   | rgba()                    | Color values WITH Alpha (e.g.: background color) |
| weight | 100...900                 | Font Weight selector in 100 Steps |
| size   | px/em/...<br/>(txt input) | text input which is meant for a number + size unit <br/> (Might get checks later) |
| txt    | free text                 | free text input which can contain anything from font-family to content text

### 2. CSS

Contains a `:root` element with the in .theme.js specified css variables.

Used elements:

- `#maindiv`: Container which encapsulates all TS-Client elements.
- `p`: One TS-Client containing the name
- `.talking`: Class that will be added to TS-Client when they are talking
- `.hidden`: Will be assigned to all silent clients if `Hide Silent` is enabled
- `.always-visible`: Will be asigned to TS-Client with the same name as `Streamer Name`
- `.silent`: ONLY USED IN CONFIGURATION! This is a helper class and is not used in the normal page.

### 3. Adding <theme_name> to possibleThemes

In the `themes.js` file there is an array specifying all allowed themes.
It is not checked if the corresponding files exists because of technical limitations.

Simply append the array in the first line to activate your new theme.

```javascript
const possibleThemes = ['default', 'example', 'my_new_theme', ...];
```

## Using Custom Fonts in Themes

Because of the security settings of the Webserver, Fonts can not be loaded from external sources and have to be included to load locally.

Make sure you have the rights depending on the Lincese to include them and distribute them with the plugin.

For more information on how to include them go to TS3Voices/html/fotns/README.md
