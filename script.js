const CLOUD_NAME = "pgoqyqng"; 
const UPLOAD_PRESET = "galeri_tkj1"; 
const JSONBIN_KEY = "$2a$10$3CJVDGBgRrLwZwWvRctjFObp8Wm2DxxwtSrftfyKr3QYKy4brksX6"; // <--- GANTI INI
const JSONBIN_BIN_ID = "6aeecd51ffd5d16053ae483d"; 
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

let appState = { 
    photos: [], 
    votes: { 'Farhan': 0, 'Teman 1': 0, 'Teman 2': 0, 'Teman 3': 0 }, 
    guestbook: [], 
    currentFilter: 'all', searchQuery: '' 
};

async function loadState() { try { const res = await fetch(JSONBIN_URL, { headers: { 'X-Master-Key': JSONBIN_KEY } }); const data = await res.json(); if(data.record && data.record.photos) { appState = data.record; refreshAll(); } } catch(e) { console.log("Load failed."); } }
async function saveState() { try { await fetch(JSONBIN_URL, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_KEY }, body: JSON.stringify(appState) }); } catch(e) { console.log("Save failed."); } }
function refreshAll() { renderGallery(); renderStack(); renderVoting(); renderMessages(); }

document.addEventListener('mousemove', (e) => { const x = (e.clientX / window.innerWidth - 0.5) * 50; const y = (e.clientY / window.innerHeight - 0.5) * 50; document.getElementById('blob1').style.transform = `translate(${x}px, ${y}px)`; document.getElementById('blob2').style.transform = `translate(${-x}px, ${-y}px)`; document.getElementById('blob3').style.transform = `translate(${x*1.5}px, ${y*1.5}px)`; });

let themeIndex = 0; const themes = [{p:'#a78bfa',s:'#60a5fa',t:'#f472b6'}, {p:'#f472b6',s:'#fbbf24',t:'#f87171'}, {p:'#2dd4bf',s:'#3b82f6',t:'#8b5cf6'}];
function changeTheme() { themeIndex = (themeIndex + 1) % themes.length; const t = themes[themeIndex]; document.documentElement.style.setProperty('--primary', t.p); document.documentElement.style.setProperty('--secondary', t.s); document.documentElement.style.setProperty('--tertiary', t.t); }

function renderGallery() {
    const grid = document.getElementById('galleryGrid'); grid.innerHTML = '';
    const filtered = appState.photos.filter(p => (appState.currentFilter === 'all' || p.album === appState.currentFilter) && p.title.toLowerCase().includes(appState.searchQuery.toLowerCase()));
    if(filtered.length === 0) { grid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10">Belum ada media. Klik Upload!</div>'; return; }
    filtered.forEach(p => {
        const div = document.createElement('div'); div.className = 'liquid-glass card-3d rounded-xl overflow-hidden relative h-40 md:h-64 cursor-pointer';
        
        let mediaTag = '';
        if (p.type === 'video') mediaTag = `<video src="${p.url}" class="w-full h-full object-cover pointer-events-none"></video>`;
        else mediaTag = `<img src="${p.url}" class="w-full h-full object-cover">`;

        div.innerHTML = `${mediaTag}<div class="absolute bottom-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent"><p class="text-xs font-bold text-white">${p.title}</p></div>`;
        div.addEventListener('mousemove', (e) => { const r = div.getBoundingClientRect(); div.style.transform = `rotateX(${((e.clientY-r.top)/r.height - 0.5)*-20}deg) rotateY(${((e.clientX-r.left)/r.width - 0.5)*20}deg) scale(1.05)`; });
        div.addEventListener('mouseleave', () => { div.style.transform = `rotateX(0) rotateY(0) scale(1)`; });
        grid.appendChild(div);
    });
}
function searchPhotos() { appState.searchQuery = document.getElementById('searchInput').value; renderGallery(); }
function filterAlbum(album) { appState.currentFilter = album; document.querySelectorAll('.album-tab').forEach(b => b.classList.remove('tab-active')); event.target.classList.add('tab-active'); renderGallery(); }

let stackCards = [];
function renderStack() {
    const stack = document.getElementById('cardStack'); stack.innerHTML = ''; stackCards = [...appState.photos].reverse();
    if(stackCards.length === 0) { stack.innerHTML = '<div class="text-center text-gray-500 mt-20">Belum ada kartu.</div>'; return; }
    stackCards.forEach((p, index) => {
        if (index > 2) return;
        const card = document.createElement('div'); card.className = `swipe-card liquid-glass rounded-xl overflow-hidden flex flex-col items-center justify-end pb-4`;
        card.style.zIndex = 10 - index; card.style.transform = `scale(${1 - index * 0.05}) translateY(${index * 10}px)`;
        
        let mediaTag = '';
        if (p.type === 'video') mediaTag = `<video src="${p.url}" class="absolute inset-0 w-full h-full object-cover pointer-events-none"></video>`;
        else mediaTag = `<img src="${p.url}" class="absolute inset-0 w-full h-full object-cover pointer-events-none">`;

        card.innerHTML = `${mediaTag}<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div><h4 class="relative z-10 font-bold text-lg text-white">${p.title}</h4>`;
        if (index === 0) {
            const hammer = new Hammer(card);
            hammer.on('pan', (e) => { card.style.transform = `translate(${e.deltaX}px, ${e.deltaY}px) rotate(${e.deltaX * 0.1}deg)`; });
            hammer.on('panend', (e) => { if (e.deltaX > 100) { card.classList.add('swiped-right'); setTimeout(() => { stackCards.shift(); renderStack(); }, 300); } else if (e.deltaX < -100) { card.classList.add('swiped-left'); setTimeout(() => { stackCards.shift(); renderStack(); }, 300); } else { card.style.transform = `scale(1) translateY(0)`; } });
        }
        stack.appendChild(card);
    });
}

let currentPhotoId = null; let currentZoom = 1;
function openLightbox(id) { 
    currentPhotoId = id; 
    const p = appState.photos.find(x => x.id === id); if(!p) return; 
    document.getElementById('lightbox').classList.remove('hidden'); 
    const mediaDiv = document.getElementById('lightboxMedia');
    
    if (p.type === 'video') {
        mediaDiv.innerHTML = `<video src="${p.url}" controls autoplay class="w-full h-full object-contain"></video>`;
    } else {
        mediaDiv.innerHTML = `<img id="lightboxImage" src="${p.url}" class="w-full h-full object-contain transition-transform duration-300">`;
        currentZoom = 1; 
        document.getElementById('lightboxImage').style.transform = `scale(1)`; 
    }
    
    for(let r of ['❤️', '😂', '🔥']) { document.getElementById(`count-${r}`).innerText = p.reactions[r] || 0; } 
    renderComments(); 
}
function closeLightbox() { document.getElementById('lightbox').classList.add('hidden'); document.getElementById('lightboxMedia').innerHTML = ''; }
function triggerDoubleTapLike() { const p = appState.photos.find(x => x.id === currentPhotoId); if(!p || p.type === 'video') return; p.reactions['❤️'] = (p.reactions['❤️'] || 0) + 1; document.getElementById('count-❤️').innerText = p.reactions['❤️']; const overlay = document.getElementById('likeOverlay'); overlay.innerHTML = '<div class="heart-burst">❤️</div>'; setTimeout(() => overlay.innerHTML = '', 800); saveState(); }
function addReaction(emoji) { const p = appState.photos.find(x => x.id === currentPhotoId); p.reactions[emoji] = (p.reactions[emoji] || 0) + 1; document.getElementById(`count-${emoji}`).innerText = p.reactions[emoji]; const overlay = document.getElementById('likeOverlay'); const el = document.createElement('div'); el.className = 'floating-emoji'; el.innerText = emoji; el.style.left = Math.random() * 80 + 10 + '%'; el.style.bottom = '10%'; overlay.appendChild(el); setTimeout(() => el.remove(), 1000); saveState(); }
function downloadImage() { const p = appState.photos.find(x => x.id === currentPhotoId); const a = document.createElement('a'); a.href = p.url; a.download = p.type === 'video' ? 'TKJ1_Video.mp4' : 'TKJ1_Memory.jpg'; a.target = '_blank'; a.click(); }

function deletePhoto(id) {
    if(!confirm("Yakin mau hapus media ini?")) return;
    appState.photos = appState.photos.filter(p => p.id !== id);
    saveState(); closeLightbox(); refreshAll();
}

function renderComments() { const p = appState.photos.find(x => x.id === currentPhotoId); const list = document.getElementById('commentsList'); list.innerHTML = ''; (p.comments || []).forEach((c, i) => { list.innerHTML += `<div class="flex justify-between items-center bg-white/5 p-2 rounded"><div><b>${c.name}:</b> ${c.text}</div><div class="flex gap-2 text-xs"><button onclick="likeComment(${i})">❤️ ${c.likes || 0}</button><button onclick="deleteComment(${i})" class="text-red-400">Hapus</button></div></div>`; }); }
function addComment() { const name = document.getElementById('commentName').value || 'Anonim'; const text = document.getElementById('commentText').value; if(!text) return; const p = appState.photos.find(x => x.id === currentPhotoId); p.comments = p.comments || []; p.comments.push({ name, text, likes: 0 }); document.getElementById('commentText').value = ''; document.getElementById('tagSuggestions').classList.add('hidden'); renderComments(); saveState(); }
function likeComment(index) { const p = appState.photos.find(x => x.id === currentPhotoId); p.comments[index].likes = (p.comments[index].likes || 0) + 1; renderComments(); saveState(); }
function deleteComment(index) { const p = appState.photos.find(x => x.id === currentPhotoId); p.comments.splice(index, 1); renderComments(); saveState(); }
function handleTag(input) { const val = input.value; const sugg = document.getElementById('tagSuggestions'); if (val.endsWith('@')) { sugg.classList.remove('hidden'); sugg.innerHTML = ''; ['Farhan', 'Teman 1', 'Teman 2', 'Teman 3'].forEach(name => { sugg.innerHTML += `<div class="p-2 hover:bg-white/20 cursor-pointer" onclick="insertTag('${name}')">@${name}</div>`; }); } else if (!val.includes('@')) { sugg.classList.add('hidden'); } }
function insertTag(name) { const input = document.getElementById('commentText'); input.value = input.value.replace(/@$/, `@${name} `); document.getElementById('tagSuggestions').classList.add('hidden'); input.focus(); }

let cropper = null; let uploadedImageBase64 = null;
function openUpload() { document.getElementById('uploadModal').classList.remove('hidden'); }
function closeUpload() { document.getElementById('uploadModal').classList.add('hidden'); }
function previewFile(event) { const file = event.target.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = (e) => { uploadedImageBase64 = e.target.result; document.getElementById('previewImg').src = uploadedImageBase64; document.getElementById('previewImg').classList.remove('hidden'); document.getElementById('btnProceed').classList.remove('hidden'); }; reader.readAsDataURL(file); }
function proceedToCrop() { document.getElementById('dropZone').classList.add('hidden'); document.getElementById('btnProceed').classList.add('hidden'); document.getElementById('cropperArea').classList.remove('hidden'); document.getElementById('editTools').classList.remove('hidden'); document.getElementById('btnSave').classList.remove('hidden'); const image = document.getElementById('imageToCrop'); image.src = uploadedImageBase64; if(cropper) cropper.destroy(); cropper = new Cropper(image, { aspectRatio: 1, viewMode: 1 }); }

async function saveUpload() {
    if(!cropper) return; const btn = document.getElementById('btnSave'); btn.innerText = "Mengunggah..."; btn.disabled = true;
    try {
        const canvas = cropper.getCroppedCanvas({ width: 800, height: 800 }); const filter = document.getElementById('filterSelect').value; const ctx = canvas.getContext('2d');
        if(filter !== 'none') { if(filter === 'grayscale') ctx.filter = 'grayscale(100%)'; if(filter === 'sepia') ctx.filter = 'sepia(100%)'; if(filter === 'brightness(1.2)') ctx.filter = 'brightness(120%)'; ctx.drawImage(canvas, 0, 0); }
        const stickerText = document.getElementById('stickerInput').value; if(stickerText) { ctx.filter = 'none'; ctx.font = 'bold 30px sans-serif'; ctx.fillStyle = 'white'; ctx.strokeStyle = 'black'; ctx.lineWidth = 3; ctx.textAlign = 'center'; ctx.strokeText(stickerText, canvas.width/2, canvas.height - 30); ctx.fillText(stickerText, canvas.width/2, canvas.height - 30); }
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8)); const formData = new FormData(); formData.append('file', blob); formData.append('upload_preset', UPLOAD_PRESET);
        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, { method: 'POST', body: formData }); const cloudData = await cloudRes.json();
        if(cloudData.secure_url) { appState.photos.unshift({ id: Date.now(), url: cloudData.secure_url, type: cloudData.resource_type, title: cloudData.resource_type === 'video' ? 'Video Baru' : 'Foto Baru', album: 'all', reactions: { '❤️': 0, '😂': 0, '🔥': 0 }, comments: [] }); await saveState(); alert("Media berhasil diupload!"); closeUpload(); refreshAll(); } else { alert("Gagal upload."); }
    } catch (error) { console.error(error); alert("Terjadi kesalahan."); } finally { btn.innerText = "Simpan ke Galeri"; btn.disabled = false; }
}

function rollRandomMemory() {
    if(appState.photos.length === 0) return alert("Galeri masih kosong, upload media dulu!");
    const overlay = document.createElement('div'); overlay.className = 'fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center'; overlay.innerHTML = '<h2 class="text-3xl font-bold mb-8 text-white">Mengacak...</h2><div id="slotImg" class="w-64 h-64 liquid-glass rounded-xl flex items-center justify-center text-5xl">❓</div>'; document.body.appendChild(overlay);
    let count = 0; const interval = setInterval(() => { const randomPhoto = appState.photos[Math.floor(Math.random() * appState.photos.length)]; document.getElementById('slotImg').innerHTML = `<img src="${randomPhoto.url}" class="w-full h-full object-cover rounded-xl">`; count++; if(count > 15) { clearInterval(interval); confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); setTimeout(() => { overlay.remove(); openLightbox(randomPhoto.id); }, 500); } }, 100);
}

function renderVoting() {
    const container = document.getElementById('votingContainer'); container.innerHTML = ''; const total = Object.values(appState.votes).reduce((a,b) => a+b, 0);
    for(let [name, count] of Object.entries(appState.votes)) { const pct = total === 0 ? 0 : (count/total)*100; container.innerHTML += `<div class="mb-2"><div class="flex justify-between text-sm mb-1"><span>${name}</span><span>${count} vote</span></div><div class="w-full bg-white/10 rounded-full h-4 overflow-hidden cursor-pointer" onclick="vote('${name}')"><div class="bg-[var(--primary)] h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div></div></div>`; }
}
function vote(name) {
    let previousVote = localStorage.getItem('votedFor');
    if (previousVote === name) { alert(`Kamu sudah vote ${name}!`); return; }
    if (previousVote && appState.votes[previousVote] > 0) { appState.votes[previousVote]--; }
    appState.votes[name]++;
    localStorage.setItem('votedFor', name);
    saveState(); renderVoting(); confetti({ particleCount: 30, origin: { y: 0.8 } });
}

function renderMessages() {
    const list = document.getElementById('messagesList');
    list.innerHTML = '';
    if(appState.guestbook.length === 0) { list.innerHTML = '<div class="text-center text-gray-500 mt-10">Belum ada pesan. Jadilah yang pertama!</div>'; return; }
    appState.guestbook.forEach((msg, i) => {
        list.innerHTML += `
            <div class="bg-white/5 p-3 rounded-xl border border-white/10 relative group">
                <b class="text-[var(--primary)] text-sm">${msg.name}</b>
                <p class="text-sm text-gray-200 mt-1">${msg.text}</p>
                <button onclick="deleteMessage(${i})" class="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition text-xs">Hapus</button>
            </div>
        `;
    });
    list.scrollTop = list.scrollHeight;
}
function addMessage() {
    const name = document.getElementById('msgName').value || 'Anonim';
    const text = document.getElementById('msgText').value;
    if(!text) return;
    appState.guestbook.push({ name, text });
    document.getElementById('msgText').value = '';
    saveState(); renderMessages();
}
function deleteMessage(index) {
    if(confirm("Hapus pesan ini?")) { appState.guestbook.splice(index, 1); saveState(); renderMessages(); }
}

let isPlaying = false;
function playMusic(e) {
    const audio = document.getElementById('bgMusic');
    if(isPlaying) audio.pause(); else audio.play();
    isPlaying = !isPlaying;
    if(e) e.target.innerText = isPlaying ? '⏸️' : '🎵';
}

loadState(); renderGallery(); renderStack(); renderVoting(); renderMessages();
