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
        { name: "Unwelcome School", id: "DAuAE_1cLVFRSHPA" }
    ];

    let player;
    let currentTrackIndex = 0;
    let targetVolume = 50;

    // 1. 樣式修飾（無縫連續滾動，無空白等待）
    const style = document.createElement('style');
    style.innerHTML = `
        #seed-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #000; z-index: 20000;
            display: flex; align-items: center; justify-content: center;
            overflow: hidden;
            transition: opacity 1.5s ease-in-out;
        }

        #seed-container {
            position: relative;
            width: 75px; height: 75px;
            transition: transform 1.2s cubic-bezier(0.45, 0.05, 0.55, 0.95);
            display: flex; align-items: center; justify-content: center;
            z-index: 20001;
            cursor: pointer;
        }

        .seed-of-light {
            width: 100%; height: 100%;
            background: #fffdf0;
            border-radius: 50%;
            box-shadow: 0 0 40px #fff, 0 0 70px #d4af37, 0 0 100px rgba(212, 175, 55, 0.5);
            animation: seed-pulse 4s infinite ease-in-out;
        }

        @keyframes seed-pulse {
            0%, 100% { transform: scale(0.9); opacity: 0.7; box-shadow: 0 0 30px #fff, 0 0 50px #d4af37; }
            50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 60px #fff, 0 0 110px #d4af37; }
        }

        #seed-container.grow { transform: scale(400); }
        #seed-container.grow .seed-of-light { animation: none !important; opacity: 1; }
        #seed-overlay.fade-out { opacity: 0; pointer-events: none; }

        .seed-text {
            position: absolute; bottom: 15%;
            color: #d4af37; font-family: "Cinzel", "serif";
            letter-spacing: 10px; font-size: 13px; font-weight: bold;
            animation: text-pulse 4s infinite ease-in-out;
            transition: opacity 0.5s;
            pointer-events: none;
        }

        @keyframes text-pulse {
            0%, 100% { opacity: 0.2; filter: blur(1px); }
            50% { opacity: 1; filter: blur(0px); text-shadow: 0 0 15px #d4af37; }
        }

        body.focus-in { animation: web-focus 3.5s ease-out forwards; }
        @keyframes web-focus {
            0% { filter: blur(20px) brightness(2.5); }
            100% { filter: blur(0px) brightness(1); }
        }

        /* --- 菱形音樂按鈕 --- */
        #music-control-btn { 
            position: fixed; bottom: 35px; right: 35px; 
            width: 44px; height: 44px; 
            background: rgba(10, 10, 12, 0.75); 
            border: 1px solid rgba(212, 175, 55, 0.6); 
            backdrop-filter: blur(12px);
            transform: rotate(45deg);
            display: flex; align-items: center; justify-content: center; 
            cursor: pointer; z-index: 9999; 
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.8), inset 0 0 8px rgba(212, 175, 55, 0.15); 
            transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
            outline: none;
        }

        .btn-icon-wrapper {
            transform: rotate(-45deg);
            display: flex; align-items: center; justify-content: center;
            width: 100%; height: 100%;
        }

        #music-control-btn svg {
            width: 18px; height: 18px;
            fill: #ffea95;
            filter: drop-shadow(0 0 4px rgba(212, 175, 55, 0.6));
        }

        #music-control-btn:hover {
            transform: rotate(45deg) scale(1.12);
            background: rgba(255, 234, 149, 0.12);
            border-color: #ffea95;
            box-shadow: 0 0 25px rgba(212, 175, 55, 0.5), inset 0 0 12px rgba(212, 175, 55, 0.3);
        }

        #music-control-btn.playing { animation: diamond-pulse 3s infinite ease-in-out; }
        @keyframes diamond-pulse {
            0%, 100% { box-shadow: 0 0 12px rgba(212, 175, 55, 0.3), inset 0 0 6px rgba(212, 175, 55, 0.2); }
            50% { box-shadow: 0 0 22px rgba(212, 175, 55, 0.7), inset 0 0 12px rgba(212, 175, 55, 0.4); }
        }

        /* --- UI 播放控制器 --- */
        .music-note { 
            position: fixed; bottom: 95px; right: 35px; 
            background: rgba(10, 10, 12, 0.88); 
            border: 1px solid rgba(212, 175, 55, 0.4);
            border-left: 4px solid #ffea95; 
            padding: 12px 22px; 
            backdrop-filter: blur(12px);
            color: #fff; font-size: 13px; z-index: 9999; 
            transform: translateX(180%); transition: transform 0.5s cubic-bezier(0.165, 0.84, 0.44, 1); 
            pointer-events: none; font-family: "Cinzel", "serif"; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.8);
            max-width: 280px;
            overflow: hidden;
        }
        .music-note.show { transform: translateX(0); }
        .music-note small { color: #d4af37; letter-spacing: 2px; font-size: 0.65rem; text-transform: uppercase; }
        .music-note b { display: block; margin-top: 3px; font-weight: 500; letter-spacing: 1px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        #playlist-window { 
            position: fixed; bottom: 95px; right: 35px; width: 340px; 
            background: rgba(12, 12, 15, 0.95); 
            border: 1px solid rgba(212, 175, 55, 0.35);
            backdrop-filter: blur(15px);
            display: none; flex-direction: column; z-index: 9998; 
            font-family: "Cinzel", "Noto Serif TC", "serif"; 
            box-shadow: 0 20px 50px rgba(0,0,0,0.9);
        }
        #playlist-window.open { display: flex; animation: fadeIn 0.3s ease; }
        
        .playlist-header {
            padding: 12px 16px;
            border-bottom: 1px solid rgba(212, 175, 55, 0.2);
            font-size: 0.72rem;
            letter-spacing: 2px;
            color: #d4af37;
        }

        #playlist-content {
            max-height: 260px;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(212, 175, 55, 0.4) rgba(10, 10, 12, 0.9);
        }

        #playlist-content::-webkit-scrollbar { width: 5px; }
        #playlist-content::-webkit-scrollbar-track { background: rgba(10, 10, 12, 0.9); }
        #playlist-content::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.3); border-radius: 2px; }
        #playlist-content::-webkit-scrollbar-thumb:hover { background: #ffea95; box-shadow: 0 0 10px #ffea95; }

        .track-item { 
            padding: 11px 16px; cursor: pointer; color: #aaa; font-size: 12px; 
            border-bottom: 1px solid rgba(255, 255, 255, 0.05); 
            transition: all 0.2s ease;
            letter-spacing: 1px;
            display: flex; align-items: center; justify-content: space-between;
        }
        .track-item:hover { color: #fff; background: rgba(212, 175, 55, 0.1); }
        .track-item.active { 
            color: #ffea95; background: rgba(212, 175, 55, 0.18); 
            font-weight: bold; border-left: 3px solid #ffea95;
            text-shadow: 0 0 8px rgba(212, 175, 55, 0.5);
        }

        /* --- 無縫接軌滾動容器 --- */
        .track-name-wrapper {
            overflow: hidden;
            white-space: nowrap;
            width: 220px;
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

        /* Hover 或播放時觸發：無縫循環滾動 */
        .track-item:hover .track-name-scroll,
        .track-item.active .track-name-scroll {
            animation: marquee-seamless 7s linear infinite;
        }

        @keyframes marquee-seamless {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-50% - 12px)); }
        }

        .remove-track-btn {
            color: rgba(212, 175, 55, 0.4);
            font-size: 11px;
            padding: 2px 6px;
            margin-left: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .remove-track-btn:hover {
            color: #ff4d4d;
            text-shadow: 0 0 6px rgba(255, 77, 77, 0.8);
        }

        .playlist-input-box {
            padding: 10px 12px;
            border-top: 1px solid rgba(212, 175, 55, 0.2);
            display: flex;
            gap: 8px;
            background: rgba(5, 5, 8, 0.8);
        }

        .playlist-input-box input {
            flex: 1;
            background: rgba(20, 20, 25, 0.8);
            border: 1px solid rgba(212, 175, 55, 0.3);
            color: #ffea95;
            padding: 6px 10px;
            font-size: 11px;
            outline: none;
            font-family: inherit;
            transition: all 0.3s;
        }
        .playlist-input-box input:focus { border-color: #ffea95; }
        .playlist-input-box input.invalid {
            border-color: #ff4d4d !important;
            color: #ff4d4d !important;
        }

        .playlist-input-box button {
            background: rgba(212, 175, 55, 0.2);
            border: 1px solid #d4af37;
            color: #ffea95;
            padding: 6px 12px;
            font-size: 11px;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.3s;
            white-space: nowrap;
        }
        .playlist-input-box button:hover {
            background: #ffea95;
            color: #000;
            box-shadow: 0 0 10px rgba(255, 234, 149, 0.5);
        }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);

    // 2. 建立 DOM 結構
    const container = document.createElement('div');
    container.innerHTML = `
        <div id="seed-overlay">
            <div id="seed-container">
                <div class="seed-of-light"></div>
            </div>
            <div class="seed-text">SEED OF LIGHT</div>
        </div>
        <div id="music-notification" class="music-note"></div>
        <button id="music-control-btn" title="Library Archive Playlist" aria-label="Toggle Playlist">
            <div class="btn-icon-wrapper">
                <svg viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
            </div>
        </button>
        <div id="playlist-window">
            <div class="playlist-header">
                <span>LIBRARY ARCHIVE // SOUNDTRACK</span>
            </div>
            <div id="playlist-content"></div>
            <div class="playlist-input-box">
                <input type="text" id="yt-url-input" placeholder="Paste YouTube Link or ID..." />
                <button id="yt-add-btn">ADD</button>
            </div>
        </div>
        <div id="youtube-player" style="display:none;"></div>
    `;
    document.body.appendChild(container);

    // 3. YouTube API 初始化
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
            }, 1500);
        }, 800);

        if (tracks.length) {
            setTimeout(() => showNotice(tracks[currentTrackIndex].name), 1800);
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
                    urlInput.placeholder = 'Paste YouTube Link or ID...';
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
            content.innerHTML = '<div style="padding:16px; text-align:center; color:#888; font-size:11px; letter-spacing:1px;">NO TRACKS IN ARCHIVE</div>';
            return;
        }

        tracks.forEach((t, i) => {
            const item = document.createElement('div');
            item.className = `track-item ${i === currentTrackIndex ? 'active' : ''}`;
            
            // 生成兩組相同標題實現無縫無限滾動
            item.innerHTML = `
                <div class="track-name-wrapper">
                    <div class="track-name-scroll">
                        <span class="track-name-text">${i + 1}. ${t.name}</span>
                        <span class="track-name-text" aria-hidden="true">✦ ${t.name}</span>
                    </div>
                </div>
                <div style="display:flex; align-items:center; flex-shrink:0;">
                    ${i === currentTrackIndex ? '<small style="margin-right:4px; color:#ffea95;">◆</small>' : ''}
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
        note.innerHTML = `<small>Now Playing</small><b>${name}</b>`;
        note.classList.add('show');
        setTimeout(() => note.classList.remove('show'), 3800);
    }
})();
