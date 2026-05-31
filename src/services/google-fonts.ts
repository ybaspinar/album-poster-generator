export interface GoogleFont {
  family: string;
  variants: string[];
  subsets: string[];
}

// Extended curated list of popular Google Fonts that can be loaded without API key
// These are loaded via fonts.googleapis.com/css2 which is publicly accessible
const POPULAR_GOOGLE_FONTS: GoogleFont[] = [
  // Sans-serif fonts
  { family: "Roboto", variants: ["400", "700"], subsets: ["latin"] },
  { family: "Open Sans", variants: ["400", "600", "700"], subsets: ["latin"] },
  { family: "Lato", variants: ["400", "700"], subsets: ["latin"] },
  { family: "Montserrat", variants: ["400", "700"], subsets: ["latin"] },
  { family: "Poppins", variants: ["400", "600", "700"], subsets: ["latin"] },
  { family: "Inter", variants: ["400", "700"], subsets: ["latin"] },
  { family: "Raleway", variants: ["400", "600", "700"], subsets: ["latin"] },
  { family: "Noto Sans", variants: ["400", "600", "700"], subsets: ["latin"] },
  { family: "Source Sans Pro", variants: ["400", "600", "700"], subsets: ["latin"] },
  { family: "Nunito", variants: ["400", "700"], subsets: ["latin"] },
  { family: "Oswald", variants: ["400", "600", "700"], subsets: ["latin"] },
  { family: "Ubuntu", variants: ["400", "500", "700"], subsets: ["latin"] },
  { family: "Work Sans", variants: ["400", "600", "700"], subsets: ["latin"] },
  { family: "Rubik", variants: ["400", "500", "700"], subsets: ["latin"] },
  { family: "IBM Plex Sans", variants: ["400", "600", "700"], subsets: ["latin"] },
  { family: "Karla", variants: ["400", "700"], subsets: ["latin"] },
  { family: "Space Grotesk", variants: ["400", "600", "700"], subsets: ["latin"] },
  { family: "Bebas Neue", variants: ["400"], subsets: ["latin"] },
  { family: "Teko", variants: ["400", "600", "700"], subsets: ["latin"] },
  
  // Serif fonts
  { family: "Playfair Display", variants: ["400", "700"], subsets: ["latin"] },
  { family: "Merriweather", variants: ["400", "700"], subsets: ["latin"] },
  { family: "Lora", variants: ["400", "700"], subsets: ["latin"] },
  { family: "Crimson Text", variants: ["400", "600", "700"], subsets: ["latin"] },
  { family: "Cormorant Garamond", variants: ["400", "600", "700"], subsets: ["latin"] },
  { family: "Zilla Slab", variants: ["400", "600", "700"], subsets: ["latin"] },
  
  // Display/Decorative fonts
  { family: "Permanent Marker", variants: ["400"], subsets: ["latin"] },
  { family: "Pacifico", variants: ["400"], subsets: ["latin"] },
  { family: "Dancing Script", variants: ["400", "700"], subsets: ["latin"] },
  { family: "Courgette", variants: ["400"], subsets: ["latin"] },
  { family: "Bangers", variants: ["400"], subsets: ["latin"] },
  { family: "Anton", variants: ["400"], subsets: ["latin"] },
];

export async function fetchGoogleFonts(): Promise<GoogleFont[]> {
  // Return curated list - no API needed since fonts.googleapis.com/css2 is public
  return POPULAR_GOOGLE_FONTS;
}

export function loadGoogleFont(family: string, variants: string[] = ["400", "700"]): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if font is already loaded
    const existingLink = document.querySelector(`link[data-font-family="${family}"]`);
    if (existingLink) {
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:${variants.join(",")}&display=swap`;
    link.dataset.fontFamily = family;

    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load font: ${family}`));

    document.head.appendChild(link);
  });
}

export function getFontFamilyString(family: string): string {
  // Convert font family name to CSS-ready format
  return `'${family}', ${getFallbackFont(family)}`;
}

function getFallbackFont(family: string): string {
  // Provide sensible fallbacks based on font category
  const sansFonts = [
    "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Source Sans Pro",
    "Raleway", "Noto Sans", "Nunito", "Oswald", "Ubuntu", "Work Sans", "Rubik",
    "IBM Plex Sans", "Karla", "Space Grotesk", "Bebas Neue", "Teko",
  ];
  
  const serifFonts = [
    "Playfair Display", "Merriweather", "Lora", "Crimson Text", "Cormorant Garamond", "Zilla Slab",
  ];
  
  const displayFonts = [
    "Permanent Marker", "Pacifico", "Dancing Script", "Courgette", "Bangers", "Anton", "Bebas Neue",
  ];

  if (sansFonts.some(f => family.toLowerCase().includes(f.toLowerCase()))) {
    return "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  }
  
  if (serifFonts.some(f => family.toLowerCase().includes(f.toLowerCase()))) {
    return "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif";
  }
  
  if (displayFonts.some(f => family.toLowerCase().includes(f.toLowerCase()))) {
    return "system-ui, sans-serif";
  }

  return "system-ui, ui-sans-serif, sans-serif";
}