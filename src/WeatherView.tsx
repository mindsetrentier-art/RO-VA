import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  MapPin,
  CalendarDays,
  Zap,
  Key,
  AlertTriangle,
  MapPinOff,
  RefreshCw,
} from "lucide-react";

interface OpenWeatherMapCurrent {
  weather: { id: number; description: string; icon: string }[];
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number };
  name: string;
}

interface OpenWeatherMapForecast {
  list: {
    dt: number;
    main: { temp_min: number; temp_max: number };
    weather: { id: number; description: string; icon: string }[];
  }[];
}

const getWeatherIcon = (code: number, size = 24, className = "") => {
  if (code >= 200 && code < 300) return <Zap size={size} className={className} />;
  if (code >= 300 && code < 600) return <CloudRain size={size} className={className} />;
  if (code >= 600 && code < 700) return <Cloud size={size} className={className} />; // Snow
  if (code >= 700 && code < 800) return <Cloud size={size} className={className} />; // Mist
  if (code === 800) return <Sun size={size} className={className} />;
  if (code > 800) return <Cloud size={size} className={className} />;
  return <Sun size={size} className={className} />;
};

export const WeatherView = () => {
  const [currentWeather, setCurrentWeather] = useState<OpenWeatherMapCurrent | null>(null);
  const [forecast, setForecast] = useState<OpenWeatherMapForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_KEY = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;

  useEffect(() => {
    if (!API_KEY) {
      setLoading(false);
      return;
    }

    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const [weatherRes, forecastRes] = await Promise.all([
          fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fr`
          ),
          fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fr`
          ),
        ]);

        if (!weatherRes.ok || !forecastRes.ok) {
          const res = !weatherRes.ok ? weatherRes : forecastRes;
          let errorMessage = "Erreur de l'API OpenWeatherMap. Vérifiez la clé API.";
          try {
            const errorData = await res.clone().json();
            if (errorData.message) {
              if (errorData.message.includes("Invalid API key")) {
                errorMessage = "Clé API invalide ou en cours d'activation.\n\n⚠️ Info : Les nouvelles clés OpenWeatherMap (\ncelles gratuites) nécessitent généralement entre 1 et 2 heures pour s'activer.";
              } else {
                errorMessage = `Erreur OpenWeatherMap: ${errorData.message}`;
              }
            }
          } catch (e) {
            errorMessage = `Erreur de l'API OpenWeatherMap (Statut: ${res.status})`;
          }
          throw new Error(errorMessage);
        }

        const weatherData = await weatherRes.json();
        const forecastData = await forecastRes.json();

        setCurrentWeather(weatherData);
        setForecast(forecastData);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching weather:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setError("Impossible de déterminer votre position. Veuillez autoriser l'accès à la localisation dans votre navigateur.");
          setLoading(false);
        }
      );
    } else {
      setError("La géolocalisation n'est pas prise en charge par ce navigateur.");
      setLoading(false);
    }
  }, [API_KEY]);

  if (!API_KEY) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center px-4 space-y-6">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-2 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
          <Key size={32} />
        </div>
        <h2 className="text-2xl font-black text-rose-500 tracking-tighter">Clé API Manquante</h2>
        <div className="bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)] shadow-lg text-left w-full space-y-4">
          <p className="text-sm text-[var(--text)] font-semibold">
            Pour utiliser OpenWeatherMap, vous devez fournir une clé API. Voici comment faire :
          </p>
          <div className="bg-[var(--bg)] p-4 rounded-xl border border-dashed border-[var(--border)] space-y-4">
            <ol className="text-sm text-[var(--text-muted)] font-medium list-decimal list-inside space-y-3">
              <li>Allez sur <a href="https://home.openweathermap.org/users/sign_up" target="_blank" rel="noreferrer" className="text-[var(--primary)] underline hover:text-[var(--primary)]/80">openweathermap.org/users/sign_up</a> et créez un compte.</li>
              <li>Allez dans l'onglet <strong>API keys</strong> (en haut à droite, sous votre nom d'utilisateur).</li>
              <li>Générez une nouvelle clé ou copiez la clé par défaut.</li>
              <li>Dans AI Studio, ouvrez le panneau <strong>Settings</strong> (en haut à droite) et descendez jusqu'à <strong>Environment Variables</strong>.</li>
              <li>Ajoutez une nouvelle variable avec :
                <div className="mt-2 p-3 bg-[var(--card)] rounded-lg text-xs font-mono font-bold break-all border border-[var(--border)]">
                  Clé: <span className="text-[var(--primary)]">VITE_OPENWEATHERMAP_API_KEY</span><br/>
                  Valeur: votre_cle_api_secrete
                </div>
              </li>
              <li className="text-amber-500 font-bold">⚠️ Attention : Une nouvelle clé peut prendre 1 à 2 heures avant de fonctionner.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
     const isLocationError = error.includes("position") || error.includes("géolocalisation");
     return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4 text-center max-w-lg mx-auto">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
           {isLocationError ? <MapPinOff size={32} /> : <AlertTriangle size={32} />}
        </div>
        <h2 className="text-2xl font-black text-amber-500 tracking-tighter">
          {isLocationError ? "Localisation Requise" : "Une erreur est survenue"}
        </h2>
        <div className="bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)] shadow-lg text-left w-full space-y-4">
          <p className="text-sm font-semibold text-[var(--text)] whitespace-pre-line">
            {error}
          </p>
          <div className="bg-[var(--bg)] p-4 rounded-xl border border-dashed border-[var(--border)] text-xs text-[var(--text-muted)] font-medium space-y-2">
            <p className="font-bold text-[var(--text)] uppercase tracking-widest text-[10px]">Solutions possibles :</p>
            {isLocationError ? (
               <ul className="list-disc list-inside space-y-1">
                 <li>Vérifiez que le GPS/localisation de votre appareil est activé.</li>
                 <li>Cliquez sur l'icône de cadenas dans la barre d'adresse du navigateur.</li>
                 <li>Assurez-vous que l'autorisation "Position" est "Autorisée".</li>
                 <li>Actualisez la page après avoir modifié les paramètres.</li>
               </ul>
            ) : (
               <ul className="list-disc list-inside space-y-1">
                 <li>Si vous venez de créer la clé, <strong>patientez 1 à 2 heures</strong>.</li>
                 <li>Vérifiez que la clé est correctement copiée dans les Settings.</li>
                 <li>Vérifiez l'absence d'espaces avant ou après la clé.</li>
               </ul>
            )}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-xl font-bold transition-colors shadow-lg shadow-amber-500/20"
          >
            <RefreshCw size={18} />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (loading || !currentWeather || !forecast) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-t-transparent border-[var(--primary)] rounded-full animate-spin" />
        <p className="text-sm font-bold text-[var(--text-muted)] animate-pulse uppercase tracking-widest">
          Analyse atmosphérique...
        </p>
      </div>
    );
  }

  // Aggregate forecast by day
  const dailyForecasts = forecast.list.reduce((acc: any[], item: any) => {
    const date = new Date(item.dt * 1000).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
    const existingDay = acc.find((d: any) => d.date === date);
    
    if (existingDay) {
      existingDay.temp_min = Math.min(existingDay.temp_min, item.main.temp_min);
      existingDay.temp_max = Math.max(existingDay.temp_max, item.main.temp_max);
      // Try to get midday weather icon if possible
      const hour = new Date(item.dt * 1000).getHours();
      if (hour >= 11 && hour <= 15) {
        existingDay.weather = item.weather[0];
      }
    } else {
      acc.push({
        date,
        temp_min: item.main.temp_min,
        temp_max: item.main.temp_max,
        weather: item.weather[0],
      });
    }
    return acc;
  }, []).slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-4xl mx-auto">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="text-[var(--primary)]" size={18} />
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
              {currentWeather.name || "Position Actuelle"}
            </p>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-[var(--text)] tracking-tighter">
            Météo Actuelle
          </h1>
        </div>
      </header>

      {/* Current Weather Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden p-6 lg:p-8 bg-gradient-to-br from-[var(--card)] to-[var(--bg)] border border-[var(--border)] rounded-3xl shadow-lg"
      >
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          {getWeatherIcon(currentWeather.weather[0].id, 200)}
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-4 mb-2">
              {getWeatherIcon(currentWeather.weather[0].id, 40, "text-[var(--primary)]")}
              <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">
                {currentWeather.weather[0].description}
              </span>
            </div>
            <div className="text-6xl lg:text-8xl font-black text-[var(--text)] tracking-tighter">
              {Math.round(currentWeather.main.temp)}°
            </div>
            <p className="text-sm font-medium text-[var(--text-muted)] mt-2">
              Ressenti: {Math.round(currentWeather.main.feels_like)}°
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="p-4 bg-[var(--bg)]/50 backdrop-blur-sm rounded-2xl border border-[var(--border)]">
              <Wind className="text-blue-400 mb-2" size={20} />
              <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Vent</p>
              <p className="text-lg font-black text-[var(--text)]">{Math.round(currentWeather.wind.speed * 3.6)} <span className="text-xs">km/h</span></p>
            </div>
            <div className="p-4 bg-[var(--bg)]/50 backdrop-blur-sm rounded-2xl border border-[var(--border)]">
              <Droplets className="text-blue-400 mb-2" size={20} />
              <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Humidité</p>
              <p className="text-lg font-black text-[var(--text)]">{currentWeather.main.humidity}%</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Forecast */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="text-[var(--text-muted)]" size={18} />
          <h2 className="text-sm font-black text-[var(--text)] uppercase tracking-widest">
            Prévisions sur 5 jours
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {dailyForecasts.map((day, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col items-center justify-between text-center gap-3"
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                  {day.date.split(" ")[0]}
                </p>
                <p className="text-xs font-bold text-[var(--text)]">{day.date.split(" ")[1]}</p>
              </div>
              
              {getWeatherIcon(day.weather.id, 28, "text-[var(--text)]")}
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-[var(--text)]">{Math.round(day.temp_max)}°</span>
                <span className="text-xs font-bold text-[var(--text-muted)]">{Math.round(day.temp_min)}°</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
    </div>
  );
};
