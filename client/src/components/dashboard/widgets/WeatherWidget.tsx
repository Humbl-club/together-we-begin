import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Snowflake, 
  Zap, 
  Wind,
  Droplets,
  Eye,
  Thermometer,
  MapPin,
  RefreshCw,
  Calendar
} from 'lucide-react';

interface WeatherWidgetProps {
  configuration: {
    showForecast?: boolean;
    showDetails?: boolean;
    units?: 'metric' | 'imperial';
    location?: string;
    autoLocation?: boolean;
  };
  size: 'small' | 'medium' | 'large' | 'full';
}

interface WeatherData {
  current: {
    temperature: number;
    condition: string;
    description: string;
    humidity: number;
    windSpeed: number;
    visibility: number;
    feelsLike: number;
    uvIndex: number;
    icon: string;
  };
  location: {
    name: string;
    country: string;
    coordinates: {
      lat: number;
      lon: number;
    };
  };
  forecast: ForecastDay[];
  lastUpdated: string;
}

interface ForecastDay {
  date: string;
  condition: string;
  icon: string;
  high: number;
  low: number;
  chanceOfRain: number;
}

// Mock weather data - in production, this would come from a weather API
const MOCK_WEATHER_DATA: WeatherData = {
  current: {
    temperature: 24,
    condition: 'Partly Cloudy',
    description: 'Partly cloudy with gentle breeze',
    humidity: 65,
    windSpeed: 12,
    visibility: 10,
    feelsLike: 26,
    uvIndex: 6,
    icon: 'partly-cloudy'
  },
  location: {
    name: 'San Francisco',
    country: 'US',
    coordinates: {
      lat: 37.7749,
      lon: -122.4194
    }
  },
  forecast: [
    { date: '2024-01-15', condition: 'Sunny', icon: 'sunny', high: 26, low: 18, chanceOfRain: 10 },
    { date: '2024-01-16', condition: 'Cloudy', icon: 'cloudy', high: 22, low: 16, chanceOfRain: 30 },
    { date: '2024-01-17', condition: 'Rain', icon: 'rainy', high: 20, low: 14, chanceOfRain: 80 },
    { date: '2024-01-18', condition: 'Partly Cloudy', icon: 'partly-cloudy', high: 24, low: 17, chanceOfRain: 20 },
    { date: '2024-01-19', condition: 'Sunny', icon: 'sunny', high: 27, low: 19, chanceOfRain: 5 }
  ],
  lastUpdated: new Date().toISOString()
};

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ 
  configuration = {}, 
  size 
}) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    showForecast = size !== 'small',
    showDetails = size === 'large' || size === 'full',
    units = 'metric',
    location,
    autoLocation = true
  } = configuration;

  useEffect(() => {
    loadWeatherData();
  }, [location, units]);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In production, this would make actual API calls to a weather service
      // For now, we'll simulate loading and use mock data
      await new Promise(resolve => setTimeout(resolve, 1000));

      setWeatherData(MOCK_WEATHER_DATA);

    } catch (err) {
      console.error('Error loading weather data:', err);
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition: string, size: 'small' | 'medium' | 'large' = 'medium') => {
    const iconSize = size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-8 h-8' : 'w-6 h-6';
    
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <Sun className={`${iconSize} text-yellow-500`} />;
      case 'partly-cloudy':
      case 'partly cloudy':
        return <Cloud className={`${iconSize} text-gray-500`} />;
      case 'cloudy':
      case 'overcast':
        return <Cloud className={`${iconSize} text-gray-600`} />;
      case 'rainy':
      case 'rain':
        return <CloudRain className={`${iconSize} text-blue-500`} />;
      case 'snow':
      case 'snowy':
        return <Snowflake className={`${iconSize} text-blue-300`} />;
      case 'thunderstorm':
      case 'storm':
        return <Zap className={`${iconSize} text-purple-500`} />;
      default:
        return <Cloud className={`${iconSize} text-gray-500`} />;
    }
  };

  const formatTemperature = (temp: number) => {
    if (units === 'imperial') {
      return `${Math.round(temp * 9/5 + 32)}°F`;
    }
    return `${Math.round(temp)}°C`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getUVIndexLevel = (uvIndex: number) => {
    if (uvIndex <= 2) return { level: 'Low', color: 'text-green-600' };
    if (uvIndex <= 5) return { level: 'Moderate', color: 'text-yellow-600' };
    if (uvIndex <= 7) return { level: 'High', color: 'text-orange-600' };
    if (uvIndex <= 10) return { level: 'Very High', color: 'text-red-600' };
    return { level: 'Extreme', color: 'text-purple-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <div className="text-gray-500 mb-2">{error}</div>
        <Button size="sm" variant="outline" onClick={loadWeatherData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="text-center py-8">
        <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <div className="text-gray-500">No weather data available</div>
      </div>
    );
  }

  const uvInfo = getUVIndexLevel(weatherData.current.uvIndex);

  return (
    <div className="space-y-4">
      {/* Current Weather */}
      <Card className="overflow-hidden bg-gradient-to-br from-blue-50 to-sky-100">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  {weatherData.location.name}, {weatherData.location.country}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {getWeatherIcon(weatherData.current.icon, 'large')}
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {formatTemperature(weatherData.current.temperature)}
                  </div>
                  <div className="text-sm text-gray-700">
                    Feels like {formatTemperature(weatherData.current.feelsLike)}
                  </div>
                </div>
              </div>

              <div className="mt-2">
                <div className="font-medium text-gray-900">{weatherData.current.condition}</div>
                <div className="text-sm text-gray-600">{weatherData.current.description}</div>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={loadWeatherData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Weather Details */}
          {showDetails && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="text-xs text-gray-600">Humidity</div>
                  <div className="font-semibold">{weatherData.current.humidity}%</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-xs text-gray-600">Wind</div>
                  <div className="font-semibold">
                    {weatherData.current.windSpeed} {units === 'metric' ? 'km/h' : 'mph'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-xs text-gray-600">Visibility</div>
                  <div className="font-semibold">
                    {weatherData.current.visibility} {units === 'metric' ? 'km' : 'mi'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-orange-500" />
                <div>
                  <div className="text-xs text-gray-600">UV Index</div>
                  <div className={`font-semibold ${uvInfo.color}`}>
                    {weatherData.current.uvIndex} {uvInfo.level}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forecast */}
      {showForecast && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <h4 className="font-semibold text-sm">5-Day Forecast</h4>
          </div>

          <div className="grid gap-2">
            {weatherData.forecast.map((day, index) => (
              <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 text-sm font-medium text-gray-900">
                    {formatDate(day.date)}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getWeatherIcon(day.icon, 'small')}
                    <span className="text-sm text-gray-700 capitalize">
                      {day.condition}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {day.chanceOfRain > 20 && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Droplets className="w-3 h-3" />
                      {day.chanceOfRain}%
                    </div>
                  )}
                  
                  <div className="text-sm font-medium text-gray-900">
                    {formatTemperature(day.high)}°
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {formatTemperature(day.low)}°
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-xs text-gray-500 text-center">
        Last updated: {new Date(weatherData.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  );
};