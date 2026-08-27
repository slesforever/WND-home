(function () {

    "use strict";


    /* =========================================================
       CONFIG
    ========================================================= */

    const DEFAULT_VOLUME = 100;

    /*
     * UI 可以到 200%
     *
     * 注意：
     * YouTube IFrame Player API 實際 setVolume() 上限為 100。
     * 因此目前 101~200 是保留的 Boost 顯示區。
     *
     * 之後若改成直接 MP3 + Web Audio，
     * 才能真正做 100% 以上的增益。
     */

    const MAX_VOLUME = 200;


    /*
     * Fade 時間
     */

    const FADE_OUT_TIME = 800;

    const FADE_IN_TIME = 1200;

    const FADE_STEP = 20;


    /*
     * localStorage
     */

    const VOLUME_KEY =
        "wnd_music_volume";


    const MUTED_KEY =
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


    let isPlaying =
        false;


    let currentTrackIndex =
        0;


    let expectedVideoId =
        null;


    /*
     * 開機時可能還沒初始化 YouTube。
     *
     * 這個 flag 會記住玩家是否要求自動播放。
     */

    let startMusicRequested =
        window.__WND_START_MUSIC_REQUESTED === true;


    /*
     * 是否正在切換歌曲
     */

    let isTransitioning =
        false;


    /*
     * Fade timer
     */

    let fadeTimer =
        null;


    /*
     * 每次切歌都增加。
     *
     * 舊操作完成時如果 ID 不同，
     * 就不再繼續執行。
     */

    let operationId =
        0;


    /*
     * YouTube API 是否正在載入
     */

    let youtubeApiLoading =
        false;


    /* =========================================================
       VOLUME
    ========================================================= */

    function loadVolume() {

        try {

            const raw =
                localStorage.getItem(
                    VOLUME_KEY
                );


            if (
                raw === null
            ) {

                return DEFAULT_VOLUME;

            }


            const value =
                Number(raw);


            if (
                Number.isFinite(value) &&
                value >= 0 &&
                value <= MAX_VOLUME
            ) {

                return value;

            }

        } catch (
            error
        ) {

            console.warn(
                "Unable to load volume:",
                error
            );

        }


        return DEFAULT_VOLUME;

    }


    let volume =
        loadVolume();


    /* =========================================================
       MUTE
    ========================================================= */

    function loadMuted() {

        try {

            return (
                localStorage.getItem(
                    MUTED_KEY
                ) === "true"
            );

        } catch (
            error
        ) {

            return false;

        }

    }


    let muted =
        loadMuted();


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
       AUDIO CONTEXT
    ========================================================= */

    let audioContext =
        null;


    function getAudioContext() {

        if (
            !audioContext
        ) {

            const AudioContext =
                window.AudioContext ||
                window.webkitAudioContext;


            if (
                AudioContext
            ) {

                audioContext =
                    new AudioContext();

            }

        }


        if (
            audioContext &&
            audioContext.state ===
            "suspended"
        ) {

            audioContext
                .resume()
                .catch(
                    () => {}
                );

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

        const ctx =
            getAudioContext();


        if (
            !ctx
        )
            return;


        try {

            const now =
                ctx.currentTime;


            /* =================================================
               BOOT
            ================================================= */

            if (
                type === "boot"
            ) {

                const osc =
                    ctx.createOscillator();


                const gain =
                    ctx.createGain();


                osc.type =
                    "sine";


                osc.frequency.setValueAtTime(
                    180,
                    now
                );


                osc.frequency.exponentialRampToValueAtTime(
                    760,
                    now + 0.72
                );


                gain.gain.setValueAtTime(
                    0.0001,
                    now
                );


                gain.gain.exponentialRampToValueAtTime(
                    0.055,
                    now + 0.18
                );


                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    now + 1.08
                );


                osc.connect(
                    gain
                );


                gain.connect(
                    ctx.destination
                );


                osc.start(
                    now
                );


                osc.stop(
                    now + 1.1
                );


                const sparkle =
                    ctx.createOscillator();


                const sparkleGain =
                    ctx.createGain();


                sparkle.type =
                    "sine";


                sparkle.frequency.setValueAtTime(
                    1200,
                    now + 0.22
                );


                sparkle.frequency.exponentialRampToValueAtTime(
                    1750,
                    now + 0.78
                );


                sparkleGain.gain.setValueAtTime(
                    0.0001,
                    now
                );


                sparkleGain.gain.exponentialRampToValueAtTime(
                    0.025,
                    now + 0.40
                );


                sparkleGain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    now + 0.95
                );


                sparkle.connect(
                    sparkleGain
                );


                sparkleGain.connect(
                    ctx.destination
                );


                sparkle.start(
                    now + 0.18
                );


                sparkle.stop(
                    now + 1.0
                );


                return;

            }


            /* =================================================
               CLICK
            ================================================= */

            if (
                type === "click"
            ) {

                const osc =
                    ctx.createOscillator();


                const gain =
                    ctx.createGain();


                osc.type =
                    "sine";


                osc.frequency.setValueAtTime(
                    640,
                    now
                );


                osc.frequency.exponentialRampToValueAtTime(
                    360,
                    now + 0.10
                );


                gain.gain.setValueAtTime(
                    0.034,
                    now
                );


                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    now + 0.11
                );


                osc.connect(
                    gain
                );


                gain.connect(
                    ctx.destination
                );


                osc.start(
                    now
                );


                osc.stop(
                    now + 0.12
                );


                return;

            }


            /* =================================================
               PAGE
            ================================================= */

            if (
                type === "page"
            ) {

                const osc =
                    ctx.createOscillator();


                const gain =
                    ctx.createGain();


                osc.type =
                    "triangle";


                osc.frequency.setValueAtTime(
                    250,
                    now
                );


                osc.frequency.exponentialRampToValueAtTime(
                    540,
                    now + 0.17
                );


                gain.gain.setValueAtTime(
                    0.037,
                    now
                );


                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    now + 0.20
                );


                osc.connect(
                    gain
                );


                gain.connect(
                    ctx.destination
                );


                osc.start(
                    now
                );


                osc.stop(
                    now + 0.21
                );


                const high =
                    ctx.createOscillator();


                const highGain =
                    ctx.createGain();


                high.type =
                    "sine";


                high.frequency.setValueAtTime(
                    920,
                    now + 0.025
                );


                highGain.gain.setValueAtTime(
                    0.020,
                    now + 0.025
                );


                highGain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    now + 0.125
                );


                high.connect(
                    highGain
                );


                highGain.connect(
                    ctx.destination
                );


                high.start(
                    now + 0.025
                );


                high.stop(
                    now + 0.14
                );

            }

        } catch (
            error
        ) {

            console.warn(
                "SFX error:",
                error
            );

        }

    }


    window.playInterfaceSfx =
        playInterfaceSfx;


    /* =========================================================
       EFFECTIVE YOUTUBE VOLUME
    ========================================================= */

    function getEffectiveVolume() {

        if (
            muted
        ) {

            return 0;

        }


        /*
         * YouTube IFrame API：
         * 真正只支援 0~100。
         */

        return Math.max(
            0,
            Math.min(
                100,
                volume
            )
        );

    }


    /* =========================================================
       SET PLAYER VOLUME
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
                    Number(value) || 0
                )
            );


        try {

            player.setVolume(
                safeValue
            );

        } catch (
            error
        ) {

            console.warn(
                "setVolume failed:",
                error
            );

        }

    }


    /* =========================================================
       APPLY USER VOLUME
    ========================================================= */

    function applyVolume() {

        setPlayerVolume(
            getEffectiveVolume()
        );

    }


    /* =========================================================
       SAVE VOLUME
    ========================================================= */

    function saveVolume() {

        try {

            localStorage.setItem(
                VOLUME_KEY,
                String(volume)
            );

        } catch (
            error
        ) {}

    }


    /* =========================================================
       SAVE MUTE
    ========================================================= */

    function saveMuted() {

        try {

            localStorage.setItem(
                MUTED_KEY,
                String(muted)
            );

        } catch (
            error
        ) {}

    }


    /* =========================================================
       VOLUME UI
    ========================================================= */

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
         * 已經建立
         */

        if (
            document.getElementById(
                "wnd-volume-control"
            )
        ) {

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


            updateVolumeUI();


            return;

        }


        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.id =
            "wnd-volume-control";


        wrapper.innerHTML = `

            <style>

                #wnd-volume-control {

                    padding:
                        11px 14px 13px;

                    border-top:
                        1px solid
                        rgba(83,187,224,.13);

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

                    width:
                        50px;

                    flex-shrink:
                        0;

                    color:
                        #7d96a4;

                    font-size:
                        8px;

                    font-weight:
                        700;

                    letter-spacing:
                        1.4px;

                }


                .wnd-volume-slider {

                    flex:
                        1;

                    min-width:
                        0;

                    height:
                        4px;

                    margin:
                        0;

                    appearance:
                        none;

                    -webkit-appearance:
                        none;

                    border-radius:
                        10px;

                    outline:
                        none;

                    cursor:
                        pointer;

                    background:
                        #63d2fa;

                }


                .wnd-volume-slider::-webkit-slider-thumb {

                    appearance:
                        none;

                    -webkit-appearance:
                        none;

                    width:
                        13px;

                    height:
                        13px;

                    border:
                        2px solid
                        white;

                    border-radius:
                        50%;

                    background:
                        #63d2fa;

                    box-shadow:
                        0 0 9px
                        rgba(99,210,250,.50);

                }


                .wnd-volume-slider::-moz-range-thumb {

                    width:
                        13px;

                    height:
                        13px;

                    border:
                        2px solid
                        white;

                    border-radius:
                        50%;

                    background:
                        #63d2fa;

                    box-shadow:
                        0 0 9px
                        rgba(99,210,250,.50);

                }


                .wnd-volume-value {

                    width:
                        48px;

                    flex-shrink:
                        0;

                    text-align:
                        right;

                    color:
                        #5b8498;

                    font-size:
                        9px;

                    font-weight:
                        700;

                }


                .wnd-volume-value.boost {

                    color:
                        #4b9fbd;

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

                    padding:
                        4px 8px;

                    border:
                        1px solid
                        rgba(99,210,250,.20);

                    background:
                        rgba(255,255,255,.40);

                    color:
                        #668c9c;

                    cursor:
                        pointer;

                    font-family:
                        inherit;

                    font-size:
                        8px;

                    font-weight:
                        700;

                }


                .wnd-mute:hover {

                    background:
                        rgba(99,210,250,.12);

                }


                .wnd-volume-note {

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
                    max="${MAX_VOLUME}"
                    step="1"
                    value="${volume}"
                >


                <div
                    id="wnd-volume-value"
                    class="wnd-volume-value"
                >
                    ${volume}%
                </div>

            </div>


            <div class="wnd-volume-bottom">

                <button
                    id="wnd-mute"
                    class="wnd-mute"
                    type="button"
                >
                    ${muted ? "UNMUTE" : "MUTE"}
                </button>


                <div class="wnd-volume-note">
                    200% RANGE
                </div>

            </div>

        `;


        musicPanel.appendChild(
            wrapper
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


        updateVolumeUI();


        /* =====================================================
           VOLUME SLIDER
        ===================================================== */

        volumeSlider.addEventListener(
            "input",
            function () {

                volume =
                    Number(
                        this.value
                    );


                /*
                 * 手動調整音量時，
                 * 自動取消 mute。
                 */

                muted =
                    false;


                saveVolume();

                saveMuted();

                updateVolumeUI();

                applyVolume();

            }
        );


        /* =====================================================
           MUTE
        ===================================================== */

        muteButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();


                muted =
                    !muted;


                saveMuted();

                updateVolumeUI();

                applyVolume();


                playInterfaceSfx(
                    "click"
                );

            }
        );

    }


    /* =========================================================
       UPDATE VOLUME UI
    ========================================================= */

    function updateVolumeUI() {

        if (
            !volumeSlider ||
            !volumeValue ||
            !muteButton
        )
            return;


        volumeSlider.value =
            String(
                volume
            );


        volumeValue.textContent =
            muted
                ? "MUTE"
                : `${volume}%`;


        volumeValue.classList.toggle(
            "boost",
            volume >
                100 &&
                !muted
        );


        muteButton.textContent =
            muted
                ? "UNMUTE"
                : "MUTE";


        /*
         * Slider 顯示
         */

        const percentage =
            (
                volume /
                MAX_VOLUME
            )
            *
            100;


        volumeSlider.style.background =
            `
                linear-gradient(
                    to right,
                    #63d2fa 0%,
                    #63d2fa ${percentage}%,
                    rgba(120,165,180,.18) ${percentage}%,
                    rgba(120,165,180,.18) 100%
                )
            `;

    }


    /* =========================================================
       STOP FADE
    ========================================================= */

    function stopFade() {

        if (
            fadeTimer !== null
        ) {

            clearTimeout(
                fadeTimer
            );


            fadeTimer =
                null;

        }

    }


    /* =========================================================
       FADE OUT
    ========================================================= */

    function fadeOut(
        callback
    ) {

        stopFade();


        if (
            !playerReady ||
            !player
        ) {

            if (
                callback
            ) {

                callback();

            }


            return;

        }


        let startVolume =
            0;


        try {

            startVolume =
                Number(
                    player.getVolume()
                );

        } catch (
            error
        ) {

            startVolume =
                getEffectiveVolume();

        }


        if (
            !Number.isFinite(
                startVolume
            )
        ) {

            startVolume =
                getEffectiveVolume();

        }


        /*
         * 已經沒聲音
         */

        if (
            startVolume <=
            0
        ) {

            setPlayerVolume(
                0
            );


            if (
                callback
            ) {

                callback();

            }


            return;

        }


        const startTime =
            performance.now();


        function step() {

            const elapsed =
                performance.now()
                -
                startTime;


            const progress =
                Math.min(
                    1,
                    elapsed /
                    FADE_OUT_TIME
                );


            /*
             * ease out
             */

            const eased =
                1 -
                Math.pow(
                    1 -
                    progress,
                    2
                );


            const nextVolume =
                startVolume *
                (
                    1 -
                    eased
                );


            setPlayerVolume(
                nextVolume
            );


            if (
                progress >=
                1
            ) {

                setPlayerVolume(
                    0
                );


                fadeTimer =
                    null;


                if (
                    callback
                ) {

                    callback();

                }


                return;

            }


            fadeTimer =
                setTimeout(
                    step,
                    FADE_STEP
                );

        }


        step();

    }


    /* =========================================================
       FADE IN
    ========================================================= */

    function fadeIn() {

        stopFade();


        if (
            !playerReady ||
            !player
        )
            return;


        const targetVolume =
            getEffectiveVolume();


        if (
            targetVolume <=
            0
        ) {

            setPlayerVolume(
                0
            );


            return;

        }


        setPlayerVolume(
            0
        );


        const startTime =
            performance.now();


        function step() {

            const elapsed =
                performance.now()
                -
                startTime;


            const progress =
                Math.min(
                    1,
                    elapsed /
                    FADE_IN_TIME
                );


            /*
             * SmoothStep
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
                progress >=
                1
            ) {

                setPlayerVolume(
                    targetVolume
                );


                fadeTimer =
                    null;


                return;

            }


            fadeTimer =
                setTimeout(
                    step,
                    FADE_STEP
                );

        }


        step();

    }


    /* =========================================================
       CURRENT TRACK
    ========================================================= */

    function getCurrentTrack() {

        return (
            tracks[
                currentTrackIndex
            ] ||
            null
        );

    }


    /* =========================================================
       UPDATE MUSIC UI
    ========================================================= */

    function updateMusicUI() {

        const current =
            getCurrentTrack();


        if (
            nowPlaying
        ) {

            nowPlaying.textContent =
                current
                    ? current.name
                    : "—";

        }


        if (
            playButton
        ) {

            playButton.textContent =
                isPlaying
                    ? "Ⅱ"
                    : "▶";

        }


        if (
            musicButton
        ) {

            musicButton.textContent =
                isPlaying
                    ? "Ⅱ"
                    : "♫";


            musicButton.classList.toggle(
                "playing",
                isPlaying
            );

        }


        if (
            musicPanel
        ) {

            musicPanel.classList.toggle(
                "playing",
                isPlaying
            );

        }

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


                const number =
                    document.createElement(
                        "div"
                    );


                number.className =
                    "track-number";


                number.textContent =
                    String(
                        index + 1
                    ).padStart(
                        2,
                        "0"
                    );


                const name =
                    document.createElement(
                        "div"
                    );


                name.className =
                    "track-name";


                name.textContent =
                    track.name;


                const remove =
                    document.createElement(
                        "button"
                    );


                remove.type =
                    "button";


                remove.className =
                    "track-remove";


                remove.textContent =
                    "×";


                item.appendChild(
                    number
                );


                item.appendChild(
                    name
                );


                item.appendChild(
                    remove
                );


                /*
                 * 選歌
                 */

                item.addEventListener(
                    "click",
                    function (event) {

                        if (
                            event.target ===
                            remove
                        ) {

                            return;

                        }


                        playTrack(
                            index
                        );

                    }
                );


                /*
                 * 刪歌
                 */

                remove.addEventListener(
                    "click",
                    function (event) {

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
       PLAY TRACK
    ========================================================= */

    function playTrack(
        index
    ) {

        if (
            index < 0 ||
            index >= tracks.length
        ) {

            return;

        }


        /*
         * 如果已經是目前播放歌曲，
         * 不重新切歌。
         */

        if (
            index ===
            currentTrackIndex &&
            isPlaying
        ) {

            return;

        }


        switchTrack(
            index,
            true
        );

    }


    /* =========================================================
       SWITCH TRACK
    ========================================================= */

    function switchTrack(
        targetIndex,
        autoplay = true
    ) {

        if (
            targetIndex < 0 ||
            targetIndex >= tracks.length
        ) {

            return;

        }


        if (
            !playerReady ||
            !player
        ) {

            /*
             * Player 還沒有 Ready。
             *
             * 只設定目標。
             */

            currentTrackIndex =
                targetIndex;


            expectedVideoId =
                tracks[
                    targetIndex
                ].id;


            pendingAutoplay =
                autoplay;


            startMusicRequested =
                autoplay;


            renderPlaylist();

            updateMusicUI();


            return;

        }


        /*
         * 新 operation。
         */

        const myOperation =
            ++operationId;


        /*
         * 是否原本正在播放
         */

        const oldPlaying =
            isPlaying;


        isTransitioning =
            true;


        /*
         * 如果原本有在播放，
         * 先 fade out。
         */

        const loadTarget =
            () => {

                /*
                 * 如果期間又有別的操作，
                 * 這次作廢。
                 */

                if (
                    myOperation !==
                    operationId
                ) {

                    return;

                }


                const target =
                    tracks[
                        targetIndex
                    ];


                if (
                    !target
                ) {

                    isTransitioning =
                        false;

                    return;

                }


                /*
                 * 這裡才真正改 index。
                 */

                currentTrackIndex =
                    targetIndex;


                expectedVideoId =
                    target.id;


                pendingAutoplay =
                    autoplay;


                renderPlaylist();

                updateMusicUI();


                /*
                 * 先將播放器音量設 0。
                 */

                setPlayerVolume(
                    0
                );


                try {

                    if (
                        autoplay
                    ) {

                        player.loadVideoById(
                            target.id
                        );

                    } else {

                        player.cueVideoById(
                            target.id
                        );

                        isTransitioning =
                            false;

                    }

                } catch (
                    error
                ) {

                    console.error(
                        "Unable to load YouTube track:",
                        error
                    );


                    isTransitioning =
                        false;

                }

            };


        if (
            oldPlaying
        ) {

            fadeOut(
                loadTarget
            );

        } else {

            loadTarget();

        }

    }


    /* =========================================================
       PLAY / PAUSE
    ========================================================= */

    function togglePlayback() {

        /*
         * Player 尚未 Ready。
         *
         * 記住使用者要播放。
         */

        if (
            !playerReady ||
            !player
        ) {

            startMusicRequested =
                true;


            pendingAutoplay =
                true;


            window.__WND_START_MUSIC_REQUESTED =
                true;


            return;

        }


        getAudioContext();


        playInterfaceSfx(
            "click"
        );


        /*
         * Pause
         */

        if (
            isPlaying
        ) {

            isPlaying =
                false;


            updateMusicUI();


            fadeOut(
                () => {

                    try {

                        player.pauseVideo();

                    } catch (
                        error
                    ) {}

                }
            );


            return;

        }


        /*
         * Play
         */

        pendingAutoplay =
            true;


        expectedVideoId =
            getCurrentTrack()
                ? getCurrentTrack().id
                : null;


        setPlayerVolume(
            0
        );


        try {

            player.playVideo();

        } catch (
            error
        ) {

            console.warn(
                "Unable to resume playback:",
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


        const nextIndex =
            (
                currentTrackIndex +
                1
            )
            %
            tracks.length;


        switchTrack(
            nextIndex,
            true
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


        const previousIndex =
            (
                currentTrackIndex -
                1 +
                tracks.length
            )
            %
            tracks.length;


        switchTrack(
            previousIndex,
            true
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
        ) {

            return;

        }


        const removingCurrent =
            index ===
            currentTrackIndex;


        /*
         * =====================================================
         * 刪除「不是目前歌曲」
         * =====================================================
         */

        if (
            !removingCurrent
        ) {

            const removed =
                tracks.splice(
                    index,
                    1
                )[0];


            if (
                !removed
            )
                return;


            /*
             * 被刪歌曲在目前歌曲之前：
             * index 往前移。
             */

            if (
                index <
                currentTrackIndex
            ) {

                currentTrackIndex--;

            }


            /*
             * 保證合法。
             */

            if (
                currentTrackIndex >=
                tracks.length
            ) {

                currentTrackIndex =
                    Math.max(
                        0,
                        tracks.length - 1
                    );

            }


            /*
             * =================================================
             * 防禦檢查
             *
             * 如果 Player 實際上還在播放那首
             * 被刪掉的歌曲，就修正。
             * =================================================
             */

            if (
                playerReady &&
                player
            ) {

                try {

                    const data =
                        player.getVideoData();


                    const actualId =
                        data &&
                        data.video_id
                            ? data.video_id
                            : null;


                    const deletedWasPlaying =
                        actualId ===
                        removed.id;


                    if (
                        deletedWasPlaying
                    ) {

                        /*
                         * 舊歌曲已不存在。
                         *
                         * 如果還有歌，
                         * 換到目前合法歌曲。
                         */

                        if (
                            tracks.length >
                            0
                        ) {

                            switchTrack(
                                Math.min(
                                    currentTrackIndex,
                                    tracks.length - 1
                                ),
                                true
                            );

                        } else {

                            stopFade();


                            try {

                                player.stopVideo();

                            } catch (
                                error
                            ) {}


                            setPlayerVolume(
                                0
                            );


                            isPlaying =
                                false;


                            updateMusicUI();

                        }


                        return;

                    }

                } catch (
                    error
                ) {

                    console.warn(
                        "Removed-track verification failed:",
                        error
                    );

                }

            }


            renderPlaylist();

            updateMusicUI();


            return;

        }


        /*
         * =====================================================
         * 刪除目前歌曲
         * =====================================================
         */

        ++operationId;


        stopFade();


        const wasPlaying =
            isPlaying;


        /*
         * 如果目前正在播放，
         * 先 Fade Out。
         */

        const performRemoval =
            () => {

                const removed =
                    tracks.splice(
                        index,
                        1
                    )[0];


                if (
                    !removed
                ) {

                    isTransitioning =
                        false;

                    return;

                }


                /*
                 * 沒有歌曲
                 */

                if (
                    tracks.length ===
                    0
                ) {

                    currentTrackIndex =
                        0;


                    expectedVideoId =
                        null;


                    pendingAutoplay =
                        false;


                    startMusicRequested =
                        false;


                    window.__WND_START_MUSIC_REQUESTED =
                        false;


                    isPlaying =
                        false;


                    isTransitioning =
                        false;


                    if (
                        playerReady &&
                        player
                    ) {

                        try {

                            player.stopVideo();

                        } catch (
                            error
                        ) {}


                        setPlayerVolume(
                            0
                        );

                    }


                    renderPlaylist();

                    updateMusicUI();


                    return;

                }


                /*
                 * 選擇下一首
                 *
                 * A B C D
                 *   ↑
                 * 刪 B
                 *
                 * A C D
                 *   ↑
                 * 播 C
                 */

                let nextIndex;


                if (
                    index <
                    tracks.length
                ) {

                    nextIndex =
                        index;

                } else {

                    nextIndex =
                        tracks.length - 1;

                }


                currentTrackIndex =
                    nextIndex;


                expectedVideoId =
                    tracks[
                        nextIndex
                    ].id;


                renderPlaylist();

                updateMusicUI();


                /*
                 * 原本沒有播放：
                 *
                 * 只換目前選取項目。
                 */

                if (
                    !wasPlaying
                ) {

                    isPlaying =
                        false;


                    isTransitioning =
                        false;


                    pendingAutoplay =
                        false;


                    try {

                        player.cueVideoById(
                            expectedVideoId
                        );

                    } catch (
                        error
                    ) {}


                    setPlayerVolume(
                        0
                    );


                    updateMusicUI();

                    renderPlaylist();


                    return;

                }


                /*
                 * 原本正在播放：
                 *
                 * 載入新歌曲。
                 */

                isTransitioning =
                    true;


                pendingAutoplay =
                    true;


                setPlayerVolume(
                    0
                );


                try {

                    player.loadVideoById(
                        expectedVideoId
                    );

                } catch (
                    error
                ) {

                    console.error(
                        "Replacement song failed:",
                        error
                    );


                    isTransitioning =
                        false;

                }

            };


        if (
            playerReady &&
            player &&
            wasPlaying
        ) {

            fadeOut(
                performRemoval
            );

        } else {

            performRemoval();

        }

    }


    /* =========================================================
       YOUTUBE ID EXTRACTION
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


            const hostname =
                url.hostname
                    .toLowerCase();


            /*
             * youtu.be
             */

            if (
                hostname.includes(
                    "youtu.be"
                )
            ) {

                const id =
                    url.pathname
                        .replace(
                            /^\/+/,
                            ""
                        )
                        .split(
                            "/"
                        )[0];


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
                hostname.includes(
                    "youtube.com"
                )
            ) {

                /*
                 * ?v=
                 */

                const watchId =
                    url.searchParams.get(
                        "v"
                    );


                if (
                    watchId &&
                    /^[a-zA-Z0-9_-]{11}$/
                        .test(
                            watchId
                        )
                ) {

                    return watchId;

                }


                /*
                 * /shorts/ID
                 * /embed/ID
                 * /v/ID
                 */

                const parts =
                    url.pathname
                        .split(
                            "/"
                        )
                        .filter(
                            Boolean
                        );


                if (
                    parts.length >= 2
                ) {

                    const type =
                        parts[0];


                    const id =
                        parts[1];


                    if (
                        (
                            type ===
                            "shorts" ||
                            type ===
                            "embed" ||
                            type ===
                            "v"
                        ) &&
                        /^[a-zA-Z0-9_-]{11}$/
                            .test(
                                id
                            )
                    ) {

                        return id;

                    }

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
                    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(id)}&format=json`
                );


            if (
                !response.ok
            ) {

                return null;

            }


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
        ) {

            console.warn(
                "YouTube title request failed:",
                error
            );

        }


        return null;

    }


    /* =========================================================
       ADD YOUTUBE TRACK
    ========================================================= */

    if (
        youtubeAdd
    ) {

        youtubeAdd.addEventListener(
            "click",
            async function () {

                if (
                    youtubeAdd.disabled
                )
                    return;


                const raw =
                    youtubeInput
                        ? youtubeInput.value.trim()
                        : "";


                const id =
                    extractYoutubeId(
                        raw
                    );


                /*
                 * Invalid
                 */

                if (
                    !id
                ) {

                    if (
                        youtubeInput
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

                    }


                    playInterfaceSfx(
                        "click"
                    );


                    return;

                }


                youtubeAdd.disabled =
                    true;


                youtubeAdd.textContent =
                    "...";


                /*
                 * 取得標題
                 */

                const title =
                    await fetchYoutubeTitle(
                        id
                    );


                /*
                 * 加入陣列
                 */

                tracks.push({

                    name:
                        title ||
                        `Track [${id}]`,

                    id:
                        id

                });


                /*
                 * 新歌 index
                 */

                const newIndex =
                    tracks.length - 1;


                if (
                    youtubeInput
                ) {

                    youtubeInput.value =
                        "";

                }


                youtubeAdd.disabled =
                    false;


                youtubeAdd.textContent =
                    "ADD";


                /*
                 * 先更新歌單，
                 * 讓 UI 立刻看到新歌。
                 */

                renderPlaylist();


                /*
                 * 最重要：
                 *
                 * 不直接改 currentTrackIndex。
                 *
                 * 統一交給 switchTrack。
                 */

                switchTrack(
                    newIndex,
                    true
                );

            }
        );

    }


    /* =========================================================
       ENTER KEY
    ========================================================= */

    if (
        youtubeInput
    ) {

        youtubeInput.addEventListener(
            "keydown",
            function (event) {

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
       MUSIC BUTTON
    ========================================================= */

    if (
        musicButton
    ) {

        musicButton.addEventListener(
            "click",
            function (event) {

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
            function (event) {

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
            function (event) {

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
            function (event) {

                event.stopPropagation();


                nextTrack();

            }
        );

    }


    /* =========================================================
       CLOSE PANEL OUTSIDE
    ========================================================= */

    document.addEventListener(
        "click",
        function (event) {

            if (
                musicPanel &&
                musicButton &&
                !musicPanel.contains(
                    event.target
                ) &&
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

    function loadYoutubeAPI() {

        /*
         * API 已經存在
         */

        if (
            window.YT &&
            window.YT.Player
        ) {

            initPlayer();

            return;

        }


        /*
         * 已經在載入
         */

        if (
            youtubeApiLoading
        )
            return;


        youtubeApiLoading =
            true;


        const script =
            document.createElement(
                "script"
            );


        script.src =
            "https://www.youtube.com/iframe_api";


        script.async =
            true;


        document.head.appendChild(
            script
        );


        /*
         * YouTube 完成載入
         */

        window.onYouTubeIframeAPIReady =
            function () {

                initPlayer();

            };

    }


    /* =========================================================
       INIT YOUTUBE PLAYER
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

                    /*
                     * 初始載入第一首。
                     *
                     * autoplay 關閉，
                     * 是否播放由 startMusicRequested 決定。
                     */

                    videoId:
                        tracks.length > 0
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

                        /* =====================================
                           READY
                        ===================================== */

                        onReady:
                            function () {

                                playerReady =
                                    true;


                                createVolumeUI();


                                applyVolume();


                                renderPlaylist();


                                updateMusicUI();


                                /*
                                 * =================================================
                                 * 核心：
                                 *
                                 * 如果玩家在 YouTube API Ready
                                 * 前就已經按了 Enter，
                                 * 這裡一定播放。
                                 * =================================================
                                 */

                                if (
                                    startMusicRequested ||
                                    window.__WND_START_MUSIC_REQUESTED === true ||
                                    pendingAutoplay
                                ) {

                                    startMusicRequested =
                                        false;


                                    window.__WND_START_MUSIC_REQUESTED =
                                        false;


                                    pendingAutoplay =
                                        false;


                                    const current =
                                        getCurrentTrack();


                                    if (
                                        current
                                    ) {

                                        currentTrackIndex =
                                            Math.max(
                                                0,
                                                Math.min(
                                                    currentTrackIndex,
                                                    tracks.length - 1
                                                )
                                            );


                                        expectedVideoId =
                                            current.id;


                                        setPlayerVolume(
                                            0
                                        );


                                        try {

                                            player.playVideo();

                                        } catch (
                                            error
                                        ) {

                                            console.warn(
                                                "Queued autoplay failed:",
                                                error
                                            );

                                        }

                                    }

                                }

                            },


                        /* =====================================
                           STATE CHANGE
                        ===================================== */

                        onStateChange:
                            function (
                                event
                            ) {

                                /*
                                 * PLAYING
                                 */

                                if (
                                    event.data ===
                                    YT.PlayerState.PLAYING
                                ) {

                                    let actualId =
                                        null;


                                    try {

                                        const data =
                                            player.getVideoData();


                                        if (
                                            data &&
                                            data.video_id
                                        ) {

                                            actualId =
                                                data.video_id;

                                        }

                                    } catch (
                                        error
                                    ) {}


                                    /*
                                     * 確認真正播放的歌曲
                                     */

                                    if (
                                        actualId
                                    ) {

                                        const realIndex =
                                            tracks.findIndex(
                                                track =>
                                                    track.id ===
                                                    actualId
                                            );


                                        /*
                                         * Player 播放的是
                                         * playlist 中不存在的歌曲。
                                         */

                                        if (
                                            realIndex ===
                                            -1
                                        ) {

                                            try {

                                                player.stopVideo();

                                            } catch (
                                                error
                                            ) {}


                                            isPlaying =
                                                false;


                                            isTransitioning =
                                                false;


                                            updateMusicUI();


                                            renderPlaylist();


                                            return;

                                        }


                                        /*
                                         * 同步。
                                         */

                                        currentTrackIndex =
                                            realIndex;


                                        expectedVideoId =
                                            actualId;

                                    }


                                    isPlaying =
                                        true;


                                    isTransitioning =
                                        false;


                                    pendingAutoplay =
                                        false;


                                    startMusicRequested =
                                        false;


                                    window.__WND_START_MUSIC_REQUESTED =
                                        false;


                                    renderPlaylist();

                                    updateMusicUI();


                                    /*
                                     * 真正開始播放後
                                     * 進行 Fade In。
                                     */

                                    fadeIn();


                                    return;

                                }


                                /*
                                 * PAUSED
                                 */

                                if (
                                    event.data ===
                                    YT.PlayerState.PAUSED
                                ) {

                                    /*
                                     * 正在 transition 時，
                                     * 不要把狀態誤判成一般 pause。
                                     */

                                    if (
                                        !isTransitioning
                                    ) {

                                        isPlaying =
                                            false;


                                        updateMusicUI();

                                    }


                                    return;

                                }


                                /*
                                 * BUFFERING
                                 */

                                if (
                                    event.data ===
                                    YT.PlayerState.BUFFERING
                                ) {

                                    updateMusicUI();


                                    return;

                                }


                                /*
                                 * ENDED
                                 */

                                if (
                                    event.data ===
                                    YT.PlayerState.ENDED
                                ) {

                                    isPlaying =
                                        false;


                                    isTransitioning =
                                        false;


                                    updateMusicUI();


                                    /*
                                     * 自動下一首
                                     */

                                    if (
                                        tracks.length >
                                        0
                                    ) {

                                        nextTrack();

                                    }

                                }

                            }

                    }

                }
            );

    }


    /* =========================================================
       START MUSIC
    ========================================================= */

    window.startMusic =
        function () {

            /*
             * 先記住意圖。
             *
             * 即使此刻 YouTube 還沒 Ready。
             */

            startMusicRequested =
                true;


            pendingAutoplay =
                true;


            window.__WND_START_MUSIC_REQUESTED =
                true;


            /*
             * 還沒 Ready：
             * 等 onReady。
             */

            if (
                !playerReady ||
                !player
            ) {

                return;

            }


            const current =
                getCurrentTrack();


            if (
                !current
            )
                return;


            expectedVideoId =
                current.id;


            setPlayerVolume(
                0
            );


            try {

                player.playVideo();

            } catch (
                error
            ) {

                console.warn(
                    "startMusic failed:",
                    error
                );

            }

        };


    /* =========================================================
       INITIALIZE
    ========================================================= */

    /*
     * 在 API 尚未載入前先建立基本 UI。
     */

    createVolumeUI();


    renderPlaylist();


    updateMusicUI();


    /*
     * 開始載入 YouTube
     */

    loadYoutubeAPI();


})();
