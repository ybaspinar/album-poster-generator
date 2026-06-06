export function loadGoogleFont(family: string, variants: string[] = ["400"]): Promise<void> {
  return new Promise((resolve) => {
    // Check if already loaded
    const existingLink = document?.querySelector(`link[data-font-family="${family}"]`);
    if (existingLink) {
      resolve();
      return;
    }

    // Check if we're in a browser environment
    if (typeof document === "undefined" || !document.head) {
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    // Use proper Google Fonts URL format - replace spaces with +
    const familyParam = family.replace(/ /g, "+");
    const weights = variants.join(";");
    link.href = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weights}&display=swap`;
    link.dataset.fontFamily = family;

    link.onload = () => resolve();
    link.onerror = () => resolve();

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
    "Inter",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Poppins",
    "Source Sans Pro",
    "Raleway",
    "Noto Sans",
    "Nunito",
    "Oswald",
    "Ubuntu",
    "Work Sans",
    "Rubik",
    "IBM Plex Sans",
    "Karla",
    "Space Grotesk",
    "Bebas Neue",
    "Teko",
  ];

  const serifFonts = [
    "Playfair Display",
    "Merriweather",
    "Lora",
    "Crimson Text",
    "Cormorant Garamond",
    "Zilla Slab",
  ];

  const displayFonts = [
    "Permanent Marker",
    "Pacifico",
    "Dancing Script",
    "Courgette",
    "Bangers",
    "Anton",
    "Bebas Neue",
  ];

  if (sansFonts.some((f) => family.toLowerCase().includes(f.toLowerCase()))) {
    return "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  }

  if (serifFonts.some((f) => family.toLowerCase().includes(f.toLowerCase()))) {
    return "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif";
  }

  if (displayFonts.some((f) => family.toLowerCase().includes(f.toLowerCase()))) {
    return "system-ui, sans-serif";
  }

  return "system-ui, ui-sans-serif, sans-serif";
}
