# Screen Reader Accessibility and ARIA

Screen readers convert digital text and UI structures into synthesized speech or refreshable braille displays for visually impaired users.

## Core Best Practices
1. **Semantic HTML**: Use native semantic elements such as `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<button>`, and `<a>`. Native semantics provide built-in accessibility roles, states, and keyboard listeners.
2. **Accessible Names and Labels**: Every interactive control must have an accessible name computed from its visible text, `aria-label`, or `aria-labelledby` reference.
3. **Heading Hierarchy**: Maintain a structured heading hierarchy (`<h1>` through `<h6>`) without skipping levels. Screen reader users rely heavily on headings to scan page content quickly.
4. **ARIA Live Regions**: Dynamic status messages, errors, and system announcements should use `aria-live="polite"` or `aria-live="assertive"` and `role="status"` to announce updates without disrupting current reading focus.
5. **Alternative Text for Images**: All informational images must include concise, descriptive `alt` attributes. Decorative images should have `alt=""` or `aria-hidden="true"` to prevent distracting screen reader users.
