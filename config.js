// API Keys
const PEXELS_API_KEY =
  'XM1cPVOd285bkUsc2iiOKjhLg7oGjwvXQCIHjextLMBD0ByhUGN4tDQD';
const OPENWEATHER_API_KEY = 'a64d9def357accae801b18b33d7bbe22';

// Alternative weather service (free, no key needed)
const USE_ALTERNATIVE_WEATHER = true;

// Fallback videos if API fails
const fallbackVideos = [
  'https://cdn.pixabay.com/video/2019/04/05/21046-329127438_large.mp4',
  'https://cdn.pixabay.com/video/2020/10/15/52795-470667958_large.mp4',
  'https://cdn.pixabay.com/video/2021/01/23/63246-506279742_large.mp4',
  'https://cdn.pixabay.com/video/2020/04/19/36337-410653426_large.mp4',
  'https://cdn.pixabay.com/video/2016/08/19/4131-180607973_large.mp4',
  'https://cdn.pixabay.com/video/2023/06/14/167032-836252994_large.mp4',
  'https://cdn.pixabay.com/video/2022/03/11/110857-689035517_large.mp4',
];

// Inspirational quotes
const quotes = [
  '"The only way to do great work is to love what you do." - Steve Jobs',
  '"Innovation distinguishes between a leader and a follower." - Steve Jobs',
  '"Stay hungry. Stay foolish." - Steve Jobs',
  '"The future belongs to those who believe in the beauty of their dreams." - Eleanor Roosevelt',
  '"It is during our darkest moments that we must focus to see the light." - Aristotle',
  '"The best time to plant a tree was 20 years ago. The second best time is now." - Chinese Proverb',
  '"Your time is limited, don\'t waste it living someone else\'s life." - Steve Jobs',
  '"The only impossible journey is the one you never begin." - Tony Robbins',
  '"Success is not final, failure is not fatal: it is the courage to continue that counts." - Winston Churchill',
  '"The way to get started is to quit talking and begin doing." - Walt Disney',
];

// Video search queries for variety
const videoQueries = [
  'nature',
  'ocean',
  'mountains',
  'forest',
  'sky',
  'clouds',
  'abstract',
  'technology',
  'space',
  'city',
  'rain',
  'waves',
  'northern lights',
  'stars',
  'sunset',
  'particles',
  'aerial',
];

// Weather icons mapping
const weatherIcons = {
  Clear: 'fas fa-sun',
  Clouds: 'fas fa-cloud',
  Rain: 'fas fa-cloud-rain',
  Drizzle: 'fas fa-cloud-rain',
  Thunderstorm: 'fas fa-bolt',
  Snow: 'fas fa-snowflake',
  Mist: 'fas fa-smog',
  Fog: 'fas fa-smog',
  Haze: 'fas fa-smog',
};
