import { useEffect, useState } from 'react';

export const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};

export const getExpandedColorPalette = () => {
  const categories = [
    { name: "Fluorescentes", colors: [] as string[] },
    { name: "Vives", colors: [] as string[] },
    { name: "Nuancées", colors: [] as string[] },
    { name: "Métalliques", colors: [] as string[] },
    { name: "Brillantes", colors: [] as string[] },
    { name: "Mates", colors: [] as string[] }
  ];

  for (let i = 0; i < 50; i++) {
    const hue = Math.floor((i / 50) * 360);
    categories[0].colors.push(hslToHex(hue, 100, 60));
  }

  for (let i = 0; i < 50; i++) {
    const hue = Math.floor((i / 50) * 360);
    const sat = 80 + Math.floor(Math.random() * 20);
    const lit = 45 + Math.floor(Math.random() * 10);
    categories[1].colors.push(hslToHex(hue, sat, lit));
  }

  for (let i = 0; i < 50; i++) {
    const hue = Math.floor((i / 50) * 360);
    const sat = 40 + Math.floor(Math.random() * 20);
    const lit = 75 + Math.floor(Math.random() * 10);
    categories[2].colors.push(hslToHex(hue, sat, lit));
  }

  const metallicHues = [40, 0, 25, 15];
  for (let i = 0; i < 50; i++) {
    const hue = metallicHues[i % 4] + (Math.random() * 10 - 5);
    const sat = hue === 0 ? 0 : (30 + Math.floor(Math.random() * 30));
    const lit = 40 + Math.floor(Math.random() * 40);
    categories[3].colors.push(hslToHex(hue, sat, lit));
  }

  for (let i = 0; i < 50; i++) {
    const hue = Math.floor((i / 50) * 360);
    const sat = 90 + Math.floor(Math.random() * 10);
    const lit = 30 + Math.floor(Math.random() * 15);
    categories[4].colors.push(hslToHex(hue, sat, lit));
  }

  for (let i = 0; i < 50; i++) {
    const hue = Math.floor((i / 50) * 360);
    const sat = 20 + Math.floor(Math.random() * 15);
    const lit = 45 + Math.floor(Math.random() * 15);
    categories[5].colors.push(hslToHex(hue, sat, lit));
  }

  return categories;
};

// Generates an array of colors across different categories
const generateColors = () => {
  const generated: string[] = [];
  
  // 1. Fluorescent (Neon) - High Saturation (100%), Lightness (50-70%)
  for (let i = 0; i < 50; i++) {
    const hue = Math.floor((i / 50) * 360);
    generated.push(`hsl(${hue}, 100%, 60%)`);
  }
  
  // 2. Vibrant - High Saturation (80-100%), Medium Lightness (40-60%)
  for (let i = 0; i < 50; i++) {
    const hue = Math.floor((i / 50) * 360);
    const sat = 80 + Math.floor(Math.random() * 20);
    const lit = 45 + Math.floor(Math.random() * 10);
    generated.push(`hsl(${hue}, ${sat}%, ${lit}%)`);
  }
  
  // 3. Nuanced (Pastel/Muted) - Medium Saturation (30-60%), High Lightness (70-85%)
  for (let i = 0; i < 50; i++) {
    const hue = Math.floor((i / 50) * 360);
    const sat = 40 + Math.floor(Math.random() * 20);
    const lit = 75 + Math.floor(Math.random() * 10);
    generated.push(`hsl(${hue}, ${sat}%, ${lit}%)`);
  }
  
  // 4. Metallic (Golds, Silvers, Bronzes, Coppers) - Specific Hues, Lower Saturation
  const metallicHues = [40 /* Gold */, 0 /* Silver/Grey */, 25 /* Bronze */, 15 /* Copper */];
  for (let i = 0; i < 50; i++) {
    const hue = metallicHues[i % 4] + (Math.random() * 10 - 5);
    const sat = hue === 0 ? 0 : (30 + Math.floor(Math.random() * 30));
    const lit = 40 + Math.floor(Math.random() * 40);
    generated.push(`hsl(${hue}, ${sat}%, ${lit}%)`);
  }
  
  // 5. Brilliant (Jewel tones) - High Saturation (85-100%), Low/Medium Lightness (25-45%)
  for (let i = 0; i < 50; i++) {
    const hue = Math.floor((i / 50) * 360);
    const sat = 90 + Math.floor(Math.random() * 10);
    const lit = 30 + Math.floor(Math.random() * 15);
    generated.push(`hsl(${hue}, ${sat}%, ${lit}%)`);
  }
  
  // 6. Matte (Desaturated, soft) - Low Saturation (15-35%), Medium Lightness (40-60%)
  for (let i = 0; i < 50; i++) {
    const hue = Math.floor((i / 50) * 360);
    const sat = 20 + Math.floor(Math.random() * 15);
    const lit = 45 + Math.floor(Math.random() * 15);
    generated.push(`hsl(${hue}, ${sat}%, ${lit}%)`);
  }

  // Shuffle the array to mix all types of colors
  return generated.sort(() => Math.random() - 0.5);
};

export const COLOR_PALETTE = generateColors();

export const useColorCycle = () => {
  const [currentColorIndex, setCurrentColorIndex] = useState(0);

  useEffect(() => {
    // Apply the initial custom colors if necessary, but we'll default it to --primary & --secondary logic
    const root = document.documentElement;
    // We can compute a secondary color based on the primary color (e.g., complementary or analogous)
    
    const interval = setInterval(() => {
      setCurrentColorIndex((prev) => (prev + 1) % COLOR_PALETTE.length);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const primaryStr = COLOR_PALETTE[currentColorIndex];
    
    // Simple parsing to generate a complementary or analogous secondary color
    // e.g. hsl(X, Y%, Z%) -> hsl((X + 45) % 360, Y%, Z%)
    let secondaryStr = primaryStr;
    const hslMatch = primaryStr.match(/hsl\(([^,]+),\s*([^,]+)%,\s*([^,]+)%\)/);
    if (hslMatch) {
      const h = parseFloat(hslMatch[1]);
      const s = parseFloat(hslMatch[2]);
      const l = parseFloat(hslMatch[3]);
      secondaryStr = `hsl(${(h + 45) % 360}, ${s}%, ${l * 0.9}%)`;
    }

    root.style.setProperty('--primary', primaryStr);
    root.style.setProperty('--secondary', secondaryStr);
    
    // Add smooth transition to the root
    root.style.transition = 'all 2s ease-in-out';
  }, [currentColorIndex]);

  // We could also expose a way to manually trigger it
  return {
    currentColorIndex,
  };
};
