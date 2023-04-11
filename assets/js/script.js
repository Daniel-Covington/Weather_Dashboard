// script.js
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const searchHistory = document.getElementById('search-history');
const currentWeather = document.getElementById('current-weather');
const forecast = document.getElementById('forecast');
const apiKey = 'c33486ce38fb3a609594f33f112d21b7';


// API request for auto complete after 2 characters are typed will display suggestions for auto complete.
$("#city-input").autocomplete({
  source: function (request, response) {
    const geonamesApiUsername = "danielcovington"; 
    const queryUrl = `http://api.geonames.org/searchJSON?name_startsWith=${request.term}&featureClass=P&maxRows=10&country=US&username=${geonamesApiUsername}`;

    $.getJSON(queryUrl, function (data) {
      response(
        $.map(data.geonames, function (city) {
          const state = city.adminCode1;
          return {
            label: city.name + ", " + state,
            value: city.name,
          };
        })
      );
    });
  },
  minLength: 2,
});


function getWeatherData(city) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=imperial`)
    .then(response => response.json())
    .then(data => {
      const { coord, name, sys, weather, main, wind } = data;
      const date = new Date().toLocaleDateString();
      const iconUrl = `https://openweathermap.org/img/wn/${weather[0].icon}.png`;

      currentWeather.innerHTML = `
        <h2>${name} (${date}) <img src="${iconUrl}" alt="${weather[0].description}" /></h2>
        <p>Temperature: ${main.temp} °F</p>
        <p>Humidity: ${main.humidity}%</p>
        <p>Wind Speed: ${wind.speed} m/s</p>
      `;

      getForecastData(coord.lat, coord.lon);
      addToSearchHistory(name);
    });
}

function getForecastData(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`)
    .then(response => response.json())
    .then(data => {
      forecast.innerHTML = '';

      const dailyData = data.list.filter(item => item.dt_txt.includes('12:00:00'));

      dailyData.forEach(day => {
        const date = new Date(day.dt_txt).toLocaleDateString();
        const iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`; 
        const forecastCard = document.createElement('div');
        forecastCard.classList.add('col-md-2-4');
        forecastCard.innerHTML = `
          <div class="card bg-primary text-white mb-3">
            <div class="card-body">
              <h5>${date}</h5>
              <img src="${iconUrl}" alt="${day.weather[0].description}" />
              <p>Temp: ${day.main.temp} °F</p>
              <p>Wind: ${day.wind.speed} mph</p>
              <p>Humidity: ${day.main.humidity}%</p>
            </div>
          </div>
        `;

        forecast.appendChild(forecastCard);
      });
    });
}

function saveSearchHistory(city) {
  let cities = localStorage.getItem('search-history');

  if (cities) {
    cities = JSON.parse(cities);
  } else {
    cities = [];
  }

  // Check if the city is already in the search history
  if (!cities.includes(city)) {
    cities.push(city);
    localStorage.setItem('search-history', JSON.stringify(cities));
  }
}


function addToSearchHistory(city) {
  const searchHistoryItems = Array.from(searchHistory.querySelectorAll('button'));
  const cities = searchHistoryItems.map(item => item.textContent);

  // Check if the city is already in the search history
  if (!cities.includes(city)) {
    const button = document.createElement('button');
    button.classList.add('btn', 'btn-light', 'rounded', 'mb-2');
    button.textContent = city;
    searchHistory.appendChild(button);
    saveSearchHistory(city);
  }
}

function loadSearchHistory() {
  const savedSearchHistory = localStorage.getItem('search-history');

  if (savedSearchHistory) {
    const cities = JSON.parse(savedSearchHistory);
    cities.forEach(city => {
      displaySearchHistory(city);
    });

    // Call getWeatherData with the last city in the search history
    if (cities.length > 0) {
      getWeatherData(cities[cities.length - 1]);
    }
  }
}

function displaySearchHistory(city) {
  const searchHistoryItems = Array.from(searchHistory.querySelectorAll('button'));
  const cities = searchHistoryItems.map(item => item.textContent);

  // Check if the city is already in the search history
  if (!cities.includes(city)) {
    const button = document.createElement('button');
    button.classList.add('btn', 'btn-light', 'rounded', 'mb-2');
    button.textContent = city;
    searchHistory.appendChild(button);
  }
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      getWeatherDataByCoords(position.coords.latitude, position.coords.longitude);
    });
  } else {
    console.log('Geolocation is not supported by this browser.');
  }
}

function getWeatherDataByCoords(lat, lon) {
  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
    .then(response => response.json())
    .then(locationData => {
      const cityName = locationData.address.city || locationData.address.town || locationData.address.village || locationData.address.county;
      
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=imperial`)
        .then(response => response.json())
        .then(data => {
          const { coord, name, sys, weather, main, wind } = data;
          const date = new Date().toLocaleDateString();
          const iconUrl = `https://openweathermap.org/img/wn/${weather[0].icon}.png`;

          currentWeather.innerHTML = `
            <h2>${name} (${date}) <img src="${iconUrl}" alt="${weather[0].description}" /></h2>
            <p>Temperature: ${main.temp} °F</p>
            <p>Humidity: ${main.humidity}%</p>
            <p>Wind Speed: ${wind.speed} m/s</p>
          `;

          getForecastData(coord.lat, coord.lon);
          addToSearchHistory(name);
        });
    });
}
  
  searchBtn.addEventListener('click', () => {
  const city = cityInput.value;
  getWeatherData(city);
  });
  
  searchHistory.addEventListener('click', (event) => {
    if (event.target.matches('button')) {
      getWeatherData(event.target.textContent);
    }
  });
  
  getLocation();
  loadSearchHistory();