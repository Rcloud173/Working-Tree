import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, MapPin, RefreshCw, Wind, Droplets, Eye, Thermometer,
  CloudRain, Sun, Cloud, CloudSnow, Zap, AlertTriangle, Heart,
  Navigation, Sprout, Bug, Tractor, ChevronRight, X, Star,
  CloudDrizzle, Umbrella, ArrowUp, ArrowDown, Clock, Info,
  CheckCircle, AlertCircle, Leaf, Waves
} from 'lucide-react';

// ============================================================================
// ✅ API PLACEHOLDER FUNCTIONS
// Replace these with actual API calls to your backend
// ============================================================================
const API_BASE = 'http://localhost:5000/api';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const weatherApi = {
  // TODO: GET ${API_BASE}/weather?location=${location}
  // Returns: { current, location, aqi }
  fetchWeather: async (location) => {
    await delay(900);
    return DEMO_WEATHER(location);
  },

  // TODO: GET ${API_BASE}/weather/forecast?location=${location}
  // Returns: { daily: [...], hourly: [...] }
  fetchForecast: async (location) => {
    await delay(700);
    return DEMO_FORECAST;
  },

  // TODO: GET ${API_BASE}/weather/alerts?location=${location}
  // Returns: { alerts: [...] }
  fetchWeatherAlerts: async (location) => {
    await delay(500);
    return DEMO_ALERTS;
  },

  // TODO: GET ${API_BASE}/weather/farming-insights?location=${location}&conditions=${JSON}
  // Returns: { insights: [...] }
  fetchFarmingInsights: async (location, conditions) => {
    await delay(600);
    return DEMO_FARMING_INSIGHTS(conditions);
  },
};

// ============================================================================
// DEMO DATA — Remove when backend is connected
// ============================================================================
const DEMO_WEATHER = (location) => ({
  location: location || 'Bijnor, Uttar Pradesh',
  country: 'India',
  lat: 29.37,
  lon: 78.14,
  temperature: 28,
  feelsLike: 31,
  humidity: 72,
  windSpeed: 14,
  windDirection: 'SW',
  visibility: 8,
  pressure: 1012,
  uvIndex: 7,
  rainProbability: 35,
  condition: 'Partly Cloudy',
  conditionCode: 'partly-cloudy',
  icon: '⛅',
  aqi: 82,
  aqiLabel: 'Moderate',
  dewPoint: 21,
  cloudCover: 45,
  updatedAt: new Date().toISOString(),
});

const HOURLY_DATA = [
  { time: '6 AM', temp: 23, rain: 5, icon: '🌤️' },
  { time: '8 AM', temp: 25, rain: 8, icon: '⛅' },
  { time: '10 AM', temp: 27, rain: 15, icon: '⛅' },
  { time: '12 PM', temp: 29, rain: 25, icon: '🌦️' },
  { time: '2 PM', temp: 31, rain: 40, icon: '🌧️' },
  { time: '4 PM', temp: 30, rain: 55, icon: '🌧️' },
  { time: '6 PM', temp: 28, rain: 45, icon: '🌦️' },
  { time: '8 PM', temp: 26, rain: 20, icon: '⛅' },
  { time: '10 PM', temp: 24, rain: 10, icon: '🌙' },
];

const DEMO_FORECAST = {
  daily: [
    { day: 'Today', high: 31, low: 22, condition: 'Partly Cloudy', icon: '⛅', rain: 35, humidity: 72 },
    { day: 'Tue', high: 29, low: 21, condition: 'Rainy', icon: '🌧️', rain: 80, humidity: 88 },
    { day: 'Wed', high: 26, low: 20, condition: 'Heavy Rain', icon: '⛈️', rain: 92, humidity: 92 },
    { day: 'Thu', high: 28, low: 21, condition: 'Cloudy', icon: '☁️', rain: 40, humidity: 78 },
    { day: 'Fri', high: 32, low: 23, condition: 'Sunny', icon: '☀️', rain: 5, humidity: 55 },
    { day: 'Sat', high: 33, low: 24, condition: 'Sunny', icon: '☀️', rain: 3, humidity: 50 },
    { day: 'Sun', high: 30, low: 22, condition: 'Partly Cloudy', icon: '⛅', rain: 20, humidity: 65 },
  ],
  hourly: HOURLY_DATA,
};

const DEMO_ALERTS = [
  {
    id: 'a1',
    type: 'warning',
    title: 'Heavy Rainfall Expected',
    description: 'Heavy to very heavy rainfall predicted on Wednesday. Harvest ready crops immediately.',
    severity: 'high',
    validFrom: '2024-07-10T00:00:00',
    validTo: '2024-07-10T23:59:00',
  },
  {
    id: 'a2',
    type: 'info',
    title: 'Wind Advisory',
    description: 'Moderate winds (30-40 km/h) expected. Secure young plants and greenhouse covers.',
    severity: 'medium',
    validFrom: '2024-07-09T12:00:00',
    validTo: '2024-07-09T20:00:00',
  },
];

const DEMO_FARMING_INSIGHTS = (conditions) => {
  const rain = conditions?.rainProbability || 35;
  const temp = conditions?.temperature || 28;
  const humidity = conditions?.humidity || 72;

  return [
    {
      id: 'i1',
      type: 'irrigation',
      icon: '💧',
      title: rain > 60 ? 'Skip Irrigation Today' : 'Irrigation Recommended',
      description: rain > 60
        ? 'Rain expected. Turn off drip systems to avoid waterlogging and root rot.'
        : 'Low rain probability. Irrigate wheat and rice fields in early morning (5-7 AM) to reduce evaporation.',
      priority: rain > 60 ? 'medium' : 'high',
      color: '#3b82f6',
    },
    {
      id: 'i2',
      type: 'crop',
      icon: '🌾',
      title: temp > 35 ? 'Heat Stress Risk' : 'Good Growing Conditions',
      description: temp > 35
        ? 'High temperatures may cause heat stress. Increase irrigation frequency and apply mulch.'
        : `Temperature of ${temp}°C is optimal for kharif crops. Good time for transplanting rice seedlings.`,
      priority: temp > 35 ? 'high' : 'low',
      color: '#16a34a',
    },
    {
      id: 'i3',
      type: 'pest',
      icon: '🐛',
      title: humidity > 80 ? 'High Fungal Disease Risk' : 'Monitor for Pests',
      description: humidity > 80
        ? 'High humidity creates favorable conditions for fungal diseases. Apply preventive fungicides to wheat.'
        : 'Conditions favorable for aphids. Inspect undersides of leaves. Consider neem oil spray if population increases.',
      priority: humidity > 80 ? 'high' : 'medium',
      color: '#dc2626',
    },
    {
      id: 'i4',
      type: 'harvest',
      icon: '🌿',
      title: 'Harvest Planning',
      description: rain > 70
        ? 'Postpone harvesting operations. Rain may damage mature crops. Arrange for proper storage.'
        : 'Good window for harvesting. Use next 2-3 days before rain arrives mid-week.',
      priority: rain > 70 ? 'high' : 'medium',
      color: '#d97706',
    },
  ];
};

const DEMO_FAVORITE_LOCATIONS = [
  { id: 'f1', name: 'Bijnor, UP', temp: 28, icon: '⛅' },
  { id: 'f2', name: 'Ludhiana, Punjab', temp: 32, icon: '☀️' },
  { id: 'f3', name: 'Nashik, Maharashtra', temp: 25, icon: '🌧️' },
];

// ============================================================================
// UTILITY
// ============================================================================
const priorityColors = {
  high: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', badge: '#fee2e2' },
  medium: { bg: '#fffbeb', border: '#fde68a', text: '#d97706', badge: '#fef3c7' },
  low: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', badge: '#dcfce7' },
};

const alertColors = {
  warning: { bg: '#fef2f2', border: '#fecaca', icon: '🚨', text: '#dc2626' },
  info: { bg: '#eff6ff', border: '#bfdbfe', icon: 'ℹ️', text: '#2563eb' },
};

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

const SkeletonBlock = ({ w = '100%', h = '1rem', rounded = '0.5rem', mb = '0' }) => (
  <div style={{
    width: w, height: h, borderRadius: rounded, marginBottom: mb,
    background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  }} />
);

const StatBadge = ({ icon: Icon, label, value, unit = '' }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
    padding: '0.75rem', background: 'rgba(255,255,255,0.15)', borderRadius: '0.75rem',
    backdropFilter: 'blur(8px)', minWidth: '70px',
  }}>
    <Icon size={16} style={{ color: 'rgba(255,255,255,0.85)' }} />
    <span style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>{value}{unit}</span>
    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.75)', textAlign: 'center', letterSpacing: '0.03em' }}>{label}</span>
  </div>
);

const HourlyChart = ({ data }) => {
  const maxTemp = Math.max(...data.map(d => d.temp));
  const minTemp = Math.min(...data.map(d => d.temp));
  const range = maxTemp - minTemp || 1;

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', minWidth: 'max-content', padding: '0.5rem 0.25rem' }}>
        {data.map((hour, i) => {
          const heightPct = ((hour.temp - minTemp) / range) * 60 + 30;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', minWidth: '56px' }}>
              <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: '500' }}>{hour.rain}%</span>
              <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end' }}>
                <div style={{
                  width: '28px', height: `${heightPct}%`, minHeight: '12px',
                  background: `linear-gradient(180deg, #10b981, #34d399)`,
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.4s ease',
                  boxShadow: '0 2px 6px rgba(16,185,129,0.3)',
                }} />
              </div>
              <span style={{ fontSize: '0.85rem' }}>{hour.icon}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1f2937' }}>{hour.temp}°</span>
              <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{hour.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const InsightCard = ({ insight }) => {
  const colors = priorityColors[insight.priority];
  return (
    <div style={{
      background: colors.bg, border: `1.5px solid ${colors.border}`,
      borderRadius: '1rem', padding: '1rem 1.1rem',
      display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{insight.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1f2937', fontFamily: "'Lora', Georgia, serif" }}>{insight.title}</span>
          <span style={{
            fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em',
            padding: '2px 6px', borderRadius: '999px', background: colors.badge, color: colors.text,
          }}>{insight.priority}</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#4b5563', lineHeight: '1.5', margin: 0 }}>{insight.description}</p>
      </div>
    </div>
  );
};

const ForecastCard = ({ day, isToday }) => (
  <div style={{
    background: isToday ? 'linear-gradient(135deg, #065f46, #047857)' : '#fff',
    border: isToday ? 'none' : '1.5px solid #e5e7eb',
    borderRadius: '1rem', padding: '1rem 0.75rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
    minWidth: '90px', flex: '1',
    boxShadow: isToday ? '0 8px 24px rgba(6,95,70,0.25)' : 'none',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'default',
  }}
    onMouseEnter={e => { if (!isToday) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.1)'; } }}
    onMouseLeave={e => { if (!isToday) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; } }}
  >
    <span style={{ fontSize: '0.7rem', fontWeight: '700', color: isToday ? 'rgba(255,255,255,0.8)' : '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{day.day}</span>
    <span style={{ fontSize: '1.6rem' }}>{day.icon}</span>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span style={{ fontSize: '0.9rem', fontWeight: '800', color: isToday ? '#fff' : '#1f2937' }}>{day.high}°</span>
      <span style={{ fontSize: '0.75rem', color: isToday ? 'rgba(255,255,255,0.65)' : '#9ca3af' }}>{day.low}°</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
      <CloudRain size={10} style={{ color: isToday ? 'rgba(255,255,255,0.8)' : '#3b82f6' }} />
      <span style={{ fontSize: '0.65rem', color: isToday ? 'rgba(255,255,255,0.8)' : '#3b82f6', fontWeight: '600' }}>{day.rain}%</span>
    </div>
  </div>
);

const AlertCard = ({ alert }) => {
  const colors = alertColors[alert.type] || alertColors.info;
  return (
    <div style={{
      background: colors.bg, border: `1.5px solid ${colors.border}`,
      borderRadius: '1rem', padding: '1rem 1.1rem',
      display: 'flex', gap: '0.75rem',
    }}>
      <span style={{ fontSize: '1.2rem' }}>{colors.icon}</span>
      <div>
        <p style={{ margin: '0 0 0.2rem', fontWeight: '700', fontSize: '0.85rem', color: '#1f2937', fontFamily: "'Lora', Georgia, serif" }}>{alert.title}</p>
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#4b5563', lineHeight: '1.5' }}>{alert.description}</p>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN WEATHER PAGE
// ============================================================================
const WeatherPage = () => {
  const [locationInput, setLocationInput] = useState('');
  const [activeLocation, setActiveLocation] = useState('Bijnor, Uttar Pradesh');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(DEMO_FAVORITE_LOCATIONS);
  const [isFavorited, setIsFavorited] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('insights'); // insights | alerts | favorites
  const searchRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadAllData = useCallback(async (location, isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [weatherData, forecastData, alertData] = await Promise.all([
        weatherApi.fetchWeather(location),
        weatherApi.fetchForecast(location),
        weatherApi.fetchWeatherAlerts(location),
      ]);
      setWeather(weatherData);
      setForecast(forecastData);
      setAlerts(alertData);

      // Load farming insights based on weather conditions
      const insightData = await weatherApi.fetchFarmingInsights(location, weatherData);
      setInsights(insightData);

      setIsFavorited(favorites.some(f => f.name.toLowerCase().includes(location.split(',')[0].toLowerCase())));
      if (isRefresh) showToast('Weather data updated!');
    } catch (e) {
      setError('Failed to load weather data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [favorites]);

  useEffect(() => {
    loadAllData(activeLocation);
  }, [activeLocation]);

  const handleSearch = (e) => {
    e?.preventDefault();
    const q = locationInput.trim();
    if (!q) return;
    setActiveLocation(q);
    setLocationInput('');
  };

  const handleGPS = () => {
    setGpsLoading(true);
    // TODO: navigator.geolocation.getCurrentPosition → reverse geocode → setActiveLocation
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        // TODO: call reverse geocode API with pos.coords.latitude, pos.coords.longitude
        setGpsLoading(false);
        showToast('GPS location detected!');
        // setActiveLocation(geocodedCityName);
      },
      () => {
        setGpsLoading(false);
        showToast('GPS access denied. Enter location manually.', 'error');
      }
    );
    // Fallback if geolocation not available
    if (!navigator.geolocation) {
      setTimeout(() => {
        setGpsLoading(false);
        showToast('GPS not supported. Enter location manually.', 'error');
      }, 1000);
    }
  };

  const toggleFavorite = () => {
    if (!weather) return;
    if (isFavorited) {
      setFavorites(prev => prev.filter(f => !f.name.toLowerCase().includes(activeLocation.split(',')[0].toLowerCase())));
      setIsFavorited(false);
      showToast('Removed from favorites');
    } else {
      const newFav = { id: `f-${Date.now()}`, name: weather.location, temp: weather.temperature, icon: weather.icon };
      setFavorites(prev => [...prev, newFav]);
      setIsFavorited(true);
      showToast('Added to favorites!');
    }
  };

  const getBgGradient = () => {
    if (!weather) return 'linear-gradient(135deg, #065f46, #047857)';
    const code = weather.conditionCode;
    if (code?.includes('rain') || code?.includes('storm')) return 'linear-gradient(135deg, #1e3a5f, #2563eb)';
    if (code?.includes('cloud')) return 'linear-gradient(135deg, #374151, #4b5563)';
    if (code?.includes('snow')) return 'linear-gradient(135deg, #1e40af, #60a5fa)';
    return 'linear-gradient(135deg, #065f46, #047857)';
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #f3f4f6; }
        ::-webkit-scrollbar-thumb { background: #d1fae5; border-radius: 2px; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          background: toast.type === 'error' ? '#dc2626' : '#065f46',
          color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '0.75rem',
          fontSize: '0.85rem', fontWeight: '600', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          animation: 'fadeIn 0.3s ease',
        }}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Sticky top bar - exact match to KrishiConnect Home top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #e8edf2',
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '0 24px', height: 64,
        boxShadow: '0 1px 0 rgb(0 0 0 / 0.04)',
      }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#166534' }}>🌦️ Weather</span>
        <div style={{ flex: 1, maxWidth: 400, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input
            type="search"
            placeholder="Search city, district, or village..."
            value={locationInput}
            onChange={e => setLocationInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearch(e))}
            style={{
              width: '100%', paddingLeft: 40, paddingRight: 16, paddingTop: 9, paddingBottom: 9,
              fontSize: 13, background: '#f8fafc', border: '1.5px solid #e8edf2', borderRadius: 99,
              fontFamily: "'DM Sans', sans-serif", color: '#1e293b', outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <button
            onClick={() => loadAllData(activeLocation, true)}
            disabled={refreshing || loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white',
              borderRadius: 11, fontSize: 13, fontWeight: 700,
              boxShadow: '0 3px 10px rgb(22 163 74 / 0.3)', border: 'none', cursor: 'pointer',
              opacity: (refreshing || loading) ? 0.7 : 1, transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={16} style={{ flexShrink: 0 }} />
            {refreshing ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '24px 20px 3rem' }}>

        {/* ── SEARCH BAR ── */}
        <form onSubmit={handleSearch} style={{
          display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search city, district, or village..."
              value={locationInput}
              onChange={e => setLocationInput(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                border: '1.5px solid #e5e7eb', borderRadius: '0.75rem',
                fontSize: '0.875rem', background: '#fff', outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                fontFamily: "'DM Sans', sans-serif",
              }}
              onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <button type="submit" style={{
            padding: '0.75rem 1.25rem', background: '#10b981', color: '#fff',
            border: 'none', borderRadius: '0.75rem', cursor: 'pointer',
            fontWeight: '600', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif",
            transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.target.style.background = '#059669'}
            onMouseLeave={e => e.target.style.background = '#10b981'}
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleGPS}
            disabled={gpsLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.75rem 1rem', background: '#fff',
              border: '1.5px solid #e5e7eb', borderRadius: '0.75rem',
              cursor: 'pointer', fontSize: '0.82rem', fontWeight: '500',
              color: '#374151', transition: 'all 0.2s',
            }}
          >
            <Navigation size={14} style={{ color: gpsLoading ? '#9ca3af' : '#10b981', animation: gpsLoading ? 'pulse 1s ease infinite' : 'none' }} />
            {gpsLoading ? 'Detecting...' : 'Use GPS'}
          </button>
        </form>

        {/* ── ERROR STATE ── */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '1rem',
            padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem',
          }}>
            <AlertCircle size={32} style={{ color: '#dc2626', marginBottom: '0.5rem' }} />
            <p style={{ color: '#991b1b', fontWeight: '600' }}>{error}</p>
            <button onClick={() => loadAllData(activeLocation)} style={{
              marginTop: '0.75rem', padding: '0.5rem 1.25rem',
              background: '#dc2626', color: '#fff', border: 'none',
              borderRadius: '0.6rem', cursor: 'pointer', fontWeight: '600',
            }}>Retry</button>
          </div>
        )}

        {/* ── MAIN GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>

          {/* ── CURRENT WEATHER CARD ── */}
          <div style={{
            background: loading ? '#fff' : getBgGradient(),
            borderRadius: '1.5rem', padding: '2rem',
            gridColumn: 'span 1',
            boxShadow: '0 10px 40px rgba(6,95,70,0.2)',
            position: 'relative', overflow: 'hidden',
            animation: 'fadeIn 0.5s ease',
            minHeight: '280px',
          }}>
            {/* Decorative blob */}
            <div style={{
              position: 'absolute', top: '-60px', right: '-60px',
              width: '200px', height: '200px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)',
            }} />
            <div style={{
              position: 'absolute', bottom: '-40px', left: '-40px',
              width: '160px', height: '160px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
            }} />

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <SkeletonBlock w="60%" h="1.5rem" rounded="0.5rem" />
                <SkeletonBlock w="40%" h="4rem" rounded="0.75rem" />
                <SkeletonBlock w="100%" h="2rem" rounded="0.5rem" />
                <SkeletonBlock w="100%" h="3rem" rounded="0.5rem" />
              </div>
            ) : weather ? (
              <div>
                {/* Location + Favorite */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={14} style={{ color: 'rgba(255,255,255,0.8)' }} />
                      <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>{weather.location}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>
                      Updated {new Date(weather.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <button onClick={toggleFavorite} style={{
                    background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '0.6rem',
                    padding: '0.4rem 0.6rem', cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <Heart size={16} style={{ color: isFavorited ? '#fbbf24' : 'rgba(255,255,255,0.8)', fill: isFavorited ? '#fbbf24' : 'none' }} />
                  </button>
                </div>

                {/* Temperature */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '4.5rem', lineHeight: 1, fontWeight: '800', color: '#fff', letterSpacing: '-0.03em' }}>
                    {weather.temperature}°
                  </span>
                  <div style={{ paddingTop: '0.5rem' }}>
                    <span style={{ fontSize: '2rem' }}>{weather.icon}</span>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginTop: '0.1rem' }}>{weather.condition}</p>
                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>Feels like {weather.feelsLike}°C</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <StatBadge icon={Droplets} label="Humidity" value={weather.humidity} unit="%" />
                  <StatBadge icon={Wind} label="Wind" value={weather.windSpeed} unit=" km/h" />
                  <StatBadge icon={CloudRain} label="Rain" value={weather.rainProbability} unit="%" />
                  <StatBadge icon={Eye} label="Visibility" value={weather.visibility} unit=" km" />
                </div>
              </div>
            ) : null}
          </div>

          {/* ── 7-DAY FORECAST ── */}
          <div style={{
            background: '#fff', borderRadius: '1.5rem', padding: '1.5rem',
            border: '1.5px solid #e5e7eb',
            animation: 'fadeIn 0.5s ease 0.1s both',
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827', fontFamily: "'Lora', Georgia, serif", marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              📅 7-Day Forecast
            </h3>
            {loading ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[...Array(7)].map((_, i) => <SkeletonBlock key={i} w="90px" h="120px" rounded="1rem" />)}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                {forecast?.daily?.map((day, i) => (
                  <ForecastCard key={i} day={day} isToday={i === 0} />
                ))}
              </div>
            )}
          </div>

          {/* ── HOURLY CHART ── */}
          <div style={{
            background: '#fff', borderRadius: '1.5rem', padding: '1.5rem',
            border: '1.5px solid #e5e7eb',
            gridColumn: '1 / -1',
            animation: 'fadeIn 0.5s ease 0.15s both',
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827', fontFamily: "'Lora', Georgia, serif", marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} style={{ color: '#10b981' }} /> Hourly Temperature & Rain Forecast
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.75rem' }}>Bar height = temperature · % above bar = rain probability</p>
            {loading ? <SkeletonBlock w="100%" h="120px" rounded="0.75rem" /> : (
              <HourlyChart data={forecast?.hourly || []} />
            )}
          </div>

          {/* ── TABS: INSIGHTS | ALERTS | FAVORITES ── */}
          <div style={{
            background: '#fff', borderRadius: '1.5rem', padding: '1.5rem',
            border: '1.5px solid #e5e7eb',
            gridColumn: '1 / -1',
            animation: 'fadeIn 0.5s ease 0.2s both',
          }}>
            {/* Tab Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              {[
                { id: 'insights', label: '🌱 Farming Insights' },
                { id: 'alerts', label: `🚨 Alerts ${alerts.length > 0 ? `(${alerts.length})` : ''}` },
                { id: 'favorites', label: '⭐ Saved Locations' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: '0.5rem 1rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer',
                  background: activeTab === tab.id ? '#065f46' : '#f3f4f6',
                  color: activeTab === tab.id ? '#fff' : '#374151',
                  fontSize: '0.82rem', fontWeight: '600', transition: 'all 0.2s',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Insights Tab */}
            {activeTab === 'insights' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {loading ? (
                  [...Array(4)].map((_, i) => <SkeletonBlock key={i} h="80px" rounded="1rem" />)
                ) : insights.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280', gridColumn: '1/-1' }}>
                    <Leaf size={32} style={{ margin: '0 auto 0.5rem', color: '#d1d5db' }} />
                    <p>No farming insights available</p>
                  </div>
                ) : (
                  insights.map(insight => <InsightCard key={insight.id} insight={insight} />)
                )}
              </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {loading ? (
                  [...Array(2)].map((_, i) => <SkeletonBlock key={i} h="80px" rounded="1rem" />)
                ) : alerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    <CheckCircle size={32} style={{ margin: '0 auto 0.5rem', color: '#10b981' }} />
                    <p style={{ fontWeight: '600' }}>No active weather alerts</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>All clear for your area</p>
                  </div>
                ) : (
                  alerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
                )}
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div>
                {favorites.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    <Star size={32} style={{ margin: '0 auto 0.5rem', color: '#d1d5db' }} />
                    <p>No saved locations yet</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Search a location and press ♥ to save it</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {favorites.map(fav => (
                      <div key={fav.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.85rem 1rem', background: '#f9fafb', borderRadius: '0.75rem',
                        border: '1.5px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s',
                      }}
                        onClick={() => setActiveLocation(fav.name)}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = '#bbf7d0'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <MapPin size={16} style={{ color: '#10b981' }} />
                          <span style={{ fontWeight: '600', fontSize: '0.875rem', color: '#111827' }}>{fav.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1rem' }}>{fav.icon}</span>
                          <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#374151' }}>{fav.temp}°C</span>
                          <button onClick={e => {
                            e.stopPropagation();
                            setFavorites(prev => prev.filter(f => f.id !== fav.id));
                          }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}>
                            <X size={14} style={{ color: '#9ca3af' }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default WeatherPage;
