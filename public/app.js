// TEX-MEX App
const API = {
  schedule: '/api/schedule',
  homework: '/api/homework',
  notes: '/api/notes',
  ai: '/api/ai'
};

let currentDate = new Date();
let currentView = 'calendar';
let chatHistory = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  renderCalendar();
  loadSchedule();
  loadHomework();
  initEventListeners();
  initAIAssistant();
  initSpotifyWidget();
  initPomodoroTimer();
  loadStatistics();
  initCustomCursor();
});

// Custom Cursor Functions with Physics
let cursor, cursorDot;
const trailElements = [];
const maxTrail = 8;
let mouseX = 0, mouseY = 0;
let cursorX = 0, cursorY = 0;
let dotX = 0, dotY = 0;
let cursorColor = '#6366f1';

// Physics parameters
const springStrength = 0.15;
const damping = 0.75;
const dotSpring = 0.35;

function initCustomCursor() {
  // Create cursor elements
  cursor = document.createElement('div');
  cursor.className = 'cursor';
  document.body.appendChild(cursor);
  
  cursorDot = document.createElement('div');
  cursorDot.className = 'cursor-dot';
  document.body.appendChild(cursorDot);
  
  // Create trail elements
  for (let i = 0; i < maxTrail; i++) {
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    document.body.appendChild(trail);
    trailElements.push({
      element: trail,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0
    });
  }
  
  // Load saved cursor color
  const savedColor = localStorage.getItem('texmex-cursor-color');
  if (savedColor) {
    cursorColor = savedColor;
    updateCursorColor(savedColor);
  }
  
  // Mouse move handler
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  
  // Animate with physics
  animateCursorPhysics();
  
  // Hover effects
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('button, a, input, select, textarea, .day-cell, .card')) {
      cursor.classList.add('hover');
    }
  });
  
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('button, a, input, select, textarea, .day-cell, .card')) {
      cursor.classList.remove('hover');
    }
  });
  
  // Click effects
  document.addEventListener('mousedown', () => {
    cursor.classList.add('click');
  });
  
  document.addEventListener('mouseup', () => {
    cursor.classList.remove('click');
  });
  
  // Cursor color buttons
  document.querySelectorAll('.cursor-color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.color;
      cursorColor = color;
      updateCursorColor(color);
      localStorage.setItem('texmex-cursor-color', color);
    });
  });
}

function updateCursorColor(color) {
  cursor.style.borderColor = color;
  cursorDot.style.background = color;
  cursorDot.style.boxShadow = `0 0 15px ${color}, 0 0 30px ${color}`;
  document.documentElement.style.setProperty('--cursor-color', color);
  
  // Update trail colors
  trailElements.forEach(trail => {
    trail.element.style.background = color;
  });
}

function animateCursorPhysics() {
  // Spring physics for main cursor
  const dx = mouseX - cursorX;
  const dy = mouseY - cursorY;
  
  cursorX += dx * springStrength;
  cursorY += dy * springStrength;
  
  cursor.style.left = cursorX - 20 + 'px';
  cursor.style.top = cursorY - 20 + 'px';
  
  // Spring physics for dot (faster follow)
  const dotDx = mouseX - dotX;
  const dotDy = mouseY - dotY;
  
  dotX += dotDx * dotSpring;
  dotY += dotDy * dotSpring;
  
  cursorDot.style.left = dotX - 5 + 'px';
  cursorDot.style.top = dotY - 5 + 'px';
  
  // Physics for trail elements
  let prevX = cursorX;
  let prevY = cursorY;
  
  trailElements.forEach((trail, index) => {
    const strength = 0.4 - (index * 0.03);
    
    const tdx = prevX - trail.x;
    const tdy = prevY - trail.y;
    
    trail.vx += tdx * strength;
    trail.vy += tdy * strength;
    
    trail.vx *= damping;
    trail.vy *= damping;
    
    trail.x += trail.vx;
    trail.y += trail.vy;
    
    trail.element.style.left = trail.x - 4 + 'px';
    trail.element.style.top = trail.y - 4 + 'px';
    trail.element.style.opacity = (maxTrail - index) / maxTrail * 0.5;
    
    prevX = trail.x;
    prevY = trail.y;
  });
  
  requestAnimationFrame(animateCursorPhysics);
}

// Spotify Widget - Lanyard API
function initSpotifyWidget() {
  updateSpotifyTrack();
  setInterval(updateSpotifyTrack, 15000); // Update every 15 seconds
}

async function updateSpotifyTrack() {
  const container = document.getElementById('spotify-track-container');
  
  try {
    // Using Lanyard API to get Discord presence
    const res = await fetch('https://api.lanyard.rest/v1/users/1447208839576551457');
    const data = await res.json();
    
    if (data.success && data.data.spotify) {
      const spotify = data.data.spotify;
      
      container.innerHTML = `
        <div class="spotify-track">
          <img src="${spotify.album_art_url}" alt="Album Art" class="spotify-album-art">
          <div class="spotify-info">
            <div class="spotify-track-name" title="${spotify.song}">${spotify.song}</div>
            <div class="spotify-artist-name" title="${spotify.artist}">by ${spotify.artist}</div>
            <div class="spotify-status playing">Playing on Spotify</div>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="spotify-no-track">
          🎵 Ничего не играет...
        </div>
      `;
    }
  } catch (error) {
    container.innerHTML = `
      <div class="spotify-no-track">
        ❌ Не удалось загрузить трек
      </div>
    `;
  }
}

// Navigation
function initNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
    });
  });
}

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-view="${view}"]`).classList.add('active');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`${view}-view`).classList.add('active');
}

// Calendar
let selectedDate = null;

function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const monthLabel = document.getElementById('current-month');
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  monthLabel.textContent = `${months[month]} ${year}`;
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay() || 7;
  
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  
  grid.innerHTML = days.map(d => `<div class="day-header">${d}</div>`).join('');
  
  for (let i = 1; i < startDay; i++) {
    grid.innerHTML += '<div class="day-cell empty"></div>';
  }
  
  const today = new Date();
  
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    grid.innerHTML += `
      <div class="day-cell ${isToday ? 'today' : ''}" data-date="${dateStr}" onclick="openDayNotes('${dateStr}')">
        <div class="day-number">${day}</div>
        <div class="day-events" id="events-${dateStr}"></div>
      </div>
    `;
  }
  
  loadCalendarEvents();
}

async function loadCalendarEvents() {
  const notes = await fetchAPI(API.notes);
  
  document.querySelectorAll('.day-cell[data-date]').forEach(cell => {
    const date = cell.dataset.date;
    const dayNotes = notes.filter(n => n.date === date);
    const container = cell.querySelector('.day-events');
    
    if (dayNotes.length > 0) {
      container.innerHTML = dayNotes.map(n => {
        const colors = {
          'low': '#22c55e',
          'normal': '#f59e0b',
          'high': '#ef4444',
          'critical': '#dc2626'
        };
        return `<div class="event-dot" style="background: ${colors[n.importance] || '#f59e0b'}; width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin: 2px;" title="${n.content}"></div>`;
      }).join('');
    }
  });
}

async function openDayNotes(date) {
  selectedDate = date;
  const modal = document.getElementById('day-modal');
  const title = document.getElementById('day-modal-title');
  const list = document.getElementById('day-notes-list');
  
  const dateObj = new Date(date);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  title.textContent = `📅 ${dateObj.toLocaleDateString('ru-RU', options)}`;
  
  const notes = await fetchAPI(API.notes);
  const dayNotes = notes.filter(n => n.date === date);
  
  if (dayNotes.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Заметок нет. Добавьте первую!</p>';
  } else {
    const priorityColors = {
      'low': '#22c55e',
      'normal': '#f59e0b',
      'high': '#ef4444',
      'critical': '#dc2626'
    };
    
    const priorityLabels = {
      'low': '🟢 Низкая',
      'normal': '🟡 Обычная',
      'high': '🔴 Высокая',
      'critical': '⚠️ Критическая'
    };
    
    list.innerHTML = dayNotes.map(n => `
      <div class="card" style="margin-bottom: 10px; border-left: 4px solid ${priorityColors[n.importance] || priorityColors.normal}">
        <div class="card-header">
          <span class="badge" style="background: ${priorityColors[n.importance] || priorityColors.normal}">${priorityLabels[n.importance] || '🟡 Обычная'}</span>
          ${n.time ? `<span class="badge" style="background: var(--accent)">⏰ ${n.time}</span>` : ''}
        </div>
        <div class="card-body">${n.content}</div>
        ${n.media_url ? `
          <div style="margin-top: 10px;">
            ${n.media_url.endsWith('.mp4') || n.media_url.endsWith('.mov') 
              ? `<video src="${n.media_url}" controls style="max-width: 100%; border-radius: 8px;"></video>`
              : `<img src="${n.media_url}" style="max-width: 100%; border-radius: 8px; cursor: pointer;" onclick="window.open('${n.media_url}', '_blank')">`
            }
          </div>
        ` : ''}
        <div class="card-actions">
          <button class="btn-secondary" onclick="editNoteFromDay(${n.id})">✏️ Редактировать</button>
          <button class="btn-danger" onclick="deleteNoteFromDay(${n.id})">🗑️ Удалить</button>
        </div>
      </div>
    `).join('');
  }
  
  modal.classList.remove('hidden');
}

function closeDayModal() {
  document.getElementById('day-modal').classList.add('hidden');
}

function showAddNoteForm() {
  showNoteModal({ date: selectedDate });
}

async function editNoteFromDay(id) {
  const notes = await fetchAPI(API.notes);
  const note = notes.find(n => n.id === id);
  showNoteModal(note);
}

async function deleteNoteFromDay(id) {
  if (confirm('Удалить эту заметку?')) {
    await deleteAPI(`${API.notes}/${id}`);
    openDayNotes(selectedDate);
    loadCalendarEvents();
  }
}

// Schedule
async function loadSchedule() {
  const data = await fetchAPI(API.schedule);
  renderSchedule(data);
}

function renderSchedule(items) {
  const container = document.getElementById('schedule-list');
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  
  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state glass-panel" style="text-align: center; padding: 60px;">
        <div style="font-size: 4rem; margin-bottom: 20px;">📚</div>
        <h3 style="margin-bottom: 10px;">Расписание пустое</h3>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">Добавьте первую пару или отсканируйте фото расписания</p>
        <button class="btn-primary" onclick="document.getElementById('scan-schedule-btn').click()">📷 Сканировать фото</button>
      </div>
    `;
    return;
  }
  
  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.day_of_week]) grouped[item.day_of_week] = [];
    grouped[item.day_of_week].push(item);
  });
  
  container.innerHTML = Object.entries(grouped).map(([day, lessons]) => `
    <div class="schedule-day glass-panel" style="margin-bottom: 30px; padding: 25px; border-radius: 20px;">
      <div class="schedule-day-header" style="display: flex; align-items: center; margin-bottom: 20px;">
        <div style="font-size: 2rem; margin-right: 15px;">${['☀️', '📘', '📗', '📙', '📕', '📓', '📒'][day]}</div>
        <div>
          <h3 style="color: var(--primary-light); font-size: 1.3rem;">${days[day]}</h3>
          <p style="color: var(--text-secondary); font-size: 0.85rem;">${lessons.length} пар</p>
        </div>
      </div>
      <div class="lessons-grid" style="display: grid; gap: 15px;">
        ${lessons.sort((a, b) => a.lesson_order - b.lesson_order).map(l => `
          <div class="lesson-card" data-id="${l.id}" style="
            background: var(--bg-card);
            border-left: 4px solid var(--primary);
            border-radius: 12px;
            padding: 18px;
            transition: all 0.3s ease;
            cursor: pointer;
          " onmouseover="this.style.background='var(--glass-bg)'; this.style.transform='translateX(5px)';" 
             onmouseout="this.style.background='var(--bg-card)'; this.style.transform='translateX(0)';">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
              <div style="display: flex; gap: 15px; align-items: center;">
                <div class="lesson-number" style="
                  background: linear-gradient(135deg, var(--primary), var(--secondary));
                  width: 40px;
                  height: 40px;
                  border-radius: 10px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 700;
                  font-size: 1.1rem;
                ">${l.lesson_order}</div>
                <div>
                  <div class="lesson-subject" style="font-size: 1.1rem; font-weight: 600; margin-bottom: 5px;">${l.subject}</div>
                  <div class="lesson-details" style="display: flex; gap: 15px; flex-wrap: wrap; font-size: 0.85rem; color: var(--text-secondary);">
                    ${l.room ? `<span>🚪 ${l.room}</span>` : ''}
                    ${l.teacher ? `<span>👤 ${l.teacher}</span>` : ''}
                  </div>
                </div>
              </div>
              ${l.time_start ? `
                <div class="lesson-time" style="
                  background: var(--bg-dark);
                  padding: 8px 12px;
                  border-radius: 8px;
                  font-size: 0.85rem;
                  color: var(--primary-light);
                  font-weight: 500;
                ">
                  ⏰ ${l.time_start} - ${l.time_end || ''}
                </div>
              ` : ''}
            </div>
            <div class="lesson-actions" style="display: flex; gap: 10px; margin-top: 12px;">
              <button class="btn-secondary" onclick="event.stopPropagation(); editLesson(${l.id})" style="flex: 1; padding: 8px;">✏️ Редактировать</button>
              <button class="btn-danger" onclick="event.stopPropagation(); deleteLesson(${l.id})" style="padding: 8px 12px;">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Homework
async function loadHomework() {
  const data = await fetchAPI(API.homework);
  renderHomework(data);
}

function renderHomework(items) {
  const container = document.getElementById('homework-list');
  
  if (items.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Домашних заданий нет. Отдыхайте!</p>';
    return;
  }
  
  container.innerHTML = items.map(h => `
    <div class="card homework-item ${h.completed ? 'completed' : ''}" data-id="${h.id}">
      <div class="checkbox ${h.completed ? 'checked' : ''}" onclick="toggleHomework(${h.id})">
        ${h.completed ? '✓' : ''}
      </div>
      <div style="flex: 1">
        <div class="card-header">
          <span class="card-title">${h.subject}</span>
          <span class="badge ${h.completed ? 'success' : 'warning'}">${h.due_date || 'Без срока'}</span>
        </div>
        <div class="card-body">${h.description}</div>
        <div class="card-actions">
          <button class="btn-secondary" onclick="editHomework(${h.id})">Редактировать</button>
          <button class="btn-danger" onclick="deleteHomework(${h.id})">Удалить</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Notes
async function loadNotes() {
  const data = await fetchAPI(API.notes);
  renderNotes(data);
}

function renderNotes(items) {
  const container = document.getElementById('notes-list');
  
  const priorityColors = {
    'low': '#22c55e',
    'normal': '#f59e0b',
    'high': '#ef4444',
    'critical': '#dc2626'
  };
  
  const priorityLabels = {
    'low': '🟢 Низкая',
    'normal': '🟡 Обычная',
    'high': '🔴 Высокая',
    'critical': '⚠️ Критическая'
  };
  
  if (items.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Заметок пока нет. Создайте первую!</p>';
    return;
  }
  
  container.innerHTML = items.map(n => `
    <div class="card" data-id="${n.id}" style="border-left: 4px solid ${priorityColors[n.importance] || priorityColors.normal}">
      <div class="card-header">
        <div>
          <span class="badge">${n.date || 'Без даты'}</span>
          ${n.time ? `<span class="badge" style="background: var(--accent)">⏰ ${n.time}</span>` : ''}
          <span class="badge" style="background: ${priorityColors[n.importance] || priorityColors.normal}">${priorityLabels[n.importance] || '🟡 Обычная'}</span>
        </div>
        <span class="card-meta">${n.type || 'general'}</span>
      </div>
      <div class="card-body">${n.content}</div>
      ${n.media_url ? `
        <div style="margin-top: 15px;">
          ${n.media_url.endsWith('.mp4') || n.media_url.endsWith('.mov') 
            ? `<video src="${n.media_url}" controls style="max-width: 100%; border-radius: 10px;"></video>`
            : `<img src="${n.media_url}" style="max-width: 100%; border-radius: 10px; cursor: pointer;" onclick="window.open('${n.media_url}', '_blank')">`
          }
        </div>
      ` : ''}
      <div class="card-actions">
        <button class="btn-secondary" onclick="editNote(${n.id})">Редактировать</button>
        <button class="btn-danger" onclick="deleteNote(${n.id})">Удалить</button>
      </div>
    </div>
  `).join('');
}

// Event Listeners
function initEventListeners() {
  // Calendar navigation
  document.getElementById('prev-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });
  
  document.getElementById('next-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
  
  // Add buttons
  document.getElementById('add-lesson-btn').addEventListener('click', () => showLessonModal());
  document.getElementById('add-homework-btn').addEventListener('click', () => showHomeworkModal());
  document.getElementById('scan-schedule-btn').addEventListener('click', () => showScanScheduleModal());
  
  // Modal close
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  
  // Day modal close
  document.getElementById('day-modal').addEventListener('click', (e) => {
    if (e.target.id === 'day-modal') closeDayModal();
  });
  
  // Theme selector
  document.getElementById('theme-selector').addEventListener('change', (e) => {
    document.body.setAttribute('data-theme', e.target.value);
    localStorage.setItem('texmex-theme', e.target.value);
  });
  
  // Load saved theme
  const savedTheme = localStorage.getItem('texmex-theme');
  if (savedTheme) {
    document.body.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-selector').value = savedTheme;
  }
}

// API Helpers
async function fetchAPI(url) {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (err) {
    console.error('API Error:', err);
    return [];
  }
}

async function postAPI(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await res.json();
}

async function putAPI(url, data) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await res.json();
}

async function deleteAPI(url) {
  const res = await fetch(url, { method: 'DELETE' });
  return await res.json();
}

// Modal Functions
function showModal(content) {
  document.getElementById('modal').innerHTML = content;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

function showLessonModal(item = {}) {
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  showModal(`
    <h3>${item.id ? 'Редактировать пару' : 'Добавить пару'}</h3>
    <form id="lesson-form">
      <div class="form-group">
        <label>День недели</label>
        <select name="day_of_week" required>
          ${days.map((d, i) => `<option value="${i}" ${item.day_of_week == i ? 'selected' : ''}>${d}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Номер пары</label>
        <input type="number" name="lesson_order" min="1" max="8" value="${item.lesson_order || 1}" required>
      </div>
      <div class="form-group">
        <label>Предмет</label>
        <input type="text" name="subject" value="${item.subject || ''}" required placeholder="Название предмета">
      </div>
      <div class="form-group">
        <label>Аудитория</label>
        <input type="text" name="room" value="${item.room || ''}" placeholder="Номер аудитории">
      </div>
      <div class="form-group">
        <label>Преподаватель</label>
        <input type="text" name="teacher" value="${item.teacher || ''}" placeholder="ФИО преподавателя">
      </div>
      <div class="form-group">
        <label>Время начала</label>
        <input type="time" name="time_start" value="${item.time_start || ''}">
      </div>
      <div class="form-group">
        <label>Время окончания</label>
        <input type="time" name="time_end" value="${item.time_end || ''}">
      </div>
      <div class="form-actions">
        <button type="button" class="btn-secondary" onclick="closeModal()">Отмена</button>
        <button type="submit" class="btn-primary">Сохранить</button>
      </div>
    </form>
  `);
  
  document.getElementById('lesson-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    if (item.id) {
      await putAPI(`${API.schedule}/${item.id}`, data);
    } else {
      await postAPI(API.schedule, data);
    }
    
    closeModal();
    loadSchedule();
  });
}

// Scan Schedule from Photo
function showScanScheduleModal() {
  showModal(`
    <h3>📷 Сканировать расписание</h3>
    <div id="scan-preview" style="margin-bottom: 20px; text-align: center;">
      <img id="preview-image" style="max-width: 100%; border-radius: 10px; display: none;">
    </div>
    <input type="file" id="schedule-photo-input" accept="image/*" style="margin-bottom: 15px;">
    <div id="scan-status" style="margin-bottom: 15px; color: var(--text-secondary);"></div>
    <div class="form-actions">
      <button type="button" class="btn-secondary" onclick="closeModal()">Отмена</button>
      <button type="button" class="btn-primary" id="start-scan-btn" disabled>🔍 Сканировать</button>
    </div>
  `);
  
  const input = document.getElementById('schedule-photo-input');
  const preview = document.getElementById('preview-image');
  const scanBtn = document.getElementById('start-scan-btn');
  const status = document.getElementById('scan-status');
  let imageData = null;
  
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imageData = e.target.result;
        preview.src = imageData;
        preview.style.display = 'block';
        scanBtn.disabled = false;
        status.textContent = 'Фото загружено. Нажмите "Сканировать"';
      };
      reader.readAsDataURL(file);
    }
  });
  
  scanBtn.addEventListener('click', async () => {
    if (!imageData) return;
    
    scanBtn.disabled = true;
    status.textContent = '🔄 Анализирую расписание...';
    
    try {
      const res = await fetch(`${API.ai}/scan-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      });
      
      const data = await res.json();
      
      if (data.error) {
        status.innerHTML = `<span style="color: var(--danger);">❌ ${data.error}</span>`;
        scanBtn.disabled = false;
        return;
      }
      
      if (data.schedule && Array.isArray(data.schedule)) {
        status.innerHTML = `<span style="color: var(--success);">✅ Найдено ${data.schedule.length} пар!</span>`;
        
        // Add all lessons to database
        for (const lesson of data.schedule) {
          await postAPI(API.schedule, lesson);
        }
        
        setTimeout(() => {
          closeModal();
          loadSchedule();
          showNotification('✅ Расписание добавлено!', `Добавлено ${data.schedule.length} пар`);
        }, 1500);
      }
    } catch (error) {
      console.error('Scan error:', error);
      status.innerHTML = '<span style="color: var(--danger);">❌ Ошибка при сканировании</span>';
      scanBtn.disabled = false;
    }
  });
}

function showHomeworkModal(item = {}) {
  showModal(`
    <h3>${item.id ? 'Редактировать ДЗ' : 'Добавить ДЗ'}</h3>
    <form id="homework-form">
      <div class="form-group">
        <label>Предмет</label>
        <input type="text" name="subject" value="${item.subject || ''}" required placeholder="Название предмета">
      </div>
      <div class="form-group">
        <label>Описание</label>
        <textarea name="description" required placeholder="Текст домашнего задания">${item.description || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Срок сдачи</label>
        <input type="date" name="due_date" value="${item.due_date || ''}">
      </div>
      <div class="form-actions">
        <button type="button" class="btn-secondary" onclick="closeModal()">Отмена</button>
        <button type="submit" class="btn-primary">Сохранить</button>
      </div>
    </form>
  `);
  
  document.getElementById('homework-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    if (item.id) {
      await putAPI(`${API.homework}/${item.id}`, data);
    } else {
      await postAPI(API.homework, data);
    }
    
    closeModal();
    loadHomework();
  });
}

function showNoteModal(item = {}) {
  const priorities = [
    { value: 'low', label: '🟢 Низкая' },
    { value: 'normal', label: '🟡 Обычная' },
    { value: 'high', label: '🔴 Высокая' },
    { value: 'critical', label: '⚠️ Критическая' }
  ];
  
  showModal(`
    <h3>${item.id ? 'Редактировать заметку' : 'Добавить заметку'}</h3>
    <form id="note-form" enctype="multipart/form-data">
      <div class="form-group">
        <label>Дата</label>
        <input type="date" name="date" value="${item.date || new Date().toISOString().split('T')[0]}">
      </div>
      <div class="form-group">
        <label>Время</label>
        <input type="time" name="time" value="${item.time || ''}">
      </div>
      <div class="form-group">
        <label>Важность</label>
        <select name="importance">
          ${priorities.map(p => `<option value="${p.value}" ${item.importance === p.value ? 'selected' : ''}>${p.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Тип</label>
        <select name="type">
          <option value="general" ${item.type === 'general' ? 'selected' : ''}>Обычная</option>
          <option value="important" ${item.type === 'important' ? 'selected' : ''}>Важная</option>
          <option value="reminder" ${item.type === 'reminder' ? 'selected' : ''}>Напоминание</option>
        </select>
      </div>
      <div class="form-group">
        <label>Медиа (фото/видео)</label>
        <input type="file" name="media" accept="image/*,video/mp4,video/*">
        ${item.media_url ? `<p style="margin-top: 5px; font-size: 0.85rem; color: var(--text-secondary);">Текущий файл: ${item.media_url}</p>` : ''}
      </div>
      <div class="form-group">
        <label>Содержание</label>
        <textarea name="content" required placeholder="Текст заметки">${item.content || ''}</textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-secondary" onclick="closeModal()">Отмена</button>
        <button type="submit" class="btn-primary">Сохранить</button>
      </div>
    </form>
  `);
  
  document.getElementById('note-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const url = item.id ? `${API.notes}/${item.id}` : API.notes;
    const method = item.id ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method: method,
        body: formData
      });
      
      if (res.ok) {
        closeModal();
        
        // Refresh day modal if open
        if (selectedDate) {
          openDayNotes(selectedDate);
        }
        
        loadCalendarEvents();
      }
    } catch (err) {
      console.error('Error saving note:', err);
    }
  });
}

// Edit Functions
async function editLesson(id) {
  const items = await fetchAPI(API.schedule);
  const item = items.find(i => i.id === id);
  showLessonModal(item);
}

async function editHomework(id) {
  const items = await fetchAPI(API.homework);
  const item = items.find(i => i.id === id);
  showHomeworkModal(item);
}

async function editNote(id) {
  const items = await fetchAPI(API.notes);
  const item = items.find(i => i.id === id);
  showNoteModal(item);
}

// Delete Functions
async function deleteLesson(id) {
  if (confirm('Удалить эту пару?')) {
    await deleteAPI(`${API.schedule}/${id}`);
    loadSchedule();
  }
}

async function deleteHomework(id) {
  if (confirm('Удалить это ДЗ?')) {
    await deleteAPI(`${API.homework}/${id}`);
    loadHomework();
  }
}

async function deleteNote(id) {
  if (confirm('Удалить эту заметку?')) {
    await deleteAPI(`${API.notes}/${id}`);
    loadNotes();
    loadCalendarEvents();
  }
}

// Toggle Homework
async function toggleHomework(id) {
  await fetch(`${API.homework}/${id}`, { method: 'PATCH' });
  loadHomework();
}

// AI Assistant Functions
function initAIAssistant() {
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-message-btn');
  const clearBtn = document.getElementById('clear-chat-btn');
  const attachBtn = document.getElementById('attach-photo-btn');
  const photoInput = document.getElementById('ai-photo-input');
  
  sendBtn.addEventListener('click', sendMessage);
  
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  clearBtn.addEventListener('click', clearChat);
  
  // Photo attachment
  attachBtn.addEventListener('click', () => photoInput.click());
  photoInput.addEventListener('change', handlePhotoUpload);
  
  // Add welcome message
  addChatMessage('assistant', 'Привет! 👋 Я AI Ассистент TEX-MEX.\n\n**Могу помочь:**\n• 📅 Изменить расписание\n• 📝 Добавить домашнее задание\n• 📷 Распознать ДЗ с фото\n• 📊 Дать советы по учёбе\n\nНапиши или пришли фото!');
}

let currentPhotoData = null;

async function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (event) => {
    currentPhotoData = event.target.result;
    
    // Show preview
    addChatMessage('user', `📷 Фото: ${file.name}`);
    addPhotoPreview(currentPhotoData);
    
    // Auto-analyze
    await analyzePhoto(currentPhotoData);
  };
  reader.readAsDataURL(file);
  e.target.value = ''; // Reset input
}

function addPhotoPreview(photoData) {
  const container = document.getElementById('chat-messages');
  const preview = document.createElement('div');
  preview.className = 'chat-message user';
  preview.innerHTML = `<img src="${photoData}" style="max-width: 200px; border-radius: 10px; margin: 5px 0;">`;
  container.appendChild(preview);
  container.scrollTop = container.scrollHeight;
}

async function analyzePhoto(photoData) {
  showTypingIndicator();
  
  try {
    const res = await fetch(`${API.ai}/analyze-photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: photoData })
    });
    
    const data = await res.json();
    removeTypingIndicator();
    
    if (data.error) {
      addChatMessage('assistant', `❌ ${data.error}`);
    } else if (data.homework) {
      addChatMessage('assistant', `✅ **Распознано ДЗ:**\n\n📚 **Предмет:** ${data.homework.subject}\n📝 **Задание:** ${data.homework.description}${data.homework.due_date ? `\n📅 **Срок:** ${data.homework.due_date}` : ''}\n\nДобавить в список?`, [
        { text: '✅ Добавить', action: () => addHomeworkFromAI(data.homework) },
        { text: '❌ Отмена', action: () => addChatMessage('assistant', 'Хорошо, не будем добавлять.') }
      ]);
    } else if (data.schedule) {
      addChatMessage('assistant', `✅ **Распознано расписание:** ${data.schedule.length} пар\n\nДобавить в расписание?`, [
        { text: '✅ Добавить', action: () => addScheduleFromAI(data.schedule) },
        { text: '❌ Отмена', action: () => addChatMessage('assistant', 'Хорошо, не будем добавлять.') }
      ]);
    }
  } catch (error) {
    removeTypingIndicator();
    addChatMessage('system', '❌ Ошибка при анализе фото.');
  }
  
  currentPhotoData = null;
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Add user message
  addChatMessage('user', message);
  input.value = '';
  
  // Show typing indicator
  showTypingIndicator();
  
  try {
    // Get context (homework count, schedule, etc.)
    const context = await getAIContext();
    
    // Check for commands
    if (message.toLowerCase().includes('добавь пару') || message.toLowerCase().includes('добавь дз') || message.toLowerCase().includes('измени')) {
      const commandRes = await fetch(`${API.ai}/execute-command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context })
      });
      
      const commandData = await commandRes.json();
      removeTypingIndicator();
      
      if (commandData.action) {
        addChatMessage('assistant', commandData.response, commandData.buttons);
      } else {
        addChatMessage('assistant', commandData.response);
      }
    } else {
      // Regular chat
      const res = await fetch(`${API.ai}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context })
      });
      
      const data = await res.json();
      removeTypingIndicator();
      addChatMessage('assistant', data.response);
    }
    
  } catch (error) {
    removeTypingIndicator();
    addChatMessage('system', '❌ Ошибка связи с AI. Проверьте подключение.');
  }
}

async function addHomeworkFromAI(hw) {
  await postAPI(API.homework, hw);
  addChatMessage('assistant', '✅ Домашнее задание добавлено!');
  loadHomework();
}

async function addScheduleFromAI(schedule) {
  for (const lesson of schedule) {
    await postAPI(API.schedule, lesson);
  }
  addChatMessage('assistant', `✅ Добавлено ${schedule.length} пар в расписание!`);
  loadSchedule();
}

async function getAIContext() {
  try {
    const [homework, schedule] = await Promise.all([
      fetchAPI(API.homework),
      fetchAPI(API.schedule)
    ]);
    
    return {
      homeworkCount: homework.length,
      pendingHomework: homework.filter(h => !h.completed).length,
      scheduleDays: schedule.length
    };
  } catch (error) {
    return {};
  }
}

function addChatMessage(role, content, buttons = []) {
  const container = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${role}`;
  
  // Convert markdown-style bold to HTML
  let formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formattedContent = formattedContent.replace(/\n/g, '<br>');
  
  messageDiv.innerHTML = `<div class="message-content">${formattedContent}</div>`;
  
  // Add buttons if provided
  if (buttons && buttons.length > 0) {
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'chat-buttons';
    buttonsDiv.style.cssText = 'display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;';
    
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = 'btn-primary';
      button.style.cssText = 'padding: 8px 16px; font-size: 0.9rem;';
      button.textContent = btn.text;
      button.addEventListener('click', () => {
        btn.action();
        buttonsDiv.remove();
      });
      buttonsDiv.appendChild(button);
    });
    
    messageDiv.appendChild(buttonsDiv);
  }
  
  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
  
  chatHistory.push({ role, content });
}

function showTypingIndicator() {
  const container = document.getElementById('chat-messages');
  const indicator = document.createElement('div');
  indicator.id = 'typing-indicator';
  indicator.className = 'chat-message assistant';
  indicator.innerHTML = `
    <div class="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  container.appendChild(indicator);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();
}

function clearChat() {
  const container = document.getElementById('chat-messages');
  container.innerHTML = '';
  chatHistory = [];
  addChatMessage('system', 'Чат очищен. Могу чем-то помочь?');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Pomodoro Timer Functions
let pomodoroInterval = null;
let pomodoroTime = 25 * 60; // 25 minutes in seconds
let isPomodoroRunning = false;

function initPomodoroTimer() {
  updatePomodoroDisplay();
  
  document.getElementById('pomodoro-start').addEventListener('click', togglePomodoro);
  document.getElementById('pomodoro-reset').addEventListener('click', resetPomodoro);
  document.getElementById('pomodoro-duration').addEventListener('change', (e) => {
    if (!isPomodoroRunning) {
      pomodoroTime = parseInt(e.target.value) * 60;
      updatePomodoroDisplay();
    }
  });
}

function togglePomodoro() {
  const btn = document.getElementById('pomodoro-start');
  
  if (isPomodoroRunning) {
    clearInterval(pomodoroInterval);
    btn.textContent = '▶ Начать';
    isPomodoroRunning = false;
  } else {
    pomodoroInterval = setInterval(() => {
      if (pomodoroTime > 0) {
        pomodoroTime--;
        updatePomodoroDisplay();
      } else {
        clearInterval(pomodoroInterval);
        btn.textContent = '▶ Начать';
        isPomodoroRunning = false;
        showNotification('⏰ Pomodoro завершен!', 'Время сделать перерыв!');
        playSound();
      }
    }, 1000);
    btn.textContent = '⏸ Пауза';
    isPomodoroRunning = true;
  }
}

function resetPomodoro() {
  clearInterval(pomodoroInterval);
  const duration = document.getElementById('pomodoro-duration').value;
  pomodoroTime = duration * 60;
  isPomodoroRunning = false;
  document.getElementById('pomodoro-start').textContent = '▶ Начать';
  updatePomodoroDisplay();
}

function updatePomodoroDisplay() {
  const minutes = Math.floor(pomodoroTime / 60);
  const seconds = pomodoroTime % 60;
  document.getElementById('pomodoro-display').textContent = 
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Quick Notes Functions
function initQuickNotes() {
  document.getElementById('quick-note-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveQuickNote();
    }
  });
  
  document.getElementById('save-quick-note').addEventListener('click', saveQuickNote);
  loadQuickNotes();
}

function saveQuickNote() {
  const input = document.getElementById('quick-note-input');
  const text = input.value.trim();
  
  if (!text) return;
  
  const notes = JSON.parse(localStorage.getItem('quick-notes') || '[]');
  notes.unshift({
    id: Date.now(),
    text: text,
    date: new Date().toISOString()
  });
  
  localStorage.setItem('quick-notes', JSON.stringify(notes.slice(0, 10)));
  input.value = '';
  loadQuickNotes();
  showNotification('✅ Заметка сохранена!', text.substring(0, 30) + '...');
}

function loadQuickNotes() {
  const notes = JSON.parse(localStorage.getItem('quick-notes') || '[]');
  const container = document.getElementById('quick-notes-list');
  
  if (notes.length === 0) {
    container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Нет заметок</p>';
    return;
  }
  
  container.innerHTML = notes.map(note => `
    <div class="quick-note-item">
      <span>${escapeHtml(note.text)}</span>
      <button onclick="deleteQuickNote(${note.id})" style="background: none; border: none; color: var(--text-secondary); cursor: pointer;">✕</button>
    </div>
  `).join('');
}

function deleteQuickNote(id) {
  const notes = JSON.parse(localStorage.getItem('quick-notes') || '[]');
  const filtered = notes.filter(n => n.id !== id);
  localStorage.setItem('quick-notes', JSON.stringify(filtered));
  loadQuickNotes();
}

// Statistics Functions
async function loadStatistics() {
  const homework = await fetchAPI(API.homework);
  const schedule = await fetchAPI(API.schedule);
  
  const total = homework.length;
  const completed = homework.filter(h => h.completed).length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-completed').textContent = completed;
  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('stat-rate').textContent = `${completionRate}%`;
  document.getElementById('stat-schedule').textContent = schedule.length;
  
  // Update progress bar
  document.getElementById('progress-bar').style.width = `${completionRate}%`;
}

// Notification helper
function showNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '📅' });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, { body, icon: '📅' });
      }
    });
  }
}

// Play sound helper
function playSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  gainNode.gain.value = 0.3;
  
  oscillator.start();
  setTimeout(() => oscillator.stop(), 200);
}
