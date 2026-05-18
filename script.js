// ==========================================================================
// CONFIGURATIONS & STATE MANAGEMENT
// ==========================================================================

// Subject Configuration (Color classes matched in CSS and Display Names)
const SUBJECTS = {
    math: { name: "수학", colorVar: "var(--sub-math)" },
    science: { name: "과학", colorVar: "var(--sub-science)" },
    english: { name: "영어", colorVar: "var(--sub-english)" },
    history: { name: "역사", colorVar: "var(--sub-history)" },
    coding: { name: "코딩", colorVar: "var(--sub-coding)" },
    art: { name: "미술", colorVar: "var(--sub-art)" },
    korean: { name: "국어", colorVar: "var(--sub-korean)" },
    general: { name: "기타", colorVar: "var(--sub-general)" }
};

// Global App State
let state = {
    posts: [],
    currentRole: "student", // 'student' or 'teacher'
    filters: {
        subject: "all",      // 'all' or subject key
        type: "all",         // 'all' | 'homework' | 'exam'
        searchQuery: "",     // text string
        calendarDate: null   // 'YYYY-MM-DD' filter from clicking a day cell
    },
    calendar: {
        activeYear: null,
        activeMonth: null    // 0-indexed (0 = Jan, 11 = Dec)
    },
    tempUploadedImage: ""    // temporary base64 image storage during modal creation
};

// Initialize Date Objects
const todayDate = new Date();
const todayFormatted = formatDateString(todayDate);

// Base64 SVGs to use as high-quality default images for seed data
const SEED_IMAGES = {
    math: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'><rect width='100%' height='100%' fill='%23ff4a76'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Outfit, sans-serif' font-weight='800' font-size='48' fill='white'>MATHEMATICS</text><circle cx='100' cy='100' r='40' fill='white' opacity='0.15'/><rect x='600' y='250' width='80' height='80' rx='10' fill='white' opacity='0.15' transform='rotate(45 640 290)'/></svg>",
    science: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'><rect width='100%' height='100%' fill='%2306d6a0'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Outfit, sans-serif' font-weight='800' font-size='48' fill='white'>SCIENCE LAB</text><path d='M120 300 L180 300 L150 200 Z' fill='white' opacity='0.2'/><circle cx='650' cy='150' r='60' fill='white' opacity='0.15'/></svg>",
    english: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'><rect width='100%' height='100%' fill='%233a86ff'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Outfit, sans-serif' font-weight='800' font-size='48' fill='white'>ENGLISH ESSAY</text><rect x='120' y='120' width='100' height='150' rx='8' fill='white' opacity='0.15'/><circle cx='680' cy='280' r='50' fill='white' opacity='0.15'/></svg>",
    coding: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'><rect width='100%' height='100%' fill='%238338ec'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Outfit, sans-serif' font-weight='800' font-size='48' fill='white'>CODING LAB</text><rect x='80' y='100' width='120' height='120' rx='20' fill='white' opacity='0.15'/><circle cx='620' cy='260' r='45' fill='white' opacity='0.15'/></svg>"
};

// ==========================================================================
// STARTUP INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Calendar state to current month
    state.calendar.activeYear = todayDate.getFullYear();
    state.calendar.activeMonth = todayDate.getMonth();
    
    // 2. Load subjects into Sidebar Filters & Form Select
    initSubjectSelectors();

    // 3. Load posts from localStorage or Seed default beautiful demo data
    loadPostsData();

    // 4. Update elements & views
    document.getElementById('header-date-text').innerText = getHeaderDateString();
    setRole('student'); // Default role
    refreshAllViews();

    // 5. Initialize lucide icons for elements loaded in HTML
    lucide.createIcons();

    // 6. Setup Drag and Drop event listeners for image upload zone
    setupDragDropZone();
});

// Setup drag and drop UI
function setupDragDropZone() {
    const dropZone = document.getElementById('drop-zone');
    if (!dropZone) return;

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            processUploadedFile(files[0]);
        }
    }, false);
}

// Generate the beautiful custom subjects list in UI
function initSubjectSelectors() {
    // Add to Sidebar
    const filterContainer = document.getElementById("subject-filters");
    const selectForm = document.getElementById("form-subject");
    
    // Clear dynamic templates (keeping the 'all' item in sidebar)
    filterContainer.querySelectorAll(".filter-item:not([data-subject='all'])").forEach(el => el.remove());
    selectForm.innerHTML = "";

    // Load each subject
    Object.entries(SUBJECTS).forEach(([key, value]) => {
        // Form Option Selector
        const opt = document.createElement("option");
        opt.value = key;
        opt.innerText = value.name;
        selectForm.appendChild(opt);

        // Sidebar filter item
        if (key !== 'general') {
            const li = document.createElement("li");
            li.className = "filter-item";
            li.setAttribute("data-subject", key);
            li.onclick = () => filterBySubject(key);
            li.innerHTML = `
                <span class="subject-dot" style="background-color: ${value.colorVar};"></span>
                <span class="filter-name">${value.name}</span>
            `;
            filterContainer.appendChild(li);
        }
    });
    
    // Append 'general' at the end of the form
    const optGen = document.createElement("option");
    optGen.value = "general";
    optGen.innerText = "기타";
    selectForm.appendChild(optGen);
}

// Load tasks from localStorage or seed stunning mock data
function loadPostsData() {
    const stored = localStorage.getItem("eduplan_posts");
    if (stored) {
        try {
            state.posts = JSON.parse(stored);
            return;
        } catch(e) {
            console.error("Failed to parse local posts data, using fallback seeds.");
        }
    }

    // Dynamic Seed Data Generation relative to today so calendar dates align perfectly
    const y = todayDate.getFullYear();
    const m = todayDate.getMonth();
    const d = todayDate.getDate();

    state.posts = [
        {
            id: "seed-1",
            type: "exam",
            title: "수학 1학기 중간고사 단원 평가",
            subject: "math",
            dueDate: formatDateString(new Date(y, m, d + 3)),
            dueTime: "09:00",
            imageUrl: SEED_IMAGES.math,
            desc: "수학 1단원 '자연수의 혼합 계산'부터 3단원 '소수의 곱셈'까지의 평가입니다.\n\n[준비물]\n- 컴퓨터용 사인펜\n- 연습장 (풀이용)\n- 삼각자 및 자\n\n* 서술형 5문항을 포함하여 총 25문항으로 출제됩니다. 오답 노트를 꼼꼼히 검토하여 시험을 잘 준비하세요!",
            completed: false
        },
        {
            id: "seed-2",
            type: "homework",
            title: "과학 탐구 보고서 제출 (자유 주제 실험)",
            subject: "science",
            dueDate: formatDateString(new Date(y, m, d + 7)),
            dueTime: "23:59",
            imageUrl: SEED_IMAGES.science,
            desc: "생활 속 재미있는 과학적 사실을 바탕으로 자유 실험 주제를 정하고, 보고서를 작성해 제출하세요.\n\n[보고서 양식 포함 사항]\n1. 탐구 동기 및 목적\n2. 가설 설정 및 실험 준비물\n3. 실험 과정 (사진 및 동영상 캡처 기록 필수)\n4. 실험 결과 분석 및 가설 검증\n5. 알게 된 점 및 느낀 점\n\n* A4 용지 3매 이내 혹은 슬라이드(PPT) 10장 이내로 제작하여 e-학습터 과학방에 업로드해 주세요.",
            completed: false
        },
        {
            id: "seed-3",
            type: "homework",
            title: "영어 스피킹 스크립트 작성 및 음성 녹음",
            subject: "english",
            dueDate: formatDateString(new Date(y, m, d + 1)),
            dueTime: "18:00",
            imageUrl: SEED_IMAGES.english,
            desc: "주제: 'My Favorite Place in the World'에 관한 2분 분량의 발표 스크립트 작성 및 음성 파일 업로드\n\n- 스크립트 단어 수: 150단어 내외\n- 문법적 오류가 없는지 사전 검토 필수\n- 녹음 파일 형식: MP3 또는 WAV\n- 발음과 억양을 최대한 살려 자연스럽게 읽어주세요.",
            completed: true
        },
        {
            id: "seed-4",
            type: "exam",
            title: "코딩 실기 시험: 자바스크립트 알고리즘 기초",
            subject: "coding",
            dueDate: formatDateString(new Date(y, m, d + 12)),
            dueTime: "14:00",
            imageUrl: SEED_IMAGES.coding,
            desc: "자바스크립트 기본 문법과 기초 알고리즘을 활용한 컴퓨터 코딩 실기 평가입니다.\n\n[출제 범위]\n- 변수, 연산자, 조건문 (if, switch)\n- 반복문 (for, while)\n- 기초 배열 메서드 활용\n- 주어진 문자열을 거꾸로 출력하거나 짝수들의 합 구하기 등의 간단한 알고리즘\n\n* VS Code를 활용하여 코딩한 뒤 결과물을 마감 시간까지 GitHub Repository 또는 메일로 제출해 주세요.",
            completed: false
        },
        {
            id: "seed-5",
            type: "homework",
            title: "역사 연표 그리기 과제 (조선 시대 전기 왕 계보)",
            subject: "history",
            dueDate: formatDateString(new Date(y, m, d - 2)), // Overdue example
            dueTime: "23:59",
            imageUrl: "",
            desc: "태조 이성계부터 성종까지 조선 전기 임금들의 주요 업적을 연표 형태로 요약하여 시각화하세요.\n\n[포함할 필수 업적]\n- 태종: 6조 직계제, 호패법 실시\n- 세종: 훈민정음 창제, 집현전 설치, 과학 기구(앙부일구, 자격루) 발명\n- 세조: 직전법 실시\n- 성종: 경국대전 완성 및 반포\n\n* 수첩이나 도화지에 예쁘게 꾸며 작성한 후 사진으로 촬영해 업로드해 주세요.",
            completed: false
        }
    ];
    savePostsToLocalStorage();
}

function savePostsToLocalStorage() {
    localStorage.setItem("eduplan_posts", JSON.stringify(state.posts));
}

// ==========================================================================
// ROLE CONTROLLER & GENERAL NAVIGATION
// ==========================================================================
function setRole(role) {
    state.currentRole = role;
    
    // Toggle active classes on buttons
    const btnStudent = document.getElementById("btn-student");
    const btnTeacher = document.getElementById("btn-teacher");
    const btnAdd = document.getElementById("btn-add-schedule");

    if (role === 'teacher') {
        btnTeacher.classList.add("active");
        btnStudent.classList.remove("active");
        btnAdd.style.display = "inline-flex"; // Show new schedule button
    } else {
        btnStudent.classList.add("active");
        btnTeacher.classList.remove("active");
        btnAdd.style.display = "none"; // Hide button
    }

    refreshAllViews();
}

// Helper refresh
function refreshAllViews() {
    renderCalendar();
    renderTasksList();
    renderStatsPanel();
}

// ==========================================================================
// RENDER CALENDAR SYSTEM
// ==========================================================================
function renderCalendar() {
    const grid = document.getElementById("calendar-days-grid");
    const title = document.getElementById("calendar-month-year");
    if (!grid || !title) return;

    grid.innerHTML = "";

    const activeYear = state.calendar.activeYear;
    const activeMonth = state.calendar.activeMonth;

    // Display title
    title.innerText = `${activeYear}년 ${activeMonth + 1}월`;

    // Calculate dates
    const firstDayIndex = new Date(activeYear, activeMonth, 1).getDay(); // Weekday index for day 1
    const totalDays = new Date(activeYear, activeMonth + 1, 0).getDate(); // Days in active month
    const totalPrevDays = new Date(activeYear, activeMonth, 0).getDate(); // Days in previous month
    
    // Generate Cells
    let cellHtml = "";

    // 1. Padding from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const prevDay = totalPrevDays - i;
        const targetMonth = activeMonth === 0 ? 11 : activeMonth - 1;
        const targetYear = activeMonth === 0 ? activeYear - 1 : activeYear;
        const cellDateStr = formatDateString(new Date(targetYear, targetMonth, prevDay));
        
        cellHtml += createCalendarDayCellHtml(prevDay, cellDateStr, true);
    }

    // 2. Active Month Days
    for (let day = 1; day <= totalDays; day++) {
        const cellDateStr = formatDateString(new Date(activeYear, activeMonth, day));
        cellHtml += createCalendarDayCellHtml(day, cellDateStr, false);
    }

    // 3. Padding from next month (Fill out calendar row)
    const totalRenderedDays = firstDayIndex + totalDays;
    const nextDaysNeeded = (7 - (totalRenderedDays % 7)) % 7;
    for (let day = 1; day <= nextDaysNeeded; day++) {
        const targetMonth = activeMonth === 11 ? 0 : activeMonth + 1;
        const targetYear = activeMonth === 11 ? activeYear + 1 : activeYear;
        const cellDateStr = formatDateString(new Date(targetYear, targetMonth, day));
        
        cellHtml += createCalendarDayCellHtml(day, cellDateStr, true);
    }

    grid.innerHTML = cellHtml;

    // Trigger icon generation on elements inside cells if there are any
    lucide.createIcons();
}

function createCalendarDayCellHtml(dayNumber, dateString, isOtherMonth) {
    const isToday = dateString === todayFormatted;
    const isSelected = dateString === state.filters.calendarDate;
    
    // Day of the week class
    const cellDateObj = new Date(dateString);
    const dayOfWeek = cellDateObj.getDay();
    let dayClass = "";
    if (dayOfWeek === 0) dayClass = "sunday";
    else if (dayOfWeek === 6) dayClass = "saturday";

    // Match scheduled events for this specific date
    const dayEvents = state.posts.filter(post => post.dueDate === dateString);
    let eventsHtml = "";
    
    if (dayEvents.length > 0) {
        eventsHtml += `<div class="day-events-container">`;
        dayEvents.slice(0, 3).forEach(event => {
            const subjectName = SUBJECTS[event.subject]?.name || "일정";
            const typeClass = event.type === 'homework' ? 'type-homework' : 'type-exam';
            eventsHtml += `
                <div class="day-event-indicator ${typeClass}" title="${event.title}">
                    ${subjectName}: ${event.title}
                </div>
            `;
        });
        if (dayEvents.length > 3) {
            eventsHtml += `<div class="day-event-indicator" style="background:rgba(255,255,255,0.06); text-align:center; color:var(--text-muted);">+${dayEvents.length - 3}</div>`;
        }
        eventsHtml += `</div>`;
    }

    return `
        <div class="calendar-day-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayClass}" 
             onclick="selectCalendarDate('${dateString}')">
            <span class="day-number">${dayNumber}</span>
            ${eventsHtml}
        </div>
    `;
}

// Handler for calendar navigation
function changeMonth(direction) {
    state.calendar.activeMonth += direction;
    if (state.calendar.activeMonth > 11) {
        state.calendar.activeMonth = 0;
        state.calendar.activeYear += 1;
    } else if (state.calendar.activeMonth < 0) {
        state.calendar.activeMonth = 11;
        state.calendar.activeYear -= 1;
    }
    renderCalendar();
}

function goToday() {
    state.calendar.activeYear = todayDate.getFullYear();
    state.calendar.activeMonth = todayDate.getMonth();
    selectCalendarDate(todayFormatted);
}

// Select a date inside calendar to filter the list view
function selectCalendarDate(dateStr) {
    if (state.filters.calendarDate === dateStr) {
        state.filters.calendarDate = null; // Toggle off
    } else {
        state.filters.calendarDate = dateStr; // Toggle on
    }
    
    updateActiveFilterStatusBar();
    renderCalendar();
    renderTasksList();
}

// ==========================================================================
// RENDER STATS PANEL
// ==========================================================================
function renderStatsPanel() {
    const list = state.posts;

    // Filter to calculate count status
    const urgentCount = list.filter(p => p.type === 'exam' && !p.completed).length;
    const pendingHomework = list.filter(p => p.type === 'homework' && !p.completed).length;
    const completedHomework = list.filter(p => p.type === 'homework' && p.completed).length;
    
    // Update labels
    document.getElementById("stat-urgent").innerText = urgentCount;
    document.getElementById("stat-pending").innerText = pendingHomework;
    document.getElementById("stat-completed").innerText = completedHomework;

    // Calculate dynamic circular/linear completion percent
    const totalHomework = pendingHomework + completedHomework;
    const rate = totalHomework > 0 ? Math.round((completedHomework / totalHomework) * 100) : 0;
    
    document.getElementById("progress-percent").innerText = `${rate}%`;
    document.getElementById("progress-fill").style.width = `${rate}%`;
}

// ==========================================================================
// RENDER DYNAMIC ASSIGNMENT/EXAM LIST & CARDS
// ==========================================================================
function renderTasksList() {
    const listContainer = document.getElementById("tasks-list-container");
    if (!listContainer) return;

    listContainer.innerHTML = "";

    // Apply active state filters (Subject, Type, Search query, Calendar date click)
    let filtered = state.posts.filter(post => {
        // 1. Subject filter
        if (state.filters.subject !== 'all' && post.subject !== state.filters.subject) {
            return false;
        }
        
        // 2. Type filter
        if (state.filters.type !== 'all' && post.type !== state.filters.type) {
            return false;
        }

        // 3. Search query
        if (state.filters.searchQuery.trim() !== '') {
            const query = state.filters.searchQuery.toLowerCase();
            const titleMatch = post.title.toLowerCase().includes(query);
            const descMatch = post.desc.toLowerCase().includes(query);
            const subjectMatch = (SUBJECTS[post.subject]?.name || "").toLowerCase().includes(query);
            if (!titleMatch && !descMatch && !subjectMatch) {
                return false;
            }
        }

        // 4. Specific calendar date click filter
        if (state.filters.calendarDate && post.dueDate !== state.filters.calendarDate) {
            return false;
        }

        return true;
    });

    // Sort by Due Date ascending, so closest/overdue items always show up first!
    filtered.sort((a, b) => {
        const timeA = new Date(`${a.dueDate}T${a.dueTime}`).getTime();
        const timeB = new Date(`${b.dueDate}T${b.dueTime}`).getTime();
        return timeA - timeB;
    });

    // Render each post card
    filtered.forEach(post => {
        const card = document.createElement("div");
        card.className = `task-card ${post.completed ? 'completed' : ''}`;
        card.onclick = () => openDetailDrawer(post.id);

        const subjectObj = SUBJECTS[post.subject] || SUBJECTS.general;
        const typeLabel = post.type === 'homework' ? '숙제' : '시험';
        const typeClass = post.type === 'homework' ? 'badge-type-homework' : 'badge-type-exam';

        // Compute D-Day countdown
        const { text: countdownText, isOverdue } = calculateDDay(post.dueDate, post.dueTime, post.completed);
        let countdownBadgeHtml = `<span class="badge badge-countdown ${isOverdue ? 'overdue' : ''}">${countdownText}</span>`;
        if (post.completed) {
            countdownBadgeHtml = `<span class="badge badge-completed"><i data-lucide="check" style="width:10px;height:10px;display:inline-block;vertical-align:middle;margin-right:2px;"></i>완료됨</span>`;
        }

        // Render card outline
        card.innerHTML = `
            <div class="task-card-left-bar" style="background-color: ${subjectObj.colorVar};"></div>
            <div class="task-card-content">
                <div class="task-card-top">
                    <div class="task-badge-row">
                        <span class="badge ${typeClass}">${typeLabel}</span>
                        <span class="badge badge-subject" style="--subject-color: ${subjectObj.colorVar}">${subjectObj.name}</span>
                        ${countdownBadgeHtml}
                    </div>
                </div>
                <h4 class="task-title">${post.title}</h4>
                ${post.desc ? `<p class="task-desc-snippet">${post.desc}</p>` : ''}
                <div class="task-card-meta">
                    <div class="task-meta-item">
                        <i data-lucide="calendar"></i>
                        <span>기한: ${formatDisplayDate(post.dueDate)} ${post.dueTime}</span>
                    </div>
                </div>
            </div>
            ${post.imageUrl ? `<img src="${post.imageUrl}" class="task-card-image-thumb" alt="첨부 이미지">` : ''}
        `;
        
        listContainer.appendChild(card);
    });

    // Reinitialize Lucide icons inside cards
    lucide.createIcons();
}

// Active search input
function handleSearch() {
    state.filters.searchQuery = document.getElementById("search-input").value;
    updateActiveFilterStatusBar();
    renderTasksList();
}

// Dynamic subject filter click handler
function filterBySubject(subjectKey) {
    state.filters.subject = subjectKey;
    
    // Toggle active class in sidebar items
    const items = document.querySelectorAll(".subject-filter-list .filter-item");
    items.forEach(item => {
        if (item.getAttribute("data-subject") === subjectKey) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    updateActiveFilterStatusBar();
    renderTasksList();
}

// Filter dynamic tab click
function filterByType(typeKey) {
    state.filters.type = typeKey;
    
    // Toggle active class in tabs
    const tabs = document.querySelectorAll(".filter-tabs .tab-btn");
    tabs.forEach(tab => {
        tab.classList.remove("active");
    });
    
    if (typeKey === 'all') document.getElementById("tab-all").classList.add("active");
    else if (typeKey === 'homework') document.getElementById("tab-homework").classList.add("active");
    else if (typeKey === 'exam') document.getElementById("tab-exam").classList.add("active");

    updateActiveFilterStatusBar();
    renderTasksList();
}

// Reset all filters in one click
function clearAllFilters() {
    state.filters.subject = "all";
    state.filters.type = "all";
    state.filters.searchQuery = "";
    state.filters.calendarDate = null;

    document.getElementById("search-input").value = "";
    
    // Reset classes
    document.querySelectorAll(".subject-filter-list .filter-item").forEach(item => {
        if (item.getAttribute("data-subject") === "all") item.classList.add("active");
        else item.classList.remove("active");
    });

    document.querySelectorAll(".filter-tabs .tab-btn").forEach(tab => {
        tab.classList.remove("active");
    });
    document.getElementById("tab-all").classList.add("active");

    updateActiveFilterStatusBar();
    renderCalendar();
    renderTasksList();
}

// Manage visibility of active filter bar
function updateActiveFilterStatusBar() {
    const bar = document.getElementById("active-filters-info");
    const label = document.getElementById("active-filter-text");
    
    const isSubjectFiltered = state.filters.subject !== 'all';
    const isTypeFiltered = state.filters.type !== 'all';
    const isSearchFiltered = state.filters.searchQuery.trim() !== '';
    const isCalendarDateFiltered = state.filters.calendarDate !== null;

    if (isSubjectFiltered || isTypeFiltered || isSearchFiltered || isCalendarDateFiltered) {
        bar.style.display = "flex";
        
        let filterParts = [];
        if (isCalendarDateFiltered) filterParts.push(`선택일자: ${formatDisplayDate(state.filters.calendarDate)}`);
        if (isSubjectFiltered) filterParts.push(`과목: ${SUBJECTS[state.filters.subject]?.name}`);
        if (isTypeFiltered) filterParts.push(`구분: ${state.filters.type === 'homework' ? '숙제' : '시험'}`);
        if (isSearchFiltered) filterParts.push(`검색어: "${state.filters.searchQuery}"`);

        label.innerText = `필터 적용 중 (${filterParts.join(', ')})`;
    } else {
        bar.style.display = "none";
    }
}

// ==========================================================================
// DETAIL DRAWER CONTROLLERS
// ==========================================================================
function openDetailDrawer(postId) {
    const drawer = document.getElementById("detail-drawer");
    const body = document.getElementById("detail-drawer-body");
    const footer = document.getElementById("detail-drawer-footer");
    if (!drawer || !body || !footer) return;

    const post = state.posts.find(p => p.id === postId);
    if (!post) return;

    // Load type badge details
    const typeBadge = document.getElementById("detail-type-badge");
    typeBadge.innerText = post.type === 'homework' ? '숙제 (Homework)' : '시험 (Exam)';
    typeBadge.className = `drawer-category-badge ${post.type === 'homework' ? 'badge-type-homework' : 'badge-type-exam'}`;

    const subjectObj = SUBJECTS[post.subject] || SUBJECTS.general;
    const { text: countdownText, isOverdue } = calculateDDay(post.dueDate, post.dueTime, post.completed);

    // Build Drawer Body Content
    body.innerHTML = `
        <div class="drawer-title-section">
            <div class="drawer-subject-indicator">
                <span class="drawer-subject-bullet" style="background-color: ${subjectObj.colorVar};"></span>
                <span style="color: ${subjectObj.colorVar}; font-weight: 800;">${subjectObj.name} 과목</span>
            </div>
            <h2 class="drawer-title">${post.title}</h2>
        </div>

        <div class="drawer-meta-grid">
            <div class="drawer-meta-item">
                <span class="drawer-meta-lbl">마감 / 시험 날짜</span>
                <span class="drawer-meta-val"><i data-lucide="calendar"></i>${formatDisplayDate(post.dueDate)}</span>
            </div>
            <div class="drawer-meta-item">
                <span class="drawer-meta-lbl">마감 / 시험 시간</span>
                <span class="drawer-meta-val"><i data-lucide="clock"></i>${post.dueTime}</span>
            </div>
            <div class="drawer-meta-item" style="grid-column: span 2;">
                <span class="drawer-meta-lbl">진행 및 남은 일정</span>
                <span class="drawer-meta-val countdown-glow ${isOverdue ? 'overdue' : ''}">
                    <i data-lucide="hourglass"></i>
                    ${post.completed ? '과제가 완료되었습니다.' : countdownText}
                </span>
            </div>
        </div>

        ${post.imageUrl ? `
            <div class="drawer-image-section">
                <span class="drawer-desc-title">참고 첨부 이미지</span>
                <div class="drawer-img-wrapper">
                    <img src="${post.imageUrl}" alt="참고 자료 이미지">
                </div>
            </div>
        ` : ''}

        ${post.desc ? `
            <div class="drawer-description-section">
                <span class="drawer-desc-title">안내 사항 및 추가 설명</span>
                <p class="drawer-desc-content">${post.desc}</p>
            </div>
        ` : ''}
    `;

    // Build Drawer Footer Controls (Context dependent on role)
    if (state.currentRole === 'teacher') {
        footer.innerHTML = `
            <button class="btn btn-danger flex-grow" onclick="deletePost('${post.id}')">
                <i data-lucide="trash-2"></i> 일정 삭제하기 (교사 권한)
            </button>
        `;
    } else {
        // Student Mode allows checking complete
        footer.innerHTML = `
            <label class="checkbox-container">
                <input type="checkbox" ${post.completed ? 'checked' : ''} onchange="togglePostCompletion('${post.id}', this.checked)">
                <span class="checkmark"></span>
                <span>이 일정(과제)을 완료로 표시</span>
            </label>
        `;
    }

    drawer.classList.add("open");
    lucide.createIcons();
}

function closeDetailDrawer(event) {
    const drawer = document.getElementById("detail-drawer");
    if (drawer) {
        drawer.classList.remove("open");
    }
}

// Student checkbox toggle
function togglePostCompletion(postId, isChecked) {
    const postIndex = state.posts.findIndex(p => p.id === postId);
    if (postIndex > -1) {
        state.posts[postIndex].completed = isChecked;
        savePostsToLocalStorage();
        refreshAllViews();
        
        // Refresh detail drawer to reflect completion status
        openDetailDrawer(postId);
    }
}

// Teacher delete capability
function deletePost(postId) {
    if (confirm("정말로 이 학업 일정을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.")) {
        state.posts = state.posts.filter(p => p.id !== postId);
        savePostsToLocalStorage();
        closeDetailDrawer();
        refreshAllViews();
    }
}

// ==========================================================================
// MODAL: ADD SCHEUDLE FORM CAPABILITIES
// ==========================================================================
function openAddModal() {
    const modal = document.getElementById("add-modal");
    if (modal) {
        modal.classList.add("open");
        
        // Default inputs to helpful values
        document.getElementById("form-due-date").value = todayFormatted;
        document.getElementById("form-due-time").value = "23:59";
        
        // Reset preview
        removeSelectedImage();
    }
}

function closeAddModal() {
    const modal = document.getElementById("add-modal");
    if (modal) {
        modal.classList.remove("open");
        document.getElementById("add-schedule-form").reset();
        removeSelectedImage();
    }
}

// Custom trigger upload click
function triggerFileInput() {
    document.getElementById("form-image").click();
}

// Handle local file load and conversion to base64 for offline/local storage usage
function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        processUploadedFile(files[0]);
    }
}

function processUploadedFile(file) {
    if (!file.type.match('image.*')) {
        alert('이미지 파일(JPG, PNG, WEBP 등)만 업로드할 수 있습니다.');
        return;
    }

    if (file.size > 3 * 1024 * 1024) {
        alert('파일의 크기가 너무 큽니다. (최대 3MB 이내)');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        state.tempUploadedImage = e.target.result;
        
        // Render preview image
        const previewImg = document.getElementById("image-preview");
        const container = document.getElementById("image-preview-container");
        const dropZone = document.getElementById("drop-zone");

        previewImg.src = e.target.result;
        container.style.display = "block";
        dropZone.style.display = "none";
    };
    reader.readAsDataURL(file);
}

function removeSelectedImage(event) {
    if (event) {
        event.stopPropagation();
    }

    state.tempUploadedImage = "";
    document.getElementById("form-image").value = "";
    document.getElementById("image-preview-container").style.display = "none";
    document.getElementById("drop-zone").style.display = "flex";
}

// Submit form
function handleFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const type = form.elements['item-type'].value; // 'homework' | 'exam'
    const title = document.getElementById("form-title").value.trim();
    const subject = document.getElementById("form-subject").value;
    const dueDate = document.getElementById("form-due-date").value;
    const dueTime = document.getElementById("form-due-time").value;
    const desc = document.getElementById("form-desc").value.trim();

    if (!title || !subject || !dueDate || !dueTime) {
        alert("필수 입력 항목을 모두 작성해주세요.");
        return;
    }

    // Assemble new task item
    const newItem = {
        id: `post-${Date.now()}`,
        type,
        title,
        subject,
        dueDate,
        dueTime,
        imageUrl: state.tempUploadedImage, // Store base64 data URL
        desc,
        completed: false
    };

    state.posts.push(newItem);
    savePostsToLocalStorage();
    
    // Close modal & clean inputs
    closeAddModal();
    refreshAllViews();
}

// ==========================================================================
// UTILITY DATE HELPER FUNCTIONS
// ==========================================================================

// Format Date object to 'YYYY-MM-DD'
function formatDateString(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Format 'YYYY-MM-DD' to user friendly 'YYYY년 MM월 DD일'
function formatDisplayDate(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일`;
}

// Build Header display string in Korean
function getHeaderDateString() {
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const y = todayDate.getFullYear();
    const m = todayDate.getMonth() + 1;
    const d = todayDate.getDate();
    const dayName = days[todayDate.getDay()];
    return `오늘은 ${y}년 ${m}월 ${d}일 (${dayName}) 입니다.`;
}

// Calculate relative time deadline/countdown
function calculateDDay(dateStr, timeStr, isCompleted) {
    if (isCompleted) {
        return { text: "완료됨", isOverdue: false };
    }

    const targetTime = new Date(`${dateStr}T${timeStr}`);
    const now = new Date();
    
    // Difference in milliseconds
    const diff = targetTime.getTime() - now.getTime();

    // Overdue check
    if (diff < 0) {
        return { text: "기간 초과 (Overdue)", isOverdue: true };
    }

    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    
    if (diffHours < 24) {
        if (diffHours === 0) {
            const diffMins = Math.floor(diff / (1000 * 60));
            return { text: `${diffMins}분 남음`, isOverdue: false };
        }
        return { text: `${diffHours}시간 남음`, isOverdue: false };
    }

    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return { text: "D-1 (내일 마감)", isOverdue: false };
    } else if (diffDays === 0) {
        return { text: "D-Day (오늘 마감)", isOverdue: false };
    }

    return { text: `D-${diffDays}`, isOverdue: false };
}
