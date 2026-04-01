class SearchManager {
    constructor() {
        this.searchInput = document.getElementById('citySearch');
        this.searchResults = document.getElementById('searchResults');
        this.init();
    }

    init() {
        this.searchInput.addEventListener('input', (e) => this.handleInput(e));
        this.searchInput.addEventListener('keypress', (e) => this.handleKeyPress(e));
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
    }

    handleInput(e) {
        const query = e.target.value.trim();
        const results = this.searchCities(query);
        this.renderResults(results);
    }

    handleKeyPress(e) {
        if (e.key === 'Enter' && this.searchResults.children.length > 0) {
            const firstItem = this.searchResults.children[0];
            if (firstItem && firstItem.dataset.city) {
                const city = JSON.parse(firstItem.dataset.city);
                loadWeather(city);
                this.searchResults.style.display = 'none';
                this.searchInput.blur();
            }
        }
    }

    handleOutsideClick(e) {
        if (!e.target.closest('.search-box')) {
            this.searchResults.style.display = 'none';
        }
    }

    searchCities(query) {
        if (query.length < 2) return [];
        const lowerQuery = query.toLowerCase();
        return CITIES.filter(city => 
            city.name.toLowerCase().includes(lowerQuery) ||
            city.region.toLowerCase().includes(lowerQuery)
        ).slice(0, 12);
    }

    renderResults(results) {
        if (results.length === 0) {
            this.searchResults.style.display = 'none';
            return;
        }
        
        this.searchResults.innerHTML = results.map(city => `
            <div class="search-item" data-city='${JSON.stringify(city)}'>
                <div>
                    <div class="city-name">${city.name}</div>
                    <div style="font-size: 12px; opacity: 0.7;">${city.region}</div>
                </div>
                <div class="city-pop">${WeatherUtils.formatPopulation(city.pop)}</div>
            </div>
        `).join('');
        
        this.searchResults.style.display = 'block';
        
        document.querySelectorAll('.search-item').forEach(item => {
            item.addEventListener('click', () => {
                const city = JSON.parse(item.dataset.city);
                this.searchInput.value = city.name;
                this.searchResults.style.display = 'none';
                loadWeather(city);
            });
        });
    }
}