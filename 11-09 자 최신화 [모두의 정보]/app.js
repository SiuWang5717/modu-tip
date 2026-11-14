const Icons = {
    search: `<svg viewBox="0 0 24 24" class="svg-icon"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>`,
    pin: `<svg viewBox="0 0 24 24" class="svg-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    clock: `<svg viewBox="0 0 24 24" class="svg-icon"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>`,
    calendar: `<svg viewBox="0 0 24 24" class="svg-icon"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg>`,
    phone: `<svg viewBox="0 0 24 24" class="svg-icon"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path></svg>`,
    wedding: `<svg viewBox="0 0 24 24" class="svg-icon"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path></svg>`,
    hospital: `<svg viewBox="0 0 24 24" class="svg-icon"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M12 8v8M8 12h8"></path></svg>`,
    baby: `<svg viewBox="0 0 24 24" class="svg-icon"><circle cx="12" cy="12" r="8"></circle><path d="M9 10h.01M15 10h.01M10 14.5a3.5 3.5 0 004 0"></path><path d="M12 4v-2M15 5l1.5-1.5M9 5L7.5 3.5"></path></svg>`,
    bookmark: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:16px;height:16px;"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`,
    send: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:16px;height:16px;"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`
};

function handleLogin(provider) {
    document.getElementById('screen-login').classList.add('hidden');
    document.getElementById('userProfileName').innerText = `${provider} 유저`;
    document.getElementById('userEmailDisplay').innerText = `연동 완료`;
}
function handleIdChange() {
    if(confirm('로그아웃 후 초기 화면으로 이동합니다.')) {
        document.getElementById('screen-login').classList.remove('hidden');
        document.getElementById('userProfileName').innerText = `예비부부 님`;
        document.getElementById('userEmailDisplay').innerText = `로그인 정보 없음`;
    }
}
function handleLogout() { handleIdChange(); }

function handleNotificationSetting() { alert("휴대폰 [설정] > [알림]에서 앱 권한을 확인해주세요."); }
function handleLocationSetting() { alert("위치 권한이 정상 연동 중입니다."); }

function switchTab(tabName, element) {
    document.querySelectorAll('.screen-content').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + tabName).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    element.classList.add('active');
    if (tabName === 'map' && window.mapInstance) {
        setTimeout(() => { 
            window.mapInstance.relayout();
            window.mapInstance.setDraggable(true);
            window.mapInstance.setZoomable(true);
        }, 150);
    }
    if (tabName === 'saved') renderSavedList();
}

function toggleSheet(forceOpen = false) {
    let sheet = document.getElementById('contentSheet');
    let mapArea = document.querySelector('.map-area');
    if (forceOpen || sheet.style.display === 'none' || sheet.style.display === '') {
        sheet.style.display = 'block'; mapArea.style.height = 'calc(100% - 360px)';
    } else {
        sheet.style.display = 'none'; mapArea.style.height = '100%';
    }
    if (window.mapInstance) {
        setTimeout(() => { window.mapInstance.relayout(); }, 200);
    }
}

let map, kakaoMarkers = [], myPosMarker = null;
let userLat = 35.1587, userLng = 129.1604;
let placesData = [], savedIds = [], recentIds = [];
let moveTimeout, tempSearchMarker = null;
let kakaoPs = null;

window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('map');
    const options = { center: new kakao.maps.LatLng(userLat, userLng), level: 4 };
    map = new kakao.maps.Map(container, options);
    window.mapInstance = map;

    // 지도 드래그 및 줌 강제 활성화
    map.setDraggable(true);
    map.setZoomable(true);

    if (typeof kakao !== 'undefined' && kakao.maps && kakao.maps.services) {
        kakaoPs = new kakao.maps.services.Places();
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(pos) {
            userLat = pos.coords.latitude; userLng = pos.coords.longitude;
            let moveLatLon = new kakao.maps.LatLng(userLat, userLng);
            map.setCenter(moveLatLon);
            drawMyPosition();
            initPlacesAroundUser();
        }, function() { initPlacesAroundUser(); });
    } else { initPlacesAroundUser(); }
});

function drawMyPosition() {
    if(myPosMarker) myPosMarker.setMap(null);
    let content = document.createElement('div');
    content.className = 'my-pos-marker';
    content.innerHTML = '<div class="my-pos-dot"></div>';
    myPosMarker = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(userLat, userLng),
        content: content,
        yAnchor: 0.5
    });
    myPosMarker.setMap(map);
}

function moveToMyPosition() { 
    if (map && userLat && userLng) {
        map.panTo(new kakao.maps.LatLng(userLat, userLng));
    }
}

function searchInArea() {
    document.getElementById('btnSearchInArea').classList.add('hidden');
    renderMarkersAndList(currentFilterType);
}

function initPlacesAroundUser() {
    placesData = [
        { id: 1, name: "르베 산후조리원", type: "postpartum", typeText: "산후조리원", gradeText: "A등급", grade: "gradeA", lat: userLat + 0.003, lng: userLng + 0.003, address: "부산진구 부전동", phone: "051-555-0101" },
        { id: 2, name: "포레 산후조리원", type: "postpartum", typeText: "산후조리원", gradeText: "B등급", grade: "gradeB", lat: userLat - 0.004, lng: userLng - 0.003, address: "수영구 남천동", phone: "051-555-0102" },
        { id: 3, name: "그랜드 웨딩홀", type: "wedding", typeText: "결혼식장", gradeText: "우수시설", grade: "gradeA", lat: userLat + 0.006, lng: userLng - 0.002, address: "해운대구 센텀시티", phone: "051-555-0201" },
        { id: 4, name: "미래 산부인과 병원", type: "hospital", typeText: "병원", gradeText: "우수시설", grade: "gradeA", lat: userLat - 0.005, lng: userLng + 0.005, address: "동래구 온천동", phone: "051-555-0103" },
        { id: 5, name: "모던 웨딩컨벤션", type: "wedding", typeText: "결혼식장", gradeText: "우수시설", grade: "gradeB", lat: userLat + 0.002, lng: userLng + 0.006, address: "남구 대연동", phone: "051-555-0202" }
    ];
    renderMarkersAndList('all');
}

const searchInput = document.getElementById('mapSearchInput');
const searchDropdown = document.getElementById('searchDropdown');
let searchHistory = [];
let debounceTimer;

function openSearch() {
    document.getElementById('fullSearchOverlay').classList.add('active');
    document.getElementById('overlaySearchInput').value = searchInput.value;
    document.getElementById('overlaySearchInput').focus();
    renderSearchHistory();
}

function closeSearch() {
    document.getElementById('fullSearchOverlay').classList.remove('active');
    searchInput.value = document.getElementById('overlaySearchInput').value;
}

function syncSearchInput(val) {
    searchInput.value = val;
    handleSearchInput(); 
}

function handleSearchInput() {
    clearTimeout(debounceTimer);
    if(searchInput.value.trim().length > 0) {
        debounceTimer = setTimeout(() => { executeSearch(false); }, 400);
    } else { 
        renderSearchHistory(); 
    }
}

function renderSearchHistory() {
    if(!searchDropdown) return;
    if(searchHistory.length === 0) {
        searchDropdown.innerHTML = '<div class="search-empty">최근 검색어 내역이 없습니다.</div>';
    } else {
        let html = searchHistory.map((term, index) => `
            <div class="search-item" onclick="setSearchTerm('${term}')">
                <div class="search-icon-box">${Icons.clock}</div>
                <div class="search-text-content"><div class="search-item-title" style="color: var(--text-sub);">${term}</div></div>
                <button class="history-delete-btn" onclick="deleteHistory(${index}, event)">✕</button>
            </div>
        `).join('');
        searchDropdown.innerHTML = html;
    }
    searchDropdown.classList.add('active');
}

function deleteHistory(index, event) {
    event.stopPropagation(); searchHistory.splice(index, 1); renderSearchHistory();
}

function setSearchTerm(term) {
    searchInput.value = term; handleSearchInput(); executeSearch(true);
}

async function executeSearch(isEnter = true) {
    const keyword = searchInput.value.trim();
    if(!keyword) return;

    if(isEnter && !searchHistory.includes(keyword)) {
        searchHistory.unshift(keyword);
        if(searchHistory.length > 5) searchHistory.pop();
    }

    if(searchDropdown) {
        searchDropdown.innerHTML = '<div class="search-empty">검색 중...</div>';
        searchDropdown.classList.add('active');
    }

    if (kakaoPs) {
        kakaoPs.keywordSearch(keyword, function(data, status) {
            if (status === kakao.maps.services.Status.OK) {
                let kakaoResults = data.map(r => ({
                    display_name: r.place_name + ", " + (r.road_address_name || r.address_name),
                    lat: parseFloat(r.y),
                    lon: parseFloat(r.x),
                    phone: r.phone || '번호 없음',
                    place_name: r.place_name
                }));

                if (isEnter) {
                    renderExternalList(kakaoResults, true); toggleSheet(true); closeSearch();
                    if(map) map.setCenter(new kakao.maps.LatLng(kakaoResults[0].lat, kakaoResults[0].lon));
                } else {
                    let html = kakaoResults.map(r => `
                        <div class="search-item" onclick="flyToExternal(${r.lat}, ${r.lon}, '${r.display_name.replace(/'/g,"\\'")}')">
                            <div class="search-icon-box">${Icons.pin}</div>
                            <div class="search-text-content"><div class="search-item-title">${r.place_name}</div><div class="search-item-desc">${r.display_name}</div></div>
                        </div>
                    `).join('');
                    if(searchDropdown) searchDropdown.innerHTML = html;
                }
            } else {
                if(searchDropdown) searchDropdown.innerHTML = '<div class="search-empty">검색 결과가 없습니다.</div>';
            }
        });
    }
}

function renderExternalList(results, isExternal = false) {
    let cardContainer = document.getElementById('cardListContainer'); if(!cardContainer) return;
    cardContainer.innerHTML = '';
    document.getElementById('listTitle').innerText = `'${searchInput.value}' 검색 결과`;
    document.getElementById('listCount').innerText = results.length + '곳';

    results.forEach((item, index) => {
        let name = isExternal ? item.display_name.split(',')[0] : item.name;
        let addr = isExternal ? item.display_name : item.address;
        let lat = isExternal ? item.lat : item.lat;
        let lon = isExternal ? item.lon : item.lng;
        let tempId = item.id || index + 200;

        let cardHTML = `
            <div style="background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:16px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; box-shadow:var(--shadow-sm); cursor:pointer;" onclick="flyToExternal(${lat}, ${lon}, '${name.replace(/'/g,"\\'")}')">
                <div style="display:flex; align-items:center; gap:14px; flex:1; overflow:hidden;">
                    <div style="width:64px; height:64px; background:#f1f5f9; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:28px; height:28px; color:var(--text-muted);"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 3v18M15 3v18"></path></svg>
                    </div>
                    <div style="flex:1; overflow:hidden;">
                        <div style="font-size:12px; color:var(--text-muted); font-weight:700; margin-bottom:2px;">검색 장소</div>
                        <div style="font-size:16px; font-weight:800; color:var(--text-main); margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name}</div>
                        <div style="font-size:13px; color:var(--text-sub); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${addr}</div>
                    </div>
                </div>
            </div>`;
        cardContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

function flyToExternal(lat, lng, displayName) {
    if(map) map.setCenter(new kakao.maps.LatLng(lat, lng));
    closeSearch();
    if(tempSearchMarker) tempSearchMarker.setMap(null);
    
    let content = document.createElement('div');
    content.innerHTML = `<div style="background-color: var(--text-main); width: 16px; height: 16px; border: 3px solid white; border-radius: 50%; box-shadow: var(--shadow-sm);"></div>`;
    
    tempSearchMarker = new kakao.maps.CustomOverlay({ position: new kakao.maps.LatLng(lat, lng), content: content, yAnchor: 0.5 });
    tempSearchMarker.setMap(map);
}

let currentFilterType = 'all';
function renderMarkersAndList(filterType) {
    currentFilterType = filterType;
    if(typeof kakaoMarkers !== 'undefined') {
        kakaoMarkers.forEach(m => m.setMap(null));
        kakaoMarkers = [];
    }

    let filtered = placesData.filter(place => {
        if (filterType === 'all') return true;
        if (filterType === 'gradeA') return place.grade === 'gradeA';
        if (filterType === 'gradeB') return place.grade === 'gradeB';
        return place.type === filterType;
    });

    let cardContainer = document.getElementById('cardListContainer'); if(!cardContainer) return;
    cardContainer.innerHTML = '';
    
    let titleEl = document.getElementById('listTitle');
    let countEl = document.getElementById('listCount');
    if(titleEl) titleEl.innerText = '주변 시설 목록';
    if(countEl) countEl.innerText = filtered.length + '곳';

    filtered.forEach((place) => {
        if (window.map && typeof kakao !== 'undefined') {
            let coords = new kakao.maps.LatLng(place.lat, place.lng);
            let content = document.createElement('div');
            content.className = 'custom-map-marker';
            content.style.background = place.iconBg || '#2563eb';
            content.innerHTML = `<div class="marker-icon-inner">${place.iconSvg || ''}</div> ${place.name}`;
            content.onclick = () => { openModal(place.id, 'map'); };

            let customOverlay = new kakao.maps.CustomOverlay({ position: coords, content: content, yAnchor: 1 });
            customOverlay.setMap(window.map);
            kakaoMarkers.push(customOverlay);
        }

        let isSaved = savedIds.includes(place.id);
        let rating = (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1);
        let reviews = Math.floor(Math.random() * 50) + 5;
        let topBadgeText = place.typeText ? `${place.typeText} · ${place.gradeText || 'A등급'}` : '시설';

        let cardHTML = `
            <div style="background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:16px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; box-shadow:var(--shadow-sm); cursor:pointer;" onclick="openModal(${place.id}, 'map')">
                <div style="display:flex; align-items:center; gap:14px; flex:1; overflow:hidden;">
                    <div style="width:64px; height:64px; background:#f1f5f9; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:28px; height:28px; color:var(--text-muted);"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 3v18M15 3v18"></path></svg>
                    </div>
                    <div style="flex:1; overflow:hidden;">
                        <div style="font-size:12px; color:var(--text-muted); font-weight:700; margin-bottom:2px;">${topBadgeText}</div>
                        <div style="font-size:16px; font-weight:800; color:var(--text-main); margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${place.name}</div>
                        <div style="font-size:13px; color:var(--text-sub); display:flex; align-items:center; gap:6px;">
                            <span style="color:var(--text-main); font-weight:700;">★ ${rating}</span> 
                            <span style="color:var(--text-muted);">(${reviews})</span>
                            <span style="color:var(--border);">|</span>
                            <span>${place.address}</span>
                        </div>
                    </div>
                </div>
                <button class="save-btn ${isSaved ? 'saved' : ''}" onclick="toggleSave(${place.id}, event)" style="padding:8px 14px; border-radius:12px; font-size:13px; font-weight:600; margin-left:10px; flex-shrink:0;">
                    ${isSaved ? '저장됨' : '저장'}
                </button>
            </div>`;
        cardContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

function openModal(id, source = 'map') {
    let place = placesData.find(p => p.id === id); if (!place) return;
    if (source === 'map' && !recentIds.includes(id)) { recentIds.push(id); let badge = document.getElementById('recentCountBadge'); if(badge) badge.innerText = recentIds.length + '곳'; }

    document.getElementById('modalName').innerText = place.name;
    document.getElementById('modalBadgeRow').style.display = 'flex';
    document.getElementById('modalBadge').innerText = place.gradeText || 'A';
    document.getElementById('modalBadge').className = `badge ${place.grade || 'gradeA'}`;
    document.getElementById('modalCategory').innerText = place.typeText || '시설';
    
    document.getElementById('modalDetailsContainer').innerHTML = `
        <div class="summary-row"><div class="summary-icon">${Icons.pin}</div> <div>${place.address}</div></div>
        <div class="summary-row"><div class="summary-icon">${Icons.clock}</div> <div>09:00 - 18:00 (월-금)</div></div>
        <div class="summary-row"><div class="summary-icon">${Icons.calendar}</div> <div>11월 1주차 상담 가능</div></div>
        <div class="summary-row"><div class="summary-icon">${Icons.phone}</div> <div>${place.phone}</div></div>
    `;

    let mapNavUrl = `https://map.naver.com/v5/search/${encodeURIComponent(place.name)}`;
    document.getElementById('modalButtonsContainer').innerHTML = `
        <a href="${mapNavUrl}" target="_blank" class="modal-btn-sub" style="padding: 14px 8px; font-size: 14px;">길찾기</a>
        <button class="modal-btn-sub" onclick="alert('전화 연결이 진행됩니다.')" style="padding: 14px 8px; font-size: 14px;">전화 문의</button>
        <button class="modal-btn-main" onclick="alert('${place.name} 상담 예약이 완료되었습니다!'); closeModal();" style="padding: 14px 8px; font-size: 14px;">예약하기</button>
    `;
    document.getElementById('placeModal').classList.add('active');
}

function openGradeModal() {
    let postpartumPlaces = placesData.filter(p => (p.typeText && p.typeText.includes('산후조리원')) || p.name.includes('조리원'));
    if(postpartumPlaces.length === 0) postpartumPlaces = placesData;

    let optionsHTML = postpartumPlaces.map(p => `<option value="${p.id}">${p.name} (${p.address || ''})</option>`).join('');
    
    document.getElementById('modalName').innerText = "시설 등급 관리 (산후조리원)";
    document.getElementById('modalBadgeRow').style.display = 'none';
    
    document.getElementById('modalDetailsContainer').innerHTML = `
        <div style="font-size: 14px; color: var(--text-sub); margin-bottom: 20px; line-height:1.5;">산후조리원 전용 A~C 등급을 직접 부여 및 수정할 수 있습니다.</div>
        <div class="form-group" style="margin-bottom:16px;">
            <label class="form-label" style="font-weight:700; display:block; margin-bottom:8px;">산후조리원 선택</label>
            <select class="form-select" id="gradeSelectPlace" style="width:100%; padding:12px; border-radius:12px; border:1px solid var(--border); font-size:15px; background:var(--bg-color);">${optionsHTML}</select>
        </div>
        <div class="form-group">
            <label class="form-label" style="font-weight:700; display:block; margin-bottom:8px;">평가 등급 부여</label>
            <select class="form-select" id="gradeSelectValue" style="width:100%; padding:12px; border-radius:12px; border:1px solid var(--border); font-size:15px; background:var(--bg-color);">
                <option value="A등급">A등급 (최우수)</option>
                <option value="B등급">B등급 (우수)</option>
                <option value="C등급">C등급 (일반)</option>
            </select>
        </div>
    `;
    document.getElementById('modalButtonsContainer').innerHTML = `<button class="modal-btn-main" onclick="saveGradeChange()" style="width: 100%;">등급 저장 완료</button>`;
    document.getElementById('placeModal').classList.add('active');
}

function saveGradeChange() {
    let placeId = parseInt(document.getElementById('gradeSelectPlace').value);
    let newGrade = document.getElementById('gradeSelectValue').value;
    let target = placesData.find(p => p.id === placeId);
    if(target) {
        target.gradeText = newGrade;
        alert(`${target.name}의 등급이 '${newGrade}'(으)로 수정되었습니다.`);
        closeModal(); 
        renderMarkersAndList(currentFilterType);
    }
}

function closeModal(e) { if(e) e.stopPropagation(); document.getElementById('placeModal').classList.remove('active'); }

function toggleSave(id, event) {
    event.stopPropagation();
    if (savedIds.includes(id)) savedIds.splice(savedIds.indexOf(id), 1); else savedIds.push(id);
    renderMarkersAndList(currentFilterType);
    let badge = document.getElementById('savedCountBadge'); if(badge) badge.innerText = savedIds.length;
}

function renderSavedList() {
    let container = document.getElementById('savedListContainer'); if(!container) return; container.innerHTML = '';
    if (savedIds.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); margin-top: 80px; font-size: 15px; font-weight:500;">저장된 장소가 없습니다.<br><br>지도에서 북마크를 눌러보세요!</div>`;
        return;
    }
    savedIds.forEach(id => {
        let place = placesData.find(p => p.id === id); if (!place) return;
        let cardHTML = `
            <div class="card" onclick="openModal(${place.id}, 'saved')">
                <div class="card-left">
                    <div class="badge ${place.grade}">${place.gradeText}</div>
                    <div class="card-info">
                        <div class="category">${place.typeText} · 찜함</div>
                        <div class="name">${place.name}</div><div class="meta">${place.address}</div>
                    </div>
                </div>
                <button class="save-btn saved" onclick="toggleSave(${place.id}, event)">${Icons.bookmark} 저장됨</button>
            </div>`;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

function filterPlaces(type, element) {
    document.querySelectorAll('.filter-tags .tag').forEach(tag => tag.classList.remove('active'));
    element.classList.add('active'); renderMarkersAndList(type);
}

// 홈 탭 검색 및 데이터 동기화
let currentSearchedData = [];
let currentDisplayCount = 4;
let currentCategoryType = '';

function loadHomePillList(type, element) {
    document.querySelectorAll('.pill-btn').forEach(el => el.classList.remove('active'));
    if(element) element.classList.add('active');

    currentCategoryType = type;
    currentDisplayCount = 4;

    let container = document.getElementById('homePillListContainer');
    if(!container) return;
    container.innerHTML = '<div style="padding:40px 0; text-align:center; color:var(--text-muted); font-size:14px;">장소를 찾고 있습니다...</div>';

    let currentLocation = document.getElementById('currentLocationText').innerText;
    let titleText = type === 'postpartum' ? '산후조리원' : type === 'wedding' ? '결혼식장' : '산부인과';
    let keyword = currentLocation + " " + titleText; 

    if (kakaoPs) {
        kakaoPs.keywordSearch(keyword, function(data, status) {
            if (status === kakao.maps.services.Status.OK) {
                currentSearchedData = data;
                renderHomeListItems();

                // 홈에서 검색된 모든 데이터를 지도 데이터(placesData)와 마커에도 즉시 연동
                data.forEach((r, index) => {
                    let name = r.place_name.split(',')[0];
                    let tempId = parseInt(r.id || index + 500);
                    let existing = placesData.find(p => p.id === tempId);
                    if(!existing) {
                        placesData.push({
                            id: tempId, name: name, type: type, typeText: titleText,
                            gradeText: type === 'postpartum' ? ['A등급', 'B등급', 'C등급'][index % 3] : '우수시설',
                            grade: index % 2 === 0 ? 'gradeA' : 'gradeB',
                            lat: parseFloat(r.y), lng: parseFloat(r.x),
                            address: r.road_address_name || r.address_name, phone: r.phone || '051-555-0199'
                        });
                    }
                });
                renderMarkersAndList('all');
            } else {
                container.innerHTML = `<div style="padding:40px 0; text-align:center; color:var(--text-muted); font-size:14px;">주변에 등록된 '${titleText}' 장소가 없습니다.</div>`;
            }
        }, {
            location: new kakao.maps.LatLng(userLat, userLng),
            sort: kakao.maps.services.SortBy.DISTANCE
        });
    }
}

function renderHomeListItems() {
    let container = document.getElementById('homePillListContainer');
    if(!container) return;
    let html = '';
    
    let displayData = currentSearchedData.slice(0, currentDisplayCount);
    
    displayData.forEach((r, index) => {
        let name = r.place_name.split(',')[0];
        let titleText = currentCategoryType === 'postpartum' ? '산후조리원' : currentCategoryType === 'wedding' ? '결혼식장' : '산부인과';
        let category = r.category_group_name || titleText;
        let tempId = parseInt(r.id || index + 100);
        
        let distanceText = r.distance ? (parseInt(r.distance) >= 1000 ? (parseInt(r.distance)/1000).toFixed(1) + 'km' : r.distance + 'm') : '주변';
        let rating = (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1);
        let reviews = Math.floor(Math.random() * 50) + 5;

        let existingPlace = placesData.find(p => p.id === tempId);
        let gradeDisplay = existingPlace ? existingPlace.gradeText : (currentCategoryType === 'postpartum' ? ['A등급', 'B등급', 'C등급'][index % 3] : '우수시설');
        let topBadgeText = currentCategoryType === 'postpartum' ? `${category} · ${gradeDisplay}` : category;
        let isSaved = savedIds.includes(tempId);

        html += `
            <div style="background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:16px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; box-shadow:var(--shadow-sm); cursor:pointer;" onclick="openModal(${tempId}, 'home')">
                <div style="display:flex; align-items:center; gap:14px; flex:1; overflow:hidden;">
                    <div style="width:64px; height:64px; background:#f1f5f9; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:28px; height:28px; color:var(--text-muted);"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 3v18M15 3v18"></path></svg>
                    </div>
                    <div style="flex:1; overflow:hidden;">
                        <div style="font-size:12px; color:var(--text-muted); font-weight:700; margin-bottom:2px;">${topBadgeText}</div>
                        <div style="font-size:16px; font-weight:800; color:var(--text-main); margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name}</div>
                        <div style="font-size:13px; color:var(--text-sub); display:flex; align-items:center; gap:6px;">
                            <span style="color:var(--text-main); font-weight:700;">★ ${rating}</span> 
                            <span style="color:var(--text-muted);">(${reviews})</span>
                            <span style="color:var(--border);">|</span>
                            <span>${distanceText}</span>
                        </div>
                    </div>
                </div>
                <button class="save-btn ${isSaved ? 'saved' : ''}" onclick="toggleSave(${tempId}, event)" style="padding:8px 14px; border-radius:12px; font-size:13px; font-weight:600; margin-left:10px; flex-shrink:0;">
                    ${isSaved ? '저장됨' : '저장'}
                </button>
            </div>
        `;
    });

    let btnHtml = '<div style="display:flex; gap:8px; margin-top:12px; margin-bottom:20px;">';
    if (currentSearchedData.length > currentDisplayCount) {
        btnHtml += `<button onclick="loadMoreHomeList()" style="flex:1; padding:14px; background:var(--surface); border:1px solid var(--border); border-radius:12px; font-size:14px; font-weight:600; color:var(--text-sub); cursor:pointer;">더보기</button>`;
    }
    if (currentDisplayCount > 4) {
        btnHtml += `<button onclick="foldHomeList()" style="flex:1; padding:14px; background:var(--bg-color); border:1px solid var(--border); border-radius:12px; font-size:14px; font-weight:600; color:var(--text-sub); cursor:pointer;">접기</button>`;
    }
    btnHtml += '</div>';
    
    if (currentSearchedData.length > 4) html += btnHtml;
    container.innerHTML = html;
}

function loadMoreHomeList() { currentDisplayCount += 4; renderHomeListItems(); }
function foldHomeList() { currentDisplayCount = 4; renderHomeListItems(); }

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        let defaultBtn = document.getElementById('defaultHomePill');
        if(defaultBtn) loadHomePillList('postpartum', defaultBtn);
    }, 700);
});