// Initialize user data
let userData = {
  name: localStorage.getItem('userName') || '',
  location: localStorage.getItem('userLocation') || '',
  pexelsKey: localStorage.getItem('pexelsApiKey') || '',
};

// Update user data from Firestore (called by auth.js)
window.updateUserData = function (name, location) {
  userData.name = name;
  userData.location = location;
  updateGreeting();
  updateWeather();
};

// Initialize todos
let todos = JSON.parse(localStorage.getItem('todos')) || [];

// Helper function to load todos from storage (called from auth.js)
window.loadTodosFromStorage = function () {
  todos = JSON.parse(localStorage.getItem('todos')) || [];
  renderTodos();
};

// Helper function to save todos
async function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));

  // Save to Firestore if user is logged in
  if (window.auth && window.auth.currentUser && window.saveTodosToFirestore) {
    await window.saveTodosToFirestore(todos);
  }
}

// ===========================
// TODO LIST FUNCTIONS
// ===========================

function renderTodos() {
  const todoList = document.getElementById('todoList');
  const todoCount = document.getElementById('todoCount');

  if (todos.length === 0) {
    todoList.innerHTML =
      '<div class="empty-todos">No tasks yet. Add one above!</div>';
    todoCount.textContent = '(0)';
    return;
  }

  const activeTodos = todos.filter((todo) => !todo.completed).length;
  todoCount.textContent = `(${activeTodos})`;

  todoList.innerHTML = todos
    .map(
      (todo, index) => `
        <div class="todo-item ${
          todo.completed ? 'completed' : ''
        }" onclick="toggleTodo(${index})">
          <div class="todo-checkbox">
            <i class="fas fa-check"></i>
          </div>
          <div class="todo-text">${todo.text}</div>
          <div class="todo-delete" onclick="deleteTodo(event, ${index})">
            <i class="fas fa-times"></i>
          </div>
        </div>
      `
    )
    .join('');
}

function toggleTodoInput() {
  const container = document.getElementById('todoInputContainer');
  const input = document.getElementById('todoInput');

  if (container.style.display === 'block') {
    container.style.display = 'none';
  } else {
    container.style.display = 'block';
    input.focus();
  }
}

function handleTodoKeypress(event) {
  if (event.key === 'Enter') {
    addTodo();
  }
}

async function addTodo() {
  const input = document.getElementById('todoInput');
  const text = input.value.trim();

  if (text) {
    todos.unshift({
      text: text,
      completed: false,
      createdAt: new Date().toISOString(),
    });

    await saveTodos();
    renderTodos();
    input.value = '';
    document.getElementById('todoInputContainer').style.display = 'none';
  }
}

async function toggleTodo(index) {
  todos[index].completed = !todos[index].completed;
  await saveTodos();
  renderTodos();
}

async function deleteTodo(event, index) {
  event.stopPropagation();
  todos.splice(index, 1);
  await saveTodos();
  renderTodos();
}

// ===========================
// VIDEO BACKGROUND FUNCTIONS
// ===========================

async function loadPexelsVideo() {
  const apiKey = userData.pexelsKey || PEXELS_API_KEY;

  if (!apiKey || apiKey === 'YOUR_PEXELS_API_KEY') {
    return loadFallbackVideo();
  }

  try {
    const query = videoQueries[Math.floor(Math.random() * videoQueries.length)];
    const response = await fetch(
      `https://api.pexels.com/videos/search?query=${query}&per_page=20&orientation=landscape`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();
    if (data.videos && data.videos.length > 0) {
      const randomVideo =
        data.videos[Math.floor(Math.random() * data.videos.length)];
      const hdFile =
        randomVideo.video_files.find(
          (file) => file.quality === 'hd' && file.width >= 1920
        ) || randomVideo.video_files[0];

      const video = document.getElementById('video-background');
      video.src = hdFile.link;
    }
  } catch (error) {
    console.error('Pexels API error:', error);
    loadFallbackVideo();
  }
}

function loadFallbackVideo() {
  const video = document.getElementById('video-background');
  const randomVideo =
    fallbackVideos[Math.floor(Math.random() * fallbackVideos.length)];
  video.src = randomVideo;
}

async function loadNewVideo() {
  await loadPexelsVideo();
}

// ===========================
// TIME & DATE FUNCTIONS
// ===========================

function updateTime() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  document.getElementById('time').textContent = time;
}

function updateDate() {
  const now = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const date = now.toLocaleDateString('en-US', options);
  document.getElementById('date').textContent = date;
}

function updateGreeting() {
  const now = new Date();
  const hour = now.getHours();
  const name = userData.name || 'there';
  let greeting;

  if (hour >= 0 && hour < 5) {
    greeting = `Still up, ${name}? Time flies when you're having fun!`;
  } else if (hour >= 5 && hour < 12) {
    greeting = `Good morning, ${name}`;
  } else if (hour >= 12 && hour < 17) {
    greeting = `Good afternoon, ${name}`;
  } else if (hour >= 17 && hour < 22) {
    greeting = `Good evening, ${name}`;
  } else {
    greeting = `Getting late, ${name}. Don't forget to rest!`;
  }

  document.getElementById('greeting').textContent = greeting;
}

async function updateQuote() {
  const quoteElement = document.getElementById('quote');

  try {
    // Try ZenQuotes API (different provider, no DNS issues)
    const response = await fetch('https://zenquotes.io/api/random');
    const data = await response.json();
    quoteElement.textContent = `"${data[0].q}" - ${data[0].a}`;
    quoteElement.style.opacity = '1';
  } catch (error) {
    console.error('Quote API failed:', error);
    // Fallback to local quotes if API fails
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteElement.textContent = randomQuote;
    quoteElement.style.opacity = '1';
  }
}

// ===========================
// WEATHER FUNCTIONS
// ===========================

async function updateWeather() {
  const tempElement = document.getElementById('weatherTemp');
  const conditionElement = document.getElementById('weatherCondition');
  const locationElement = document.querySelector('.weather-location span');
  const iconElement = document.getElementById('weatherIcon');

  try {
    let weatherData;

    if (USE_ALTERNATIVE_WEATHER) {
      try {
        if (userData.location) {
          const response = await fetch(
            `https://wttr.in/${encodeURIComponent(userData.location)}?format=j1`
          );
          const data = await response.json();

          if (data && data.current_condition && data.current_condition[0]) {
            const current = data.current_condition[0];
            const temp = Math.round(
              current.temp_F || (current.temp_C * 9) / 5 + 32
            );
            tempElement.textContent = `${temp}°`;
            conditionElement.textContent = current.weatherDesc[0].value;
            locationElement.textContent =
              data.nearest_area[0].areaName[0].value;

            const desc = current.weatherDesc[0].value.toLowerCase();
            let iconClass = 'fas fa-sun';
            if (desc.includes('cloud')) iconClass = 'fas fa-cloud';
            if (desc.includes('rain')) iconClass = 'fas fa-cloud-rain';
            if (desc.includes('snow')) iconClass = 'fas fa-snowflake';
            if (desc.includes('thunder')) iconClass = 'fas fa-bolt';
            if (desc.includes('fog') || desc.includes('mist'))
              iconClass = 'fas fa-smog';

            iconElement.innerHTML = `<i class="${iconClass}"></i>`;
            return;
          }
        } else {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
            });
          });

          const response = await fetch(
            `https://wttr.in/${position.coords.latitude},${position.coords.longitude}?format=j1`
          );
          const data = await response.json();

          if (data && data.current_condition && data.current_condition[0]) {
            const current = data.current_condition[0];
            const temp = Math.round(
              current.temp_F || (current.temp_C * 9) / 5 + 32
            );
            tempElement.textContent = `${temp}°`;
            conditionElement.textContent = current.weatherDesc[0].value;
            locationElement.textContent =
              data.nearest_area[0].areaName[0].value || 'Your Location';

            const desc = current.weatherDesc[0].value.toLowerCase();
            let iconClass = 'fas fa-sun';
            if (desc.includes('cloud')) iconClass = 'fas fa-cloud';
            if (desc.includes('rain')) iconClass = 'fas fa-cloud-rain';
            if (desc.includes('snow')) iconClass = 'fas fa-snowflake';
            if (desc.includes('thunder')) iconClass = 'fas fa-bolt';
            if (desc.includes('fog') || desc.includes('mist'))
              iconClass = 'fas fa-smog';

            iconElement.innerHTML = `<i class="${iconClass}"></i>`;
            return;
          }
        }
      } catch (altError) {
        console.log(
          'Alternative weather service failed, trying OpenWeather...'
        );
      }
    }

    // Fallback to OpenWeather
    if (userData.location) {
      // Clean location: remove state abbreviations like "PA", "NY", etc.
      let location = userData.location.trim()
        .replace(/,?\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\s*$/i, '');

      // Add US country code if not present
      if (!location.toLowerCase().includes(',us')) {
        location = `${location},US`;
      }

      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        location
      )}&appid=${OPENWEATHER_API_KEY}&units=imperial`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      weatherData = await response.json();
    } else {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
        });
      });

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=${OPENWEATHER_API_KEY}&units=imperial`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      weatherData = await response.json();
    }

    if (weatherData && weatherData.main) {
      tempElement.textContent = `${Math.round(weatherData.main.temp)}°`;
      conditionElement.textContent = weatherData.weather[0].main;
      locationElement.textContent = weatherData.name;

      const iconClass =
        weatherIcons[weatherData.weather[0].main] || 'fas fa-sun';
      iconElement.innerHTML = `<i class="${iconClass}"></i>`;
    }
  } catch (error) {
    console.error('Weather update failed:', error);
    tempElement.textContent = '--°';
    conditionElement.textContent = 'Weather Unavailable';
    locationElement.textContent = userData.location || 'Set Location';
    iconElement.innerHTML = '<i class="fas fa-question-circle"></i>';
  }
}

// ===========================
// SEARCH FUNCTIONALITY
// ===========================

let selectedSuggestionIndex = -1;

// Clear search bar on page load (prevent autofill)
window.addEventListener('load', function () {
  document.getElementById('searchBar').value = '';
});

// Fetch search suggestions from Google using JSONP
function fetchSearchSuggestions(query) {
  if (!query.trim()) {
    document.getElementById('searchSuggestions').style.display = 'none';
    return;
  }

  // Remove any existing script tags for suggestions
  const existingScript = document.getElementById('suggestion-script');
  if (existingScript) {
    existingScript.remove();
  }

  // Create callback function name
  const callbackName = 'handleSuggestions';

  // Create global callback
  window[callbackName] = function (data) {
    const suggestions = data[1] || [];
    displaySuggestions(suggestions, query);
    delete window[callbackName];
  };

  // Create script tag for JSONP
  const script = document.createElement('script');
  script.id = 'suggestion-script';
  script.src = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(
    query
  )}&callback=${callbackName}`;
  document.head.appendChild(script);
}

// Display suggestions
function displaySuggestions(suggestions, query) {
  const suggestionsDiv = document.getElementById('searchSuggestions');

  if (suggestions.length === 0) {
    suggestionsDiv.style.display = 'none';
    return;
  }

  suggestionsDiv.innerHTML = suggestions
    .slice(0, 8)
    .map(
      (suggestion, index) =>
        `<div class="suggestion-item" data-index="${index}" onclick="selectSuggestion('${suggestion
          .replace(/'/g, "\\'")
          .replace(/"/g, '&quot;')}')">
          <i class="fas fa-search suggestion-icon"></i>
          <span>${suggestion}</span>
        </div>`
    )
    .join('');

  suggestionsDiv.style.display = 'block';
  selectedSuggestionIndex = -1;
}

// Select a suggestion
window.selectSuggestion = function (suggestion) {
  const searchBar = document.getElementById('searchBar');
  searchBar.value = suggestion;
  document.getElementById('searchSuggestions').style.display = 'none';
  performSearch(suggestion);
};

// Perform search
function performSearch(query) {
  if (query.trim()) {
    if (query.includes('.') && !query.includes(' ')) {
      window.location.href = query.startsWith('http') ? query : `https://${query}`;
    } else {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(
        query
      )}&gbv=1`;
    }
  }
}

// Search bar input listener
let suggestionTimeout;
document.getElementById('searchBar').addEventListener('input', function (e) {
  clearTimeout(suggestionTimeout);
  suggestionTimeout = setTimeout(() => {
    fetchSearchSuggestions(this.value);
  }, 200);
});

// Search bar keypress listener
document.getElementById('searchBar').addEventListener('keydown', function (e) {
  const suggestionsDiv = document.getElementById('searchSuggestions');
  const suggestionItems = suggestionsDiv.querySelectorAll('.suggestion-item');

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedSuggestionIndex = Math.min(
      selectedSuggestionIndex + 1,
      suggestionItems.length - 1
    );
    updateSelectedSuggestion(suggestionItems);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
    updateSelectedSuggestion(suggestionItems);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (selectedSuggestionIndex >= 0 && suggestionItems[selectedSuggestionIndex]) {
      suggestionItems[selectedSuggestionIndex].click();
    } else {
      performSearch(this.value.trim());
    }
    suggestionsDiv.style.display = 'none';
  } else if (e.key === 'Escape') {
    suggestionsDiv.style.display = 'none';
  }
});

// Update selected suggestion highlight
function updateSelectedSuggestion(items) {
  items.forEach((item, index) => {
    if (index === selectedSuggestionIndex) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

// Close suggestions when clicking outside
document.addEventListener('click', function (e) {
  if (!e.target.closest('.search-container')) {
    document.getElementById('searchSuggestions').style.display = 'none';
  }
});

// ===========================
// AUTH FUNCTIONS
// ===========================

function showSignIn() {
  document.getElementById('signInForm').classList.remove('hidden');
  document.getElementById('signUpForm').classList.add('hidden');
  document.querySelectorAll('.auth-tab')[0].classList.add('active');
  document.querySelectorAll('.auth-tab')[1].classList.remove('active');
}

function showSignUp() {
  document.getElementById('signInForm').classList.add('hidden');
  document.getElementById('signUpForm').classList.remove('hidden');
  document.querySelectorAll('.auth-tab')[0].classList.remove('active');
  document.querySelectorAll('.auth-tab')[1].classList.add('active');
}

async function handleEmailSignIn() {
  const email = document.getElementById('signInEmail').value;
  const password = document.getElementById('signInPassword').value;
  const errorDiv = document.getElementById('signInError');

  if (!email || !password) {
    errorDiv.textContent = 'Please fill in all fields';
    return;
  }

  const result = await window.signInWithEmail(email, password);
  if (!result.success) {
    errorDiv.textContent = result.error;
  }
}

async function handleEmailSignUp() {
  const name = document.getElementById('signUpName').value;
  const email = document.getElementById('signUpEmail').value;
  const password = document.getElementById('signUpPassword').value;
  const errorDiv = document.getElementById('signUpError');

  if (!name || !email || !password) {
    errorDiv.textContent = 'Please fill in all fields';
    return;
  }

  if (password.length < 6) {
    errorDiv.textContent = 'Password must be at least 6 characters';
    return;
  }

  const result = await window.signUpWithEmail(email, password, name);
  if (!result.success) {
    errorDiv.textContent = result.error;
  }
}

async function handleGoogleSignIn() {
  const result = await window.signInWithGoogle();
  if (!result.success) {
    document.getElementById('signInError').textContent = result.error;
  }
}

async function handleSignOut() {
  const result = await window.signOutUser();
  if (result.success) {
    window.location.reload();
  }
}

// ===========================
// SETTINGS FUNCTIONS
// ===========================

function openSettings() {
  document.getElementById('settingsModal').style.display = 'block';
  document.getElementById('userName').value = userData.name;
  document.getElementById('userLocation').value = userData.location;

  // Display user email if logged in
  const emailDisplay = document.getElementById('userEmailDisplay');
  if (window.auth && window.auth.currentUser) {
    emailDisplay.textContent = window.auth.currentUser.email;
    emailDisplay.style.display = 'block';
  } else {
    emailDisplay.style.display = 'none';
  }
}

function closeSettings() {
  document.getElementById('settingsModal').style.display = 'none';
}

async function saveSettings() {
  userData.name = document.getElementById('userName').value;
  userData.location = document.getElementById('userLocation').value;

  // Save to Firestore if user is logged in
  if (window.auth && window.auth.currentUser) {
    await window.saveUserSettings(userData.name, userData.location);
  } else {
    // Fallback to localStorage for guests
    localStorage.setItem('userName', userData.name);
    localStorage.setItem('userLocation', userData.location);
  }

  updateGreeting();
  updateWeather();
  closeSettings();
}

// ===========================
// GOOGLE APPS MENU FUNCTIONS
// ===========================

function toggleAppsMenu() {
  const menu = document.getElementById('appsMenu');
  const overlay = document.getElementById('appsMenuOverlay');

  menu.classList.toggle('active');
  overlay.classList.toggle('active');
}

function closeAppsMenu() {
  const menu = document.getElementById('appsMenu');
  const overlay = document.getElementById('appsMenuOverlay');

  menu.classList.remove('active');
  overlay.classList.remove('active');
}

// ===========================
// INITIALIZATION
// ===========================

async function init() {
  await loadPexelsVideo();

  updateTime();
  updateDate();
  updateGreeting();
  updateQuote();
  updateWeather();
  renderTodos();

  // Auto-focus search bar
  document.getElementById('searchBar').focus();

  setInterval(updateTime, 1000);
  setInterval(updateDate, 60000);
  setInterval(updateGreeting, 60000);
  setInterval(updateWeather, 600000);
}

init();
