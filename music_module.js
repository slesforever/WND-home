(function() {
    // 0. 防重疊機制：清理舊 DOM
    const cleanDOM = (id) => { const el = document.getElementById(id); if (el) el.remove(); };
    ['ba-overlay', 'music-control-btn', 'playlist-window', 'youtube-player', 'ba-style'].forEach(cleanDOM);

    // 預設蔚藍檔案 OST
    const tracks = [
        { name: "Blue Archive OST 1 - Constant Moderato", id: "c59d74iJ-jI" }
    ];

    let player;
    let currentTrackIndex = 0;
    let targetVolume = 50;
    let isPlayerReady = false;
    let shouldPlayOnReady = false;

    // 1. 蔚藍檔案科技風格 CSS
    const style = document.createElement('style');
    style.id = 'ba-style';
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;800&family=Noto+Sans+TC:wght@500;700&display=swap');

        #ba-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #050b14; z-index: 20000;
            display: flex; align-items: center; justify-content: center;
            overflow: hidden; transition: opacity 1.2s ease-in-out;
            font-family: 'Exo 2', 'Noto Sans TC', sans-serif;
        }

        /* 背景中心深藍/青色微幅漂移 */
        .ba-ambient-bg {
            position: absolute; top: 50%; left: 50%;
            width: 140vmax; height: 140vmax;
            transform: translate(-50%, -50%);
            background: radial-gradient(circle at center, rgba(0, 210, 255, 0.22) 0%, rgba(10, 30, 65, 0.55) 45%, rgba(5, 11, 20, 0.98) 75%);
            animation: ba-drift 14s ease-in-out infinite alternate;
            pointer-events: none; filter: blur(50px);
        }

        @keyframes ba-drift {
            0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 0.7; }
            50% { transform: translate(-49%, -51%) scale(1.05) rotate(1.5deg); opacity: 0.95; }
            100% { transform: translate(-51%, -49%) scale(1.02) rotate(-1.5deg); opacity: 0.7; }
        }

        /* 藍色科幻光霧 */
        .ba-fog-layer {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(circle at 50% 50%, rgba(0, 210, 255, 0.08) 0%, transparent 65%);
            filter: blur(25px); animation: ba-fog 6s ease-in-out infinite alternate;
            pointer-events: none;
        }
        @keyframes ba-fog {
            0% { opacity: 0.4; transform: scale(0.95); }
            100% { opacity: 0.85; transform: scale(1.1); }
        }

        /* 蔚藍檔案風格 光環/什亭之箱 核心 */
        #ba-core-container {
            position: relative; width: 85px; height: 85px;
            display: flex; align-items: center; justify-content: center;
            z-index: 20001; cursor: pointer;
            transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ba-halo-core {
            width: 100%; height: 100%;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.95);
            border: 3px solid #00d2ff;
            box-shadow: 0 0 25px #00d2ff, 0 0 50px rgba(0, 210, 255, 0.6), inset 0 0 15px #00d2ff;
            animation: halo-pulse 3.5s infinite ease-in-out;
            position: relative;
        }

        /* 菱形光環裝飾點綴 */
        .ba-halo-core::before {
            content: ''; position: absolute; top: 50%; left: 50%;
            width: 115%; height: 115%;
            border: 2px dashed rgba(0, 210, 255, 0.8);
            border-radius: 50%; transform: translate(-50%, -50%) rotate(45deg);
            animation: halo-spin 12s linear infinite;
        }

        @keyframes halo-pulse {
            0%, 100% { transform: scale(0.92); box-shadow: 0 0 20px #00d2ff, 0 0 40px rgba(0, 210, 255, 0.5); }
            50% { transform: scale(1.08); box-shadow: 0 0 35px #00d2ff, 0 0 70px rgba(0, 210, 255, 0.9); }
        }
        @keyframes halo-spin { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }

        /* 點擊衝擊波 */
        .ba-ripple {
            position: absolute; top: 50%; left: 50%;
            width: 90px; height: 90px;
            border: 2px solid #00d2ff; border-radius: 50%;
            transform: translate(-50%, -50%) scale(1);
            box-shadow: 0 0 30px #00d2ff;
            animation: ba-ripple-out 1s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
            pointer-events: none; z-index: 20002;
        }
        @keyframes ba-ripple-out {
            0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(14); opacity: 0; }
        }

        #ba-core-container.grow { transform: scale(350); }
        #ba-overlay.fade-out { opacity: 0; pointer-events: none; }

        .ba-text {
            position: absolute; bottom: 15%;
            color: #00d2ff; font-weight: 800; font-size: 14px;
            letter-spacing: 8px; text-shadow: 0 0 12px rgba(0, 210, 255, 0.8);
            animation: text-glow 3s infinite ease-in-out;
            pointer-events: none; z-index: 20001;
        }
        @keyframes text-glow {
            0%, 100% { opacity: 0.4; } 50% { opacity: 1; text-shadow: 0 0 20px #00d2ff; }
        }

        /* --- 蔚藍檔案風格 UI 按鈕 --- */
        #music-control-btn {
            position: fixed; bottom: 35px; right: 35px;
            width: 46px; height: 46px;
            background: rgba(11, 19, 43, 0.85);
            border: 1px solid #00d2ff;
            backdrop-filter: blur(10px);
            transform: rotate(45deg);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; z-index: 9999;
            box-shadow: 0 0 15px rgba(0, 210, 255, 0.3), inset 0 0 8px rgba(0, 210, 255, 0.2);
            transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
            outline: none;
        }

        .btn-icon-wrapper {
            transform: rotate(-45deg);
            display: flex; align-items: center; justify-content: center;
            width: 100%; height: 100%;
        }

        #music-control-btn svg {
            width: 20px; height: 20px; fill: #00d2ff;
            filter: drop-shadow(0 0 5px rgba(0, 210, 255, 0.8));
        }

        #music-control-btn:hover {
            transform: rotate(45deg) scale(1.12);
            background: rgba(0, 210, 255, 0.2);
            box-shadow: 0 0 25px rgba(0, 210, 255, 0.7);
        }

        #music-control-btn.playing { animation: ba-btn-pulse 2.5s infinite ease-in-out; }
        @keyframes ba-btn-pulse {
            0%, 100% { box-shadow: 0 0 10px rgba(0, 210, 255, 0.4); }
            50% { box-shadow: 0 0 25px rgba(0, 210, 255, 0.9); }
        }

        /* 播放通知面板 */
        .music-note {
            position: fixed; bottom: 95px; right: 35px;
            background: rgba(11, 19, 43, 0.92);
            border: 1px solid rgba(0, 210, 255, 0.5);
            border-left: 4px solid #00d2ff;
            padding: 12px 20px; backdrop-filter: blur(12px);
            color: #fff; font-size: 13px; z-index: 9999;
            transform: translateX(180%); transition: transform 0.4s ease;
            pointer-events: none; font-family: 'Exo 2', sans-serif;
            box-shadow: 0 10px 30px rgba(0,0,0,0.7); max-width: 280px; overflow: hidden;
        }
        .music-note.show { transform: translateX(0); }
        .music-note small { color: #00d2ff; letter-spacing: 2px; font-size: 0.65rem; text-transform: uppercase; font-weight: 700; }
        .music-note b { display: block; margin-top: 3px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* 歌單視窗 */
        #playlist-window {
            position: fixed; bottom: 95px; right: 35px; width: 340px;
            background: rgba(10, 16, 32, 0.95);
            border: 1px solid rgba(0, 210, 255, 0.4);
            backdrop-filter: blur(15px);
            display: none; flex-direction: column; z-index: 9998;
            font-family: 'Exo 2', 'Noto Sans TC', sans-serif;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
        }
        #playlist-window.open { display: flex; animation: fadeIn 0.3s ease; }

        .playlist-header {
            padding: 12px 16px; border-bottom: 1px solid rgba(0, 210, 255, 0.2);
            font-size: 0.75rem; letter-spacing: 2px; color: #00d2ff; font-weight: 800;
        }

        #playlist-content {
            max-height: 260px; overflow-y: auto;
            scrollbar-width: thin; scrollbar-color: rgba(0, 210, 255, 0.4) rgba(10, 16, 32, 0.9);
        }

        .track-item {
            padding: 11px 16px; cursor: pointer; color: #a0b0c0; font-size: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: all 0.2s ease;
            display: flex; align-items: center; justify-content: space-between;
        }
        .track-item:hover { color: #fff; background: rgba(0, 210, 255, 0.12); }
        .track-item.active {
            color: #00d2ff; background: rgba(0, 210, 255, 0.18);
            font-weight: 700; border-left: 3px solid #00d2ff;
        }

        .track-name-wrapper {
            overflow: hidden; white-space: nowrap; width: 220px; position: relative;
            mask-image: linear-gradient(90deg, transparent 0%, #000 4%, #000 96%, transparent 100%);
            -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 4%, #000 96%, transparent 100%);
        }
        .track-name-scroll { display: inline-flex; gap: 24px; white-space: nowrap; will-change: transform; }
        .track-item:hover .track-name-scroll, .track-item.active .track-name-scroll { animation: marquee 7s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(calc(-50% - 12px)); } }

        .remove-track-btn { color: rgba(0, 210, 255, 0.4); font-size: 11px; padding: 2px 6px; cursor: pointer; }
        .remove-track-btn:hover { color: #ff4d4d; }

        .playlist-input-box {
            padding: 10px 12px; border-top: 1px solid rgba(0, 210, 255, 0.2);
            display: flex; gap: 8px; background: rgba(5, 10, 20, 0.8);
        }
        .playlist-input-box input {
            flex: 1; background: rgba(15, 25, 45, 0.8); border: 1px solid rgba(0, 210, 255, 0.3);
            color: #00d2ff; padding: 6px 10px; font-size: 11px; outline: none; font-family: inherit;
        }
        .playlist-input-box input:focus { border-color: #00d2ff; }
        .playlist-input-box button {
            background: rgba(0, 210, 255, 0.2); border: 1px solid #00d2ff; color: #00d2ff;
            padding: 6px 12px; font-size: 11px; cursor: pointer; font-family: inherit; transition: all 0.2s;
        }
        .playlist-input-box button:hover { background: #00d2ff; color: #050b14; font-weight: bold; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);

    // 2. DOM 結構注入
    const container = document.createElement('div');
    container.innerHTML = `
        <div id="ba-overlay">
            <div class="ba-ambient-bg"></div>
            <div class="ba-fog-layer"></div>
            <div id="ba-core-container">
                <div class="ba-halo-core"></div>
            </div>
            <div class="ba-text">SCHALE // SYSTEM CONNECT</div>
        </div>
        <div id="music-notification" class="music-note"></div>
        <button id="music-control-btn" title="SCHALE Soundtrack" aria-label="Toggle Playlist">
            <div class="btn-icon-wrapper">
                <svg viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
            </div>
        </button>
        <div id="playlist-window">
            <div class="playlist-header">
                <span>SCHALE ARCHIVE // SOUNDTRACK</span>
            </div>
            <div id="playlist-content"></div>
            <div class="playlist-input-box">
                <input type="text" id="yt-url-input" placeholder="Paste YouTube Link or ID..." />
                <button id="yt-add-btn">ADD</button>
            </div>
        </div>
        <div id="youtube-player" style="position:fixed; left:-9999px; top:-9999px; width:1px; height:1px; opacity:0; pointer-events:none;"></div>
    `;
    document.body.appendChild(container);

    // 綁定點擊啟動
    const coreBtn = document.getElementById('ba-core-container');
    if (coreBtn) coreBtn.onclick = startRitual;

    // 3. YouTube API 初始化
    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
    } else if (window.YT && window.YT.Player) {
        initPlayer();
    }

    window.onYouTubeIframeAPIReady = function() { initPlayer(); };

    function initPlayer() {
        player = new YT.Player('youtube-player', {
            height: '1', width: '1',
            videoId: tracks.length ? tracks[currentTrackIndex].id : '',
            playerVars: { 'autoplay': 0, 'controls': 0 },
            events: {
                'onReady': () => {
                    isPlayerReady = true;
                    if (shouldPlayOnReady) fadeInMusic();
                },
                'onStateChange': (e) => {
                    if (e.data === YT.PlayerState.ENDED && tracks.length > 0) {
                        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
                        player.loadVideoById(tracks[currentTrackIndex].id);
                        showNotice(tracks[currentTrackIndex].name);
                        renderPlaylist();
                    }
                }
            }
        });
    }

    function fadeInMusic() {
        if (!tracks.length || !player) return;
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
        const overlay = document.getElementById('ba-overlay');
        const text = document.querySelector('.ba-text');

        // 生成點擊漣漪
        const ripple = document.createElement('div');
        ripple.className = 'ba-ripple';
        overlay.appendChild(ripple);

        coreBtn.classList.add('grow');
        if (text) text.style.opacity = '0';

        if (isPlayerReady) {
            fadeInMusic();
        } else {
            shouldPlayOnReady = true;
        }

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
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = rawVal.match(regExp);
            const ytId = (match && match[2].length === 11) ? match[2] : (/^[a-zA-Z0-9_-]{11}$/.test(rawVal) ? rawVal : null);

            if (!ytId) return;

            tracks.push({ name: `SCHALE Track [${ytId}]`, id: ytId });
            urlInput.value = '';
            renderPlaylist();

            currentTrackIndex = tracks.length - 1;
            player.loadVideoById(ytId);
            showNotice(tracks[currentTrackIndex].name);
        };

        renderPlaylist();
    }

    function renderPlaylist() {
        const content = document.getElementById('playlist-content');
        if (!content) return;
        content.innerHTML = '';

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
                <span class="remove-track-btn">✕</span>
            `;

            item.onclick = (e) => {
                if (e.target.classList.contains('remove-track-btn')) return;
                currentTrackIndex = i;
                player.loadVideoById(tracks[i].id);
                showNotice(tracks[i].name);
                renderPlaylist();
            };

            item.querySelector('.remove-track-btn').onclick = (e) => {
                e.stopPropagation();
                tracks.splice(i, 1);
                renderPlaylist();
            };

            content.appendChild(item);
        });
    }

    function showNotice(name) {
        const note = document.getElementById('music-notification');
        if (!note) return;
        note.innerHTML = `<small>Now Playing</small><b>${name}</b>`;
        note.classList.add('show');
        setTimeout(() => note.classList.remove('show'), 3800);
    }
})();
