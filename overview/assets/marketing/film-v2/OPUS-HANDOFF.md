# Opus production handoff — C&B film v2

October 29, 2026. Read [SCRIPT.md](SCRIPT.md) as the timing and copy source. Build the new 64-second film as a separate version. Preserve the previous 55-second film and its editable source.

**Delivery in this handoff:** script, shot directions and review keyframes. **Still to produce:** animated film, recorded narration if selected, aligned captions, audio mix and final exports. Do not describe the keyframe deck as a completed video.

The review keyframes use static native 1920 × 1080 HTML compositions, existing equipment assets, an illustrative ring scene and simplified demo interfaces. Their source is `dist/overview/film-v2/frame.js`. Open `/overview/film-v2/frame.html?frame=1` through `?frame=8` to inspect individual scenes. Each frame has a deliberately different composition; do not turn the sequence into a repeated title-and-small-ring template during animation.

The compositions establish hierarchy and story beats; they do not claim to capture exact live application states. For final website interaction, use actual captures or verify an editable recreation against the current workflow. Preserve the same terms, states and two-step structure. Scene 03's review still shows the whole system; the final edit then selects robotic handling. Scene 07's still shows the scope-discussion action; the final edit may continue into its local saved-response state.

| PNG keyframe | Timeline position | Native HTML query |
|---|---|---|
| `01-machine.png` | 00:04 | `?frame=1` |
| `02-faces.png` | 00:11 | `?frame=2` |
| `03-explorer.png` | 00:18 | `?frame=3` |
| `04-process.png` | 00:26 | `?frame=4` |
| `05-application.png` | 00:34 | `?frame=5` |
| `06-brief.png` | 00:42 | `?frame=6` |
| `07-proposal.png` | 00:51 | `?frame=7` |
| `08-next-step.png` | 01:00 | `?frame=8` |

## The creative decision

The manufacturer and equipment should carry the film. Begin with real C&B equipment at a generous scale, make the buyer's ring gear the subject of the explanation, then show a useful next conversation. The visible customer journey ends at a proposal response, while the film's final conversion action is Request a Quote.

Keep the eight frames visually distinct. Use changes in subject scale, camera position and page context to create rhythm. The sequence must remain understandable with the sound off.

The approved C&B website and the user's equipment-first direction govern the design. Existing reference decisions are documented in [the brand asset kit](../../docs/call-brand-assets.md): T1 Energy supplies machinery-led evidence; Grafbase supplies clear framing around technical proof. Do not import their colors, typography or effects. The 3D interaction reference is the deliberate whole-system-to-component progression already implemented in the C&B Explorer.

## Fixed visual system

| Element | Use |
|---|---|
| Silver surface | `#E3E6E5`; shots 01, 05–08. Keep reading zones white or silver. |
| Graphite type | `#282E2D` on light surfaces. Secondary text `#626D69`. |
| Ink-wine technical space | `#21191C`; shots 02–04. Warm-white type `#F6F3EE`; secondary type `#C4BAB6`. |
| Primary action | Wine `#781C35` on light; `#8F2D46` with a restrained `#B86C7F` boundary on dark. White label. |
| Technical emphasis | Fluorescent orange-red `#FF5A1F` on the selected component contour or explained face. Fine, crisp and clearly visible at normal playback size. |
| Champagne | `#E8D8AF` only when needed for one short headline phrase on dark. Never a second action color. |
| Texture | Existing flat continuous curves on the equipment stage; restrained grid in Explorer scenes. Keep all texture away from type and the CTA. |
| Type | Arial / Helvetica to match the website. Main titles 88–106 px at 1080p, short labels 25–30 px, supporting copy 30–34 px. Qualifications at least 20 px and visibly readable. |
| Geometry | Modest corner radii, no floating glass cards, no pills around every label, no ornamental dividers. |

The silver section must stay neutral. No pale rose full-screen backgrounds. Orange-red is a technical selection signal, not a CTA fill. Wine retains action priority.

## Composition and motion

- Design at 1920 × 1080 with approximately 96 px of outer safety. Keep critical labels away from the lower caption zone. Make deliberate alternate layouts for vertical exports later; do not center-crop this film.
- Give the machine or part roughly 55–70% of the visual field. A large subject and sparse text should establish the hierarchy before motion begins.
- Frame one must already contain the machine and meaningful title. No empty logo intro, particle build-up or generic cinematic reveal.
- Limit each scene to one main reveal and one camera movement. Once a label appears, hold its baseline still; do not bounce or continually track text around the model.
- Use 8–12-frame fades for labels and 18–30-frame camera eases where appropriate. Simple cuts are preferred when switching between real equipment, schematic geometry and website interaction; they preserve the distinction between those sources.
- Use a real scene capture for Explorer orbit/selection. A photograph may receive a slow planar camera push, but not synthetic 3D rotation or generative changes to its structure.
- Keep the manufacturer logo readable for 3–5 seconds in the opening/system story. Preserve the official lockup and the machine's own nameplate. The low-resolution source does not support inventing or redrawing the mark.
- Never animate the technical process at a speed that implies a real cycle time. Do not add sparks, material clouds, wheel rotation arrows, clamping forces, dimensional improvements or finished-part tolerances.
- During website shots, show one deliberate action at a time. Hide unrelated browser tabs, operating-system chrome, hover detours and redundant controls. Do not replace the real workflow with a fictitious one-click quote generator.
- Shot 07 uses a stage cut: inquiry context → **C&B prepares the proposal** → customer review/response. The visual must not imply that the website instantly prices or approves machinery.
- All end-card elements settle by 00:57.2 and remain still to 01:04. The drawn CTA inside the video is not an interactive player control; the surrounding web page provides the actual link.

## Source map

Paths below are relative to the repository root.

| Use | Source | Boundary |
|---|---|---|
| Original logo | `dist/assets/logo.webp`; archival copy `marketing-assets/brand/cb-logo-burgundy.webp` | Existing raster is 205 × 50. Preserve its ratio and colors. Request an approved vector for larger final branding if required. |
| Real robotic grinder | `marketing-assets/equipment/double-disc-30in-robot.png` | Representative published C&B equipment; not established as the machine used in the historical ring gear case. |
| Approved flat field | `dist/brand/assets/precision-field-wide.svg` | Decorative field behind equipment only; do not turn it into physical brushed metal or a luminous tunnel. |
| Actual machine Explorer | `dist/explorer/`; live `/machines/robotic-double-disc/` or `/overview/#build-confidence` | Exterior interpretation from photography; missing/internal geometry is schematic. No CAD accuracy claim. |
| Ring/process foundation | `video/system/ring-video-scene.js`; `video/keyframes/`; `dist/illustrations/` | Reuse the silver part and face selections. The tooth form and grinding arrangement are illustrative. Do not strengthen engineering claims through motion. |
| Application page | `dist/applications/ring-gear-grinding/`; live `/applications/ring-gear-grinding/` | Use actual page copy and verified imagery; do not fabricate search ranking or a search-engine result. |
| Inquiry | `dist/request-a-quote/`; presentation stages `/overview/#brief` and `#review` | Keep Fill + Review. Fields and summary must refer to the same fictional project. |
| Proposal/response | `/overview/#quotation`; `dist/quotes/` and `dist/projects/` | Example proposal only. Data and responses are stored locally in this demo; no email, order or legal acceptance is created. |
| Contact details | Existing site header/content records | `+1 248.264.9800` and `sales@cbmachinery.com`. |
| Earlier film reference | `video/export/cb-ring-gear-55s.mp4`; `video/film/timeline.js` | A source/reference, not the replacement output. Do not simply recolor its repeated layout and call that the new direction. |

Reference webpages and provenance are recorded in [content sources](../../docs/content-sources.md) and [the current asset kit](../../docs/call-brand-assets.md). Keep real equipment, historical application photography and schematic scenes separate in their labels. Their juxtaposition does not establish that they depict one operating line.

## Website capture and continuity

Use one dedicated synthetic ring gear case throughout shots 06–07. Capture after preparing the example locally; do not show a real customer's personal information. Keep the project identifier or stable project title visible enough to establish continuity, without turning it into the main headline.

The same material, dimensions, production requirement and open question must survive the transition from brief to proposal context. If a field changes for the capture, do not revert it between shots. The current sample quote contains illustrative pricing; frame scope and next action as the subject and leave the sample qualification readable.

Keep one response: **Request a scope discussion** or **Request a revision**. Do not show both being submitted. End that moment with **Response saved in this demo**. Do not show “email delivered,” “order accepted,” payment, a won-deal badge or confetti implying a completed sale.

The C&B receiving view is supporting production context, not another mandatory customer step in this film. My projects/account registration stays outside the main edit. No sign-up gate is added before the inquiry.

## Sound and captions

The film must pass a silent review before narration is added. Use a restrained instrumental bed without a forced crescendo or faux machine sound effects. Do not synthesize an operating sound that might be interpreted as the real machine.

If adding voiceover, use the exact script first. Leave natural pauses between the technical principle, brief and proposal sections. Keep the voice confident and conversational. The final spoken line finishes by 01:01.

Deliver English captions as a separate WebVTT and SRT timed to the recorded voice. Avoid stacking subtitles over face labels, form fields or contacts. Do not burn subtitles into the only master; keep a clean master for derivative formats.

## Production sequence

1. Match all eight review keyframes at full resolution. Check scale, logo, text hierarchy and face treatment before committing motion.
2. Build a silent 64-second animatic. Use real source scenes for camera movement and actual page capture for interaction.
3. Review the machine opening, face-grinding explanation and proposal transition together. These three moments must tell the complete story without narration.
4. Add approved narration, captions and sound. Re-time within the eight windows; if clarity requires a changed duration, document the revised cut before export.
5. Export a review MP4 and inspect it at normal browser playback size and on a phone. Check that orange outlines, labels and C&B identity survive compression.
6. Deliver final MP4, clean editing master, captions, poster, editable project and a short export/readme record. Do not overwrite the old video until the new cut has been reviewed.

## Delivery naming

- `cb-machinery-from-part-to-proposal-v2-64s.mp4` — H.264, 1920 × 1080, 30 fps, BT.709; sound if used.
- `cb-machinery-from-part-to-proposal-v2-master.mov` — editing master, codec chosen by the production environment and recorded in the export notes.
- `cb-machinery-from-part-to-proposal-v2.en.vtt` and `.srt` — aligned English captions.
- `cb-machinery-from-part-to-proposal-v2-poster.jpg` — approved branded-machine opening, no playback controls baked into the image.
- Editable timeline/source project with asset paths and fonts retained.

These names are requested deliverables, not files claimed to exist in this handoff.

## Acceptance checks

- The first frame establishes C&B and equipment; the machine is not a tiny decoration.
- Each of the eight shots has one clear message, with readable English copy and no unexplained abbreviations.
- Face grinding highlights the opposing annular faces, never the gear teeth.
- Real photography, interpreted model, process schematic and proposed website have accurate identification.
- The same project continues from requirements to proposal response, without instant pricing or a fabricated sale.
- The final action is the wine **Request a Quote**, held clearly with phone and email.
- There are no exaggerated production results, tolerances, capacities, SEO performance or customer conversion claims.
- Silver, wine and orange roles match the website; no blue palette or pink field returns.
- Audio/captions are synchronized, the master is 64 seconds at 30 fps, and no missing frames, clipped labels or rendering artifacts appear.
- The final result has been visually reviewed as an actual encoded film, not only as keyframes.
