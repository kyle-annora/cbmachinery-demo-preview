# Full-site marketing pages: source and design ledger

Updated 2026-10-28. This directory supports the local C&B demo. Pages use the approved C&B wine / champagne design system and published C&B information. No generated industrial photography or invented testimonials were added.

## Source map

| Page | Source and editorial boundary |
| --- | --- |
| `/machines/` | [C&B homepage](https://www.cbmachinery.com/) and machine-family pages. Two product families are explained; the current robot machine is a representative example. |
| `/machines/double-disc/` | [Double disc](https://www.cbmachinery.com/machines/double-disc/): opposing wheel faces; horizontal and vertical families. Descriptions are paraphrased without performance guarantees. |
| `/machines/clamp-bore/` | [Clamp bore](https://www.cbmachinery.com/machines/clamp-bore/): locating relationship, one- and two-spindle arrangements. No default specification or unverified process fit. |
| `/rebuilds/` | [Rebuilds](https://www.cbmachinery.com/machines/rebuilds/): rebuilding/re-engineering/retooling and Besly, Gardner, Giustina, Mattison families. Published percentage savings and guaranteed outcomes are deliberately not repeated. |
| `/services/` | [Services](https://www.cbmachinery.com/services/): machine service, spindle rebuild, automation, controls, scraping and production grinding. Links preserve service interest separately from technical requirements. |
| `/applications/` | [Applications](https://www.cbmachinery.com/applications/): published industries and part families. Card links either enter a detailed local page or start a contextual inquiry. |
| `/applications/auto-heavy-powertrain/` | [Published powertrain portfolio](https://www.cbmachinery.com/applications/auto-heavy-powertrain/): ring gear, rods, gears, covers. Historical case metrics are not transferred to new projects. |
| `/inventory/` | [Published inventory](https://www.cbmachinery.com/inventory/), checked 2026-10-28. Six real listing groups / stock references are shown as source listings, with explicit availability confirmation. No live-stock, pricing or lead-time feed is implied. |
| `/resources/` | [C&B news](https://www.cbmachinery.com/news/) and the precise existing official post sources recorded below. Dates are original publication dates, not new demo dates. |
| `/about-us/` | [About C&B](https://www.cbmachinery.com/about-us/): established 1980, Michigan headquarters, team/capabilities. No current certifications or client endorsement claims added. |
| `/contact-us/` | [Contact](https://www.cbmachinery.com/contact-us/): phone, email, address. The demo does not submit a real contact form. |
| `/resources/quote-preparation/` | Original editorial guide for the proposed inquiry experience; does not claim to be a pre-existing C&B document. |
| `/resources/double-disc-grinding/` | Original process introduction grounded in the double-disc source and existing model’s explicit schematic boundaries. |

## Existing official images reused

- `/assets/machine.png`, `/assets/clamp-bore.png`, `/assets/factory.jpg`, `/assets/ring-gear.jpg`: provenance in `docs/content-sources.md`.
- `/review-kit/assets/gardner-reengineered-grinder.jpg`: official Gardner rebuilding image, not live inventory.
- `/review-kit/assets/technician-aligning-grinder.jpg`: official Machine Service image.
- `/review-kit/assets/orbitform-tech-expo-2026.jpg`: [October 8, 2026 official post](https://www.linkedin.com/feed/update/urn:li:activity:7513974132817027072/).
- `/review-kit/assets/manufacturing-day-2026.jpg`: [October 2, 2026 official post](https://www.linkedin.com/feed/update/urn:li:activity:7511779158792859649/).
- `/site/assets/42in-reciprocator-video-poster.jpg`: unchanged copy of `marketing-assets/news/42in-reciprocator-video-poster.jpg`; [October 16, 2026 post](https://www.linkedin.com/feed/update/urn:li:activity:7516913173896192000/) links to the [official video](https://www.youtube.com/watch?v=zcTpfG1pU9Q). This is not the 30-inch Explorer model.
- `/illustrations/ring-gear-fallback.svg`: existing original application schematic, visibly labeled as illustration.

## Reference lock

Primary: the user-approved current C&B website / Tulip-derived composition. This work expands that established system rather than introducing a new visual direction.

| Decision | Reference / reason |
| --- | --- |
| Wine hero and white content rhythm | Existing approved C&B homepage, product and inquiry pages |
| Champagne in a limited headline role | Explicit user-approved palette; primary actions remain wine |
| Product photography leads machine pages | Existing official asset strategy and prior reference lock |
| 44px+ controls, stacked narrow-screen layout | Refero craft details and existing responsive system |
| Comparison tabs | Machine orientations have distinct explanations; selection reveals a coherent description plus discussion facts |
| Filterable application library | Helps enter by part family without forcing a machine choice |
| Searchable inventory table → mobile cards | Model and stock reference matter more than decorative imagery; no substitute equipment photo is used as an individual stock image |
| Hero CTA + post-decision CTA + shared nav CTA | Keeps a next step available before and after the user has learned enough to act |
| Source and demo notes | Separates public capabilities from commercial confirmation and proposal workflow |

## Implementation and checks

13 static HTML routes. Shared presentation: `site-pages.css`; progressive enhancements: `site-pages.js`; route manifest: `pages.json`. Content remains readable without JavaScript; enhancements control orientation tabs, application filters and inventory search / empty state.

Browser checked at 1280px: machines hero, double-disc vertical tab, application industry filter, inventory type/search/empty state, services hero and contact layout. At 390px iframe width: machines, services, inventory filter/cards and contact; all had no horizontal overflow. No broken images or console errors were seen in the checked views. This is responsive-layout QA, not a physical-phone performance test.

Static HTML check: 13 pages, one H1 each, all local assets/routes and in-page anchors resolve. JavaScript syntax check passed. The temporary mobile QA wrapper is removed after checks.
