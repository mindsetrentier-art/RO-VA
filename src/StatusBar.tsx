import React, { useState, useEffect } from "react";
import { Clock, Calendar, MapPin, Cloud, Zap, CloudRain, Sun } from "lucide-react";

export const StatusBar = () => {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<{ temp: number; description: string; icon: number; city: string } | null>(null);
  const API_KEY = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!API_KEY) return;

    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fr`
        );
        if (!res.ok) return;
        const data = await res.json();
        setWeather({
          temp: Math.round(data.main.temp),
          description: data.weather[0].description,
          icon: data.weather[0].id,
          city: data.name,
        });
      } catch (err) {}
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(48.8566, 2.3522) // Paris fallback
      );
    } else {
      fetchWeather(48.8566, 2.3522);
    }
  }, [API_KEY]);

  const getWeatherIcon = (code: number) => {
    if (code >= 200 && code < 300) return <Zap size={12} />;
    if (code >= 300 && code < 600) return <CloudRain size={12} />;
    if (code >= 600 && code < 700) return <Cloud size={12} />;
    if (code >= 700 && code < 800) return <Cloud size={12} />;
    if (code === 800) return <Sun size={12} />;
    if (code > 800) return <Cloud size={12} />;
    return <Sun size={12} />;
  };

  const formattedDate = time.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  const formattedTime = time.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="fixed top-0 left-0 h-8 w-full bg-[var(--primary)] text-white text-[10px] md:text-xs font-medium flex items-center justify-between px-4 sm:px-6 shadow-md z-[60] shrink-0">
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-1.5 opacity-90">
          <Calendar size={12} />
          <span className="capitalize">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold">
          <Clock size={12} />
          <span>{formattedTime}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-1.5 opacity-90 truncate max-w-[100px] sm:max-w-none">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">{weather ? weather.city : "Position"}</span>
        </div>
        
        {weather && (
          <div className="flex items-center gap-3 bg-white/20 px-2.5 py-1 rounded-full">
            <div className="flex items-center gap-1.5">
               {getWeatherIcon(weather.icon)}
               <span className="capitalize">{weather.description}</span>
            </div>
            <div className="w-px h-3 bg-white/30"></div>
            <span className="font-bold">{weather.temp}°C</span>
          </div>
        )}
      </div>
    </div>
  );
};
