(function () {

    "use strict";


    /* =========================================================
       CONFIGURATION
    ========================================================= */

    const DEFAULT_VOLUME = 100;

    /*
     * UI 可以調到 200%
     *
     * 但是 YouTube IFrame Player API 的 setVolume()
     * 實際上限為 100。
     *
     * 0~100：
     *     直接作用於 YouTube Player。
     *
     * 101~200：
     *     保留給未來真正 Web Audio Boost 使用。
     *
     * 目前不會假裝 YouTube 可以超過 100。
     */

    const MAX_VOLUME = 200;


    const FADE_OUT_TIME = 800;

    const FADE_IN_TIME = 1200;

    const FADE_STEP = 20;


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
       STATE
    ========================================================= */

    let player = null;

    let playerReady = false;

    let currentTrackIndex = 0;

    let isPlaying = false;

    let isTransitioning = false;

    let youtubeApiLoading = false;

    let fadeTimer = null;

    let transitionId = 0;

    let pendingAutoplay = false;


    /* =========================================================
       LOAD SAVED VOLUME
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
                "Unable to load saved volume:",
                error
            );

        }


        return DEFAULT_VOLUME;

    }


    let volume =
        loadVolume();


    /* =========================================================
       LOAD SAVED MUTE
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

    let audioContext = null;


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

            audioContext.resume()
                .catch(() => {});

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
                    now + 0.4
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
                    now + 1
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
                    now + 0.1
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
                    now + 0.2
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
                    0.02,
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
       EFFECTIVE VOLUME
    ========================================================= */

    function getEffectiveVolume() {

        if (
            muted
        ) {

            return 0;

        }


        /*
         * YouTube 真正上限 100
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
                "Unable to apply volume:",
                error
            );

        }

    }


    /* =========================================================
       SAVE SETTINGS
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
       CREATE VOLUME UI
    ========================================================= */

    let volumeSlider = null;

    let volumeValue = null;

    let muteButton = null;


    function createVolumeUI() {

        if (
            !musicPanel
        )
            return;


        /*
         * 避免重複建立
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
                        rgba(99,210,250,.5);

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
                        rgba(99,210,250,.5);

                }


                .wnd-volume-value {

                    width:
                        47px;

                    flex-shrink:
                        0;

                    color:
                        #5b8498;

                    text-align:
                        right;

                    font-size:
                        9px;

                    font-weight:
                        700;

                }


                .wnd-volume-value.boost {

                    color:
                        #4c9dbd;

                }


                .wnd-volume-bottom {

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

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


            <div
                class="wnd-volume-row"
            >

                <div
                    class="wnd-volume-label"
                >
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
                    class="wnd-volume-note"
                >
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


        /* =====================================================
           SLIDER
        ===================================================== */

        volumeSlider.addEventListener(
            "input",
            function () {

                volume =
                    Number(
                        this.value
                    );


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


        updateVolumeUI();

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
            String(volume);


        volumeValue.textContent =
            muted
                ? "MUTE"
                : `${volume}%`;


        volumeValue.classList.toggle(
            "boost",
            volume > 100 &&
            !muted
        );


        muteButton.textContent =
            muted
                ? "UNMUTE"
                : "MUTE";


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
            fadeTimer
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
        duration,
        callback
    ) {

        stopFade();


        if (
            !playerReady ||
            !player
        ) {

            if (
                callback
            )
                callback();


            return;

        }


        let startVolume;


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
            ) ||
            startVolume <= 0
        ) {

            setPlayerVolume(
                0
            );


            if (
                callback
            )
                callback();


            return;

        }


        const startTime =
            performance.now();


        function step() {

            const progress =
                Math.min(
                    1,
                    (
                        performance.now()
                        -
                        startTime
                    )
                    /
                    duration
                );


            const eased =
                1 -
                Math.pow(
                    1 -
                    progress,
                    2
                );


            const current =
                startVolume *
                (
                    1 -
                    eased
                );


            setPlayerVolume(
                current
            );


            if (
                progress >= 1
            ) {

                setPlayerVolume(
                    0
                );


                fadeTimer =
                    null;


                if (
                    callback
                )
                    callback();


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

    function fadeIn(
        duration
    ) {

        stopFade();


        if (
            !playerReady ||
            !player
        )
            return;


        const target =
            getEffectiveVolume();


        if (
            target <= 0
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

            const progress =
                Math.min(
                    1,
                    (
                        performance.now()
                        -
                        startTime
                    )
                    /
                    duration
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


            const current =
                target *
                eased;


            setPlayerVolume(
                current
            );


            if (
                progress >= 1
            ) {

                setPlayerVolume(
                    target
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


        const safe =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(value) || 0
                )
            );


        try {

            player.setVolume(
                safe
            );

        } catch (
            error
        ) {}

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
       UPDATE UI
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


                remove.className =
                    "track-remove";


                remove.type =
                    "button";


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
                 * 播放歌曲
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
                 * 刪除歌曲
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
        targetIndex
    ) {

        if (
            targetIndex < 0 ||
            targetIndex >= tracks.length
        )
            return;


        /*
         * 如果已經就是目前歌曲，
         * 不重新 load。
         */

        if (
            targetIndex ===
            currentTrackIndex &&
            isPlaying
        ) {

            return;

        }


        switchToTrack(
            targetIndex
        );

    }


    /* =========================================================
       SWITCH TRACK
    ========================================================= */

    function switchToTrack(
        targetIndex
    ) {

        if (
            targetIndex < 0 ||
            targetIndex >= tracks.length
        )
            return;


        if (
            !playerReady ||
            !player
        ) {

            /*
             * Player 還沒 ready。
             * 直接記住目標。
             */

            currentTrackIndex =
                targetIndex;


            pendingAutoplay =
                true;


            expectedVideoId =
                tracks[
                    targetIndex
                ].id;


            renderPlaylist();

            updateMusicUI();

            return;

        }


        const requestId =
            ++transitionId;


        const oldWasPlaying =
            isPlaying;


        isTransitioning =
            true;


        stopFade();


        function loadTarget() {

            /*
             * 如果期間又點了另一首，
             * 取消這次操作。
             */

            if (
                requestId !==
                transitionId
            ) {

                return;

            }


            currentTrackIndex =
                targetIndex;


            expectedVideoId =
                tracks[
                    targetIndex
                ].id;


            pendingAutoplay =
                true;


            renderPlaylist();

            updateMusicUI();


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
                    "Failed to load YouTube track:",
                    error
                );


                isTransitioning =
                    false;

            }

        }


        if (
            oldWasPlaying
        ) {

            fadeOut(
                FADE_OUT_TIME,
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
         * Pause
         */

        if (
            isPlaying
        ) {

            isPlaying =
                false;


            updateMusicUI();


            fadeOut(
                FADE_OUT_TIME,
                function () {

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
         * Resume
         */

        isTransitioning =
            false;


        pendingAutoplay =
            true;


        try {

            setPlayerVolume(
                0
            );


            player.playVideo();

        } catch (
            error
        ) {

            console.warn(
                "Unable to play:",
                error
            );

        }

    }


    /* =========================================================
       NEXT TRACK
    ========================================================= */

    function nextTrack() {

        if (
            tracks.length ===
            0
        )
            return;


        let nextIndex;


        if (
            currentTrackIndex >=
            tracks.length - 1
        ) {

            nextIndex =
                0;

        } else {

            nextIndex =
                currentTrackIndex + 1;

        }


        switchToTrack(
            nextIndex
        );

    }


    /* =========================================================
       PREVIOUS TRACK
    ========================================================= */

    function previousTrack() {

        if (
            tracks.length ===
            0
        )
            return;


        let previousIndex;


        if (
            currentTrackIndex <=
            0
        ) {

            previousIndex =
                tracks.length - 1;

        } else {

            previousIndex =
                currentTrackIndex - 1;

        }


        switchToTrack(
            previousIndex
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


        const removingCurrent =
            index ===
            currentTrackIndex;


        const removedTrack =
            tracks[index];


        /*
         * =====================================================
         * 刪除「不是目前歌曲」
         * =====================================================
         */

        if (
            !removingCurrent
        ) {

            tracks.splice(
                index,
                1
            );


            /*
             * 如果刪除的歌曲在目前歌曲之前，
             * currentTrackIndex 往前移。
             */

            if (
                index <
                currentTrackIndex
            ) {

                currentTrackIndex--;

            }


            /*
             * 保證 index 不越界
             */

            if (
                tracks.length > 0 &&
                currentTrackIndex >=
                tracks.length
            ) {

                currentTrackIndex =
                    tracks.length - 1;

            }


            /*
             * 如果沒有歌
             */

            if (
                tracks.length ===
                0
            ) {

                currentTrackIndex =
                    0;


                isPlaying =
                    false;


                if (
                    playerReady &&
                    player
                ) {

                    stopFade();


                    try {

                        player.stopVideo();

                    } catch (
                        error
                    ) {}


                    setPlayerVolume(
                        0
                    );

                }


                updateMusicUI();

            } else {

                renderPlaylist();

                updateMusicUI();

            }


            return;

        }


        /*
         * =====================================================
         * 刪除目前正在播放的歌曲
         * =====================================================
         */

        ++transitionId;


        stopFade();


        const wasPlaying =
            isPlaying;


        /*
         * 先淡出
         */

        const finishRemoval =
            function () {

                /*
                 * 從 playlist 正式移除
                 */

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
                 * 沒有歌曲了
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
                 * 刪掉的是目前 index。
                 *
                 * 例如：
                 *
                 * A B C D
                 *   ↑
                 * 刪 B
                 *
                 * 最自然的是：
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
                 * 沒有原本正在播放：
                 * 只是切換選中的歌曲。
                 */

                if (
                    !wasPlaying
                ) {

                    isPlaying =
                        false;


                    isTransitioning =
                        false;


                    if (
                        playerReady &&
                        player
                    ) {

                        setPlayerVolume(
                            0
                        );


                        try {

                            player.cueVideoById(
                                expectedVideoId
                            );

                        } catch (
                            error
                        ) {}

                    }


                    renderPlaylist();

                    updateMusicUI();


                    return;

                }


                /*
                 * 原本有在播放：
                 * 載入新歌曲並自動播放。
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
                        "Failed to load replacement track:",
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
                FADE_OUT_TIME,
                finishRemoval
            );

        } else {

            finishRemoval();

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
         * 純 ID
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
                    .toLowerCase()
                    .includes(
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
                url.hostname
                    .toLowerCase()
                    .includes(
                        "youtube.com"
                    )
            ) {

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


                const parts =
                    url.pathname
                        .split(
                            "/"
                        )
                        .filter(
                            Boolean
                        );


                /*
                 * /shorts/ID
                 */

                if (
                    parts[0] ===
                    "shorts" &&
                    parts[1]
                ) {

                    if (
                        /^[a-zA-Z0-9_-]{11}$/
                            .test(
                                parts[1]
                            )
                    ) {

                        return parts[1];

                    }

                }


                /*
                 * /embed/ID
                 */

                if (
                    parts[0] ===
                    "embed" &&
                    parts[1]
                ) {

                    if (
                        /^[a-zA-Z0-9_-]{11}$/
                            .test(
                                parts[1]
                            )
                    ) {

                        return parts[1];

                    }

                }

            }

        } catch (
            error
        ) {

            /*
             * 不是 URL。
             * 後面會自動回傳 null。
             */

        }


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
                "Unable to fetch YouTube title:",
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
                 * 無效 ID
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
                 * 取得歌曲名稱
                 */

                const title =
                    await fetchYoutubeTitle(
                        id
                    );


                /*
                 * 加到陣列
                 */

                tracks.push({

                    name:
                        title ||
                        `Track [${id}]`,

                    id:
                        id

                });


                /*
                 * 新歌的 index
                 *
                 * 注意：
                 * 這裡「不直接修改」
                 * currentTrackIndex。
                 *
                 * 交給 switchToTrack。
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
                 * 先刷新 UI。
                 */

                renderPlaylist();


                /*
                 * 然後真的切到新歌。
                 */

                switchToTrack(
                    newIndex
                );

            }
        );

    }


    /* =========================================================
       ENTER TO ADD
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
       PREVIOUS BUTTON
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
       NEXT BUTTON
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
       CLOSE MUSIC PANEL
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

        if (
            window.YT &&
            window.YT.Player
        ) {

            initPlayer();

            return;

        }


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


        window.onYouTubeIframeAPIReady =
            function () {

                initPlayer();

            };

    }


    /* =========================================================
       INITIALIZE PLAYER
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
                                 * 如果在 API Ready 前
                                 * 已經指定了要播放的歌曲，
                                 * 現在才開始。
                                 */

                                if (
                                    pendingAutoplay
                                ) {

                                    pendingAutoplay =
                                        false;


                                    const current =
                                        getCurrentTrack();


                                    if (
                                        current
                                    ) {

                                        expectedVideoId =
                                            current.id;


                                        setPlayerVolume(
                                            0
                                        );


                                        try {

                                            player.loadVideoById(
                                                current.id
                                            );

                                        } catch (
                                            error
                                        ) {

                                            console.warn(
                                                "Initial track load error:",
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
                                            data
                                        ) {

                                            actualId =
                                                data.video_id;

                                        }

                                    } catch (
                                        error
                                    ) {}


                                    /*
                                     * 如果 YouTube
                                     * 播放的是已刪除的歌曲，
                                     * 強制停止。
                                     */

                                    if (
                                        actualId
                                    ) {

                                        const actualIndex =
                                            tracks.findIndex(
                                                track =>
                                                    track.id ===
                                                    actualId
                                            );


                                        if (
                                            actualIndex ===
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
                                         * 同步 index
                                         */

                                        currentTrackIndex =
                                            actualIndex;

                                    }


                                    isPlaying =
                                        true;


                                    isTransitioning =
                                        false;


                                    pendingAutoplay =
                                        false;


                                    updateMusicUI();

                                    renderPlaylist();


                                    /*
                                     * 真正開始播放後
                                     * 才 Fade In。
                                     */

                                    fadeIn(
                                        FADE_IN_TIME
                                    );


                                    return;

                                }


                                /* =================================
                                   PAUSED
                                ================================= */

                                if (
                                    event.data ===
                                    YT.PlayerState.PAUSED
                                ) {

                                    /*
                                     * 如果不是我們正在
                                     * 做 transition，
                                     * 才把它當正常 pause。
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


                                /* =================================
                                   BUFFERING
                                ================================= */

                                if (
                                    event.data ===
                                    YT.PlayerState.BUFFERING
                                ) {

                                    updateMusicUI();

                                    return;

                                }


                                /* =================================
                                   ENDED
                                ================================= */

                                if (
                                    event.data ===
                                    YT.PlayerState.ENDED
                                ) {

                                    isPlaying =
                                        false;


                                    updateMusicUI();


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

            getAudioContext();


            if (
                tracks.length ===
                0
            ) {

                return;

            }


            /*
             * API 尚未 ready。
             */

            if (
                !playerReady ||
                !player
            ) {

                pendingAutoplay =
                    true;


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


            pendingAutoplay =
                true;


            isTransitioning =
                false;


            setPlayerVolume(
                0
            );


            try {

                player.playVideo();

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
       INITIALIZE
    ========================================================= */

    createVolumeUI();

    renderPlaylist();

    updateMusicUI();

    loadYoutubeAPI();

})();
