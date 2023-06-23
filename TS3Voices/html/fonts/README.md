# Using Custom Fonts

## Adding a new Custom Fonts

Create a new folder for the custom font and add:

- The license Text for the Font
- woff / woff2 files for the different font-weights
- A css file containing the @font-face declaration implementing the font

e.g.: Orbitron:

- The license file is OFL.txt in this case which declares Orbitron to be licenses under SIL Open Font License, Version 1.1.
- We added Regular, 500, 600, 700, 800, 900 font-weight woff & woff2 files
- orbitron.css contains @font-face declarations for every wight

## Using the Font in a Theme

First copy the conntents of the Fonts css file below your `:root` element in your Theme css:

```css
/* moonwolf.theme.css */
:root {
    --font-family: 'Orbitron', sans-serif; /* It's a good idea to allow setting a different font*/
    /* ... */
}

/* orbitron-regular - latin */
@font-face {
    font-family: 'Orbitron';
    font-style: normal;
    font-weight: 400;
    src: local(''),
                 url('/fonts/Orbitron/orbitron-v16-latin-regular.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
                 url('/fonts/Orbitron/orbitron-v16-latin-regular.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
}
/* orbitron-500 - latin */
@font-face {
    font-family: 'Orbitron';
    font-style: normal;
    font-weight: 500;
    src: local(''),
                 url('/fonts/Orbitron/orbitron-v16-latin-500.woff2') format('woff2'), /* Chrome 26+, Opera 23+, Firefox 39+ */
                 url('/fonts/Orbitron/orbitron-v16-latin-500.woff') format('woff'); /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
}
/* ... */
```

Now you can use the font in your theme by setting  `font-family: var(--font-family);`

## Giving Attribution

Some Fonts require to give Attribution, like FontAwesome. For this case there should also be a `attribution.js` inside the fonts subfolder.

e.g.: FontAwesome/attribution.js:

```javascript
console.log(`Font Awesome Free 5.15.1 by @fontawesome - https://fontawesome.com
License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
`)
```

When creating a Theme using one such font you should copy the contents of `attribution.js` at the bottom of your `.theme.js` file.

**If this attribution is enough or not depends on the given license and should be checked thouroughly before uploading!**
