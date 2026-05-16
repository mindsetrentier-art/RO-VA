import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Flower2,
  CloudLightning,
  Snowflake,
  CloudFog,
  Activity
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

interface OpenWeatherMapAirPollution {
  list: {
    main: { aqi: number };
    components: { pm2_5: number; pm10: number };
  }[];
}

const getWeatherIcon = (code: number, size = 24, className = "") => {
  if (code >= 200 && code < 300) return <CloudLightning size={size} className={`text-yellow-500 drop-shadow-md ${className}`} />;
  if (code >= 300 && code < 600) return <CloudRain size={size} className={`text-blue-400 drop-shadow-md ${className}`} />;
  if (code >= 600 && code < 700) return <Snowflake size={size} className={`text-blue-200 drop-shadow-md ${className}`} />;
  if (code >= 700 && code < 800) return <CloudFog size={size} className={`text-slate-400 drop-shadow-md ${className}`} />;
  if (code === 800) return <Sun size={size} className={`text-amber-400 drop-shadow-md ${className}`} fill="currentColor" />;
  if (code > 800) return <Cloud size={size} className={`text-slate-300 drop-shadow-md ${className}`} fill="currentColor" opacity={0.9} />;
  return <Sun size={size} className={`text-amber-400 drop-shadow-md ${className}`} fill="currentColor" />;
};

const getAQIDescription = (aqi: number) => {
  switch (aqi) {
    case 1: return { text: "Excellente", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    case 2: return { text: "Bonne", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" };
    case 3: return { text: "Modérée", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    case 4: return { text: "Mauvaise", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" };
    case 5: return { text: "Très Mauvaise", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" };
    default: return { text: "Inconnue", color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20" };
  }
};

const getSimulatedPollen = (month: number, humidity: number) => {
  if (month >= 2 && month <= 8) {
    if (humidity > 70) return { level: "Faible", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    if (month >= 4 && month <= 6) return { level: "Élevé", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" };
    return { level: "Modéré", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
  }
  return { level: "Très Faible", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
};

export const WeatherView = () => {
  const [currentWeather, setCurrentWeather] = useState<OpenWeatherMapCurrent | null>(null);
  const [forecast, setForecast] = useState<OpenWeatherMapForecast | null>(null);
  const [airPollution, setAirPollution] = useState<OpenWeatherMapAirPollution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingApiKey, setMissingApiKey] = useState(false);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const [weatherRes, forecastRes, airRes] = await Promise.all([
          fetch(`/api/weather?lat=${lat}&lon=${lon}`),
          fetch(`/api/weather/forecast?lat=${lat}&lon=${lon}`),
          fetch(`/api/weather/air?lat=${lat}&lon=${lon}`),
        ]);

        if (weatherRes.status === 401 || forecastRes.status === 401 || airRes.status === 401) {
          setMissingApiKey(true);
          setLoading(false);
          return;
        }

        if (!weatherRes.ok || !forecastRes.ok) {
          const res = !weatherRes.ok ? weatherRes : forecastRes;
          let errorMessage = "Erreur de l'API OpenWeatherMap. Vérifiez la clé API.";
          try {
            const errorData = await res.clone().json();
            if (errorData.error) {
              if (errorData.error.includes("Invalid API key")) {
                errorMessage = "Clé API invalide ou en cours d'activation.\n\n⚠️ Info : Les nouvelles clés OpenWeatherMap (\ncelles gratuites) nécessitent généralement entre 1 et 2 heures pour s'activer.";
              } else {
                errorMessage = `Erreur OpenWeatherMap: ${errorData.error}`;
              }
            }
          } catch (e) {
            errorMessage = `Erreur de l'API OpenWeatherMap (Statut: ${res.status})`;
          }
          throw new Error(errorMessage);
        }

        const weatherData = await weatherRes.json();
        const forecastData = await forecastRes.json();
        const airData = airRes.ok ? await airRes.json() : null;

        setCurrentWeather(weatherData);
        setForecast(forecastData);
        setAirPollution(airData);
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
          console.error("Geolocation error, falling back to Paris:", error);
          // Fallback to Paris coordinates: 48.8566, 2.3522
          fetchWeather(48.8566, 2.3522);
        },
        { timeout: 10000, enableHighAccuracy: false, maximumAge: 300000 }
      );
    } else {
      console.warn("La géolocalisation n'est pas prise en charge par ce navigateur. Utilisation de Paris par défaut.");
      fetchWeather(48.8566, 2.3522);
    }
  }, []);

  if (missingApiKey) {
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
      existingDay.humidity = Math.max(existingDay.humidity || 0, item.main.humidity);
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
        humidity: item.main.humidity,
        weather: item.weather[0],
      });
    }
    return acc;
  }, []).slice(0, 5);

  const currentMonth = new Date().getMonth();
  const pollenStatus = getSimulatedPollen(currentMonth, currentWeather.main.humidity);
  const aqiValue = airPollution?.list?.[0]?.main?.aqi || 0;
  const aqiInfo = getAQIDescription(aqiValue);

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
        className="relative overflow-hidden p-6 lg:p-8 bg-gradient-to-br from-[var(--card)] to-[var(--bg)] border border-[var(--border)] rounded-[2rem] shadow-xl"
      >
        <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none blur-sm">
          {getWeatherIcon(currentWeather.weather[0].id, 240)}
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-4 mb-3">
              {getWeatherIcon(currentWeather.weather[0].id, 48)}
              <span className="text-sm font-bold text-[var(--text)] uppercase tracking-widest bg-[var(--bg)]/50 backdrop-blur-md px-3 py-1 rounded-full border border-[var(--border)]">
                {currentWeather.weather[0].description}
              </span>
            </div>
            <div className="text-7xl lg:text-9xl font-black text-[var(--text)] tracking-tighter drop-shadow-sm">
              {Math.round(currentWeather.main.temp)}°
            </div>
            <p className="text-sm font-medium text-[var(--text-muted)] mt-2">
              Ressenti: {Math.round(currentWeather.main.feels_like)}°
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full md:w-auto">
            <div className="p-4 bg-[var(--card)]/80 backdrop-blur-md rounded-2xl border border-[var(--border)] shadow-sm flex flex-col items-center justify-center text-center">
              <Wind className="text-sky-400 mb-2 drop-shadow-sm" size={24} />
              <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] whitespace-nowrap">Vent</p>
              <p className="text-base lg:text-lg font-black text-[var(--text)] mt-1">{Math.round(currentWeather.wind.speed * 3.6)} <span className="text-[10px]">km/h</span></p>
            </div>
            <div className="p-4 bg-[var(--card)]/80 backdrop-blur-md rounded-2xl border border-[var(--border)] shadow-sm flex flex-col items-center justify-center text-center">
              <Droplets className="text-blue-400 mb-2 drop-shadow-sm" size={24} />
              <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] whitespace-nowrap">Humidité</p>
              <p className="text-base lg:text-lg font-black text-[var(--text)] mt-1">{currentWeather.main.humidity}%</p>
            </div>
            
            {airPollution && (
              <div className={`p-4 ${aqiInfo.bg} backdrop-blur-md rounded-2xl border ${aqiInfo.border} shadow-sm flex flex-col items-center justify-center text-center`}>
                <Activity className={`${aqiInfo.color} mb-2 drop-shadow-sm`} size={24} />
                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] whitespace-nowrap">Pollution</p>
                <p className={`text-xs lg:text-sm font-black ${aqiInfo.color} mt-1`}>{aqiInfo.text}</p>
              </div>
            )}
            
            <div className={`p-4 ${pollenStatus.bg} backdrop-blur-md rounded-2xl border ${pollenStatus.border} shadow-sm flex flex-col items-center justify-center text-center`}>
               <Flower2 className={`${pollenStatus.color} mb-2 drop-shadow-sm`} size={24} />
               <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] whitespace-nowrap">Pollen</p>
               <p className={`text-xs lg:text-sm font-black ${pollenStatus.color} mt-1`}>{pollenStatus.level}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Forecast */}
      <div>
        <div className="flex items-center gap-2 mb-4 ml-1">
          <CalendarDays className="text-[var(--text-muted)]" size={20} />
          <h2 className="text-sm font-black text-[var(--text)] uppercase tracking-widest drop-shadow-sm">
            Prévisions sur 5 jours
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {dailyForecasts.map((day, index) => {
            // Simplify simulated pollen per day based on its humidity
            const dayPollen = getSimulatedPollen(currentMonth, day.humidity);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-5 rounded-3xl bg-gradient-to-b from-[var(--card)] to-[var(--bg)] border border-[var(--border)] shadow-md flex flex-col items-center justify-between text-center gap-3 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                    {day.date.split(" ")[0]}
                  </p>
                  <p className="text-sm font-bold text-[var(--text)] mt-1">{day.date.split(" ")[1]}</p>
                </div>
                
                <div className="scale-125 my-2">
                  {getWeatherIcon(day.weather.id, 32)}
                </div>

                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] line-clamp-1 mb-1">
                  {day.weather.description}
                </p>
                
                <div className="flex items-center gap-2 mb-2 w-full justify-center">
                  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${aqiInfo.bg} ${aqiInfo.border} ${aqiInfo.color}`} title={`Pollution: ${aqiInfo.text}`}>
                    <Activity size={10} />
                    <span className="text-[8px] font-black uppercase">{aqiInfo.text.substring(0,3)}</span>
                  </div>
                  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${dayPollen.bg} ${dayPollen.border} ${dayPollen.color}`} title={`Pollen: ${dayPollen.level}`}>
                    <Flower2 size={10} />
                    <span className="text-[8px] font-black uppercase">{dayPollen.level.substring(0,3)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)] w-full justify-center">
                  <span className="text-base font-black text-[var(--text)]">{Math.round(day.temp_max)}°</span>
                  <span className="text-sm font-bold text-[var(--text-muted)]">{Math.round(day.temp_min)}°</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
};

export const WeatherWidget = () => {
  const [currentWeather, setCurrentWeather] = useState<OpenWeatherMapCurrent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingApiKey, setMissingApiKey] = useState(false);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const weatherRes = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        
        if (weatherRes.status === 401) {
          setMissingApiKey(true);
          setLoading(false);
          return;
        }

        if (!weatherRes.ok) {
          throw new Error("Erreur météo");
        }

        const weatherData = await weatherRes.json();
        setCurrentWeather(weatherData);
        setLoading(false);
      } catch (err: any) {
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
          fetchWeather(48.8566, 2.3522);
        },
        { timeout: 10000, enableHighAccuracy: false, maximumAge: 300000 }
      );
    } else {
      fetchWeather(48.8566, 2.3522);
    }
  }, []);

  if (missingApiKey || error || !currentWeather) {
    // Return a minimal error or placeholder state
    return (
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[var(--card)] to-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-sm text-xs opacity-70">
         <CloudRain size={20} className="text-[var(--text-muted)]" />
         <div>
           <p className="font-bold text-[var(--text)]">Météo Indisponible</p>
           <p className="text-[10px] text-[var(--text-muted)]">Données locales</p>
         </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl animate-pulse">
        <div className="w-8 h-8 rounded-full bg-[var(--border)]" />
        <div className="space-y-1">
           <div className="w-16 h-3 bg-[var(--border)] rounded" />
           <div className="w-10 h-2 bg-[var(--border)] rounded" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden p-4 bg-gradient-to-br from-[var(--card)] to-[var(--bg)] border border-[var(--border)] rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex items-center justify-between"
    >
      <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none blur-sm">
        {getWeatherIcon(currentWeather.weather[0].id, 100)}
      </div>

      <div className="flex items-center gap-4 relative z-10 w-full">
        <div className="p-2.5 bg-[var(--bg)]/50 backdrop-blur-md rounded-2xl shadow-inner border border-white/5">
           {getWeatherIcon(currentWeather.weather[0].id, 28)}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] bg-[var(--primary)]/10 px-1.5 py-0.5 rounded-md">
              {currentWeather.name}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black tabular-nums tracking-tighter text-[var(--text)] drop-shadow-sm">
              {Math.round(currentWeather.main.temp)}°
            </span>
            <span className="text-xs font-bold text-[var(--text-muted)] capitalize">
              {currentWeather.weather[0].description}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1 items-end pl-2 border-l border-[var(--border)]">
          <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-muted)]">
            <Wind size={10} className="text-sky-400" />
            {Math.round(currentWeather.wind.speed * 3.6)} <span className="opacity-50">km/h</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-muted)]">
             <Droplets size={10} className="text-blue-400" />
             {currentWeather.main.humidity}%
          </div>
        </div>
      </div>
    </motion.div>
  );
};
