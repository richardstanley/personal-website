**Objective:**
Refactor the CSS (and if necessary, suggest minimal HTML structural adjustments) for the personal website `https://richardstanley.net/` to incorporate a new visual style. The style should be subtly inspired by the aesthetics of a Magic: The Gathering card (think information hierarchy, defined sections, classic typography) but must remain highly professional, clean, and appropriate for the personal website of a CTO in the fintech and real estate industry. The current website content (text, images, links) should be preserved.

**Current Website Structure Overview (based on `https://richardstanley.net/`):**
* Single-page layout.
* Navigation Bar (Top): "About," "Projects," "Resume."
* Main Content Sections:
    * Hero/Introduction (Name: Richard Stanley, current brief intro).
    * "About Me" (with profile picture).
    * "Resume" (with download link).
    * "Contact" (LinkedIn, GitHub links).

**Styling Guidelines - "Professional MTG-Inspired Theme":**

1.  **Overall Philosophy:**
    * **Subtlety is Key:** The inspiration should be a gentle nod, not overt. The site must primarily communicate professionalism, trustworthiness, and modernity.
    * **Maintain Readability & Accessibility:** Ensure high contrast, legible fonts, and a responsive design.

2.  **Color Palette:**
    * **Primary Background (Page Body/Main Content Area):** An off-white, light cream, or very light parchment color (e.g., `#FAF8F0`, `#FDFBF6`).
    * **Section Backgrounds (Optional for contrast):** Slightly darker shade than the primary background for content sections like "About Me," "Projects" to create a "text box" feel, or use subtle borders.
    * **Accent Colors (for links, hover effects, subtle borders, key highlights):**
        * Deep Navy Blue (e.g., `#001F3F` or `#2c3e50`)
        * Charcoal Grey (e.g., `#343a40` or `#4A4A4A`)
        * Muted Gold/Bronze (e.g., `#B08D57` or `#C4A661`) - use very sparingly for elements like call-to-action buttons or specific highlights.
    * **Text Color:** Dark grey or near-black for body text (e.g., `#212529`) for maximum readability on light backgrounds.

3.  **Typography:**
    * **Main Heading (Richard Stanley):** A distinguished, classic serif font (e.g., Garamond, Palatino, Merriweather, Lora). Make it prominent.
    * **"Type Line" (Your Title - e.g., "CTO, Fintech & Real Estate Innovator"):** Positioned directly under your name. Style it distinctively: slightly smaller than the main heading, perhaps in an italic version of the heading font, a lighter weight, or a complementary clean sans-serif font.
    * **Section Headings ("About Me," "Projects," "Resume," "Contact"):** Use the same serif font as the main heading, or a strong sans-serif that pairs well with it (e.g., Lato, Open Sans, Montserrat).
    * **Body Text:** A highly readable sans-serif font (e.g., Open Sans, Lato, Roboto) or a very clean serif (e.g., Source Serif Pro). Prioritize clarity.
    * **Navigation Links:** Clean sans-serif, matching or complementary to body text.

4.  **Layout & Element Styling:**
    * **Global:**
        * Ensure consistent padding and margins for a spacious, uncluttered feel.
    * **Header/Navigation Bar:**
        * Clean design. Background could be transparent, the primary background color, or a subtle charcoal/navy if a dark theme header is desired for contrast.
    * **Hero Section (Name, Title, Brief Intro):**
        * The background could feature a very subtle, almost imperceptible texture (e.g., a faint linen, fine paper grain, or an abstract geometric pattern reminiscent of architectural lines or digital networks – ensure it doesn't hinder readability).
    * **Content Sections ("About Me," "Projects," etc.):**
        * Visually delineate these sections. Options:
            * A thin, solid border in an accent color (charcoal or navy).
            * A slightly different background color from the main page body (as per Color Palette).
            * Increased whitespace separation.
    * **Profile Picture ("About Me" section):**
        * Ensure it has a clean, defined border (e.g., 1-2px solid in charcoal or a muted accent color).
        * Consider a very subtle box-shadow to lift it slightly.
    * **"Projects" Section:**
        * If projects are listed individually, style each project block to feel somewhat self-contained (like a mini-card). This could involve:
            * A clear project title (heading).
            * Brief description.
            * Key information (e.g., "Technologies Used:", "Role:") clearly labeled.
            * Consider using flexbox or grid for aligning project items if there are multiple.
    * **Buttons/Links:**
        * Primary call-to-action buttons (e.g., "Download Resume") should use an accent color (e.g., the muted gold or navy) with clear hover states.
        * Text links should be clearly distinguishable, using an accent color and underline on hover/focus.

5.  **Specific "MTG-Inspired" Abstract Cues (Very Subtle):**
    * **"Nameplate":** Your name and title area at the top.
    * **"Art":** Your profile picture.
    * **"Text Box":** Each content section.
    * Avoid any direct MTG iconography, symbols, or overly thematic fonts.

**Requested Output:**
* Clean, well-commented CSS code.
* If minor HTML structural changes are necessary to achieve the styling (e.g., adding wrapper divs for sections, or classes), please specify these changes clearly, ideally providing the modified HTML snippets.
* Strive to use modern CSS practices (flexbox, grid) where appropriate for layout.
* Ensure the styling is responsive and looks good on common screen sizes (desktop, tablet, mobile).

**Example Snippet (Conceptual - for how to apply a font):**
```css
/* Conceptual example for typography */
body {
  font-family: 'Open Sans', sans-serif; /* Example body font */
  background-color: #FAF8F0; /* Example parchment background */
  color: #212529;
}

.hero-section h1 { /* Your Name */
  font-family: 'Merriweather', serif; /* Example heading font */
  font-size: 2.5rem;
  color: #001F3F; /* Example Navy Blue */
}

.hero-section .title-subheader { /* Your Professional Title */
  font-family: 'Merriweather', serif;
  font-style: italic;
  font-size: 1.2rem;
  color: #343a40; /* Example Charcoal */
  margin-top: -10px; /* Adjust as needed */
}

.content-section {
  background-color: #FFFFFF; /* Slightly different or same as body */
  border: 1px solid #D3D3D3; /* Subtle border */
  padding: 20px;
  margin-bottom: 30px;
}
