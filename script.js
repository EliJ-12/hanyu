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
  document.getElementById('hanzi').textContent = word.hanzi;
  document.getElementById('pinyin').textContent = word.pinyin;
  document.getElementById('translation').textContent = word.translation;
  document.getElementById('hsk-level').textContent = `HSK ${word.hsk}`;
}

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
});

// Load initial data
async function init() {
  selectedHSK = parseInt(localStorage.getItem('selectedHSK')) || 1;
  document.getElementById('hsk-select').value = selectedHSK;
  await loadVocab(selectedHSK);
  displayWord(getWordOfDay());
  requestNotificationPermission();
}

init();

// Notifications
function requestNotificationPermission() {
  if ('Notification' in window && navigator.serviceWorker) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        // Simulate daily notification on app open
        showNotification();
      }
    });
  }
}

function showNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    navigator.serviceWorker.getRegistration().then(registration => {
      registration.showNotification('Hanyu Daily', {
        body: 'Time to learn a new Chinese word!',
        icon: '/icon-192x192.png', // Placeholder, need to add icon
        badge: '/icon-192x192.png'
      });
    });
  }
}
