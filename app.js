// TimeZones List Generation
const SUPABASE_URL = 'https://dvgprznbqdmmhnvabmnl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2Z3Byem5icWRtbWhudmFibW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MzE0MTAsImV4cCI6MjA5MDAwNzQxMH0.oUYU4EpZDaPc_HGbj7q_6q0ftiWEXyAQZwiqar6s7ss';

let cloudStatus = 'unknown';

function getSupabaseHeaders(extraHeaders = {}) {
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        ...extraHeaders
    };
}

function isCloudUnavailable() {
    return cloudStatus === 'offline';
}

function updateShareButtonCloudMode() {
    const shareBtn = document.getElementById('share-btn');
    const label = shareBtn?.querySelector('[data-i18n]');
    if (!shareBtn || !label) return;

    const key = isCloudUnavailable() ? 'btn_copy_invite_link' : 'btn_share_id';
    label.setAttribute('data-i18n', key);
    label.textContent = t(key);
    shareBtn.dataset.mode = isCloudUnavailable() ? 'local' : 'cloud';
}

function setCloudStatus(nextStatus, reason = null) {
    if (cloudStatus === nextStatus) return;
    cloudStatus = nextStatus;
    if (nextStatus === 'offline') {
        console.warn('[Cloud] Falling back to local share mode.', reason || '');
    }
    updateShareButtonCloudMode();
}

function clearCloudMeetingId() {
    localStorage.removeItem('timeAlignMeetingId');
    const badge = document.getElementById('meeting-id-badge');
    const badgeText = document.getElementById('meeting-id-text');
    if (badge) badge.style.display = 'none';
    if (badgeText) badgeText.textContent = '';
}

async function cloudFetch(path, init = {}) {
    if (isCloudUnavailable()) {
        throw new Error('CloudUnavailable');
    }
    try {
        const response = await fetch(`${SUPABASE_URL}${path}`, {
            ...init,
            headers: getSupabaseHeaders(init.headers || {})
        });
        setCloudStatus('online');
        return response;
    } catch (error) {
        setCloudStatus('offline', error);
        throw error;
    }
}

function getLocalShareUrl(stateStr) {
    const encoded = btoa(encodeURIComponent(stateStr));
    return `${window.location.origin}${window.location.pathname}#share=${encoded}`;
}

async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
}

function getShareButtonIdleHTML() {
    const labelKey = isCloudUnavailable() ? 'btn_copy_invite_link' : 'btn_share_id';
    return `<span class="icon">🔗</span><span data-i18n="${labelKey}">${t(labelKey)}</span>`;
}

async function copyLocalShareLink(stateStr) {
    clearCloudMeetingId();
    await copyToClipboard(getLocalShareUrl(stateStr));
    updateShareButtonCloudMode();
}

async function updateMeetingData(meetingId, dataStr) {
    const res = await cloudFetch(`/rest/v1/meetings?id=eq.${meetingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataStr })
    });
    if (!res.ok) throw new Error(`DB Error ${res.status}`);
    return res;
}

async function createMeeting(dataStr) {
    const meetingId = Math.floor(100000 + Math.random() * 900000).toString();
    const res = await cloudFetch('/rest/v1/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ id: meetingId, data: dataStr })
    });
    if (!res.ok) throw new Error('DB Error');
    return meetingId;
}

async function fetchMeeting(meetingId) {
    const res = await cloudFetch(`/rest/v1/meetings?id=eq.${meetingId}&select=data`, {
        headers: { 'Cache-Control': 'no-cache, no-store' }
    });
    if (!res.ok) throw new Error('DB Error');
    const rows = await res.json();
    return (rows && rows.length > 0) ? rows[0].data : null;
}

async function searchMeetingByName(name) {
    if (isCloudUnavailable()) return [];

    try {
        const res = await cloudFetch('/rest/v1/meetings?select=id,data&order=id.desc&limit=10');
        if (!res.ok) return [];

        const rows = await res.json();
        const results = [];
        for (const row of rows) {
            try {
                const d = JSON.parse(row.data);
                const topic = d.meetingTopic || d.topic || '';
                if (topic.includes(name)) {
                    results.push({ id: row.id, topic });
                }
            } catch(e) {}
        }
        return results;
    } catch (error) {
        return [];
    }
}

let _searchTimer = null;

const timezones = Intl.supportedValuesOf('timeZone');
let participantCount = 0;
let isCreator = true;

const commonTimezones = [
    { key: 'tz_cn', value: 'Asia/Shanghai' },
    { key: 'tz_tw', value: 'Asia/Taipei' },
    { key: 'tz_us_east', value: 'America/New_York' },
    { key: 'tz_us_west', value: 'America/Los_Angeles' },
    { key: 'tz_us_central', value: 'America/Chicago' },
    { key: 'tz_ca_east', value: 'America/Toronto' },
    { key: 'tz_ca_west', value: 'America/Vancouver' },
    { key: 'tz_uk', value: 'Europe/London' },
    { key: 'tz_eu', value: 'Europe/Paris' }
];

function translateTz(tz) {
    if (typeof currentLang !== 'undefined' && currentLang === 'en') {
        return tz.replace(/_/g, ' ');
    }
    const map = {
        'America': '美洲', 'Asia': '亚洲', 'Europe': '欧洲', 
        'Africa': '非洲', 'Australia': '澳洲', 'Pacific': '太平洋',
        'Indian': '印度洋', 'Atlantic': '大西洋', 'Antarctica': '南极洲',
        'New_York': '纽约', 'Chicago': '芝加哥', 'Los_Angeles': '洛杉矶',
        'Toronto': '多伦多', 'Vancouver': '温哥华', 'London': '伦敦',
        'Paris': '巴黎', 'Berlin': '柏林', 'Shanghai': '上海',
        'Taipei': '台北', 'Tokyo': '东京', 'Seoul': '首尔',
        'Sydney': '悉尼', 'Dubai': '迪拜', 'Singapore': '新加坡',
        'Hong_Kong': '香港', 'Macau': '澳门', 'Moscow': '莫斯科',
        'Rome': '罗马', 'Madrid': '马德里', 'Kolkata': '孟买',
        'Bangkok': '曼谷', 'Argentina': '阿根廷', 'Mexico_City': '墨西哥城'
    };
    let translated = tz;
    for (const [en, zh] of Object.entries(map)) {
        translated = translated.replace(new RegExp(en, 'g'), zh);
    }
    return translated.replace(/_/g, ' ');
}

function populateTimezones(selectElement, defaultTz, showAll = false) {
    selectElement.innerHTML = '';
    
    const commonGroup = document.createElement('optgroup');
    commonGroup.label = t('common_timezones_group');
    
    if (!defaultTz) defaultTz = commonTimezones[0].value;
    
    commonTimezones.forEach(tzData => {
        const option = document.createElement('option');
        option.value = tzData.value;
        option.textContent = tzData.key ? t(tzData.key) : tzData.label;
        if (tzData.value === defaultTz) option.selected = true;
        commonGroup.appendChild(option);
    });
    selectElement.appendChild(commonGroup);

    if (showAll) {
        const otherGroup = document.createElement('optgroup');
        otherGroup.label = t('other_timezones_group');
        
        const foldOption = document.createElement('option');
        foldOption.value = 'FOLD_MORE';
        foldOption.textContent = t('fold_timezones');
        foldOption.style.fontWeight = 'bold';
        otherGroup.appendChild(foldOption);
        
        timezones.forEach(tz => {
            if (commonTimezones.some(c => c.value === tz)) return;
            
            const option = document.createElement('option');
            option.value = tz;
            
            const date = new Date();
            const str = date.toLocaleString('en-US', { timeZone: tz, timeZoneName: 'short' });
            const offsetMatch = str.match(/\b([A-Z]+[+-]?\d*)\b$/);
            const offsetString = offsetMatch ? offsetMatch[0] : '';
            
            option.textContent = `(本地: ${offsetString}) ${translateTz(tz)}`;
            
            if (tz === defaultTz && !commonTimezones.some(c => c.value === defaultTz)) {
                option.selected = true;
            }
            otherGroup.appendChild(option);
        });
        selectElement.appendChild(otherGroup);
    } else {
        // If the initialized defaultTz is completely outside commonTimezones, we must force expand!
        if (defaultTz && !commonTimezones.some(c => c.value === defaultTz)) {
            return populateTimezones(selectElement, defaultTz, true);
        }
        
        const moreOption = document.createElement('option');
        moreOption.value = 'LOAD_MORE';
        moreOption.textContent = t('load_timezones');
        moreOption.style.fontWeight = 'bold';
        selectElement.appendChild(moreOption);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash;
    
    if (hash && hash.startsWith('#id=')) {
        const meetingId = hash.substring(4);
        document.body.style.opacity = '0.5';
        document.title = t('loading_cloud_meeting');
        fetchMeeting(meetingId).then(decodedStr => {
            if (decodedStr) {
                localStorage.setItem('timeAlignState', decodedStr);
                localStorage.setItem('timeAlignMeetingId', meetingId);
                window.history.replaceState(null, '', window.location.pathname);
                window.location.reload();
            } else {
                alert(t('alert_no_meeting_found'));
                document.body.style.opacity = '1';
                document.title = 'TimeAlign';
                window.history.replaceState(null, '', window.location.pathname);
            }
        }).catch(err => {
            alert(isCloudUnavailable() ? t('alert_cloud_unavailable_link') : t('alert_db_error'));
            document.body.style.opacity = '1';
            window.history.replaceState(null, '', window.location.pathname);
        });
        return; // Halt bootstrapping until reload!
    }

    if (hash && hash.startsWith('#share=')) {
        try {
            const encoded = hash.substring(7);
            const decodedStr = decodeURIComponent(atob(encoded));
            JSON.parse(decodedStr); // Validate safety
            localStorage.setItem('timeAlignState', decodedStr);
            isCreator = false; // Invitee mode active
            // Hide the massive hash URL from the browser string
            window.history.replaceState(null, '', window.location.pathname);
        } catch(e) {
            console.error('Failed to parse shared state.');
        }
    }
    
    const viewerTimezoneSelect = document.getElementById('viewer-timezone');
    
    // Default system fallback overrides to the first recommended common timezone.
    const defaultTz = commonTimezones[0].value;
    
    populateTimezones(viewerTimezoneSelect, defaultTz);
    viewerTimezoneSelect.addEventListener('change', function(e) {
        if (e.target.value === 'LOAD_MORE') populateTimezones(e.target, defaultTz, true);
        else if (e.target.value === 'FOLD_MORE') populateTimezones(e.target, defaultTz, false);
        else {
            if (typeof saveData === 'function') saveData();
            if (typeof calculateBestTime === 'function') calculateBestTime();
        }
    });
    
    const saved = localStorage.getItem('timeAlignState');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            
            if (data.meetingTopic) {
                const topicInput = document.getElementById('meeting-topic');
                if (topicInput) topicInput.value = data.meetingTopic;
            }
            
            if (data.viewerTz) viewerTimezoneSelect.value = data.viewerTz;
            
            if (data.participants && data.participants.length > 0) {
                data.participants.forEach(pData => {
                    addParticipant(pData.name, pData.tz, pData);
                });
            } else {
                addParticipant(t('creator_default') + ' 1', defaultTz);
                addParticipant(t('participant_default') + ' 1', defaultTz);
            }
        } catch(e) {
            addParticipant(t('participant_default') + ' 1', defaultTz);
            addParticipant(t('participant_default') + ' 2', defaultTz);
        }
    } else {
        addParticipant(t('creator_default') + ' 1', defaultTz);
        addParticipant(t('participant_default') + ' 1', defaultTz);
    }

    const addParticipantBtn = document.getElementById('add-participant-btn');
    if (!isCreator) {
        addParticipantBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:2px;"><path d="M12 5v14M5 12h14"/></svg>' + t('btn_add_my_time');
        const topic = document.getElementById('meeting-topic');
        if (topic) {
            topic.readOnly = true;
            topic.style.pointerEvents = 'none';
        }
    }
    
    addParticipantBtn.addEventListener('click', () => addParticipant('', defaultTz));
    document.getElementById('calculate-btn').addEventListener('click', calculateBestTime);
    
    const shareBtn = document.getElementById('share-btn');
    updateShareButtonCloudMode();
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const topicInput = document.getElementById('meeting-topic');
            if (!topicInput.value.trim()) {
                topicInput.style.border = '2px solid #f87171';
                topicInput.placeholder = t('alert_enter_name_first');
                topicInput.focus();
                setTimeout(() => {
                    topicInput.style.border = '';
                    topicInput.placeholder = t('topic_placeholder');
                }, 3000);
                return;
            }
            saveData();
            let stateStr;
            if (hash.startsWith('#state=')) {
                stateStr = hash.substring(7);
            } else {
                stateStr = localStorage.getItem('timeAlignState');
            }
            if (!stateStr) return;
            
            const orig = getShareButtonIdleHTML();
            if (isCloudUnavailable()) {
                copyLocalShareLink(stateStr).then(() => {
                    shareBtn.innerHTML = '<span class="icon">✅</span> ' + t('toast_local_link_copied');
                    setTimeout(() => {
                        shareBtn.innerHTML = getShareButtonIdleHTML();
                    }, 3000);
                });
                return;
            }

            shareBtn.innerHTML = '<span class="icon">⏳</span> ' + t('toast_generating_id');
            
            createMeeting(stateStr).then(meetingId => {
                localStorage.setItem('timeAlignMeetingId', meetingId);
                const topicName = document.getElementById('meeting-topic').value.trim() || '未命名会议';
                const siteUrl = window.location.origin + window.location.pathname;
                const directLink = siteUrl + '#id=' + meetingId;
                const clipText = `【${topicName}】会议编号：${meetingId}\n点击链接直接加入：${directLink}\n（或打开 ${siteUrl} 手动输入编号 ${meetingId}）`;
                copyToClipboard(clipText).then(() => {
                    // Show persistent badge
                    const badge = document.getElementById('meeting-id-badge');
                    const badgeText = document.getElementById('meeting-id-text');
                    if (badge && badgeText) {
                        badgeText.textContent = meetingId;
                        badge.style.display = 'block';
                    }
                    shareBtn.innerHTML = `<span class="icon">✅</span> ` + t('toast_id_copied');
                    setTimeout(() => shareBtn.innerHTML = orig, 3000);
                });
            }).catch(e => {
                copyLocalShareLink(stateStr).then(() => {
                    shareBtn.innerHTML = '<span class="icon">✅</span> ' + t('toast_local_link_copied');
                    setTimeout(() => {
                        shareBtn.innerHTML = getShareButtonIdleHTML();
                    }, 3000);
                });
            });
        });
    }
    
    document.getElementById('auto-locate-btn').addEventListener('click', () => {
        const btn = document.getElementById('auto-locate-btn');
        const orig = btn.innerHTML;
        btn.innerHTML = '<span class="icon">⏳</span> ' + t('toast_locating');
        
        const applyLocalTz = () => {
            const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const select = document.getElementById('viewer-timezone');
            
            let optionExists = Array.from(select.options).some(opt => opt.value === localTz);
            if (!optionExists) {
                populateTimezones(select, localTz, true);
            } else {
                select.value = localTz;
            }
            
            saveData();
            btn.innerHTML = '<span class="icon">✅</span> ' + t('toast_located');
            setTimeout(() => btn.innerHTML = orig, 2000);
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => { applyLocalTz(); }, // Success UX
                (error) => { applyLocalTz(); }     // Fallback to Intl if denied
            );
        } else {
            applyLocalTz();
        }
    });
    
    document.addEventListener('input', (e) => {
        if (e.target.id === 'meeting-topic') {
            const val = e.target.value.trim();
            let hashPayload = null;
            let isCloudId = false;

            if (val.includes('#id=')) {
                hashPayload = val.split('#id=')[1];
                isCloudId = true;
            } else if (val.includes('#share=')) {
                hashPayload = val.split('#share=')[1];
            } else if (/^\d{6}$/.test(val)) {
                hashPayload = val;
                isCloudId = true;
            } else if (val.length > 50 && /^[A-Za-z0-9+/=]+$/.test(val)) {
                hashPayload = val;
            }
            
            if (hashPayload) {
                if (isCloudId) {
                    if (isCloudUnavailable()) {
                        alert(t('alert_cloud_unavailable_link'));
                        return;
                    }
                    window.location.hash = 'id=' + hashPayload;
                    window.location.reload();
                    return;
                } else {
                    try {
                        JSON.parse(decodeURIComponent(atob(hashPayload)));
                        window.location.hash = 'share=' + hashPayload;
                        window.location.reload();
                        return;
                    } catch(err) {} 
                }
            }
            
            // Debounced name-based search
            if (val.length >= 2 && !/^\d+$/.test(val) && !isCloudUnavailable()) {
                clearTimeout(_searchTimer);
                _searchTimer = setTimeout(() => {
                    // Remove old dropdown
                    document.querySelectorAll('.meeting-search-dropdown').forEach(d => d.remove());
                    searchMeetingByName(val).then(results => {
                        if (results.length === 0) return;
                        const dropdown = document.createElement('div');
                        dropdown.className = 'meeting-search-dropdown';
                        dropdown.style.cssText = 'position:absolute;left:0;right:0;top:100%;z-index:200;background:rgba(30,30,60,0.97);border:1px solid rgba(129,140,248,0.3);border-radius:0 0 12px 12px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.4);max-height:200px;overflow-y:auto;';
                        results.forEach(r => {
                            const item = document.createElement('div');
                            item.style.cssText = 'padding:10px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:background 0.15s;border-bottom:1px solid rgba(255,255,255,0.05);';
                            item.innerHTML = `<span style="color:#e0e0ff;">${r.topic}</span><span style="color:var(--primary);font-size:0.8rem;opacity:0.7;">编号 ${r.id}</span>`;
                            item.onmouseover = () => item.style.background = 'rgba(129,140,248,0.15)';
                            item.onmouseout = () => item.style.background = 'transparent';
                            item.onclick = () => {
                                window.location.hash = 'id=' + r.id;
                                window.location.reload();
                            };
                            dropdown.appendChild(item);
                        });
                        const card = document.getElementById('meeting-info-card');
                        card.style.position = 'relative';
                        card.appendChild(dropdown);
                        // Auto-close
                        setTimeout(() => {
                            document.addEventListener('click', function closeDd(ev) {
                                if (!dropdown.contains(ev.target)) { dropdown.remove(); document.removeEventListener('click', closeDd); }
                            });
                        }, 10);
                    });
                }, 500);
            } else {
                document.querySelectorAll('.meeting-search-dropdown').forEach(d => d.remove());
            }
        }
        saveData();
    });
    document.addEventListener('change', (e) => {
        saveData();
        // Skip the FOLD/LOAD MORE buttons to avoid calculating when just scrolling timezones
        if (e.target.value !== 'LOAD_MORE' && e.target.value !== 'FOLD_MORE') {
            if (typeof calculateBestTime === 'function') calculateBestTime();
        }
    });
    
    // Auto-calculate on load so users don't see an empty result page on refresh
    setTimeout(calculateBestTime, 200);
});

function saveData() {
    const data = {
        meetingTopic: document.getElementById('meeting-topic')?.value || '',
        viewerTz: document.getElementById('viewer-timezone') ? document.getElementById('viewer-timezone').value : '',
        participants: []
    };
    document.querySelectorAll('.participant-card').forEach(card => {
        const name = card.querySelector('.name-input').value;
        const tz = card.querySelector('.timezone-select').value;
        const avatarImg = card.querySelector('.participant-avatar');
        let avatar = '';
        if (avatarImg) {
            const emojiData = avatarImg.getAttribute('data-emoji');
            avatar = emojiData ? 'emoji:' + emojiData : (avatarImg.src || '');
        }
        const slots = [];
        card.querySelectorAll('.time-slot').forEach(slot => {
            const date = slot.querySelector('.date-input').value;
            const start = slot.querySelector('.start-time').value;
            const end = slot.querySelector('.end-time').value;
            slots.push({ date, start, end });
        });
        data.participants.push({ name, tz, avatar, slots });
    });
    localStorage.setItem('timeAlignState', JSON.stringify(data));
}

function addParticipant(name = '', tz = 'Asia/Shanghai', restoreData = null) {
    participantCount++;
    const container = document.getElementById('participants-container');
    const template = document.getElementById('participant-template');
    const clone = template.content.cloneNode(true);
    
    const card = clone.querySelector('.participant-card');
    card.dataset.id = Date.now().toString() + Math.random().toString();
    
    const isImportedAndInvitee = !isCreator && restoreData !== null;
    if (isImportedAndInvitee) {
        card.classList.add('readonly-card');
    }
    
    const nameInput = clone.querySelector('.name-input');
    nameInput.value = name || `${t('participant_default')} ${participantCount}`;
    if (isImportedAndInvitee) {
        nameInput.readOnly = true;
        nameInput.style.pointerEvents = 'none';
        nameInput.style.border = 'none';
        nameInput.style.background = 'transparent';
    }
    
    const avatar = clone.querySelector('.participant-avatar');
    if (avatar) {
        if (restoreData && restoreData.avatar) {
            if (restoreData.avatar.startsWith('emoji:')) {
                avatar.style.cssText = 'width:48px;height:48px;border-radius:50%;background:rgba(129,140,248,0.15);display:flex;align-items:center;justify-content:center;font-size:28px;cursor:pointer;';
                avatar.outerHTML = `<div class="participant-avatar" style="width:48px;height:48px;border-radius:50%;background:rgba(129,140,248,0.15);display:flex;align-items:center;justify-content:center;font-size:28px;cursor:pointer;" data-emoji="${restoreData.avatar.slice(6)}">${restoreData.avatar.slice(6)}</div>`;
            } else {
                avatar.src = restoreData.avatar.replace('lorelei', 'micah');
            }
        } else {
            const seed = name || (Date.now().toString() + participantCount);
            avatar.src = `https://api.dicebear.com/7.x/micah/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
        }
    }
    
    // Avatar picker on click
    const avatarEl = clone.querySelector('.participant-avatar');
    if (avatarEl) {
        avatarEl.style.cursor = 'pointer';
        avatarEl.title = '点击更换头像';
        avatarEl.addEventListener('click', function(e) {
            e.stopPropagation();
            // Remove any existing picker
            document.querySelectorAll('.avatar-picker').forEach(p => p.remove());
            
            const emojis = ['🐱','🐶','🐰','🐻','🐼','🦊','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🦄','🐧','🐥','🐝','🦋','🌸','🌻','🍓','🍑','🧁','🍩','🌈','⭐','💖','🎀','👑','🌙'];
            
            const picker = document.createElement('div');
            picker.className = 'avatar-picker';
            picker.style.cssText = 'position:absolute;top:60px;left:0;z-index:100;background:rgba(30,30,60,0.95);border:1px solid rgba(129,140,248,0.3);border-radius:12px;padding:8px;display:grid;grid-template-columns:repeat(6,1fr);gap:4px;box-shadow:0 8px 32px rgba(0,0,0,0.4);backdrop-filter:blur(12px);';
            
            emojis.forEach(emoji => {
                const btn = document.createElement('button');
                btn.textContent = emoji;
                btn.style.cssText = 'border:none;background:transparent;font-size:24px;cursor:pointer;padding:6px;border-radius:8px;transition:all 0.15s;';
                btn.onmouseover = () => btn.style.background = 'rgba(129,140,248,0.2)';
                btn.onmouseout = () => btn.style.background = 'transparent';
                btn.onclick = (ev) => {
                    ev.stopPropagation();
                    // Replace avatar with emoji
                    const parent = avatarEl.parentElement;
                    const emojiDiv = document.createElement('div');
                    emojiDiv.className = 'participant-avatar';
                    emojiDiv.setAttribute('data-emoji', emoji);
                    emojiDiv.style.cssText = 'width:48px;height:48px;border-radius:50%;background:rgba(129,140,248,0.15);display:flex;align-items:center;justify-content:center;font-size:28px;cursor:pointer;';
                    emojiDiv.textContent = emoji;
                    emojiDiv.title = '点击更换头像';
                    avatarEl.replaceWith(emojiDiv);
                    // Re-attach click handler to new element
                    emojiDiv.addEventListener('click', avatarEl._pickerHandler || function(){});
                    picker.remove();
                    saveData();
                };
                picker.appendChild(btn);
            });
            
            // Position relative to card
            const card = avatarEl.closest('.participant-card');
            card.style.position = 'relative';
            card.appendChild(picker);
            
            // Close on outside click
            setTimeout(() => {
                document.addEventListener('click', function closeP(ev) {
                    if (!picker.contains(ev.target)) { picker.remove(); document.removeEventListener('click', closeP); }
                });
            }, 10);
        });
    }
    
    const tzSelect = clone.querySelector('.timezone-select');
    populateTimezones(tzSelect, tz);
    if (isImportedAndInvitee) {
        tzSelect.disabled = true;
        tzSelect.style.appearance = 'none';
        tzSelect.style.border = 'none';
        tzSelect.style.background = 'transparent';
    } else {
        tzSelect.addEventListener('change', function(e) {
            if (e.target.value === 'LOAD_MORE') populateTimezones(e.target, commonTimezones[0].value, true);
            if (e.target.value === 'FOLD_MORE') populateTimezones(e.target, commonTimezones[0].value, false);
        });
    }
    
    const locateBtn = clone.querySelector('.participant-auto-locate');
    if (locateBtn) {
        if (isImportedAndInvitee) {
            locateBtn.style.display = 'none';
        } else {
            locateBtn.addEventListener('click', (e) => {
                const btn = e.target.closest('.participant-auto-locate');
                const orig = btn.innerHTML;
                btn.innerHTML = '⏳ ' + t('toast_locating');
                
                const applyLocalTz = () => {
                    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    let optionExists = Array.from(tzSelect.options).some(opt => opt.value === localTz);
                    if (!optionExists) {
                        populateTimezones(tzSelect, localTz, true);
                    } else {
                        tzSelect.value = localTz;
                    }
                    saveData();
                    btn.innerHTML = '✅ ' + t('toast_located');
                    setTimeout(() => btn.innerHTML = orig, 2000);
                };

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        () => applyLocalTz(),
                        () => applyLocalTz()
                    );
                } else {
                    applyLocalTz();
                }
            });
        }
    }
    
    const timeSlotsContainer = clone.querySelector('.time-slots');
    
    if (restoreData && restoreData.slots) {
        const activeSels = restoreData.slots.map(s => {
            const startD = parseNaiveLocal(`${s.date}T${s.start}:00`);
            const endD = parseNaiveLocal(`${s.date}T${s.end}:00`);
            return { startLocal: startD, endLocal: endD };
        });
        renderNiceBadges(timeSlotsContainer, activeSels);
    } else {
        const defaultStart = new Date(); defaultStart.setHours(9,0,0,0);
        const defaultEnd = new Date(); defaultEnd.setHours(17,0,0,0);
        renderNiceBadges(timeSlotsContainer, [{ startLocal: defaultStart, endLocal: defaultEnd }]);
    }
    
    // Default state: '我 (本地)' is expanded, others are folded
    if (participantCount === 1) {
        card.classList.add('expanded');
        clone.querySelector('.remove-participant-btn').style.display = 'none';
    }
    
    clone.querySelector('.toggle-details-btn').addEventListener('click', () => {
        card.classList.toggle('expanded');
    });
    
    clone.querySelector('.open-calendar-btn').addEventListener('click', () => openCalendar(card));
    
    clone.querySelector('.remove-participant-btn').addEventListener('click', () => {
        card.style.opacity = 0;
        card.style.transform = 'scale(0.9)';
        setTimeout(() => { card.remove(); saveData(); }, 300);
    });

    container.appendChild(clone);
    saveData();
}

function calculateBestTime() {
    const targetTz = document.getElementById('viewer-timezone').value;
    const cards = document.querySelectorAll('.participant-card');
    
    if (cards.length === 0) return;
    
    const allParticipantsRanges = [];
    const participantsData = [];
    
    for (const card of cards) {
        const name = card.querySelector('.name-input').value;
        const tz = card.querySelector('.timezone-select').value;
        const slots = card.querySelectorAll('.time-slot');
        const ranges = [];
        
        slots.forEach(slot => {
            const dateVal = slot.querySelector('.date-input').value;
            const startVal = slot.querySelector('.start-time').value;
            const endVal = slot.querySelector('.end-time').value;
            if(!dateVal || !startVal || !endVal) return;
            
            const startDate = getAbsoluteDate(tz, `${dateVal}T${startVal}:00`);
            let endDate = getAbsoluteDate(tz, `${dateVal}T${endVal}:00`);
            
            if (endDate <= startDate) {
                // cross midnight
                endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000); 
            }
            
            ranges.push({ start: startDate.getTime(), end: endDate.getTime() });
        });
        
        if (ranges.length > 0) {
            allParticipantsRanges.push(ranges);
            participantsData.push({ name, tz, ranges });
        }
    }
    
    const overlap = findOverlap(allParticipantsRanges);
    displayResults(overlap, targetTz);
    renderTimeline(participantsData, targetTz);
}

// Map a local Timezone date/time string to an absolute Date object (UTC)
function getAbsoluteDate(tz, localIsoString) {
    const [datePart, timePart] = localIsoString.split('T');
    const [yyyy, mm, dd] = datePart.split('-');
    const [hh, min, ss] = timePart.split(':');
    
    const tzString = new Date(`${yyyy}-${mm}-${dd}T12:00:00Z`).toLocaleString('en-US', { timeZone: tz, timeZoneName: 'longOffset' });
    const match = tzString.match(/GMT([+-]\d{2}):?(\d{2})?/);
    let offsetMs = 0;
    if (match) {
        const sign = match[1][0] === '-' ? -1 : 1;
        const hr = parseInt(match[1].substring(1), 10);
        const m = match[2] ? parseInt(match[2], 10) : 0;
        offsetMs = sign * (hr * 60 + m) * 60 * 1000;
    }
    
    const baseDate = new Date(Date.UTC(yyyy, parseInt(mm)-1, dd, hh, min, ss || 0));
    return new Date(baseDate.getTime() - offsetMs);
}

function findOverlap(participantRanges) {
    if(participantRanges.length === 0) return [];
    if(participantRanges.length === 1) return participantRanges[0];
    
    let currentOverlap = participantRanges[0];
    
    for (let i = 1; i < participantRanges.length; i++) {
        let nextOverlap = [];
        const currentPersonSlots = participantRanges[i];
        
        for (const slot1 of currentOverlap) {
            for (const slot2 of currentPersonSlots) {
                const maxStart = Math.max(slot1.start, slot2.start);
                const minEnd = Math.min(slot1.end, slot2.end);
                
                if (maxStart < minEnd) {
                    nextOverlap.push({ start: maxStart, end: minEnd });
                }
            }
        }
        currentOverlap = nextOverlap;
    }
    
    return currentOverlap;
}

function displayResults(overlaps, targetTz) {
    const resultsSection = document.getElementById('results-section');
    const container = document.getElementById('results-container');
    resultsSection.classList.remove('hidden');
    container.innerHTML = '';
    
    if (overlaps.length === 0) {
        container.innerHTML = `<div class="no-overlap">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:1rem; opacity:0.8"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><br>
            ${t('no_overlap_found')}
        </div>`;
        return;
    }
    
    overlaps.forEach(overlap => {
        // Since getAbsoluteDate accurately translates intervals, overlap is stored directly in total epoch milliseconds.
        const localStart = new Date(overlap.start);
        const localEnd = new Date(overlap.end);
        
        const locale = (typeof currentLang !== 'undefined' && currentLang === 'en') ? 'en-US' : 'zh-CN';
        const options = { timeZone: targetTz, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
        const sTime = localStart.toLocaleString(locale, options);
        let eTime = '';
        
        // If they end on the exact same date & month in the target timezone:
        const startDayStr = localStart.toLocaleString('en-US', { timeZone: targetTz, month: 'numeric', day: 'numeric' });
        const endDayStr = localEnd.toLocaleString('en-US', { timeZone: targetTz, month: 'numeric', day: 'numeric' });
        
        if (startDayStr === endDayStr) {
            eTime = localEnd.toLocaleString(locale, { timeZone: targetTz, hour: '2-digit', minute: '2-digit', hour12: false });
        } else {
            eTime = localEnd.toLocaleString(locale, options);
        }
        
        const durationMins = (overlap.end - overlap.start) / 60000;
        const durHrs = Math.floor(durationMins / 60);
        const durLeftMs = durationMins % 60;
        let durStr = durHrs > 0 ? `${durHrs}${t('hour')} ` : '';
        if (durLeftMs > 0) durStr += `${durLeftMs}${t('minute')}`;
        
        const el = document.createElement('div');
        el.className = 'result-item';
        el.innerHTML = `
            <div class="result-time">${sTime} — ${eTime}</div>
            <div class="result-duration">${t('overlap_summary')} ${durStr}</div>
        `;
        container.appendChild(el);
    });
}

function renderTimeline(participantsData, targetTz) {
    const container = document.getElementById('timeline-container');
    container.innerHTML = '';

    let minMs = Infinity;
    let maxMs = -Infinity;
    participantsData.forEach(p => p.ranges.forEach(r => {
        if (r.start < minMs) minMs = r.start;
        if (r.end > maxMs) maxMs = r.end;
    }));

    if (minMs === Infinity) return;

    // Snap minMs to the exact top-of-the-hour relative to the display timezone!
    // Using strict mathematical deduction instead of string parsing to flawlessly support 24:00 boundaries and fractional timezones (e.g. India +05:30)
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: targetTz, minute: 'numeric' });
    const targetMins = parseInt(formatter.format(new Date(minMs)));
    const targetSecs = new Date(minMs).getSeconds();
    const targetMills = new Date(minMs).getMilliseconds();
    
    // Deduct the localized minutes, seconds, and milliseconds straight from the Epoch anchor
    let originEpoch = minMs - (targetMins * 60000) - (targetSecs * 1000) - targetMills;

    // Pad limits by 1 hour for safe UI breathing room
    minMs = originEpoch - 60 * 60 * 1000;
    maxMs += 60 * 60 * 1000;
    const totalMs = maxMs - minMs;
    const totalHours = Math.ceil(totalMs / (60 * 60 * 1000));

    const axis = document.createElement('div');
    axis.className = 'timeline-axis';
    
    let stepH = 2; // Every 2 hours
    if (totalHours > 72) stepH = 12; // Every 12 hours
    else if (totalHours > 24) stepH = 6; // Every 6 hours
    
    for (let i = 0; i <= totalHours; i += stepH) {
        const hr = document.createElement('div');
        hr.className = 'timeline-hour';
        hr.style.flex = stepH;
        
        const tickDate = new Date(minMs + i * 60 * 60 * 1000);
        const locale = (typeof currentLang !== 'undefined' && currentLang === 'en') ? 'en-US' : 'zh-CN';
        hr.textContent = tickDate.toLocaleString(locale, { timeZone: targetTz, day: 'numeric', hour: '2-digit', hour12: false });
        axis.appendChild(hr);
    }
    container.appendChild(axis);

    participantsData.forEach(p => {
        const row = document.createElement('div');
        row.className = 'timeline-row';
        
        const label = document.createElement('div');
        label.className = 'timeline-label';
        
        let shortLocation = p.tz;
        if (typeof commonTimezones !== 'undefined') {
            const match = commonTimezones.find(c => c.value === p.tz);
            if (match) {
                shortLocation = t(match.key).split(' ')[0];
            } else {
                if (p.tz.startsWith('Europe/')) {
                    shortLocation = '欧洲';
                } else {
                    shortLocation = translateTz(p.tz).split('/').pop();
                }
            }
        }
        
        label.textContent = `${p.name || t('anonymous')} (${t('from')} ${shortLocation})`;
        label.title = label.textContent;
        
        const bars = document.createElement('div');
        bars.className = 'timeline-bars';
        
        p.ranges.forEach(range => {
            const startPct = ((range.start - minMs) / totalMs) * 100;
            const widthPct = ((range.end - range.start) / totalMs) * 100;
            
            const block = document.createElement('div');
            block.className = 'timeline-block';
            block.style.left = `${startPct}%`;
            block.style.width = `${widthPct}%`;
            bars.appendChild(block);
        });
        
        row.appendChild(label);
        row.appendChild(bars);
        container.appendChild(row);
    });

    // === Overlap highlight row ===
    if (participantsData.length >= 2) {
        const allRangesArrays = participantsData.map(p => p.ranges);
        const overlapRanges = findOverlap(allRangesArrays);
        
        if (overlapRanges.length > 0) {
            // Separator
            const sep = document.createElement('div');
            sep.style.cssText = 'border-top: 1px dashed rgba(52, 211, 153, 0.4); margin: 8px 0 4px 200px;';
            container.appendChild(sep);

            const overlapRow = document.createElement('div');
            overlapRow.className = 'timeline-row';
            
            const overlapLabel = document.createElement('div');
            overlapLabel.className = 'timeline-label';
            overlapLabel.textContent = t('overlap_period');
            overlapLabel.style.color = '#34d399';
            overlapLabel.style.fontWeight = '700';
            overlapLabel.title = t('overlap_tooltip');
            
            const overlapBars = document.createElement('div');
            overlapBars.className = 'timeline-bars';
            
            overlapRanges.forEach(range => {
                const startPct = ((range.start - minMs) / totalMs) * 100;
                const widthPct = ((range.end - range.start) / totalMs) * 100;
                
                const block = document.createElement('div');
                block.className = 'timeline-block';
                block.style.left = `${startPct}%`;
                block.style.width = `${widthPct}%`;
                block.style.background = 'linear-gradient(135deg, rgba(52, 211, 153, 0.7), rgba(16, 185, 129, 0.9))';
                block.style.border = '1px solid rgba(52, 211, 153, 0.8)';
                block.style.boxShadow = '0 0 8px rgba(52, 211, 153, 0.4)';
                block.style.borderRadius = '4px';
                overlapBars.appendChild(block);
            });
            
            overlapRow.appendChild(overlapLabel);
            overlapRow.appendChild(overlapBars);
            container.appendChild(overlapRow);
        }
    }
}
