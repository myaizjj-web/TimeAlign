// calendar.js
// Handles Drag-to-Select Weekly Calendar UI

const HOUR_HEIGHT = 40; // px
let isDragging = false;
let dragStartCol = null;
let dragStartY = 0;
let currentTempBlock = null;

let currentParticipantCard = null;
let currentParticipantTz = null;
let weekStartDate = new Date();
weekStartDate.setHours(0,0,0,0);
const dayOffset = weekStartDate.getDay() === 0 ? 6 : weekStartDate.getDay() - 1;
weekStartDate.setDate(weekStartDate.getDate() - dayOffset);

// In-memory array of selected intervals for the currently open modal: 
// { startLocal: Date, endLocal: Date }
let activeSelections = [];

document.addEventListener('DOMContentLoaded', () => {
    initCalendarModal();
});

function initCalendarModal() {
    const modal = document.getElementById('calendar-modal');
    document.querySelector('.close-modal-btn').onclick = () => modal.classList.add('hidden');
    document.getElementById('cal-prev-week').onclick = () => shiftWeek(-1);
    document.getElementById('cal-next-week').onclick = () => shiftWeek(1);
    document.getElementById('cal-clear-btn').onclick = clearCalendar;
    document.getElementById('cal-save-btn').onclick = saveCalendarSlots;
    
    // Catch mouse up outside to cancel active drags smoothly
    document.addEventListener('mouseup', endDrag);
}

function openCalendar(participantCard) {
    currentParticipantCard = participantCard;
    currentParticipantTz = participantCard.querySelector('.timezone-select').value;
    
    // Parse existing slots from the UI into activeSelections
    activeSelections = [];
    const slots = participantCard.querySelectorAll('.time-slot');
    slots.forEach(slot => {
        const dateVal = slot.querySelector('.date-input').value;
        const startVal = slot.querySelector('.start-time').value;
        const endVal = slot.querySelector('.end-time').value;
        if(dateVal && startVal && endVal) {
            // Reconstruct naive local dates to represent their selection visually
            const startStr = `${dateVal}T${startVal}:00`;
            const endStr = `${dateVal}T${endVal}:00`;
            const startDate = parseNaiveLocal(startStr);
            let endDate = parseNaiveLocal(endStr);
            if (endDate <= startDate) {
                endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
            }
            activeSelections.push({ startLocal: startDate, endLocal: endDate });
        }
    });

    mergeSelections();
    renderCalendarGrid();
    document.getElementById('calendar-modal').classList.remove('hidden');
}

// Custom parser to map "2026-03-25T09:00:00" to a local JS date completely independent of actual timezone execution.
// This is strictly used for visualizing the UI calendar.
function parseNaiveLocal(isoString) {
    const [datePart, timePart] = isoString.split('T');
    const [y, m, d] = datePart.split('-');
    const [hh, min] = timePart.split(':');
    return new Date(y, m-1, d, hh, min, 0);
}
function formatNaiveLocal(dateObj) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const hh = String(dateObj.getHours()).padStart(2, '0');
    const min = String(dateObj.getMinutes()).padStart(2, '0');
    return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
}

function shiftWeek(dir) {
    weekStartDate.setDate(weekStartDate.getDate() + dir * 7);
    renderCalendarGrid();
}

function clearCalendar() {
    activeSelections = [];
    renderBlocks();
}

function renderCalendarGrid() {
    const monthH4 = document.getElementById('cal-current-month');
    const endOfWeek = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    if (weekStartDate.getMonth() === endOfWeek.getMonth()) {
        monthH4.textContent = `${weekStartDate.getFullYear()}年${weekStartDate.getMonth()+1}月`;
    } else {
        monthH4.textContent = `${weekStartDate.getMonth()+1}月 - ${endOfWeek.getMonth()+1}月`;
    }

    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    
    // Layout Wrappers
    const layout = document.createElement('div');
    layout.className = 'cal-layout';
    
    // Time Column
    const timeColArea = document.createElement('div');
    const timeColHeader = document.createElement('div');
    timeColHeader.className = 'cal-day-header';
    timeColHeader.style.visibility = 'hidden';
    timeColHeader.textContent = 'GMT';
    
    const timeColBody = document.createElement('div');
    timeColBody.className = 'cal-time-col';
    for(let h=0; h<24; h++) {
        const cell = document.createElement('div');
        cell.className = 'cal-time-cell';
        cell.innerHTML = `<span>${String(h).padStart(2,'0')}:00</span>`;
        timeColBody.appendChild(cell);
    }
    
    const timeWrap = document.createElement('div');
    timeWrap.appendChild(timeColHeader);
    timeWrap.appendChild(timeColBody);
    layout.appendChild(timeWrap);

    // Days Container
    const daysContainer = document.createElement('div');
    daysContainer.className = 'cal-days-container';
    
    const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
    
    for (let c = 0; c < 7; c++) {
        const currentD = new Date(weekStartDate.getTime() + c * 24 * 60 * 60 * 1000);
        
        const dayColWrap = document.createElement('div');
        dayColWrap.className = 'cal-day-col';
        dayColWrap.dataset.colIndex = c;
        dayColWrap.dataset.dateLabel = `${currentD.getFullYear()}-${String(currentD.getMonth()+1).padStart(2,'0')}-${String(currentD.getDate()).padStart(2,'0')}`;
        
        const header = document.createElement('div');
        header.className = 'cal-day-header';
        header.innerHTML = `周${weekDays[c]}<br><span style="font-weight:400; font-size:0.75rem; color:var(--text-muted)">${currentD.getMonth()+1}/${currentD.getDate()}</span>`;
        
        const gridArea = document.createElement('div');
        gridArea.className = 'cal-day-grid';
        
        // Draw 24 lines
        for(let h=0; h<24; h++) {
            const line = document.createElement('div');
            line.className = 'cal-hour-line';
            line.style.top = `${h * HOUR_HEIGHT}px`;
            gridArea.appendChild(line);
            
            const hLine = document.createElement('div');
            hLine.className = 'cal-half-hour-line';
            hLine.style.top = `${h * HOUR_HEIGHT + HOUR_HEIGHT/2}px`;
            gridArea.appendChild(hLine);
        }
        
        // Interaction listeners
        gridArea.addEventListener('mousedown', (e) => startDrag(e, dayColWrap));
        
        dayColWrap.appendChild(header);
        dayColWrap.appendChild(gridArea);
        daysContainer.appendChild(dayColWrap);
    }
    
    layout.appendChild(daysContainer);
    grid.appendChild(layout);
    
    renderBlocks();
}

let isMovingBlock = false;
let movingSelectionIndex = -1;
let movingOriginalStart = null;
let movingOriginalEnd = null;
let moveStartY = 0;
let moveStartX = 0;
let moveOriginalColIndex = 0;

let isResizingTop = false;
let isResizingBottom = false;
let resizingSelectionIndex = -1;
let resizeOriginalTime = null;
let resizeFixedTime = null;
let resizeStartY = 0;

function startDrag(e, dayColWrap) {
    const resizeTop = e.target.closest('.cal-resize-handle-top');
    const resizeBottom = e.target.closest('.cal-resize-handle-bottom');
    const confirmedBlock = e.target.closest('.cal-selection-block.confirmed');
    
    if (resizeTop) {
        isResizingTop = true;
        resizingSelectionIndex = parseInt(confirmedBlock.dataset.index);
        const sel = activeSelections[resizingSelectionIndex];
        resizeOriginalTime = new Date(sel.startLocal.getTime());
        resizeFixedTime = new Date(sel.endLocal.getTime());
        resizeStartY = e.clientY;
        
        document.addEventListener('mousemove', onGlobalMove);
        document.addEventListener('mouseup', onGlobalUp);
        return;
    }
    
    if (resizeBottom) {
        isResizingBottom = true;
        resizingSelectionIndex = parseInt(confirmedBlock.dataset.index);
        const sel = activeSelections[resizingSelectionIndex];
        resizeOriginalTime = new Date(sel.endLocal.getTime());
        resizeFixedTime = new Date(sel.startLocal.getTime());
        resizeStartY = e.clientY;
        
        document.addEventListener('mousemove', onGlobalMove);
        document.addEventListener('mouseup', onGlobalUp);
        return;
    }
    
    // If clicking an existing block (and not its remove btn), initiate move drag
    if (confirmedBlock && !e.target.closest('.cal-remove-btn')) {
        isMovingBlock = true;
        movingSelectionIndex = parseInt(confirmedBlock.dataset.index);
        const sel = activeSelections[movingSelectionIndex];
        movingOriginalStart = new Date(sel.startLocal.getTime());
        movingOriginalEnd = new Date(sel.endLocal.getTime());
        moveStartY = e.clientY;
        moveStartX = e.clientX;
        moveOriginalColIndex = parseInt(dayColWrap.dataset.colIndex);
        
        document.addEventListener('mousemove', onGlobalMove);
        document.addEventListener('mouseup', onGlobalUp);
        return;
    }
    
    if (confirmedBlock) return;
    
    // Original creation logic
    isDragging = true;
    dragStartCol = dayColWrap;
    const gridArea = dayColWrap.querySelector('.cal-day-grid');
    const rect = gridArea.getBoundingClientRect();
    
    const rawY = e.clientY - rect.top;
    const snapHeight = HOUR_HEIGHT / 4;
    dragStartY = Math.floor(rawY / snapHeight) * snapHeight;
    
    currentTempBlock = document.createElement('div');
    currentTempBlock.className = 'cal-selection-block';
    currentTempBlock.style.top = `${dragStartY}px`;
    currentTempBlock.style.height = `${snapHeight}px`;
    gridArea.appendChild(currentTempBlock);
    
    document.addEventListener('mousemove', onGlobalMove);
    document.addEventListener('mouseup', onGlobalUp);
}

function onGlobalMove(e) {
    if (isDragging) {
        onDrag(e, dragStartCol);
    } else if (isMovingBlock) {
        onMoveBlock(e);
    } else if (isResizingTop || isResizingBottom) {
        onResizeBlock(e);
    }
}

function onGlobalUp(e) {
    if (isDragging) {
        endDrag(e);
    } else if (isMovingBlock) {
        endMoveBlock(e);
    } else if (isResizingTop || isResizingBottom) {
        endResizeBlock(e);
    }
    document.removeEventListener('mousemove', onGlobalMove);
    document.removeEventListener('mouseup', onGlobalUp);
}

function onResizeBlock(e) {
    if (resizingSelectionIndex === -1) return;
    
    const deltaY = e.clientY - resizeStartY;
    const snapHeight = HOUR_HEIGHT / 4;
    const snappedDeltaY = Math.round(deltaY / snapHeight) * snapHeight;
    const deltaYMs = (snappedDeltaY / HOUR_HEIGHT) * 60 * 60 * 1000;
    
    const sel = activeSelections[resizingSelectionIndex];
    if (isResizingTop) {
        const newTime = new Date(resizeOriginalTime.getTime() + deltaYMs);
        if (newTime >= resizeFixedTime) {
            sel.startLocal = new Date(resizeFixedTime.getTime() - 15 * 60000);
        } else {
            sel.startLocal = newTime;
        }
    } else if (isResizingBottom) {
        const newTime = new Date(resizeOriginalTime.getTime() + deltaYMs);
        if (newTime <= resizeFixedTime) {
            sel.endLocal = new Date(resizeFixedTime.getTime() + 15 * 60000);
        } else {
            sel.endLocal = newTime;
        }
    }
    
    renderBlocks();
}

function endResizeBlock(e) {
    isResizingTop = false;
    isResizingBottom = false;
    resizingSelectionIndex = -1;
    syncToDOMAndSave();
}

function onMoveBlock(e) {
    if (!isMovingBlock || movingSelectionIndex === -1) return;
    
    // Y-axis translation (Time)
    const deltaY = e.clientY - moveStartY;
    const snapHeight = HOUR_HEIGHT / 4;
    const snappedDeltaY = Math.round(deltaY / snapHeight) * snapHeight;
    const deltaYMs = (snappedDeltaY / HOUR_HEIGHT) * 60 * 60 * 1000;
    
    // X-axis translation (Days)
    const container = document.querySelector('.cal-days-container');
    const colWidth = container.offsetWidth / 7;
    const deltaX = e.clientX - moveStartX;
    
    let deltaDays = Math.round(deltaX / colWidth);
    
    // Prevent dragging completely out of bounds (off the week view horizontally)
    let newColIndex = moveOriginalColIndex + deltaDays;
    if (newColIndex < 0) deltaDays = -moveOriginalColIndex;
    if (newColIndex > 6) deltaDays = 6 - moveOriginalColIndex;
    
    const deltaXMs = deltaDays * 24 * 60 * 60 * 1000;
    const totalDeltaMs = deltaYMs + deltaXMs;
    
    const sel = activeSelections[movingSelectionIndex];
    sel.startLocal = new Date(movingOriginalStart.getTime() + totalDeltaMs);
    sel.endLocal = new Date(movingOriginalEnd.getTime() + totalDeltaMs);
    
    renderBlocks();
}

function endMoveBlock(e) {
    if (!isMovingBlock) return;
    isMovingBlock = false;
    mergeSelections();
    renderBlocks();
    syncToDOMAndSave();
}

function onDrag(e, dayColWrap) {
    if (!isDragging || dragStartCol !== dayColWrap) return;
    
    const gridArea = dayColWrap.querySelector('.cal-day-grid');
    const rect = gridArea.getBoundingClientRect();
    const rawY = e.clientY - rect.top;
    
    const snapHeight = HOUR_HEIGHT / 4;
    const currentY = Math.max(0, Math.min(24 * HOUR_HEIGHT, Math.floor(rawY / snapHeight) * snapHeight));
    
    const topY = Math.min(dragStartY, currentY);
    const bottomY = Math.max(dragStartY + snapHeight, currentY);
    
    currentTempBlock.style.top = `${topY}px`;
    currentTempBlock.style.height = `${bottomY - topY}px`;
    
    updateBlockText(currentTempBlock, topY, bottomY);
}

function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    
    if (currentTempBlock && dragStartCol) {
        const topPx = parseFloat(currentTempBlock.style.top);
        const bottomPx = topPx + parseFloat(currentTempBlock.style.height);
        
        const dateStr = dragStartCol.dataset.dateLabel;
        const [y, m, d] = dateStr.split('-');
        
        const startHours = Math.floor(topPx / HOUR_HEIGHT);
        const startMins = Math.floor((topPx % HOUR_HEIGHT) * (60 / HOUR_HEIGHT));
        
        const endHours = Math.floor(bottomPx / HOUR_HEIGHT);
        const endMins = Math.floor((bottomPx % HOUR_HEIGHT) * (60 / HOUR_HEIGHT));
        
        const startD = new Date(y, m-1, d, startHours, startMins, 0);
        let endD = new Date(y, m-1, d, endHours, endMins, 0);
        
        if (bottomPx === 24 * HOUR_HEIGHT) {
            endD = new Date(y, m-1, parseInt(d)+1, 0, 0, 0);
        }
        
        activeSelections.push({ startLocal: startD, endLocal: endD });
        mergeSelections();
        
        currentTempBlock.remove();
        currentTempBlock = null;
        dragStartCol = null;
        
        renderBlocks();
        syncToDOMAndSave();
    }
}

function mergeSelections() {
    if (activeSelections.length === 0) return;
    
    activeSelections.sort((a,b) => a.startLocal - b.startLocal);
    
    const merged = [activeSelections[0]];
    for (let i = 1; i < activeSelections.length; i++) {
        const current = activeSelections[i];
        const lastMerged = merged[merged.length - 1];
        
        // If overlapping or directly touching
        if (current.startLocal <= lastMerged.endLocal) {
            lastMerged.endLocal = new Date(Math.max(lastMerged.endLocal, current.endLocal));
        } else {
            merged.push(current);
        }
    }
    
    activeSelections = merged;
}

function removeSelection(index) {
    activeSelections.splice(index, 1);
    renderBlocks();
    syncToDOMAndSave();
}

// Renders the verified blocks inside `activeSelections` onto the grid
function renderBlocks() {
    // Clear all existing confirmed blocks
    document.querySelectorAll('.cal-selection-block.confirmed').forEach(el => el.remove());
    
    const dayCols = document.querySelectorAll('.cal-day-col');
    if (dayCols.length === 0) return;
    
    const gridStartStr = dayCols[0].dataset.dateLabel;
    const [sy, sm, sd] = gridStartStr.split('-');
    const gridStartD = new Date(sy, sm-1, sd, 0, 0, 0);
    const gridEndD = new Date(gridStartD.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    activeSelections.forEach((sel, index) => {
        // Check if selection falls in the currently visible week window
        if (sel.endLocal <= gridStartD || sel.startLocal >= gridEndD) return;
        
        // To handle cross-day selections properly, we evaluate per day column
        dayCols.forEach((col, colIndex) => {
            const colDateStr = col.dataset.dateLabel;
            const [y, m, d] = colDateStr.split('-');
            const colDayStart = new Date(y, m-1, d, 0, 0, 0);
            const colDayEnd = new Date(y, m-1, parseInt(d)+1, 0, 0, 0);
            
            // Interaction overlap with this column
            const maxStart = new Date(Math.max(sel.startLocal, colDayStart));
            const minEnd = new Date(Math.min(sel.endLocal, colDayEnd));
            
            if (maxStart < minEnd) {
                // Compute pixels
                const startMins = maxStart.getHours() * 60 + maxStart.getMinutes();
                let endMins = minEnd.getHours() * 60 + minEnd.getMinutes();
                if (minEnd.getHours() === 0 && minEnd.getMinutes() === 0 && minEnd > maxStart) endMins = 24 * 60;
                
                const topPx = (startMins / 60) * HOUR_HEIGHT;
                const bottomPx = (endMins / 60) * HOUR_HEIGHT;
                
                const block = document.createElement('div');
                block.className = 'cal-selection-block confirmed';
                block.dataset.index = index;
                block.style.top = `${topPx}px`;
                block.style.height = `${bottomPx - topPx}px`;
                
                const handleTop = document.createElement('div');
                handleTop.className = 'cal-resize-handle-top';
                
                const handleBottom = document.createElement('div');
                handleBottom.className = 'cal-resize-handle-bottom';
                
                block.appendChild(handleTop);
                block.appendChild(handleBottom);
                
                updateBlockText(block, topPx, bottomPx);
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'cal-remove-btn';
                removeBtn.innerHTML = '&times;';
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    removeSelection(index);
                };
                block.appendChild(removeBtn);
                
                col.querySelector('.cal-day-grid').appendChild(block);
            }
        });
    });
}

function updateBlockText(block, topPx, bottomPx) {
    const sH = Math.floor(topPx / HOUR_HEIGHT);
    const sM = Math.floor((topPx % HOUR_HEIGHT) * (60 / HOUR_HEIGHT));
    let eH = Math.floor(bottomPx / HOUR_HEIGHT);
    const eM = Math.floor((bottomPx % HOUR_HEIGHT) * (60 / HOUR_HEIGHT));
    
    const timeStr = `${String(sH).padStart(2,'0')}:${String(sM).padStart(2,'0')} - ${String(eH).padStart(2,'0')}:${String(eM).padStart(2,'0')}`;
    let textDiv = block.querySelector('.cal-selection-text');
    if (!textDiv) {
        textDiv = document.createElement('div');
        textDiv.className = 'cal-selection-text';
        block.appendChild(textDiv);
    }
    textDiv.textContent = timeStr;
}

// Converts the absolute selections back into textual inputs for the Participant Card, keeping `app.js` architecture pristine.
function saveCalendarSlots() {
    if (!currentParticipantCard) return;
    
    const timeSlotsContainer = currentParticipantCard.querySelector('.time-slots');
    timeSlotsContainer.innerHTML = ''; // Wipe existing
    
    // Sort chronologically
    activeSelections.sort((a,b) => a.startLocal - b.startLocal);
    
    // Inject visual badges containing the logic inputs
    renderNiceBadges(timeSlotsContainer, activeSelections);
    
    document.getElementById('calendar-modal').classList.add('hidden');
    // Auto-recalc if applicable
    if(typeof calculateBestTime === 'function') setTimeout(calculateBestTime, 100);
    if(typeof saveData === 'function') saveData();
}

function syncToDOMAndSave() {
    if (!currentParticipantCard) return;
    const timeSlotsContainer = currentParticipantCard.querySelector('.time-slots');
    mergeSelections();
    renderNiceBadges(timeSlotsContainer, activeSelections);
    if (typeof saveData === 'function') saveData();
    if (typeof calculateBestTime === 'function') setTimeout(calculateBestTime, 100);
}

function eTimeCheck(d) {
    return d.getHours() === 0 && d.getMinutes() === 0;
}

function renderNiceBadges(container, selections) {
    container.innerHTML = '';
    selections.forEach((sel, i) => {
        const s = formatNaiveLocal(sel.startLocal);
        
        // Check if end is 00:00 midnight of NEXT day
        let eTimeValue = '23:59'; 
        let eDateValue = s.date;
        if (sel.endLocal.getHours() === 0 && sel.endLocal.getMinutes() === 0) {
            const temp = new Date(sel.endLocal.getTime() - 1000);
            eDateValue = formatNaiveLocal(temp).date;
            eTimeValue = '23:59';
        } else {
            const e = formatNaiveLocal(sel.endLocal);
            eDateValue = e.date;
            eTimeValue = e.time;
        }

        const template = document.getElementById('slot-template');
        const clone = template.content.cloneNode(true);
        const slotObj = clone.querySelector('.time-slot');
        slotObj.style.display = 'none'; // hide inputs initially
        
        clone.querySelector('.date-input').value = s.date;
        clone.querySelector('.start-time').value = s.time;
        clone.querySelector('.end-time').value = eTimeValue;
        
        // Ensure manual edits propagate when revealed
        slotObj.querySelectorAll('input').forEach(inp => {
            inp.addEventListener('change', () => {
                if (typeof saveData === 'function') saveData();
                if (typeof calculateBestTime === 'function') setTimeout(calculateBestTime, 100);
            });
        });
        
        const confirmBtn = clone.querySelector('.confirm-slot-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', (e) => {
                if (typeof saveData === 'function') saveData();
                
                const card = e.target.closest('.participant-card');
                if (card) {
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
                    const containerWrapper = card.querySelector('.time-slots');
                    renderNiceBadges(containerWrapper, newSels);
                    if (typeof calculateBestTime === 'function') calculateBestTime();
                }
            });
        }
        
        const removeBtn = clone.querySelector('.remove-slot-btn');
        removeBtn.addEventListener('click', (e) => {
            const row = e.target.closest('.time-slot');
            if (row.nextElementSibling && row.nextElementSibling.classList.contains('badge-view')) {
                row.nextElementSibling.remove();
            }
            row.remove();
            if (typeof saveData === 'function') saveData();
            if (typeof calculateBestTime === 'function') setTimeout(calculateBestTime, 100);
        });

        container.appendChild(clone);
        
        // Visual Badge
        const badge = document.createElement('div');
        badge.className = 'badge-view';
        badge.style = "background: rgba(129, 140, 248, 0.2); border: 1px solid rgba(129, 140, 248, 0.5); border-radius: 4px; padding: 4px 8px; margin-bottom: 6px; font-size: 0.8rem; color: var(--text-main); display: flex; justify-content: space-between; align-items: center;";
        
        let title = `${s.date.substring(5)} ${s.time} - `;
        if (s.date !== eDateValue) title += `${eDateValue.substring(5)} `;
        title += eTimeValue;
        
        const textSpan = document.createElement('div');
        textSpan.innerHTML = `<span class="icon" style="margin-right:4px">📅</span> ${title}`;
        
        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.gap = '10px';
        
        const isReadonly = container.closest('.participant-card')?.classList.contains('readonly-card');
        if (isReadonly) {
            controls.style.display = 'none';
        }
        
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '✏️';
        editBtn.style = "background:transparent; border:none; cursor:pointer; font-size:14px; filter: grayscale(100%) brightness(200%); outline:none;";
        editBtn.title = "原位编辑时间";
        editBtn.addEventListener('click', () => {
            badge.style.display = 'none';
            badge.previousElementSibling.style.display = 'flex'; // reveal native inputs
        });
        
        const delBtn = document.createElement('button');
        delBtn.innerHTML = '❌';
        delBtn.style = "background:transparent; border:none; cursor:pointer; font-size:12px; filter: grayscale(100%) brightness(200%); outline:none;";
        delBtn.title = "移除该时段";
        delBtn.addEventListener('click', () => {
            badge.previousElementSibling.remove(); // remove hidden input row
            badge.remove(); // remove self
            if (typeof saveData === 'function') saveData();
            if (typeof calculateBestTime === 'function') setTimeout(calculateBestTime, 100);
        });
        
        controls.appendChild(editBtn);
        controls.appendChild(delBtn);
        
        badge.appendChild(textSpan);
        badge.appendChild(controls);
        
        container.appendChild(badge);
    });
}
