# BuildSystems Website
Website developed using the Astro framework.

## Notes

### Images
Most images are using the Astro `<Picture />` tag.<br />
This way Astro generates both avif and webp images. Avif as a primary light-weight option and webp as a fallback option in case a browser do not accept avif format.<br />
The background image, the multi-story timber building, uses the `<Image />` tag. It has many configurations to be as optimized both for Desktop and Mobile. The result is a bonch of srcset, but in this case it uses only webp (the standard astro output format).

### Animations
There are three kinds of animations in the website: lottie, CSS-only and webp animations.<br />
#### Lottie
Initially we were using mostly lottie animations, but it was having a huge impact on the website's performance. Even after optimizing and minifying the lottie.json files it was still getting bad ratings on Google Lighthouse both because of the file size, and the size of the DOM. Because of that some animations were redone on CSS-only.
#### CSS-only
The cover animation and the "Ökologische, Ökonomische, Konformität" animation were redone using CSS.<br />
Notes for future animations:<br />
- There is no good way to have text on SVGs in a way that they can be animated later. The SVG native `<text></text>` tag doesn't have a text block functionality. It is not possible to align or justify for example. So each text line has to be positioned using the x and y (while having a proper viewBox on the svg tag). SVG also has a `<foreignObject></foreignObject>` tag to include HTML. The problem is that Safari has bugs which do not allow this tag to be animated using CSS @keyframes.
- The path animation could also have been easier if wasnt't for Safari. The animation is done using CSS ![stroke-dasharray & stroke-dashoffset trick](https://www.youtube.com/watch?v=-Na_WRk3k74). The issue here was that Safari doesn't accept negative values for stroke-dashoffset.
#### webp
Animations with renderings are using wepb format. If the animation's frames stack, then it is possible to do the optimization using Astro's `<Image />` tag. If the frames don't stack, then it is necessary to generate multiple width versions of the video and include the img element `<img src="" srcset="" sizes="" alt="" loading="" decoding="" />`. This is because Astro webp image optimizer stack the frames, so you have a ghost effect.

### Partners' logos
The logos are using SVGs whenever possible through SVG sprites and Astros's `<Image />` tag when there is no SVGs available for the logo.

### Fonts
The fonts are self-hosted and preloaded to avoid flash of unstyled text (FOUT). Specially because the cover animation is CSS-only and uses both fonts.
