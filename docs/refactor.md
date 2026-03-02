# Component Refactoring Mapping

Here is the list of components, their current function, and the corresponding proposed renames (if the name differs from the function).

| Current Component Name            | Function Description                                        | New Component Name                      |
| :-------------------------------- | :---------------------------------------------------------- | :-------------------------------------- |
| `Anchor.astro`                    | Renders a styled action link with an optional icon.         | `ActionLink.astro`                      |
| `ExpandButton.astro`              | Renders a section of expandable text triggered by a button. | `ExpandableText.astro`                  |
| `OrganizationCard.astro`          | Renders an individual logo item within a logo carousel.     | `LogoCarouselItem.astro`                |
| `StickyLogoMessage.astro`         | Renders a sticky text section that stays visible on scroll. | `StickySection.astro`                   |
| `BlogCarousel/BlogCarousel.astro` | Displays a carousel of project/blog cards.                  | `ProjectCarousel/ProjectCarousel.astro` |
| `CallToAction.astro`              | Displays a call-to-action block.                            | (Keep Name)                             |
| `Cover.astro`                     | Displays an animated full-screen cover.                     | (Keep Name)                             |
| `Footer.astro`                    | Displays the site footer.                                   | (Keep Name)                             |
| `Header.astro`                    | Displays the site header.                                   | (Keep Name)                             |
| `ThreePillarsHorizontal.astro`    | Displays the horizontal pillar animation.                   | (Keep Name)                             |
| `ThreePillarsVertical.astro`      | Displays the vertical pillar animation.                     | (Keep Name)                             |

---

## CSS Class Refactoring Mapping

Global CSS classes in `src/styles/global.css` renamed for semantic clarity.

| Old Class Name        | New Class Name           | Purpose                                         |
| :-------------------- | :----------------------- | :---------------------------------------------- |
| `.frame`              | `.section-container`     | Responsive side margins for layout sections     |
| `.content`            | `.rich-text-container`   | Flex column wrapper centering article text      |
| `.sticky`             | `.sticky-section-header` | Sticky positioning with responsive top padding  |
| `.primary-font-size`  | `.text-hero-heading`     | Primary responsive hero font size & line height |
| `.primary-height`     | `.min-h-hero`            | Minimum height (80svh) for hero sections        |
| `.primary-margin-top` | `.mt-hero`               | Large top margin (35svh) for hero spacing       |
| `.msg-secondary`      | `.text-subheading`       | Secondary responsive subheading font size       |
| `.msg-tertiary`       | `.text-body-large`       | Tertiary large body text font size              |
| `.blend`              | `.mix-blend-difference`  | Applies `mix-blend-mode: difference`            |
| `.green`              | `.text-brand-green`      | Custom brand green `#24b54a` text color         |
| `.intro-breath`       | _(Deleted)_              | Unused dead code                                |
