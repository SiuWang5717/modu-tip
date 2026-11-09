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

function handleNotificationSetting() {
    alert("휴대폰 [설정] > [알림]에서 앱 권한을 확인해주세요.");
}
function handleLocationSetting() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if(isMobile) alert("휴대폰 [설정] > [위치]에서 앱의 위치 권한을 '항상 허용'으로 변경해주십시오.");
    else {
        navigator.geolocation.getCurrentPosition(
            () => { alert("위치 권한이 이미 허용되어 정상 연동 중입니다."); moveToMyPosition(); },
            () => { alert("웹 브라우저 주소창 좌측의 '자물쇠' 아이콘을 눌러 위치 권한을 허용해주세요."); }
        );
    }
}

function switchTab(tabName, element) {
    document.querySelectorAll('.screen-content').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + tabName).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    element.classList.add('active');
    if (tabName === 'map' && window.mapInstance) {
        setTimeout(() => { map.relayout(); }, 150);
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
        setTimeout(() => { map.relayout(); }, 200);
    }
}

let map, kakaoMarkers = [], myPosMarker = null;
let userLat = 35.1587, userLng = 129.1604;
let placesData = [], savedIds = [], recentIds = [];
let moveTimeout, tempSearchMarker = null;
let kakaoPs = null;

window.addEventListener('DOMContentLoaded', () => {
    // 카카오 지도 초기화
    const container = document.getElementById('map');
    const options = {
        center: new kakao.maps.LatLng(userLat, userLng),
        level: 4
    };
    map = new kakao.maps.Map(container, options);
    window.mapInstance = map;

    // 카카오 장소 검색 객체 초기화
    if (typeof kakao !== 'undefined' && kakao.maps && kakao.maps.services) {
        kakaoPs = new kakao.maps.services.Places();
    }

    // 지도 드래그/이동 감지
    kakao.maps.event.addListener(map, 'dragstart', () => {
        clearTimeout(moveTimeout);
        document.getElementById('btnSearchInArea').classList.add('hidden');
    });
    kakao.maps.event.addListener(map, 'dragend', () => {
        renderMarkersAndList(currentFilterType);
        clearTimeout(moveTimeout);
        moveTimeout = setTimeout(() => { document.getElementById('btnSearchInArea').classList.remove('hidden'); }, 1000);
    });

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
        let moveLatLon = new kakao.maps.LatLng(userLat, userLng);
        map.panTo(moveLatLon);
    }
}

function searchInArea() {
    document.getElementById('btnSearchInArea').classList.add('hidden');
    renderMarkersAndList(currentFilterType);
}

function initPlacesAroundUser() {
    placesData = [
        { id: 1, name: "르베 산후조리원", type: "postpartum", typeText: "산후조리원", iconBg: "#2563eb", iconSvg: Icons.baby, grade: "gradeA", gradeText: "A", lat: userLat + 0.003, lng: userLng + 0.003, address: "부산진구 부전동", phone: "051-555-0101" },
        { id: 2, name: "포레 산후조리원", type: "postpartum", typeText: "산후조리원", iconBg: "#2563eb", iconSvg: Icons.baby, grade: "gradeB", gradeText: "B", lat: userLat - 0.004, lng: userLng - 0.003, address: "수영구 남천동", phone: "051-555-0102" },
        { id: 3, name: "그랜드 웨딩홀", type: "wedding", typeText: "결혼식장", iconBg: "#ec4899", iconSvg: Icons.wedding, grade: "gradeA", gradeText: "A", lat: userLat + 0.006, lng: userLng - 0.002, address: "해운대구 센텀시티", phone: "051-555-0201" },
        { id: 4, name: "미래 산부인과 병원", type: "hospital", typeText: "병원", iconBg: "#10b981", iconSvg: Icons.hospital, grade: "gradeA", gradeText: "A", lat: userLat - 0.005, lng: userLng + 0.005, address: "동래구 온천동", phone: "051-555-0103" },
        { id: 5, name: "모던 웨딩컨벤션", type: "wedding", typeText: "결혼식장", iconBg: "#ec4899", iconSvg: Icons.wedding, grade: "gradeB", gradeText: "B", lat: userLat + 0.002, lng: userLng + 0.006, address: "남구 대연동", phone: "051-555-0202" }
    ];
    renderMarkersAndList('all');
}

const searchInput = document.getElementById('mapSearchInput');
const searchContainer = document.getElementById('searchContainer');
const clearBtn = document.getElementById('clearSearchBtn');
const searchDimOverlay = document.getElementById('searchDimOverlay');
const searchDropdown = document.getElementById('searchDropdown');
let searchHistory = [];
let debounceTimer;

function openSearch() {
    searchDimOverlay.classList.add('active');
    searchContainer.classList.add('focused');
    renderSearchHistory();
}
function closeSearch() {
    searchDimOverlay.classList.remove('active');
    searchContainer.classList.remove('focused');
    searchDropdown.classList.remove('active');
    searchInput.blur();
}
function handleSearchInput() {
    clearTimeout(debounceTimer);
    if(searchInput.value.trim().length > 0) {
        clearBtn.classList.add('visible');
        debounceTimer = setTimeout(() => { executeSearch(false); }, 400);
    } else { 
        clearBtn.classList.remove('visible'); renderSearchHistory(); 
    }
}
function clearSearch() { searchInput.value = ''; handleSearchInput(); searchInput.focus(); }

function renderSearchHistory() {
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

    searchDropdown.innerHTML = '<div class="search-empty">검색 중...</div>';
    searchDropdown.classList.add('active');

    let internalMatches = placesData.filter(p => p.name.includes(keyword) || p.address.includes(keyword));
    
    if(internalMatches.length > 0 && isEnter) {
        renderExternalList(internalMatches); toggleSheet(true); closeSearch();
        map.setCenter(new kakao.maps.LatLng(internalMatches[0].lat, internalMatches[0].lng));
        return;
    } else if (internalMatches.length > 0) {
        let html = internalMatches.map(p => `
            <div class="search-item" onclick="flyToAndOpen(${p.lat}, ${p.lng}, ${p.id})">
                <div class="search-icon-box" style="color:white; background:${p.iconBg}">${p.iconSvg}</div>
                <div class="search-text-content"><div class="search-item-title">${p.name}</div><div class="search-item-desc">${p.address} | ${p.typeText}</div></div>
            </div>
        `).join('');
        searchDropdown.innerHTML = html;
        return;
    }

    if (kakaoPs) {
        kakaoPs.keywordSearch(keyword, function(data, status) {
            if (status === kakao.maps.services.Status.OK) {
                let kakaoResults = data.map(r => ({
                    display_name: r.place_name + ", " + (r.road_address_name || r.address_name),
                    lat: parseFloat(r.y),
                    lon: parseFloat(r.x),
                    phone: r.phone || '번호 없음'
                }));

                if (isEnter) {
                    renderExternalList(kakaoResults, true); toggleSheet(true);
                    flyToExternal(kakaoResults[0].lat, kakaoResults[0].lon, kakaoResults[0].display_name);
                } else {
                    let html = kakaoResults.map(r => `
                        <div class="search-item" onclick="flyToExternal(${r.lat}, ${r.lon}, '${r.display_name.replace(/'/g,"\\'")}')">
                            <div class="search-icon-box">${Icons.pin}</div>
                            <div class="search-text-content"><div class="search-item-title">${r.display_name.split(',')[0]}</div><div class="search-item-desc">${r.display_name}</div></div>
                        </div>
                    `).join('');
                    searchDropdown.innerHTML = html;
                }
            } else {
                executeNominatimSearch(keyword, isEnter);
            }
        });
    } else {
        executeNominatimSearch(keyword, isEnter);
    }
}

async function executeNominatimSearch(keyword, isEnter) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(keyword)}&format=json&limit=8&countrycodes=kr&accept-language=ko`);
        const results = await response.json();
        let filteredResults = results.filter(r => !r.type.includes('restaurant') && !r.type.includes('cafe'));

        if(filteredResults.length === 0) {
            searchDropdown.innerHTML = '<div class="search-empty">해당 장소를 찾을 수 없습니다.</div>';
        } else if (isEnter) {
            renderExternalList(filteredResults, true); toggleSheet(true);
            flyToExternal(filteredResults[0].lat, filteredResults[0].lon, filteredResults[0].display_name);
        } else {
            let html = filteredResults.map(r => `
                <div class="search-item" onclick="flyToExternal(${r.lat}, ${r.lon}, '${r.display_name.replace(/'/g,"\\'")}')">
                    <div class="search-icon-box">${Icons.pin}</div>
                    <div class="search-text-content"><div class="search-item-title">${r.display_name.split(',')[0]}</div><div class="search-item-desc">${r.display_name}</div></div>
                </div>
            `).join('');
            searchDropdown.innerHTML = html;
        }
    } catch(error) { 
        searchDropdown.innerHTML = '<div class="search-empty">검색 결과를 불러오지 못했습니다.</div>'; 
    }
}

function renderExternalList(results, isExternal = false) {
    let cardContainer = document.getElementById('cardListContainer'); cardContainer.innerHTML = '';
    document.getElementById('listTitle').innerText = `'${searchInput.value}' 검색 결과`;
    document.getElementById('listCount').innerText = results.length + '곳';

    results.forEach((item, index) => {
        let name = isExternal ? item.display_name.split(',')[0] : item.name;
        let addr = isExternal ? item.display_name : item.address;
        let lat = isExternal ? item.lat : item.lat;
        let lon = isExternal ? item.lon : item.lng;
        
        let cardHTML = `
            <div class="card" onclick="flyToExternal(${lat}, ${lon}, '${name.replace(/'/g,"\\'")}')">
                <div class="card-left">
                    <div class="badge grade-b">${index + 1}</div>
                    <div class="card-info" style="max-width: 250px;">
                        <div class="category">${isExternal ? '검색 장소' : item.typeText}</div>
                        <div class="name">${name}</div><div class="meta">${addr}</div>
                    </div>
                </div>
            </div>`;
        cardContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

function flyToAndOpen(lat, lng, id) {
    map.setCenter(new kakao.maps.LatLng(lat, lng));
    closeSearch();
    setTimeout(() => { openModal(id, 'map'); }, 500);
}

function flyToExternal(lat, lng, displayName) {
    map.setCenter(new kakao.maps.LatLng(lat, lng));
    closeSearch();
    if(tempSearchMarker) tempSearchMarker.setMap(null);
    
    let content = document.createElement('div');
    content.innerHTML = `<div style="background-color: var(--text-main); width: 16px; height: 16px; border: 3px solid white; border-radius: 50%; box-shadow: var(--shadow-sm);"></div>`;
    
    tempSearchMarker = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(lat, lng),
        content: content,
        yAnchor: 0.5
    });
    tempSearchMarker.setMap(map);
}

let currentFilterType = 'all';
function renderMarkersAndList(filterType) {
    currentFilterType = filterType;
    kakaoMarkers.forEach(m => m.setMap(null));
    kakaoMarkers = [];

    let filtered = placesData.filter(place => {
        if (filterType === 'all') return true;
        if (filterType === 'gradeA') return place.grade === 'gradeA';
        if (filterType === 'gradeB') return place.grade === 'gradeB';
        return place.type === filterType;
    });

    let cardContainer = document.getElementById('cardListContainer'); cardContainer.innerHTML = '';
    document.getElementById('listTitle').innerText = '주변 시설 목록';
    document.getElementById('listCount').innerText = filtered.length + '곳';

    filtered.forEach(place => {
        let coords = new kakao.maps.LatLng(place.lat, place.lng);
        let content = document.createElement('div');
        content.className = 'custom-map-marker';
        content.style.background = place.iconBg;
        content.innerHTML = `<div class="marker-icon-inner">${place.iconSvg}</div> ${place.name}`;
        content.onclick = () => { openModal(place.id, 'map'); };

        let customOverlay = new kakao.maps.CustomOverlay({
            position: coords,
            content: content,
            yAnchor: 1
        });
        customOverlay.setMap(map);
        kakaoMarkers.push(customOverlay);

        let isSaved = savedIds.includes(place.id);
        let cardHTML = `
            <div class="card">
                <div class="card-left" onclick="openModal(${place.id}, 'map')">
                    <div class="badge ${place.grade}">${place.gradeText}</div>
                    <div class="card-info" style="max-width: 200px;">
                        <div class="category">${place.typeText} · ${place.gradeText}등급</div>
                        <div class="name">${place.name}</div><div class="meta">${place.address}</div>
                    </div>
                </div>
                <button class="save-btn ${isSaved ? 'saved' : ''}" onclick="toggleSave(${place.id}, event)">
                    ${isSaved ? Icons.bookmark + ' 저장됨' : Icons.bookmark + ' 저장'}
                </button>
            </div>`;
        cardContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

function openModal(id, source = 'map') {
    let place = placesData.find(p => p.id === id); if (!place) return;
    if (source === 'map' && !recentIds.includes(id)) { recentIds.push(id); document.getElementById('recentCountBadge').innerText = recentIds.length + '곳'; }

    document.getElementById('modalName').innerText = place.name;
    document.getElementById('modalBadgeRow').style.display = 'flex';
    document.getElementById('modalBadge').innerText = place.gradeText;
    document.getElementById('modalBadge').className = `badge ${place.grade}`;
    document.getElementById('modalCategory').innerText = place.typeText;
    
    document.getElementById('modalDetailsContainer').innerHTML = `
        <div class="summary-row"><div class="summary-icon">${Icons.pin}</div> <div>${place.address}</div></div>
        <div class="summary-row"><div class="summary-icon">${Icons.clock}</div> <div>09:00 - 18:00 (월-금)</div></div>
        <div class="summary-row"><div class="summary-icon">${Icons.calendar}</div> <div>11월 1주차 상담 가능</div></div>
        <div class="summary-row"><div class="summary-icon">${Icons.phone}</div> <div>${place.phone}</div></div>
    `;

    let mapNavUrl = `https://map.naver.com/v5/search/${encodeURIComponent(place.name)}`;
    document.getElementById('modalButtonsContainer').innerHTML = `
        <a href="${mapNavUrl}" target="_blank" class="modal-btn-sub">${Icons.send} 길찾기</a>
        <button class="modal-btn-main" onclick="alert('전화가 연결됩니다.')">${Icons.phone} 전화 문의</button>
    `;
    document.getElementById('placeModal').classList.add('active');
}

function openGradeModal() {
    document.getElementById('modalName').innerText = "시설 등급 관리";
    document.getElementById('modalBadgeRow').style.display = 'none';
    let optionsHTML = placesData.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    document.getElementById('modalDetailsContainer').innerHTML = `
        <div style="font-size: 14px; color: var(--text-sub); margin-bottom: 24px; line-height:1.5;">운영자가 직접 등급을 평가 및 수정할 수 있습니다.</div>
        <div class="form-group"><label class="form-label">해당 시설 선택</label><select class="form-select" id="gradeSelectPlace">${optionsHTML}</select></div>
        <div class="form-group"><label class="form-label">평가 등급 부여</label><select class="form-select" id="gradeSelectValue"><option value="gradeA">A등급 (최우수)</option><option value="gradeB">B등급 (우수)</option></select></div>
    `;
    document.getElementById('modalButtonsContainer').innerHTML = `<button class="modal-btn-main" onclick="saveGradeChange()" style="width: 100%;">등급 저장 완료</button>`;
    document.getElementById('placeModal').classList.add('active');
}

function saveGradeChange() {
    let placeId = parseInt(document.getElementById('gradeSelectPlace').value);
    let newGrade = document.getElementById('gradeSelectValue').value;
    let target = placesData.find(p => p.id === placeId);
    if(target) {
        target.grade = newGrade; target.gradeText = newGrade === 'gradeA' ? 'A' : 'B';
        alert(`${target.name}의 등급이 수정되었습니다.`);
        closeModal(); renderMarkersAndList(currentFilterType);
    }
}

function openRecentModal() {
    let contentHTML = recentIds.length === 0 
        ? `<div style="padding: 30px 0; text-align: center; color: var(--text-muted); font-size:15px;">최근 조회한 정보가 없습니다.</div>`
        : recentIds.map(id => {
            let p = placesData.find(item => item.id === id);
            return `<div style="padding: 16px 12px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items:center;">
                        <span style="font-weight:700; color:var(--text-main); font-size:15px;">${p.name}</span>
                        <span style="color: var(--text-sub); font-size: 12px; background:var(--bg-color); padding:6px 10px; border-radius:8px;">${p.address}</span>
                    </div>`;
        }).join('');
    document.getElementById('modalName').innerText = "최근 본 정보";
    document.getElementById('modalBadgeRow').style.display = 'none';
    document.getElementById('modalDetailsContainer').innerHTML = contentHTML;
    document.getElementById('modalButtonsContainer').innerHTML = `<button class="modal-btn-main" onclick="closeModal()" style="width: 100%;">닫기</button>`;
    document.getElementById('placeModal').classList.add('active');
}

function closeModal(e) { if(e) e.stopPropagation(); document.getElementById('placeModal').classList.remove('active'); }

function toggleSave(id, event) {
    event.stopPropagation();
    if (savedIds.includes(id)) savedIds.splice(savedIds.indexOf(id), 1); else savedIds.push(id);
    renderMarkersAndList(currentFilterType);
    document.getElementById('savedCountBadge').innerText = savedIds.length;
}

function renderSavedList() {
    let container = document.getElementById('savedListContainer'); container.innerHTML = '';
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