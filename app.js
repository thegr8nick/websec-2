document.addEventListener('DOMContentLoaded', () => {
    WeatherUI.showEmpty();
    
    new SearchManager();
    
    console.log('Приложение готово! Начните вводить название города');
});