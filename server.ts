import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import sharp from "sharp";

const iconColors: Record<string, string[]> = {
  purple: ["#7C5CFF", "#2563EB"],
  red: ["#EF4444", "#F97316"],
  green: ["#10B981", "#3B82F6"],
  pink: ["#EC4899", "#8B5CF6"],
  blue: ["#3B82F6", "#06B6D4"],
  orange: ["#F59E0B", "#EF4444"],
  slate: ["#64748B", "#94A3B8"],
  indigo: ["#6366F1", "#4F46E5"],
  teal: ["#14B8A6", "#0EA5E9"],
  gold: ["#FBBF24", "#D97706"],
};

const iconShapes: Record<string, string> = {
  circleBar: `<circle cx="32" cy="32" r="32" fill="url(#shape)" /><rect x="64" y="0" width="32" height="96" rx="16" fill="url(#shape)" />`,
  triangle: `<polygon points="48,0 96,96 0,96" fill="url(#shape)" />`,
  hexagon: `<polygon points="48,0 96,24 96,72 48,96 0,72 0,24" fill="url(#shape)" />`,
  star: `<polygon points="48,0 63,30 96,35 72,58 78,91 48,75 18,91 24,58 0,35 33,30" fill="url(#shape)" />`,
  diamond: `<polygon points="48,0 96,48 48,96 0,48" fill="url(#shape)" />`,
  shield: `<path d="M0 0 h96 v32 C96 64 48 96 48 96 C48 96 0 64 0 32 Z" fill="url(#shape)" />`,
  drop: `<path d="M48 0 C 48 0 96 48 96 64 A 48 48 0 0 1 0 64 C 0 48 48 0 48 0 Z" fill="url(#shape)" />`,
  cross: `<path d="M32 0 h32 v32 h32 v32 h-32 v32 h-32 v-32 h-32 v-32 h32 z" fill="url(#shape)" />`,
  circles: `<circle cx="32" cy="48" r="32" fill="url(#shape)" /><circle cx="64" cy="48" r="32" fill="url(#shape)" opacity="0.8" />`,
  orb: `<circle cx="48" cy="48" r="48" fill="url(#shape)" />`,
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON middleware
  app.use(express.json());

  // API Routes
  app.get("/manifest.json", (req, res) => {
    const color = (req.query.color as string) || "purple";
    const shape = (req.query.shape as string) || "circleBar";
    const name = (req.query.name as string) || "ROIVA";

    res.json({
      name: name,
      short_name: name,
      start_url: "/",
      display: "standalone",
      background_color: "#0f172a",
      theme_color: iconColors[color]?.[0] || "#7C5CFF",
      icons: [
        {
          src: `/api/icon?color=${color}&shape=${shape}&size=192&format=png`,
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: `/api/icon?color=${color}&shape=${shape}&size=512&format=png`,
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        },
      ],
    });
  });

  app.get("/api/icon", async (req, res) => {
    try {
      const colorKey = (req.query.color as string) || "purple";
      const shapeKey = (req.query.shape as string) || "circleBar";
      let size = parseInt((req.query.size as string) || "192", 10);
      const isPng = req.query.format === "png";
      
      const colors = iconColors[colorKey] || iconColors.purple;
      const shapeStr = iconShapes[shapeKey] || iconShapes.circleBar;

      if (isNaN(size) || size < 16 || size > 1024) size = 192;

      // Base design is 192x192 with shape drawn at corner 48, 48 and scale
      // The inner <g> container is 96x96
      // For PNGs (used for Apple Touch Icon and manifest), we remove rx to avoid black transparent corners
      const rxAttr = isPng ? "0" : "48";
      const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${colors[0]}" />
            <stop offset="100%" stop-color="${colors[1]}" />
          </linearGradient>
          <linearGradient id="shape" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9" />
            <stop offset="100%" stop-color="#E2E8F0" stop-opacity="0.9" />
          </linearGradient>
        </defs>
        <rect width="192" height="192" rx="${rxAttr}" fill="url(#bg)" />
        <g transform="translate(48, 48)">
          ${shapeStr}
        </g>
        <text x="96" y="176" font-family="'Inter', -apple-system, sans-serif" font-size="16" font-weight="900" fill="#ffffff" opacity="0.4" text-anchor="middle" letter-spacing="4">ROIVA</text>
      </svg>
      `;

      if (isPng) {
        const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
        res.setHeader("Content-Type", "image/png");
        res.send(buffer);
      } else {
        res.setHeader("Content-Type", "image/svg+xml");
        res.send(svg);
      }
    } catch (e: any) {
      console.error("Error generating icon:", e);
      res.status(500).send("Error generating icon");
    }
  });

  app.get("/api/weather", async (req, res) => {
    try {
      const lat = req.query.lat;
      const lon = req.query.lon;
      
      // Support both with and without VITE_ prefix to be accommodating
      const apiKey = process.env.VITE_OPENWEATHERMAP_API_KEY || process.env.OPENWEATHERMAP_API_KEY;

      if (!apiKey) {
        return res.status(401).json({ error: "Missing API key" });
      }

      if (!lat || !lon) {
        return res.status(400).json({ error: "lat and lon are required" });
      }

      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`
      );

      if (!weatherRes.ok) {
        const errorData = await weatherRes.json().catch(() => ({}));
        return res.status(weatherRes.status).json({ error: errorData.message || "Failed to fetch weather" });
      }

      const weatherData = await weatherRes.json();
      res.json(weatherData);

    } catch (e: any) {
      console.error("Error in /api/weather:", e);
      res.status(500).json({ error: e.message || "Internal server error" });
    }
  });

  app.get("/api/weather/forecast", async (req, res) => {
    try {
      const lat = req.query.lat;
      const lon = req.query.lon;
      
      const apiKey = process.env.VITE_OPENWEATHERMAP_API_KEY || process.env.OPENWEATHERMAP_API_KEY;

      if (!apiKey) {
        return res.status(401).json({ error: "Missing API key" });
      }

      if (!lat || !lon) {
        return res.status(400).json({ error: "lat and lon are required" });
      }

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`
      );

      if (!forecastRes.ok) {
        const errorData = await forecastRes.json().catch(() => ({}));
        return res.status(forecastRes.status).json({ error: errorData.message || "Failed to fetch forecast" });
      }

      const forecastData = await forecastRes.json();
      res.json(forecastData);

    } catch (e: any) {
      console.error("Error in /api/weather/forecast:", e);
      res.status(500).json({ error: e.message || "Internal server error" });
    }
  });

  app.get("/api/weather/air", async (req, res) => {
    try {
      const lat = req.query.lat;
      const lon = req.query.lon;
      
      const apiKey = process.env.VITE_OPENWEATHERMAP_API_KEY || process.env.OPENWEATHERMAP_API_KEY;

      if (!apiKey) {
        return res.status(401).json({ error: "Missing API key" });
      }

      if (!lat || !lon) {
        return res.status(400).json({ error: "lat and lon are required" });
      }

      const airRes = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
      );

      if (!airRes.ok) {
        const errorData = await airRes.json().catch(() => ({}));
        return res.status(airRes.status).json({ error: errorData.message || "Failed to fetch air pollution" });
      }

      const airData = await airRes.json();
      res.json(airData);

    } catch (e: any) {
      console.error("Error in /api/weather/air:", e);
      res.status(500).json({ error: e.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
