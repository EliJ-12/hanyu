// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Global variables
let vocab = [];
let currentIndex = 0;
let selectedHSK = 1;
let currentView = 'daily';

// DOM Elements
const dailyView = document.getElementById('daily-view');
const listView = document.getElementById('list-view');
const dailyBtn = document.getElementById('daily-btn');
const listBtn = document.getElementById('list-btn');
const vocabListContainer = document.getElementById('vocab-list');
const searchInput = document.getElementById('search-input');

// Navigation
function showView(view) {
  currentView = view;
  if (view === 'daily') {
    dailyView.classList.remove('hidden');
    listView.classList.add('hidden');
    dailyBtn.classList.add('active');
    listBtn.classList.remove('active');
  } else {
    dailyView.classList.add('hidden');
    listView.classList.remove('hidden');
    dailyBtn.classList.remove('active');
    listBtn.classList.add('active');
    renderVocabList();
  }
}

dailyBtn.addEventListener('click', () => showView('daily'));
listBtn.addEventListener('click', () => showView('list'));

// Load vocabulary
async function loadVocab(level) {
  try {
    const response = await fetch(`hsk${level}.json`);
    vocab = await response.json();
  } catch (error) {
    console.error('Error loading vocab:', error);
  }
}

// Select word based on date
function getWordOfDay() {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  currentIndex = day % vocab.length;
  return vocab[currentIndex];
}

// Display word
function displayWord(word) {
  document.getElementById('pinyin').textContent = word.pinyin;
  document.getElementById('hanzi').textContent = word.hanzi;
  document.getElementById('translation').textContent = word.translation;
  document.getElementById('hsk-level').textContent = `HSK ${word.hsk}`;
}

// Render vocabulary list
function renderVocabList(searchTerm = '') {
  vocabListContainer.innerHTML = '';
  
  const filtered = searchTerm 
    ? vocab.filter(word => 
        word.hanzi.includes(searchTerm) || 
        word.pinyin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.translation.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : vocab;
  
  filtered.forEach(word => {
    const item = document.createElement('div');
    item.className = 'vocab-item';
    item.innerHTML = `
      <span class="vocab-hanzi">${word.hanzi}</span>
      <span class="vocab-pinyin">${word.pinyin}</span>
      <span class="vocab-translation">${word.translation}</span>
      <span class="vocab-hsk">HSK ${word.hsk}</span>
    `;
    vocabListContainer.appendChild(item);
  });
  
  if (filtered.length === 0) {
    vocabListContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #888;">No words found</div>';
  }
}

// Search functionality
searchInput.addEventListener('input', (e) => {
  renderVocabList(e.target.value);
});

// Next word
document.getElementById('next-btn').addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % vocab.length;
  displayWord(vocab[currentIndex]);
});

// Filter by HSK level
document.getElementById('hsk-select').addEventListener('change', async (e) => {
  selectedHSK = parseInt(e.target.value);
  localStorage.setItem('selectedHSK', selectedHSK);
  await loadVocab(selectedHSK);
  displayWord(getWordOfDay());
  if (currentView === 'list') {
    renderVocabList(searchInput.value);
  }
});

// Check for new day and show notification
function checkNewDay() {
  const lastVisit = localStorage.getItem('lastVisit');
  const today = new Date().toDateString();
  
  if (lastVisit !== today) {
    // New day - show notification and update last visit
    localStorage.setItem('lastVisit', today);
    return true;
  }
  return false;
}

// Load initial data
async function init() {
  selectedHSK = parseInt(localStorage.getItem('selectedHSK')) || 1;
  document.getElementById('hsk-select').value = selectedHSK;
  await loadVocab(selectedHSK);
  displayWord(getWordOfDay());
  
  // Check if it's a new day and request notification permission
  const isNewDay = checkNewDay();
  if (isNewDay) {
    requestNotificationPermission();
  }
}

init();

// Notifications
function requestNotificationPermission() {
  if ('Notification' in window && navigator.serviceWorker) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        showNotification();
      }
    });
  }
}

function showNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) {
        const word = getWordOfDay();
        registration.showNotification('Hanyu Daily - New Word!', {
          body: `${word.hanzi} (${word.pinyin}) - ${word.translation}`,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'daily-word',
          requireInteraction: false
        });
      }
    });
  }
}

// Register periodic sync for daily notifications (if supported)
if ('serviceWorker' in navigator && 'periodicSync' in registration) {
  navigator.serviceWorker.ready.then(registration => {
    registration.periodicSync.register('daily-vocab', {
      minInterval: 24 * 60 * 60 * 1000 // 24 hours
    }).catch(err => console.log('Periodic sync not supported:', err));
  });
}
