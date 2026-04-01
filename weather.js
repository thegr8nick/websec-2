const WeatherUtils = {
    formatPopulation(pop) {
        if (pop >= 1000000) return (pop / 1000000).toFixed(1).replace('.0', '') + ' млн';
        if (pop >= 1000) return Math.round(pop / 1000) + ' тыс.';
        return pop;
    },

    getWeatherIcon(code) {
        const icons = {
            0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
            45: '🌫️', 48: '🌫️',
            51: '🌦️', 53: '🌦️', 55: '🌧️',
            61: '🌧️', 63: '🌧️', 65: '🌧️',
            71: '❄️', 73: '❄️', 75: '❄️',
            77: '🌨️',
            80: '🌦️', 81: '🌧️', 82: '⛈️',
            85: '🌨️', 86: '🌨️',
            95: '⛈️', 96: '⛈️', 99: '⛈️'
        };
        return icons[code] || '🌡️';
    },

    getWeatherDescription(code) {
        const desc = {
            0: 'Ясно', 1: 'Малооблачно', 2: 'Переменная облачность', 3: 'Пасмурно',
            45: 'Туман', 48: 'Туман с изморозью',
            51: 'Морось', 53: 'Морось', 55: 'Сильная морось',
            61: 'Дождь', 63: 'Дождь', 65: 'Сильный дождь',
            71: 'Снег', 73: 'Снег', 75: 'Сильный снег',
            77: 'Снежная крупа',
            80: 'Ливень', 81: 'Ливень', 82: 'Сильный ливень',
            85: 'Снегопад', 86: 'Сильный снегопад',
            95: 'Гроза', 96: 'Гроза с градом', 99: 'Сильная гроза'
        };
        return desc[code] || '—';
    },

    getDayName(index, isToday = false) {
        if (isToday) return 'Сегодня';
        const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        return days[index];
    }
};

class WeatherService {
    static async getWeather(city) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,precipitation,wind_speed_10m,relative_humidity_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка загрузки');
        return await response.json();
    }
}

class WeatherUI {
    static updateCityInfo(city) {
        document.getElementById('cityName').innerText = city.name;
        document.getElementById('cityDetails').innerHTML = `${city.region} • Население: ${WeatherUtils.formatPopulation(city.pop)}`;
    }

    static updateCurrentWeather(current) {
        document.getElementById('currentTemp').innerHTML = Math.round(current.temperature_2m) + '°';
        document.getElementById('weatherDesc').innerHTML = WeatherUtils.getWeatherDescription(current.weathercode) + ' ' + WeatherUtils.getWeatherIcon(current.weathercode);
        document.getElementById('currentPrecip').innerHTML = current.precipitation !== undefined ? current.precipitation.toFixed(1) : '0';
        document.getElementById('currentWind').innerHTML = Math.round(current.wind_speed_10m);
        document.getElementById('currentHumidity').innerHTML = current.relative_humidity_2m !== undefined ? current.relative_humidity_2m : '—';
    }

    static updateDailyForecast(daily) {
        const forecastList = document.getElementById('forecastList');
        forecastList.innerHTML = '';

        for (let i = 0; i < daily.time.length; i++) {
            const date = new Date(daily.time[i]);
            const isToday = i === 0;
            const dayName = WeatherUtils.getDayName(date.getDay(), isToday);
            
            const maxTemp = Math.round(daily.temperature_2m_max[i]);
            const minTemp = Math.round(daily.temperature_2m_min[i]);
            const precip = daily.precipitation_sum[i] ? daily.precipitation_sum[i].toFixed(1) : '0';
            const weatherCode = daily.weathercode[i];
            
            const card = document.createElement('div');
            card.className = 'forecast-day';
            card.innerHTML = `
                <div class="day-name">${dayName}</div>
                <div class="weather-icon">${WeatherUtils.getWeatherIcon(weatherCode)}</div>
                <div class="temp-max">${maxTemp}°</div>
                <div class="temp-min">${minTemp}°</div>
                <div class="precip">💧 ${precip} мм</div>
            `;
            forecastList.appendChild(card);
        }
    }

    static showLoading() {
        document.getElementById('weatherContent').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('errorState').style.display = 'none';
        document.getElementById('loadingState').style.display = 'block';
    }

    static showWeather() {
        document.getElementById('weatherContent').style.display = 'block';
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('errorState').style.display = 'none';
    }

    static showError() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('errorState').style.display = 'block';
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('weatherContent').style.display = 'none';
    }

    static showEmpty() {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('weatherContent').style.display = 'none';
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('errorState').style.display = 'none';
    }
}

async function loadWeather(city) {
    WeatherUI.showLoading();
    
    try {
        const data = await WeatherService.getWeather(city);
        WeatherUI.updateCityInfo(city);
        WeatherUI.updateCurrentWeather(data.current);
        WeatherUI.updateDailyForecast(data.daily);
        WeatherUI.showWeather();
    } catch (error) {
        console.error(error);
        WeatherUI.showError();
    }
}