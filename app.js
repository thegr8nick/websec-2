document.addEventListener("DOMContentLoaded", () => {
    let citiesData = [];
    let activeChart = null;

    const map = L.map('map').setView([55.75, 37.61], 4);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    function formatPopulation(pop) {
        if (pop >= 1000000) return (pop / 1000000).toFixed(1).replace('.0', '') + ' млн';
        if (pop >= 1000) return Math.round(pop / 1000) + ' тыс.';
        return pop;
    }

    function getWeatherIcon(code) {
        const icons = {
            0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
            45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️', 55: '🌧️',
            61: '🌧️', 63: '🌧️', 65: '🌧️', 71: '❄️', 73: '❄️', 75: '❄️',
            77: '🌨️', 80: '🌦️', 81: '🌧️', 82: '⛈️', 85: '🌨️', 86: '🌨️',
            95: '⛈️', 96: '⛈️', 99: '⛈️'
        };
        return icons[code] || '🌡️';
    }

    function getWeatherDescription(code) {
        const desc = {
            0: 'Ясно', 1: 'Малооблачно', 2: 'Переменная облачность', 3: 'Пасмурно',
            45: 'Туман', 48: 'Туман с изморозью', 51: 'Морось', 55: 'Сильная морось',
            61: 'Дождь', 65: 'Сильный дождь', 71: 'Снег', 75: 'Сильный снег',
            80: 'Ливень', 82: 'Сильный ливень', 85: 'Снегопад', 95: 'Гроза'
        };
        return desc[code] || '—';
    }

    function getDayName(index, isToday = false) {
        if (isToday) return 'Сегодня';
        const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        return days[index];
    }

    async function initData() {
        try {
            const response = await fetch('cities.json');
            if (!response.ok) throw new Error('Файл не найден');
            citiesData = await response.json();

            for (let k = 0; k < citiesData.length; k++) {
                const city = citiesData[k];
                const marker = L.circleMarker([city.lat, city.lon], {
                    radius: 5,
                    color: '#e74c3c',
                    fillColor: '#e74c3c',
                    fillOpacity: 0.7,
                    weight: 1
                }).addTo(map);

                marker.bindTooltip(city.name);
                marker.on('click', () => {
                    map.setView([city.lat, city.lon], 8);
                    loadWeather(city);
                });
            }
        } catch (error) {
            console.error(error);
            document.getElementById('emptyState').style.display = 'none';
            document.getElementById('errorState').style.display = 'block';
        }
    }

    function drawChart(daily) {
        const ctx = document.getElementById('weatherChart').getContext('2d');
        
        if (activeChart) {
            activeChart.destroy();
        }

        Chart.defaults.color = 'rgba(255, 255, 255, 0.8)';
        
        activeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: daily.time.map(t => getDayName(new Date(t).getDay(), false)),
                datasets: [
                    {
                        label: 'Темп. (°C)',
                        data: daily.temperature_2m_max,
                        borderColor: '#ffaa88',
                        backgroundColor: 'rgba(255, 170, 136, 0.2)',
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Осадки (мм)',
                        data: daily.precipitation_sum,
                        type: 'bar',
                        backgroundColor: 'rgba(88, 170, 255, 0.6)',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'top' } },
                scales: {
                    y: { display: true, position: 'left', grid: { color: 'rgba(255,255,255,0.1)' } },
                    y1: { display: true, position: 'right', grid: { drawOnChartArea: false } }
                }
            }
        });
    }

    async function loadWeather(city) {
        const weatherContent = document.getElementById('weatherContent');
        const emptyState = document.getElementById('emptyState');
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');

        weatherContent.style.display = 'none';
        emptyState.style.display = 'none';
        errorState.style.display = 'none';
        loadingState.style.display = 'block';

        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,precipitation,wind_speed_10m,relative_humidity_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Ошибка загрузки');
            const data = await response.json();

            document.getElementById('cityName').innerText = city.name;
            document.getElementById('cityDetails').innerHTML = `Население: ${formatPopulation(city.population)}`;

            const current = data.current;
            document.getElementById('currentTemp').innerHTML = Math.round(current.temperature_2m) + '°';
            document.getElementById('weatherDesc').innerHTML = getWeatherDescription(current.weathercode) + ' ' + getWeatherIcon(current.weathercode);
            document.getElementById('currentPrecip').innerHTML = current.precipitation !== undefined ? current.precipitation.toFixed(1) : '0';
            document.getElementById('currentWind').innerHTML = Math.round(current.wind_speed_10m);
            document.getElementById('currentHumidity').innerHTML = current.relative_humidity_2m !== undefined ? current.relative_humidity_2m : '—';

            drawChart(data.daily);

            const daily = data.daily;
            const forecastList = document.getElementById('forecastList');
            forecastList.innerHTML = '';

            for (let k = 0; k < daily.time.length; k++) {
                const date = new Date(daily.time[k]);
                const isToday = k === 0;
                const dayName = getDayName(date.getDay(), isToday);
                
                const maxTemp = Math.round(daily.temperature_2m_max[k]);
                const minTemp = Math.round(daily.temperature_2m_min[k]);
                const precip = daily.precipitation_sum[k] ? daily.precipitation_sum[k].toFixed(1) : '0';
                
                const card = document.createElement('div');
                card.className = 'forecast-day';
                card.innerHTML = `
                    <div class="day-name">${dayName}</div>
                    <div class="weather-icon">${getWeatherIcon(daily.weathercode[k])}</div>
                    <div class="temp-max">${maxTemp}°</div>
                    <div class="temp-min">${minTemp}°</div>
                    <div class="precip">💧 ${precip} мм</div>
                `;
                forecastList.appendChild(card);
            }

            weatherContent.style.display = 'block';
            loadingState.style.display = 'none';
            
        } catch (error) {
            console.error(error);
            loadingState.style.display = 'none';
            errorState.style.display = 'block';
        }
    }

    const searchInput = document.getElementById('citySearch');
    const searchResultsDiv = document.getElementById('searchResults');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        searchResultsDiv.innerHTML = '';
        
        if (query.length < 2) {
            searchResultsDiv.style.display = 'none';
            return;
        }
        
        const results = citiesData.filter(city => city.name.toLowerCase().includes(query)).slice(0, 10);
        
        if (results.length > 0) {
            for (let g = 0; g < results.length; g++) {
                const city = results[g];
                const item = document.createElement('div');
                item.className = 'search-item';
                item.innerHTML = `
                    <div>
                        <div class="city-name">${city.name}</div>
                    </div>
                    <div class="city-pop">${formatPopulation(city.population)}</div>
                `;
                
                item.addEventListener('click', () => {
                    searchInput.value = city.name;
                    searchResultsDiv.style.display = 'none';
                    map.setView([city.lat, city.lon], 8);
                    loadWeather(city);
                });
                
                searchResultsDiv.appendChild(item);
            }
            searchResultsDiv.style.display = 'block';
        } else {
            searchResultsDiv.style.display = 'none';
        }
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            searchResultsDiv.style.display = 'none';
        }
    });

    initData();
});