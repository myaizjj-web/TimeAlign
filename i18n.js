// i18n.js
const translations = {
    zh: {
        page_title: "TimeAlign - 智能跨时区找时间",
        subtitle: "在全球任意时区寻找最完美的开会时间。",
        topic_placeholder: "✨ 创建新会议名称或者输入会议编号...",
        meeting_id: "📋 会议编号：",
        meeting_id_desc: "分享此编号即可协同找时间",
        btn_share_id: "创建会议编号",
        btn_copy_invite_link: "复制邀请链接",
        btn_add_participant: "添加参与者",
        btn_add_my_time: "添加我的时间",
        btn_calc_best_time: "寻找最佳时间",
        best_time_title: "最佳重合时间",
        btn_auto_locate_title: "获取系统当前所在时区",
        btn_auto_locate: "自动(或手动选择)",
        results_placeholder: "点击 \"寻找最佳时间\" 查看结果。",
        timeline_title: "全局空闲时间日历分布",
        name_placeholder: "姓名 (例如：Alice)",
        toggle_details_title: "展开/收起详情",
        remove_participant_title: "移除参与者",
        timezone_label: "所属时区 (Timezone)",
        btn_auto_locate2_title: "获取设备定位的时区",
        btn_auto_locate2: "自动定位(或手动选择)",
        free_time_title: "空闲时间",
        btn_open_calendar: "在日历中拖动选择时间",
        to_label: "至",
        confirm_slot_title: "保存修改并重新折叠为徽章",
        remove_slot_title: "移除该时段",
        modal_title: "滑动拖拽选择空闲时间",
        btn_prev_week: "< 上一周",
        btn_next_week: "下一周 >",
        btn_clear_cal: "清空",
        btn_save_cal: "保存时间段",
        btn_clear_data: "清除会议数据",
        btn_confirm_save: "确认保存",
        
        // Dynamic Texts
        alert_only_creator_clear: "⚠️ 仅创建者可清除会议数据，请联系会议创建者操作。",
        confirm_clear_data: "确定要清除所有会议数据？此操作不可恢复。",
        toast_no_data: "暂无数据",
        toast_saving: "正在保存...",
        toast_saved: "已确定你的时间！",
        toast_save_failed: "保存失败",
        toast_network_error: "网络错误",
        alert_no_meeting_found: "找不到该 6 位通用会议编号！",
        alert_db_error: "网络或数据库连接失败。",
        alert_cloud_unavailable_link: "云端会议暂不可用，请让创建者直接发送邀请链接。",
        loading_cloud_meeting: "⌛ 加载云会议中...",
        toast_generating_id: "正在云端发号...",
        toast_id_copied: "编号已复制",
        toast_cloud_fail_fallback: "云失败, 备用本地码已复制",
        toast_local_link_copied: "邀请链接已复制",
        toast_locating: "定位中...",
        toast_located: "已定位",
        alert_enter_name_first: "⚠️ 请先输入会议名称后再创建链接！",
        participant_default: "参会者",
        creator_default: "创建者",
        
        common_timezones_group: "⭐ 常见受邀地区",
        other_timezones_group: "🌍 全球其他时区",
        fold_timezones: "⬆️ 收起其余 400+ 个全球时区...",
        load_timezones: "⬇️ 展开其余 400+ 个全球时区...",
        
        no_overlap_found: "未找到所有人均空闲的时段。",
        overlap_summary: "共重合",
        hour: "小时",
        minute: "分钟",
        anonymous: "匿名",
        from: "来自",
        overlap_period: "✅ 重叠时段",
        overlap_tooltip: "所有人均空闲的重叠时间",
        
        week_1: "一", week_2: "二", week_3: "三", week_4: "四", week_5: "五", week_6: "六", week_0: "日",
        day_prefix: "周",
        year: "年",
        month: "月",
        tz_cn: "中国大陆 (北京时间)", 
        tz_tw: "台湾 (台北时间)", 
        tz_us_east: "美国 - 美东 (纽约)", 
        tz_us_west: "美国 - 美西 (洛杉矶)", 
        tz_us_central: "美国 - 中部 (芝加哥)", 
        tz_ca_east: "加拿大 - 东部 (多伦多)", 
        tz_ca_west: "加拿大 - 西部 (温哥华)", 
        tz_uk: "欧洲 - 英国 (伦敦)", 
        tz_eu: "欧洲 - 中欧 (巴黎/柏林)",
        btn_avatar_title: "点击更换头像",
        meeting_id_label: "编号"
    },
    en: {
        page_title: "TimeAlign - Smart Global Scheduling",
        subtitle: "Find the perfect meeting time across any timezone globally.",
        topic_placeholder: "✨ Create meeting topic or enter ID...",
        meeting_id: "📋 Meeting ID:",
        meeting_id_desc: "Share this ID to schedule collaboratively",
        btn_share_id: "Create Meeting ID",
        btn_copy_invite_link: "Copy Invite Link",
        btn_add_participant: "Add Participant",
        btn_add_my_time: "Add My Time",
        btn_calc_best_time: "Find Best Time",
        best_time_title: "Best Overlap Time",
        btn_auto_locate_title: "Get local timezone",
        btn_auto_locate: "Auto (or manual)",
        results_placeholder: "Click \"Find Best Time\" to view results.",
        timeline_title: "Global Availability Timeline",
        name_placeholder: "Name (e.g. Alice)",
        toggle_details_title: "Toggle details",
        remove_participant_title: "Remove participant",
        timezone_label: "Timezone",
        btn_auto_locate2_title: "Get device timezone",
        btn_auto_locate2: "Locate (or manual)",
        free_time_title: "Available Time",
        btn_open_calendar: "Drag to select time on calendar",
        to_label: "To",
        confirm_slot_title: "Save and collapse to badge",
        remove_slot_title: "Remove this slot",
        modal_title: "Drag to Select Free Time",
        btn_prev_week: "< Prev Week",
        btn_next_week: "Next Week >",
        btn_clear_cal: "Clear",
        btn_save_cal: "Save Slots",
        btn_clear_data: "Clear Meeting Data",
        btn_confirm_save: "Confirm Save",
        
        // Dynamic Texts
        alert_only_creator_clear: "⚠️ Only the creator can clear meeting data.",
        confirm_clear_data: "Are you sure you want to clear all data? This cannot be undone.",
        toast_no_data: "No data",
        toast_saving: "Saving...",
        toast_saved: "Time Confirmed!",
        toast_save_failed: "Save Failed",
        toast_network_error: "Network Error",
        alert_no_meeting_found: "Cannot find this 6-digit meeting ID!",
        alert_db_error: "Network or database connection failed.",
        alert_cloud_unavailable_link: "Cloud meeting IDs are unavailable right now. Ask the creator for a direct invite link instead.",
        loading_cloud_meeting: "⌛ Loading cloud meeting...",
        toast_generating_id: "Generating ID...",
        toast_id_copied: "ID Copied",
        toast_cloud_fail_fallback: "Cloud failed, local fallback copied",
        toast_local_link_copied: "Invite link copied",
        toast_locating: "Locating...",
        toast_located: "Located",
        alert_enter_name_first: "⚠️ Please enter a meeting name before linking!",
        participant_default: "Participant",
        creator_default: "Creator",
        
        common_timezones_group: "⭐ Common Timezones",
        other_timezones_group: "🌍 Other Global Timezones",
        fold_timezones: "⬆️ Fold 400+ other timezones...",
        load_timezones: "⬇️ Load 400+ other timezones...",
        
        no_overlap_found: "No common available time found for everyone.",
        overlap_summary: "Overlap:",
        hour: "hrs",
        minute: "mins",
        anonymous: "Anonymous",
        from: "from",
        overlap_period: "✅ Overlap",
        overlap_tooltip: "Time when everyone is available",
        
        week_1: "Mon", week_2: "Tue", week_3: "Wed", week_4: "Thu", week_5: "Fri", week_6: "Sat", week_0: "Sun",
        day_prefix: "",
        year: "/",
        month: "", // Handled custom in calendar later
        tz_cn: "China (Beijing Time)", 
        tz_tw: "Taiwan (Taipei Time)", 
        tz_us_east: "US - East (New York)", 
        tz_us_west: "US - West (Los Angeles)", 
        tz_us_central: "US - Central (Chicago)", 
        tz_ca_east: "Canada - East (Toronto)", 
        tz_ca_west: "Canada - West (Vancouver)", 
        tz_uk: "Europe - UK (London)", 
        tz_eu: "Europe - Central (Paris/Berlin)",
        btn_avatar_title: "Click to change avatar",
        meeting_id_label: "ID"
    }
};

let currentLang = localStorage.getItem('timeAlignLang') || 'zh';

function t(key) {
    if (translations[currentLang] && translations[currentLang][key]) {
        return translations[currentLang][key];
    }
    // Fallback to key if not found
    return key;
}

function updateDOMTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.setAttribute('placeholder', t(key));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.setAttribute('title', t(key));
    });

    // Update buttons transparency to reflect active language
    const zhBtn = document.getElementById('lang-zh');
    const enBtn = document.getElementById('lang-en');
    if (zhBtn && enBtn) {
        if (currentLang === 'zh') {
            zhBtn.style.opacity = '1';
            enBtn.style.opacity = '0.5';
        } else {
            zhBtn.style.opacity = '0.5';
            enBtn.style.opacity = '1';
        }
    }
    
    // Refresh date specific elements if app is initialized
    if (typeof calculateBestTime === 'function') {
        calculateBestTime();
    }
    if (document.getElementById('calendar-modal') && !document.getElementById('calendar-modal').classList.contains('hidden')) {
        if (typeof renderCalendarGrid === 'function') renderCalendarGrid();
    }
    if (typeof updateShareButtonCloudMode === 'function') {
        updateShareButtonCloudMode();
    }
}

function setLanguage(lang) {
    if (lang === currentLang) return;
    currentLang = lang;
    localStorage.setItem('timeAlignLang', lang);
    updateDOMTranslations();
    
    // Refresh select inputs specifically
    document.querySelectorAll('.timezone-select').forEach(select => {
        const val = select.value;
        if (typeof populateTimezones === 'function') {
            const isFull = Array.from(select.options).some(o => o.value === 'FOLD_MORE');
            populateTimezones(select, val, isFull);
        }
    });

    // Refresh participant visual badges
    if (typeof activeSelections !== 'undefined' && typeof renderNiceBadges === 'function') {
        document.querySelectorAll('.participant-card').forEach(card => {
            const timeSlotsContainer = card.querySelector('.time-slots');
            const newSels = [];
            card.querySelectorAll('.time-slot').forEach(inpRow => {
                const d = inpRow.querySelector('.date-input').value;
                const s = inpRow.querySelector('.start-time').value;
                const en = inpRow.querySelector('.end-time').value;
                if (d && s && en) {
                    const startD = parseNaiveLocal(`${d}T${s}:00`);
                    let endD = parseNaiveLocal(`${d}T${en}:00`);
                    if (endD <= startD) endD = new Date(endD.getTime() + 24 * 60 * 60 * 1000);
                    newSels.push({ startLocal: startD, endLocal: endD });
                }
            });
            renderNiceBadges(timeSlotsContainer, newSels);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Basic hooks
    const zhBtn = document.getElementById('lang-zh');
    const enBtn = document.getElementById('lang-en');
    
    if (zhBtn) zhBtn.addEventListener('click', () => setLanguage('zh'));
    if (enBtn) enBtn.addEventListener('click', () => setLanguage('en'));

    // Initial Translation
    updateDOMTranslations();
});
