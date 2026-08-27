(function () {

    "use strict";


    /* =========================================================
       CONFIGURATION
    ========================================================= */

    const DEFAULT_VOLUME = 35;

    /*
     * Fade 時間
     *
     * Fade Out：
     * 舊歌曲慢慢消失
     *
     * Fade In：
     * 新歌曲慢慢出現
     */

    const FADE_OUT_MS = 800;

    const FADE_IN_MS = 1200;


    /*
     * 每次音量變化的間隔
     */

    const FADE_INTERVAL_MS = 20;


    /*
     * 儲存音量的 localStorage key
     */

    const VOLUME_STORAGE_KEY =
        "wnd_music_volume";


    const MUTED_STORAGE_KEY =
        "wnd_music_muted";


    /* =========================================================
       DEFAULT PLAYLIST
    ========================================================= */

    const tracks = [

        {
            name:
                "Background Music",

            id:
                "eMqWJDP28p8"

        }

    ];


    /* =========================================================
       PLAYER STATE
    ========================================================= */

    let player =
        null;


    let playerReady =
        false;


    let playing =
        false;


    let currentTrackIndex =
        0;


    let apiLoading =
        false;


    let fading =
        false;


    let fadeToken =
        0;


    let pendingPlayRequest =
        false;


    /* =========================================================
       LOAD SAVED VOLUME
    ========================================================= */

    function loadSavedVolume() {

        try {

            const saved =
                Number(
                    localStorage.getItem(
                        VOLUME_STORAGE_KEY
                    )
                );


            if (
                Number.isFinite(saved) &&
                saved >= 0 &&
                saved <= 100
            ) {

                return saved;

            }

        } catch (
            error
        ) {}


        return DEFAULT_VOLUME;

    }


    let volume =
        loadSavedVolume();


    /* =========================================================
       LOAD MUTED STATE
    ========================================================= */

    function loadMutedState() {

        try {

            return (
                localStorage.getItem(
                    MUTED_STORAGE_KEY
                ) ===
                "true"
            );

        } catch (
            error
        ) {

            return false;

        }

    }


    let muted =
        loadMutedState();


    /* =========================================================
       DOM
    ========================================================= */

    const musicButton =
        document.getElementById(
            "music-button"
        );


    const musicPanel =
        document.getElementById(
            "music-panel"
        );


    const musicList =
        document.getElementById(
            "music-list"
        );


    const nowPlaying =
        document.getElementById(
            "now-playing"
        );


    const playButton =
        document.getElementById(
            "play-track"
        );


    const previousButton =
        document.getElementById(
            "prev-track"
        );


    const nextButton =
        document.getElementById(
            "next-track"
        );


    const youtubeInput =
        document.getElementById(
            "youtube-input"
        );


    const youtubeAdd =
        document.getElementById(
            "youtube-add"
        );


    /* =========================================================
       CREATE VOLUME UI
       ========================================================= */

    let volumeContainer =
        null;


    let volumeSlider =
        null;


    let volumeValue =
        null;


    let muteButton =
        null;


    function createVolumeUI() {

        if (
            !musicPanel
        )
            return;


        /*
         * 防止重複建立
         */

        if (
            document.getElementById(
                "wnd-volume-control"
            )
        ) {

            return;

        }


        volumeContainer =
            document.createElement(
                "div"
            );


        volumeContainer.id =
            "wnd-volume-control";


        volumeContainer.innerHTML = `

            <style>

                #wnd-volume-control {

                    padding:
                        10px 14px 12px;

                    border-top:
                        1px solid
                        rgba(83,187,224,.12);

                    background:
                        rgba(255,255,255,.18);

                }


                .wnd-volume-row {

                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        8px;

                }


                .wnd-volume-label {

                    min-width:
                        48px;

                    color:
                        #7d96a3;

                    font-size:
                        8px;

                    font-weight:
                        700;

                    letter-spacing:
                        1.4px;

                }


                .wnd-volume-value {

                    width:
                        32px;

                    text-align:
                        right;

                    color:
                        #5b8498;

                    font-size:
                        9px;

                    font-weight:
                        700;

                }


                .wnd-volume-slider {

                    flex:
                        1;

                    min-width:
                        0;

                    height:
                        4px;

                    appearance:
                        none;

                    -webkit-appearance:
                        none;

                    border-radius:
                        5px;

                    outline:
                        none;

                    cursor:
                        pointer;

                    background:
                        linear-gradient(
                            to right,
                            #63d2fa 0%,
                            #63d2fa 35%,
                            rgba(120,165,180,.18) 35%,
                            rgba(120,165,180,.18) 100%
                        );

                }


                .wnd-volume-slider::-webkit-slider-thumb {

                    appearance:
                        none;

                    -webkit-appearance:
                        none;

                    width:
                        12px;

                    height:
                        12px;

                    border-radius:
                        50%;

                    border:
                        2px solid
                        white;

                    background:
                        #63d2fa;

                    box-shadow:
                        0 0 8px
                        rgba(99,210,250,.45);

                }


                .wnd-volume-slider::-moz-range-thumb {

                    width:
                        12px;

                    height:
                        12px;

                    border-radius:
                        50%;

                    border:
                        2px solid
                        white;

                    background:
                        #63d2fa;

                    box-shadow:
                        0 0 8px
                        rgba(99,210,250,.45);

                }


                .wnd-volume-bottom {

                    display:
                        flex;

                    justify-content:
                        space-between;

                    align-items:
                        center;

                    margin-top:
                        8px;

                }


                .wnd-mute {

                    border:
                        1px solid
                        rgba(99,210,250,.18);

                    background:
                        rgba(255,255,255,.38);

                    color:
                        #668c9c;

                    padding:
                        4px 8px;

                    cursor:
                        pointer;

                    font-family:
                        inherit;

                    font-size:
                        8px;

                    font-weight:
                        700;

                    transition:
                        all .18s ease;

                }


                .wnd-mute:hover {

                    background:
                        rgba(99,210,250,.12);

                    color:
                        #3c91b3;

                }


                .wnd-fade-info {

                    color:
                        #9aacb5;

                    font-size:
                        7px;

                    letter-spacing:
                        1px;

                }

            </style>


            <div class="wnd-volume-row">

                <div class="wnd-volume-label">
                    VOLUME
                </div>


                <input
                    id="wnd-volume-slider"
                    class="wnd-volume-slider"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value="${volume}"
                    aria-label="Music volume"
                >


                <div
                    id="wnd-volume-value"
                    class="wnd-volume-value"
                >
                    ${volume}%
                </div>

            </div>


            <div
                class="wnd-volume-bottom"
            >

                <button
                    id="wnd-mute"
                    class="wnd-mute"
                    type="button"
                >
                    ${muted ? "UNMUTE" : "MUTE"}
                </button>


                <div
                    class="wnd-fade-info"
                >
                    FADE ${FADE_IN_MS / 1000}s
                </div>

            </div>

        `;


        musicPanel.appendChild(
            volumeContainer
        );


        volumeSlider =
            document.getElementById(
                "wnd-volume-slider"
            );


        volumeValue =
            document.getElementById(
                "wnd-volume-value"
            );


        muteButton =
            document.getElementById(
                "wnd-mute"
            );


        updateVolumeSlider();


        /* =====================================================
           SLIDER
        ===================================================== */

        volumeSlider.addEventListener(
            "input",
            () => {

                const value =
                    Number(
                        volumeSlider.value
                    );


                volume =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            value
                        )
                    );


                muted =
                    false;


                saveVolume();

                saveMutedState();

                updateVolumeSlider();

                applyVolume();

            }
        );


        /* =====================================================
           MUTE
        ===================================================== */

        muteButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                muted =
                    !muted;


                saveMutedState();

                updateVolumeSlider();

                applyVolume();


                playInterfaceSfx(
                    "click"
                );

            }
        );

    }


    /* =========================================================
       SAVE VOLUME
    ========================================================= */

    function saveVolume() {

        try {

            localStorage.setItem(
                VOLUME_STORAGE_KEY,
                String(volume)
            );

        } catch (
            error
        ) {}

    }


    /* =========================================================
       SAVE MUTED
    ========================================================= */

    function saveMutedState() {

        try {

            localStorage.setItem(
                MUTED_STORAGE_KEY,
                String(muted)
            );

        } catch (
            error
        ) {}

    }


    /* =========================================================
       UPDATE VOLUME SLIDER
    ========================================================= */

    function updateVolumeSlider() {

        if (
            !volumeSlider ||
            !volumeValue ||
            !muteButton
        ) {

            return;

        }


        volumeSlider.value =
            String(
                volume
            );


        volumeValue.textContent =
            `${volume}%`;


        muteButton.textContent =
            muted
                ? "UNMUTE"
                : "MUTE";


        /*
         * Slider fill
         */

        const displayedVolume =
            volume;


        volumeSlider.style.background =
            `
                linear-gradient(
                    to right,
                    #63d2fa 0%,
                    #63d2fa ${displayedVolume}%,
                    rgba(120,165,180,.18) ${displayedVolume}%,
                    rgba(120,165,180,.18) 100%
                )
            `;

    }


    /* =========================================================
       WEB AUDIO
    ========================================================= */

    let audioContext =
        null;


    function getAudioContext() {

        if (
            !audioContext
        ) {

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();

        }


        if (
            audioContext.state ===
            "suspended"
        ) {

            audioContext.resume();

        }


        return audioContext;

    }


    window.resumeInterfaceAudio =
        getAudioContext;


    /* =========================================================
       SFX
    ========================================================= */

    function playInterfaceSfx(
        type
    ) {

        try {

            const ctx =
                getAudioContext();


            const now =
                ctx.currentTime;


            /* =====================================================
               BOOT
            ===================================================== */

            if (
                type === "boot"
            ) {

                const oscillator =
                    ctx.createOscillator();


                const gain =
                    ctx.createGain();


                oscillator.type =
                    "sine";


                oscillator.frequency.setValueAtTime(
                    180,
                    now
                );


                oscillator.frequency.exponentialRampToValueAtTime(
                    760,
                    now + .72
                );


                gain.gain.setValueAtTime(
                    .0001,
                    now
                );


                gain.gain.exponentialRampToValueAtTime(
                    .055,
                    now + .18
                );


                gain.gain.exponentialRampToValueAtTime(
                    .0001,
                    now + 1.08
                );


                oscillator.connect(
                    gain
                );


                gain.connect(
                    ctx.destination
                );


                oscillator.start(
                    now
                );


                oscillator.stop(
                    now + 1.1
                );


                /*
                 * Sparkle
                 */

                const sparkle =
                    ctx.createOscillator();


                const sparkleGain =
                    ctx.createGain();


                sparkle.type =
                    "sine";


                sparkle.frequency.setValueAtTime(
                    1200,
                    now + .22
                );


                sparkle.frequency.exponentialRampToValueAtTime(
                    1750,
                    now + .78
                );


                sparkleGain.gain.setValueAtTime(
                    .0001,
                    now
                );


                sparkleGain.gain.exponentialRampToValueAtTime(
                    .025,
                    now + .40
                );


                sparkleGain.gain.exponentialRampToValueAtTime(
                    .0001,
                    now + .95
                );


                sparkle.connect(
                    sparkleGain
                );


                sparkleGain.connect(
                    ctx.destination
                );


                sparkle.start(
                    now + .18
                );


                sparkle.stop(
                    now + 1
                );

            }


            /* =====================================================
               CLICK
            ===================================================== */

            if (
                type === "click"
            ) {

                const oscillator =
                    ctx.createOscillator();


                const gain =
                    ctx.createGain();


                oscillator.type =
                    "sine";


                oscillator.frequency.setValueAtTime(
                    640,
                    now
                );


                oscillator.frequency.exponentialRampToValueAtTime(
                    360,
                    now + .10
                );


                gain.gain.setValueAtTime(
                    .034,
                    now
                );


                gain.gain.exponentialRampToValueAtTime(
                    .0001,
                    now + .11
                );


                oscillator.connect(
                    gain
                );


                gain.connect(
                    ctx.destination
                );


                oscillator.start(
                    now
                );


                oscillator.stop(
                    now + .12
                );

            }


            /* =====================================================
               PAGE
            ===================================================== */

            if (
                type === "page"
            ) {

                const oscillator =
                    ctx.createOscillator();


                const gain =
                    ctx.createGain();


                oscillator.type =
                    "triangle";


                oscillator.frequency.setValueAtTime(
                    250,
                    now
                );


                oscillator.frequency.exponentialRampToValueAtTime(
                    540,
                    now + .17
                );


                gain.gain.setValueAtTime(
                    .037,
                    now
                );


                gain.gain.exponentialRampToValueAtTime(
                    .0001,
                    now + .20
                );


                oscillator.connect(
                    gain
                );


                gain.connect(
                    ctx.destination
                );


                oscillator.start(
                    now
                );


                oscillator.stop(
                    now + .21
                );


                const high =
                    ctx.createOscillator();


                const highGain =
                    ctx.createGain();


                high.type =
                    "sine";


                high.frequency.setValueAtTime(
                    920,
                    now + .025
                );


                highGain.gain.setValueAtTime(
                    .020,
                    now + .025
                );


                highGain.gain.exponentialRampToValueAtTime(
                    .0001,
                    now + .125
                );


                high.connect(
                    highGain
                );


                highGain.connect(
                    ctx.destination
                );


                high.start(
                    now + .025
                );


                high.stop(
                    now + .14
                );

            }

        } catch (
            error
        ) {

            console.warn(
                "Interface SFX error:",
                error
            );

        }

    }


    window.playInterfaceSfx =
        playInterfaceSfx;


    /* =========================================================
       EFFECTIVE VOLUME
    ========================================================= */

    function getEffectiveVolume() {

        if (
            muted
        ) {

            return 0;

        }


        return volume;

    }


    /* =========================================================
       APPLY VOLUME
    ========================================================= */

    function applyVolume() {

        if (
            !playerReady ||
            !player
        )
            return;


        try {

            player.setVolume(
                getEffectiveVolume()
            );

        } catch (
            error
        ) {

            console.warn(
                "Volume error:",
                error
            );

        }

    }


    /* =========================================================
       SET VOLUME
    ========================================================= */

    function setPlayerVolume(
        value
    ) {

        if (
            !playerReady ||
            !player
        )
            return;


        const safeValue =
            Math.max(
                0,
                Math.min(
                    100,
                    value
                )
            );


        try {

            player.setVolume(
                safeValue
            );

        } catch (
            error
        ) {}

    }


    /* =========================================================
       FADE OUT
    ========================================================= */

    function fadeOut(
        duration = FADE_OUT_MS
    ) {

        if (
            !playerReady ||
            !player
        ) {

            return Promise.resolve();

        }


        /*
         * 取消之前的 fade
         */

        fadeToken++;


        const currentToken =
            fadeToken;


        fading =
            true;


        return new Promise(
            resolve => {

                let startVolume;


                try {

                    startVolume =
                        player.getVolume();

                } catch (
                    error
                ) {

                    startVolume =
                        getEffectiveVolume();

                }


                /*
                 * 如果已經是 0
                 */

                if (
                    startVolume <= 0
                ) {

                    if (
                        currentToken ===
                        fadeToken
                    ) {

                        fading =
                            false;

                    }


                    resolve();

                    return;

                }


                const startTime =
                    performance.now();


                function step() {

                    /*
                     * 如果這個 fade
                     * 已經被新的 fade 取代
                     */

                    if (
                        currentToken !==
                        fadeToken
                    ) {

                        resolve();

                        return;

                    }


                    const elapsed =
                        performance.now()
                        -
                        startTime;


                    const progress =
                        Math.min(
                            1,
                            elapsed /
                            duration
                        );


                    /*
                     * ease-out
                     */

                    const eased =
                        1 -
                        Math.pow(
                            1 - progress,
                            2
                        );


                    const nextVolume =
                        startVolume *
                        (1 - eased);


                    setPlayerVolume(
                        nextVolume
                    );


                    if (
                        progress >= 1
                    ) {

                        setPlayerVolume(
                            0
                        );


                        fading =
                            false;


                        resolve();

                        return;

                    }


                    setTimeout(
                        step,
                        FADE_INTERVAL_MS
                    );

                }


                step();

            }
        );

    }


    /* =========================================================
       FADE IN
    ========================================================= */

    function fadeIn(
        duration = FADE_IN_MS
    ) {

        if (
            !playerReady ||
            !player
        ) {

            return Promise.resolve();

        }


        fadeToken++;


        const currentToken =
            fadeToken;


        fading =
            true;


        return new Promise(
            resolve => {

                const targetVolume =
                    getEffectiveVolume();


                /*
                 * 被靜音時
                 * 不要把音量拉起來
                 */

                if (
                    targetVolume <= 0
                ) {

                    setPlayerVolume(
                        0
                    );


                    fading =
                        false;


                    resolve();

                    return;

                }


                const startTime =
                    performance.now();


                function step() {

                    if (
                        currentToken !==
                        fadeToken
                    ) {

                        resolve();

                        return;

                    }


                    const elapsed =
                        performance.now()
                        -
                        startTime;


                    const progress =
                        Math.min(
                            1,
                            elapsed /
                            duration
                        );


                    /*
                     * ease-in-out
                     */

                    const eased =
                        progress *
                        progress *
                        (
                            3 -
                            2 *
                            progress
                        );


                    const nextVolume =
                        targetVolume *
                        eased;


                    setPlayerVolume(
                        nextVolume
                    );


                    if (
                        progress >= 1
                    ) {

                        setPlayerVolume(
                            targetVolume
                        );


                        fading =
                            false;


                        resolve();

                        return;

                    }


                    setTimeout(
                        step,
                        FADE_INTERVAL_MS
                    );

                }


                step();

            }
        );

    }


    /* =========================================================
       CHANGE TRACK WITH FADE
    ========================================================= */

    async function transitionToTrack(
        newIndex,
        options = {}
    ) {

        const {
            autoplay = true,
            sfx = true
        } =
            options;


        if (
            !tracks[newIndex]
        )
            return;


        /*
         * 避免同一首重複 transition
         */

        if (
            newIndex ===
            currentTrackIndex &&
            playerReady &&
            playing &&
            autoplay
        ) {

            return;

        }


        /*
         * 停止上一次 transition
         */

        fadeToken++;


        /*
         * 如果目前正在播放
         * 先 Fade Out
         */

        if (
            playerReady &&
            player &&
            playing
        ) {

            await fadeOut(
                FADE_OUT_MS
            );

        }


        /*
         * 更新索引
         */

        currentTrackIndex =
            newIndex;


        renderPlaylist();

        updateMusicUI();


        /*
         * 載入新歌曲
         */

        if (
            playerReady &&
            player
        ) {

            try {

                setPlayerVolume(
                    0
                );


                if (
                    sfx
                ) {

                    playInterfaceSfx(
                        "click"
                    );

                }


                player.loadVideoById(
                    tracks[
                        currentTrackIndex
                    ].id
                );


                pendingPlayRequest =
                    autoplay;


            } catch (
                error
            ) {

                console.warn(
                    "Track load error:",
                    error
                );

            }

        }

    }


    /* =========================================================
       PLAY CURRENT TRACK
    ========================================================= */

    function playCurrentTrack() {

        if (
            !playerReady ||
            !player
        )
            return;


        try {

            setPlayerVolume(
                0
            );


            player.playVideo();


            playing =
                true;


            updateMusicUI();

            renderPlaylist();


            /*
             * YouTube PLAYING state
             * 之後會再觸發 fade in。
             */

            if (
                player.getPlayerState &&
                player.getPlayerState() ===
                YT.PlayerState.PLAYING
            ) {

                fadeIn(
                    FADE_IN_MS
                );

            }

        } catch (
            error
        ) {

            console.warn(
                "Play error:",
                error
            );

        }

    }


    /* =========================================================
       PLAY TRACK DIRECT
    ========================================================= */

    function playTrack(
        index
    ) {

        transitionToTrack(
            index,
            {
                autoplay:
                    true,

                sfx:
                    true

            }
        );

    }


    /* =========================================================
       PLAY / PAUSE
    ========================================================= */

    function togglePlayback() {

        if (
            !playerReady ||
            !player
        )
            return;


        getAudioContext();


        playInterfaceSfx(
            "click"
        );


        /*
         * 正在播放
         */

        if (
            playing
        ) {

            fadeOut(
                FADE_OUT_MS
            )
            .then(
                () => {

                    if (
                        player &&
                        player.pauseVideo
                    ) {

                        player.pauseVideo();

                    }


                    playing =
                        false;


                    updateMusicUI();

                }
            );


            return;

        }


        /*
         * 沒播放
         */

        try {

            setPlayerVolume(
                0
            );


            player.playVideo();


            /*
             * 真正 PLAYING 後
             * fadeIn
             */

        } catch (
            error
        ) {

            console.warn(
                "Play error:",
                error
            );

        }

    }


    /* =========================================================
       NEXT
    ========================================================= */

    function nextTrack() {

        if (
            tracks.length ===
            0
        )
            return;


        const next =
            (
                currentTrackIndex +
                1
            )
            %
            tracks.length;


        transitionToTrack(
            next,
            {
                autoplay:
                    true,

                sfx:
                    true

            }
        );

    }


    /* =========================================================
       PREVIOUS
    ========================================================= */

    function previousTrack() {

        if (
            tracks.length ===
            0
        )
            return;


        const previous =
            (
                currentTrackIndex -
                1 +
                tracks.length
            )
            %
            tracks.length;


        transitionToTrack(
            previous,
            {
                autoplay:
                    true,

                sfx:
                    true

            }
        );

    }


    /* =========================================================
       REMOVE TRACK
    ========================================================= */

    function removeTrack(
        index
    ) {

        if (
            index < 0 ||
            index >= tracks.length
        )
            return;


        const removedCurrent =
            index ===
            currentTrackIndex;


        tracks.splice(
            index,
            1
        );


        /*
         * 沒歌曲
         */

        if (
            tracks.length ===
            0
        ) {

            currentTrackIndex =
                0;


            playing =
                false;


            if (
                player &&
                player.stopVideo
            ) {

                player.stopVideo();

            }


            setPlayerVolume(
                0
            );


            renderPlaylist();

            updateMusicUI();

            return;

        }


        /*
         * 如果刪的是目前歌曲
         */

        if (
            removedCurrent
        ) {

            if (
                currentTrackIndex >=
                tracks.length
            ) {

                currentTrackIndex =
                    0;

            }


            transitionToTrack(
                currentTrackIndex,
                {
                    autoplay:
                        true,

                    sfx:
                        false

                }
            );


            return;

        }


        /*
         * 刪除前面的歌曲
         */

        if (
            index <
            currentTrackIndex
        ) {

            currentTrackIndex--;

        }


        renderPlaylist();

        updateMusicUI();

    }


    /* =========================================================
       EXTRACT YOUTUBE ID
    ========================================================= */

    function extractYoutubeId(
        value
    ) {

        if (
            !value
        )
            return null;


        value =
            value.trim();


        /*
         * 直接輸入 ID
         */

        if (
            /^[a-zA-Z0-9_-]{11}$/
                .test(
                    value
                )
        ) {

            return value;

        }


        try {

            const url =
                new URL(
                    value
                );


            /*
             * youtu.be
             */

            if (
                url.hostname
                    .includes(
                        "youtu.be"
                    )
            ) {

                const id =
                    url.pathname
                        .replace(
                            "/",
                            ""
                        );


                if (
                    /^[a-zA-Z0-9_-]{11}$/
                        .test(
                            id
                        )
                ) {

                    return id;

                }

            }


            /*
             * youtube.com
             */

            if (
                url.hostname
                    .includes(
                        "youtube.com"
                    )
            ) {

                const id =
                    url.searchParams.get(
                        "v"
                    );


                if (
                    id &&
                    /^[a-zA-Z0-9_-]{11}$/
                        .test(
                            id
                        )
                ) {

                    return id;

                }


                /*
                 * /embed/ID
                 * /shorts/ID
                 */

                const parts =
                    url.pathname
                        .split(
                            "/"
                        )
                        .filter(
                            Boolean
                        );


                const last =
                    parts[
                        parts.length - 1
                    ];


                if (
                    /^[a-zA-Z0-9_-]{11}$/
                        .test(
                            last
                        )
                ) {

                    return last;

                }

            }

        } catch (
            error
        ) {}


        return null;

    }


    /* =========================================================
       FETCH YOUTUBE TITLE
    ========================================================= */

    async function fetchYoutubeTitle(
        id
    ) {

        try {

            const response =
                await fetch(
                    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
                );


            if (
                !response.ok
            )
                return null;


            const data =
                await response.json();


            if (
                data &&
                data.title
            ) {

                return data.title;

            }

        } catch (
            error
        ) {}


        return null;

    }


    /* =========================================================
       ESCAPE HTML
    ========================================================= */

    function escapeHtml(
        value
    ) {

        return String(
            value
        )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

    }


    /* =========================================================
       RENDER PLAYLIST
    ========================================================= */

    function renderPlaylist() {

        if (
            !musicList
        )
            return;


        musicList.innerHTML =
            "";


        if (
            tracks.length ===
            0
        ) {

            musicList.innerHTML = `

                <div
                    style="
                        padding:20px;
                        text-align:center;
                        color:#8ca1ad;
                        font-size:10px;
                        letter-spacing:1px;
                    "
                >
                    NO TRACKS
                </div>

            `;


            updateMusicUI();

            return;

        }


        tracks.forEach(
            (
                track,
                index
            ) => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "track";


                if (
                    index ===
                    currentTrackIndex
                ) {

                    item.classList.add(
                        "active"
                    );

                }


                item.innerHTML = `

                    <div class="track-number">

                        ${String(
                            index + 1
                        ).padStart(
                            2,
                            "0"
                        )}

                    </div>


                    <div class="track-name">

                        ${escapeHtml(
                            track.name
                        )}

                    </div>


                    <button
                        class="track-remove"
                        type="button"
                        aria-label="Remove track"
                    >
                        ×
                    </button>

                `;


                /*
                 * 選擇歌曲
                 */

                item.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target.classList
                                .contains(
                                    "track-remove"
                                )
                        ) {

                            return;

                        }


                        playTrack(
                            index
                        );

                    }
                );


                /*
                 * 刪除歌曲
                 */

                const removeButton =
                    item.querySelector(
                        ".track-remove"
                    );


                removeButton.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        playInterfaceSfx(
                            "click"
                        );


                        removeTrack(
                            index
                        );

                    }
                );


                musicList.appendChild(
                    item
                );

            }
        );


        updateMusicUI();

    }


    /* =========================================================
       MUSIC UI
    ========================================================= */

    function updateMusicUI() {

        if (
            musicButton
        ) {

            musicButton.textContent =
                playing
                    ? "Ⅱ"
                    : "♫";


            musicButton.classList.toggle(
                "playing",
                playing
            );

        }


        if (
            playButton
        ) {

            playButton.textContent =
                playing
                    ? "Ⅱ"
                    : "▶";

        }


        if (
            musicPanel
        ) {

            musicPanel.classList.toggle(
                "playing",
                playing
            );

        }


        if (
            nowPlaying
        ) {

            if (
                tracks[currentTrackIndex]
            ) {

                nowPlaying.textContent =
                    tracks[
                        currentTrackIndex
                    ].name;

            } else {

                nowPlaying.textContent =
                    "—";

            }

        }

    }


    /* =========================================================
       MUSIC BUTTON
    ========================================================= */

    if (
        musicButton
    ) {

        musicButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                getAudioContext();


                playInterfaceSfx(
                    "click"
                );


                musicPanel.classList.toggle(
                    "open"
                );

            }
        );

    }


    /* =========================================================
       PLAY BUTTON
    ========================================================= */

    if (
        playButton
    ) {

        playButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                togglePlayback();

            }
        );

    }


    /* =========================================================
       PREVIOUS
    ========================================================= */

    if (
        previousButton
    ) {

        previousButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                previousTrack();

            }
        );

    }


    /* =========================================================
       NEXT
    ========================================================= */

    if (
        nextButton
    ) {

        nextButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                nextTrack();

            }
        );

    }


    /* =========================================================
       ADD YOUTUBE
    ========================================================= */

    if (
        youtubeAdd
    ) {

        youtubeAdd.addEventListener(
            "click",
            async () => {

                const raw =
                    youtubeInput
                        .value
                        .trim();


                const id =
                    extractYoutubeId(
                        raw
                    );


                if (
                    !id
                ) {

                    youtubeInput.value =
                        "";


                    youtubeInput.placeholder =
                        "Invalid YouTube URL";


                    setTimeout(
                        () => {

                            youtubeInput.placeholder =
                                "Paste YouTube URL or ID...";

                        },
                        1800
                    );


                    playInterfaceSfx(
                        "click"
                    );


                    return;

                }


                youtubeAdd.disabled =
                    true;


                youtubeAdd.textContent =
                    "...";


                const title =
                    await fetchYoutubeTitle(
                        id
                    );


                tracks.push({

                    name:
                        title ||
                        `Track [${id}]`,

                    id:
                        id

                });


                currentTrackIndex =
                    tracks.length -
                    1;


                youtubeInput.value =
                    "";


                youtubeAdd.disabled =
                    false;


                youtubeAdd.textContent =
                    "ADD";


                renderPlaylist();


                /*
                 * 新歌曲直接走 Fade transition
                 */

                await transitionToTrack(
                    currentTrackIndex,
                    {
                        autoplay:
                            true,

                        sfx:
                            true

                    }
                );

            }
        );

    }


    /* =========================================================
       ENTER KEY IN INPUT
    ========================================================= */

    if (
        youtubeInput
    ) {

        youtubeInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();


                    if (
                        youtubeAdd &&
                        !youtubeAdd.disabled
                    ) {

                        youtubeAdd.click();

                    }

                }

            }
        );

    }


    /* =========================================================
       CLOSE MUSIC PANEL
    ========================================================= */

    document.addEventListener(
        "click",
        event => {

            if (
                musicPanel &&
                !musicPanel.contains(
                    event.target
                ) &&
                musicButton &&
                !musicButton.contains(
                    event.target
                )
            ) {

                musicPanel.classList.remove(
                    "open"
                );

            }

        }
    );


    /* =========================================================
       YOUTUBE API
    ========================================================= */

    function loadYouTubeAPI() {

        if (
            window.YT &&
            window.YT.Player
        ) {

            initPlayer();

            return;

        }


        if (
            apiLoading
        )
            return;


        apiLoading =
            true;


        const script =
            document.createElement(
                "script"
            );


        script.src =
            "https://www.youtube.com/iframe_api";


        document.head.appendChild(
            script
        );


        window.onYouTubeIframeAPIReady =
            function () {

                initPlayer();

            };

    }


    /* =========================================================
       INIT PLAYER
    ========================================================= */

    function initPlayer() {

        if (
            player
        )
            return;


        player =
            new YT.Player(
                "youtube-player",
                {

                    videoId:
                        tracks.length
                            ? tracks[0].id
                            : "",


                    width:
                        1,

                    height:
                        1,


                    playerVars: {

                        autoplay:
                            0,

                        controls:
                            0,

                        disablekb:
                            1,

                        fs:
                            0,

                        iv_load_policy:
                            3,

                        modestbranding:
                            1,

                        playsinline:
                            1,

                        rel:
                            0

                    },


                    events: {

                        onReady:
                            function () {

                                playerReady =
                                    true;


                                applyVolume();


                                createVolumeUI();


                                renderPlaylist();


                                updateMusicUI();

                            },


                        onStateChange:
                            function (
                                event
                            ) {

                                /*
                                 * 開始播放
                                 */

                                if (
                                    event.data ===
                                    YT.PlayerState.PLAYING
                                ) {

                                    playing =
                                        true;


                                    updateMusicUI();


                                    /*
                                     * 每次真正進入
                                     * PLAYING 都從 0
                                     * Fade In
                                     */

                                    if (
                                        pendingPlayRequest ||
                                        fading === false
                                    ) {

                                        pendingPlayRequest =
                                            false;


                                        fadeIn(
                                            FADE_IN_MS
                                        );

                                    }

                                }


                                /*
                                 * 暫停
                                 */

                                if (
                                    event.data ===
                                    YT.PlayerState.PAUSED
                                ) {

                                    /*
                                     * 如果只是我們
                                     * 自己 fade-out 後
                                     * pause，不需要亂改
                                     */

                                    if (
                                        !fading
                                    ) {

                                        playing =
                                            false;

                                    }


                                    updateMusicUI();

                                }


                                /*
                                 * 自然結束
                                 */

                                if (
                                    event.data ===
                                    YT.PlayerState.ENDED
                                ) {

                                    playing =
                                        false;


                                    updateMusicUI();


                                    /*
                                     * 下一首
                                     */

                                    nextTrack();

                                }


                                /*
                                 * 緩衝
                                 */

                                if (
                                    event.data ===
                                    YT.PlayerState.BUFFERING
                                ) {

                                    /*
                                     * 不改 playing
                                     */

                                }


                                updateMusicUI();

                            }

                    }

                }
            );

    }


    /* =========================================================
       START MUSIC FROM INDEX
    ========================================================= */

    window.startMusic =
        function () {

            if (
                !playerReady ||
                !player
            ) {

                return;

            }


            getAudioContext();


            try {

                /*
                 * 如果尚未選曲
                 */

                if (
                    !tracks[currentTrackIndex]
                ) {

                    return;

                }


                /*
                 * 從目前歌曲開始
                 */

                setPlayerVolume(
                    0
                );


                pendingPlayRequest =
                    true;


                player.playVideo();


                /*
                 * 某些情況 YouTube
                 * 已經正在播放
                 */

                if (
                    player.getPlayerState &&
                    player.getPlayerState() ===
                    YT.PlayerState.PLAYING
                ) {

                    playing =
                        true;


                    pendingPlayRequest =
                        false;


                    fadeIn(
                        FADE_IN_MS
                    );

                }


            } catch (
                error
            ) {

                console.warn(
                    "startMusic error:",
                    error
                );

            }

        };


    /* =========================================================
       INITIALIZE UI
    ========================================================= */

    createVolumeUI();

    renderPlaylist();

    updateMusicUI();

    loadYouTubeAPI();

})();
