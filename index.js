(function() {
    // 0. 防重疊機制：如果已經存在，先移除舊 DOM
    const existingOverlay = document.getElementById('seed-overlay');
    if (existingOverlay) existingOverlay.remove();
    const existingBtn = document.getElementById('music-control-btn');
    if (existingBtn) existingBtn.remove();
    const existingUI = document.getElementById('playlist-window');
    if (existingUI) existingUI.remove();
    const existingPlayer = document.getElementById('youtube-player');
    if (existingPlayer) existingPlayer.remove();

    const tracks = [
        { name: "Library of Ruina - String Theocracy", id: "nOj_A3aZxGs" },
        { name: "Library of Ruina - Theme02", id: "On4Hk6b1KsY" },
        { name: "Malkuth Story", id: "LhoSpUKQEbU" },
        { name: "The Blue Reverberation", id: "uXw1f0porfg" },
        { name: "Malkuth Battle 3", id: "aeIXVi6iXFI" },
        { name: "Tiphereth Battle 3", id: "M5JelTHJ-eA" },
        { name: "Chesed Battle 3", id: "4AJR475AcgQ" },
        { name: "Lobotomy OST - Neutral04", id: "PRUrlZFty3A" }
    ];

    let player;
    let currentTrackIndex = 0;
    let targetVolume = 50;

    // 1. 蔚藍檔案 (Blue Archive / SCHALE) 科技風格 CSS
    const style = document.createElement('style');
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;800&family=Noto+Sans+TC:wght@400;700&display=swap');

        /* --- 開場光環與夏萊系統啟動動畫 --- */
        #seed-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #090e17; z-index: 20000;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            overflow: hidden;
            transition: opacity 1.2s ease-in-out;
            font-family: 'Exo 2', 'Noto Sans TC', sans-serif;
        }

        #seed-container {
            position: relative;
            width: 110px; height: 110px;
            display: flex; align-items: center; justify-content: center;
            z-index: 20001;
            cursor: pointer;
            transition: transform 1.2s cubic-bezier(0.25, 1, 0.5, 1);
        }

        /* 蔚藍檔案 Halo 光環造型 */
        .seed-of-light {
            width: 90px; height: 90px;
            border-radius: 50%;
            border: 3px solid #00f0ff;
            box-shadow: 0 0 25px #00f0ff, inset 0 0 15px #00f0ff;
            position: relative;
            animation: halo-rotate 6s linear infinite;
        }

        .seed-of-light::before {
            content: ''; position: absolute; top: -8px; left: 50%; transform: translateX(-50%);
            width: 16px; height: 16px; background: #fff200; border-radius: 50%;
            box-shadow: 0 0 12px #fff200;
        }

        .seed-of-light::after {
            content: ''; position: absolute; inset: -12px;
            border-radius: 50%; border: 1px dashed rgba(0, 240, 255, 0.6);
            animation: halo-rotate-reverse 10s linear infinite;
        }

        @keyframes halo-rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes halo-rotate-reverse { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }

        #seed-container.grow { transform: scale(35); }
        #seed-overlay.fade-out { opacity: 0; pointer-events: none; }

        .seed-text {
            margin-top: 35px;
            color: #00f0ff; font-size: 14px; font-weight: 800;
            letter-spacing: 6px; text-transform: uppercase;
            text-shadow: 0 0 12px rgba(0, 240, 255, 0.8);
            animation: ba-text-pulse 2s infinite ease-in-out;
            pointer-events: none;
        }

        @keyframes ba-text-pulse {
            0%, 100% { opacity: 0.4; } 50% { opacity: 1; }
        }

        body.focus-in { animation: web-focus 2.5s ease-out forwards; }
        @keyframes web-focus {
            0% { filter: blur(15px) brightness(1.8); }
            100% { filter: blur(0px) brightness(1); }
        }

        /* --- 蔚藍檔案風格 斜角科技按鈕 --- */
        #music-control-btn { 
            position: fixed; bottom: 35px; right: 35px; 
            width: 48px; height: 48px; 
            background: rgba(10, 20, 35, 0.85); 
            border: 2px solid #00f0ff; 
            backdrop-filter: blur(10px);
            clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
            display: flex; align-items: center; justify-content: center; 
            cursor: pointer; z-index: 9999; 
            box-shadow: 0 0 15px rgba(0, 240, 255, 0.3); 
            transition: all 0.3s ease;
            outline: none;
        }

        .btn-icon-wrapper {
            display: flex; align-items: center; justify-content: center;
            width: 100%; height: 100%;
        }

        #music-control-btn svg {
            width: 20px; height: 20px;
            fill: #00f0ff;
            filter: drop-shadow(0 0 5px rgba(0, 240, 255, 0.8));
        }

        #music-control-btn:hover {
            background: #00f0ff;
            box-shadow: 0 0 25px rgba(0, 240, 255, 0.8);
        }
        #music-control-btn:hover svg { fill: #090e17; }

        #music-control-btn.playing { animation: ba-pulse 2s infinite ease-in-out; }
        @keyframes ba-pulse {
            0%, 100% { box-shadow: 0 0 10px rgba(0, 240, 255, 0.4); }
            50% { box-shadow: 0 0 25px rgba(0, 240, 255, 0.9); }
        }

        /* --- UI 播放控制器 (夏萊 Terminal 風格) --- */
        .music-note { 
            position: fixed; bottom: 95px; right: 35px; 
            background: rgba(9, 15, 26, 0.92); 
            border: 1px solid rgba(0, 240, 255, 0.5);
            border-left: 4px solid #00f0ff; 
            padding: 10px 18px; 
            backdrop-filter: blur(12px);
            color: #fff; font-size: 13px; z-index: 9999; 
            transform: translateX(180%); transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); 
            pointer-events: none; font-family: 'Exo 2', 'Noto Sans TC', sans-serif; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.8);
            max-width: 280px; overflow: hidden;
            clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
        }
        .music-note.show { transform: translateX(0); }
        .music-note small { color: #00f0ff; letter-spacing: 2px; font-size: 0.65rem; text-transform: uppercase; font-weight: 700; }
        .music-note b { display: block; margin-top: 2px; font-weight: 600; letter-spacing: 0.5px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        #playlist-window { 
            position: fixed; bottom: 95px; right: 35px; width: 350px; 
            background: rgba(9, 15, 26, 0.94); 
            border: 1px solid #00f0ff;
            backdrop-filter: blur(15px);
            display: none; flex-direction: column; z-index: 9998; 
            font-family: 'Exo 2', 'Noto Sans TC', sans-serif; 
            box-shadow: 0 15px 40px rgba(0, 240, 255, 0.2);
            clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
        }
        #playlist-window.open { display: flex; animation: baFadeIn 0.25s ease-out; }
        
        .playlist-header {
            padding: 12px 16px;
            background: linear-gradient(90deg, rgba(0, 240, 255, 0.15) 0%, transparent 100%);
            border-bottom: 1px solid rgba(0, 240, 255, 0.3);
            font-size: 0.75rem;
            font-weight: 800;
            letter-spacing: 2px;
            color: #00f0ff;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        #playlist-content {
            max-height: 260px;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #00f0ff rgba(9, 15, 26, 0.9);
        }

        #playlist-content::-webkit-scrollbar { width: 4px; }
        #playlist-content::-webkit-scrollbar-track { background: rgba(9, 15, 26, 0.9); }
        #playlist-content::-webkit-scrollbar-thumb { background: #00f0ff; }

        .track-item { 
            padding: 10px 16px; cursor: pointer; color: #a3b8cc; font-size: 12px; 
            border-bottom: 1px solid rgba(0, 240, 255, 0.08); 
            transition: all 0.2s ease;
            display: flex; align-items: center; justify-content: space-between;
        }
        .track-item:hover { color: #fff; background: rgba(0, 240, 255, 0.12); }
        .track-item.active { 
            color: #00f0ff; background: rgba(0, 240, 255, 0.2); 
            font-weight: bold; border-left: 3px solid #00f0ff;
            text-shadow: 0 0 8px rgba(0, 240, 255, 0.6);
        }

        /* --- 無縫接軌滾動容器 --- */
        .track-name-wrapper {
            overflow: hidden;
            white-space: nowrap;
            width: 230px;
            position: relative;
            mask-image: linear-gradient(90deg, transparent 0%, #000 4%, #000 96%, transparent 100%);
            -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 4%, #000 96%, transparent 100%);
        }

        .track-name-scroll {
            display: inline-flex;
            gap: 24px;
            white-space: nowrap;
            will-change: transform;
        }

        .track-name-text {
            display: inline-block;
            white-space: nowrap;
        }

        .track-item:hover .track-name-scroll,
        .track-item.active .track-name-scroll {
            animation: marquee-seamless 7s linear infinite;
        }

        @keyframes marquee-seamless {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-50% - 12px)); }
        }

        .remove-track-btn {
            color: rgba(255, 255, 255, 0.4);
            font-size: 12px;
            padding: 2px 6px;
            margin-left: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .remove-track-btn:hover {
            color: #ff3366;
            text-shadow: 0 0 8px rgba(255, 51, 102, 0.8);
        }

        .playlist-input-box {
            padding: 10px 12px;
            border-top: 1px solid rgba(0, 240, 255, 0.3);
            display: flex;
            gap: 8px;
            background: rgba(5, 10, 18, 0.9);
        }

        .playlist-input-box input {
            flex: 1;
            background: rgba(15, 25, 40, 0.8);
            border: 1px solid rgba(0, 240, 255, 0.4);
            color: #00f0ff;
            padding: 6px 10px;
            font-size: 11px;
            outline: none;
            font-family: inherit;
            transition: all 0.3s;
        }
        .playlist-input-box input:focus { border-color: #00f0ff; box-shadow: 0 0 8px rgba(0, 240, 255, 0.4); }
        .playlist-input-box input.invalid {
            border-color: #ff3366 !important;
            color: #ff3366 !important;
        }

        .playlist-input-box button {
            background: #00f0ff;
            border: none;
            color: #090e17;
            font-weight: 800;
            padding: 6px 14px;
            font-size: 11px;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.3s;
            white-space: nowrap;
            clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
        }
        .playlist-input-box button:hover {
            background: #fff;
            color: #00f0ff;
            box-shadow: 0 0 12px rgba(255, 255, 255, 0.8);
        }
        
        @keyframes baFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);

    // 2. 建立 DOM 結構
    const container = document.createElement('div');
    container.innerHTML = `
        <div id="seed-overlay">
            <div id="seed-container">
                <div class="seed-of-light"></div>
            </div>
            <div class="seed-text">SCHALE DATABASE // ACCESS GRANTED</div>
        </div>
        <div id="music-notification" class="music-note"></div>
        <button id="music-control-btn" title="SCHALE Audio Archive" aria-label="Toggle Playlist">
            <div class="btn-icon-wrapper">
                <svg viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
            </div>
        </button>
        <div id="playlist-window">
            <div class="playlist-header">
                <span>SCHALE ARCHIVE // MUSIC PLAYER</span>
                <span style="font-size:9px; opacity:0.6;">SYSTEM ONLINE</span>
            </div>
            <div id="playlist-content"></div>
            <div class="playlist-input-box">
                <input type="text" id="yt-url-input" placeholder="YouTube Link or ID..." />
                <button id="yt-add-btn">ADD</button>
            </div>
        </div>
        <div id="youtube-player" style="display:none;"></div>
    `;
    document.body.appendChild(container);

    // 3. YouTube API 初始化 (保留所有核心邏輯)
    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
    } else if (window.YT && window.YT.Player) {
        initPlayer();
    }

    window.onYouTubeIframeAPIReady = function() {
        initPlayer();
    };

    function initPlayer() {
        player = new YT.Player('youtube-player', {
            height: '0', width: '0', 
            videoId: tracks.length ? tracks[currentTrackIndex].id : '',
            playerVars: { 'autoplay': 0, 'controls': 0 },
            events: { 
                'onReady': () => { 
                    const seedBtn = document.getElementById('seed-container');
                    if (seedBtn) seedBtn.onclick = startRitual; 
                },
                'onStateChange': onPlayerStateChange
            }
        });
    }

    function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.ENDED) {
            if (tracks.length === 0) return;
            currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
            player.loadVideoById(tracks[currentTrackIndex].id);
            showNotice(tracks[currentTrackIndex].name);
            updatePlaylistUI();
        }
    }

    function fadeInMusic() {
        if (!tracks.length) return;
        let currentVol = 0;
        player.setVolume(0);
        player.playVideo();
        
        const musicBtn = document.getElementById('music-control-btn');
        if (musicBtn) musicBtn.classList.add('playing');

        const fadeInterval = setInterval(() => {
            currentVol += 2;
            if (currentVol >= targetVolume) {
                player.setVolume(targetVolume);
                clearInterval(fadeInterval);
            } else {
                player.setVolume(currentVol);
            }
        }, 80);
    }

    function startRitual() {
        const seedBtn = document.getElementById('seed-container');
        const overlay = document.getElementById('seed-overlay');
        const text = document.querySelector('.seed-text');

        seedBtn.classList.add('grow');
        if (text) text.style.opacity = '0';

        fadeInMusic();
        document.body.classList.add('focus-in');

        setTimeout(() => {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                overlay.remove();
                initUI();
            }, 1200);
        }, 600);

        if (tracks.length) {
            setTimeout(() => showNotice(tracks[currentTrackIndex].name), 1500);
        }
    }

    async function fetchYoutubeTitle(ytId) {
        try {
            const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.title) return data.title;
            }
        } catch(e) {}
        return null;
    }

    function extractYoutubeId(url) {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        const candidate = (match && match[2].length === 11) ? match[2] : url.trim();
        return (/^[a-zA-Z0-9_-]{11}$/.test(candidate)) ? candidate : null;
    }

    function removeTrack(index) {
        if (index < 0 || index >= tracks.length) return;

        const isCurrentPlaying = (index === currentTrackIndex);
        tracks.splice(index, 1);

        if (tracks.length === 0) {
            currentTrackIndex = 0;
            if (player && player.stopVideo) player.stopVideo();
            showNotice("歌單已空");
            renderPlaylist();
            return;
        }

        if (index < currentTrackIndex) {
            currentTrackIndex--;
        } else if (isCurrentPlaying) {
            if (currentTrackIndex >= tracks.length) {
                currentTrackIndex = 0;
            }
            player.loadVideoById(tracks[currentTrackIndex].id);
            showNotice(tracks[currentTrackIndex].name);
        }

        renderPlaylist();
    }

    function initUI() {
        const musicBtn = document.getElementById('music-control-btn');
        const playlistWindow = document.getElementById('playlist-window');
        const addBtn = document.getElementById('yt-add-btn');
        const urlInput = document.getElementById('yt-url-input');

        musicBtn.onclick = (e) => {
            e.stopPropagation();
            playlistWindow.classList.toggle('open');
        };

        document.addEventListener('click', (e) => {
            if (!playlistWindow.contains(e.target) && !musicBtn.contains(e.target)) {
                playlistWindow.classList.remove('open');
            }
        });

        addBtn.onclick = async () => {
            const rawVal = urlInput.value.trim();
            const ytId = extractYoutubeId(rawVal);

            if (!ytId) {
                urlInput.classList.add('invalid');
                urlInput.value = '';
                urlInput.placeholder = '無效的連結 / ID！';
                setTimeout(() => {
                    urlInput.classList.remove('invalid');
                    urlInput.placeholder = 'YouTube Link or ID...';
                }, 2000);
                return;
            }

            addBtn.innerText = 'FETCH...';
            addBtn.disabled = true;

            let fetchedTitle = await fetchYoutubeTitle(ytId);
            addBtn.innerText = 'ADD';
            addBtn.disabled = false;

            const finalTrackName = fetchedTitle || `Track [${ytId}]`;
            tracks.push({ name: finalTrackName, id: ytId });
            
            urlInput.value = '';
            renderPlaylist();

            currentTrackIndex = tracks.length - 1;
            player.loadVideoById(ytId);
            showNotice(finalTrackName);
            updatePlaylistUI();
        };

        renderPlaylist();
    }

    function renderPlaylist() {
        const content = document.getElementById('playlist-content');
        if (!content) return;
        content.innerHTML = '';

        if (tracks.length === 0) {
            content.innerHTML = '<div style="padding:16px; text-align:center; color:#5c738a; font-size:11px; letter-spacing:1px;">NO DATA IN SCHALE ARCHIVE</div>';
            return;
        }

        tracks.forEach((t, i) => {
            const item = document.createElement('div');
            item.className = `track-item ${i === currentTrackIndex ? 'active' : ''}`;
            
            item.innerHTML = `
                <div class="track-name-wrapper">
                    <div class="track-name-scroll">
                        <span class="track-name-text">${i + 1}. ${t.name}</span>
                        <span class="track-name-text" aria-hidden="true">✦ ${t.name}</span>
                    </div>
                </div>
                <div style="display:flex; align-items:center; flex-shrink:0;">
                    ${i === currentTrackIndex ? '<small style="margin-right:4px; color:#00f0ff;">◆</small>' : ''}
                    <span class="remove-track-btn" title="Remove Track">✕</span>
                </div>
            `;
            
            item.onclick = (e) => {
                if (e.target.classList.contains('remove-track-btn')) return;
                currentTrackIndex = i;
                player.loadVideoById(tracks[i].id);
                showNotice(tracks[i].name);
                updatePlaylistUI();
            };

            const removeBtn = item.querySelector('.remove-track-btn');
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                removeTrack(i);
            };

            content.appendChild(item);
        });
    }

    function updatePlaylistUI() {
        renderPlaylist();
    }

    function showNotice(name) {
        const note = document.getElementById('music-notification');
        if (!note) return;
        note.innerHTML = `<small>NOW PLAYING</small><b>${name}</b>`;
        note.classList.add('show');
        setTimeout(() => note.classList.remove('show'), 3800);
    }
})();
