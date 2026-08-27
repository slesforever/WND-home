(function () {

    "use strict";


    /* =========================================================
       CONFIG
    ========================================================= */

    const DEFAULT_VOLUME = 100;

    const MAX_VOLUME = 200;

    const FADE_OUT_TIME = 800;

    const FADE_IN_TIME = 1200;

    const FADE_STEP = 20;


    const VOLUME_STORAGE_KEY =
        "wnd_music_volume";


    const MUTED_STORAGE_KEY =
        "wnd_music_muted";


    /* =========================================================
       PLAYLIST
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


    let isLoadingTrack =
        false;


    let currentTrackIndex =
        0;


    let expectedVideoId =
        tracks.length
            ? tracks[0].id
            : null;


    /*
     * 開機播放請求。
     *
     * index.html 點擊 Boot 時會設定。
     */

    let startRequested =
        window.__WND_START_MUSIC_REQUESTED === true;


    let youtubeApiLoading =
        false;


    let fadeTimer =
        null;


    /*
     * 用來取消過期的切歌操作。
     */

    let operationSerial =
        0;


    /* =========================================================
       VOLUME
    ========================================================= */

    function loadVolume() {

        try {

            const value =
                Number(
                    localStorage.getItem(
                        VOLUME_STORAGE_KEY
                    )
                );


            if (
                Number.isFinite(
                    value
                ) &&
                value >= 0 &&
                value <= MAX_VOLUME
            ) {

                return value;

            }

        } catch (
            error
        ) {}


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
                    MUTED_STORAGE_KEY
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

            audioContext.resume()
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
                type ===
                "boot"
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
                    now + .4
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


                return;

            }


            /* =================================================
               CLICK
            ================================================= */

            if (
                type ===
                "click"
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
                    now + .1
                );


                gain.gain.setValueAtTime(
                    .034,
                    now
                );


                gain.gain.exponentialRampToValueAtTime(
                    .0001,
                    now + .11
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
                    now + .12
                );


                return;

            }


            /* =================================================
               PAGE
            ================================================= */

            if (
                type ===
                "page"
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
                    now + .17
                );


                gain.gain.setValueAtTime(
                    .037,
                    now
                );


                gain.gain.exponentialRampToValueAtTime(
                    .0001,
                    now + .2
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
                    .02,
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
                "SFX error:",
                error
            );

        }

    }


    window.playInterfaceSfx =
        playInterfaceSfx;


    /* =========================================================
       VOLUME
    ========================================================= */

    function getEffectiveVolume() {

        if (
            muted
        ) {

            return 0;

        }


        /*
         * YouTube IFrame API 實際最大 100。
         */

        return Math.max(
            0,
            Math.min(
                100,
                volume
            )
        );

    }


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


    function applyVolume() {

        setPlayerVolume(
            getEffectiveVolume()
        );

    }


    /* =========================================================
       SETTINGS SAVE
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


    function saveMuted() {

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

                }


                .wnd-volume-value {

                    width:
                        48px;

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
                        #479bbd;

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

                    font-size:
                        8px;

                    font-weight:
                        700;

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
                    MAX UI 200%
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
           SLIDER
        ===================================================== */

        volumeSlider.addEventListener(
            "input",
            () => {

                volume =
                    Number(
                        volumeSlider.value
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
            event => {

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
            volume > 100 &&
            !muted
        );


        muteButton.textContent =
            muted
                ? "UNMUTE"
                : "MUTE";


        const fill =
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
                    #63d2fa ${fill}%,
                    rgba(120,165,180,.18) ${fill}%,
                    rgba(120,165,180,.18) 100%
                )
            `;

    }


    /* =========================================================
       FADE CONTROL
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
            )
        ) {

            startVolume =
                getEffectiveVolume();

        }


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
                performance.now() -
                startTime;


            const progress =
                Math.min(
                    1,
                    elapsed /
                    FADE_OUT_TIME
                );


            const eased =
                1 -
                Math.pow(
                    1 -
                    progress,
                    2
                );


            setPlayerVolume(
                startVolume *
                (1 - eased)
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


        const target =
            getEffectiveVolume();


        setPlayerVolume(
            0
        );


        if (
            target <=
            0
        ) {

            return;

        }


        const startTime =
            performance.now();


        function step() {

            const elapsed =
                performance.now() -
                startTime;


            const progress =
                Math.min(
                    1,
                    elapsed /
                    FADE_IN_TIME
                );


            const eased =
                progress *
                progress *
                (
                    3 -
                    2 *
                    progress
                );


            setPlayerVolume(
                target *
                eased
            );


            if (
                progress >=
                1
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
       UI UPDATE
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
       PLAYLIST RENDER
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
                 * 點歌
                 */

                item.addEventListener(
                    "click",
                    event => {

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


        const target =
            tracks[
                targetIndex
            ];


        if (
            !target
        )
            return;


        const operation =
            ++operationSerial;


        /*
         * 目標先記下來。
         */

        currentTrackIndex =
            targetIndex;


        expectedVideoId =
            target.id;


        renderPlaylist();

        updateMusicUI();


        /*
         * Player 尚未 Ready：
         * 只記住目標。
         */

        if (
            !playerReady ||
            !player
        ) {

            if (
                autoplay
            ) {

                startRequested =
                    true;

                pendingAutoplay =
                    true;

            }


            return;

        }


        /*
         * 如果現在正在播，
         * 淡出後再換。
         */

        if (
            isPlaying
        ) {

            fadeOut(
                () => {

                    if (
                        operation !==
                        operationSerial
                    ) {

                        return;

                    }


                    actuallyLoadTrack(
                        targetIndex,
                        autoplay,
                        operation
                    );

                }
            );

        } else {

            actuallyLoadTrack(
                targetIndex,
                autoplay,
                operation
            );

        }

    }


    /* =========================================================
       LOAD ACTUAL TRACK
    ========================================================= */

    function actuallyLoadTrack(
        targetIndex,
        autoplay,
        operation
    ) {

        if (
            operation !==
            operationSerial
        ) {

            return;

        }


        const target =
            tracks[
                targetIndex
            ];


        if (
            !target
        )
            return;


        currentTrackIndex =
            targetIndex;


        expectedVideoId =
            target.id;


        isTransitioning =
            true;


        renderPlaylist();

        updateMusicUI();


        setPlayerVolume(
            0
        );


        try {

            if (
                autoplay
            ) {

                pendingAutoplay =
                    true;


                player.loadVideoById(
                    target.id
                );

            } else {

                pendingAutoplay =
                    false;


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
                "Track loading failed:",
                error
            );


            isTransitioning =
                false;

        }

    }


    /* =========================================================
       PLAY CURRENT
    ========================================================= */

    function playCurrent() {

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


        if (
            !playerReady ||
            !player
        ) {

            startRequested =
                true;


            window.__WND_START_MUSIC_REQUESTED =
                true;


            return;

        }


        setPlayerVolume(
            0
        );


        try {

            player.playVideo();

        } catch (
            error
        ) {

            console.warn(
                "Playback failed:",
                error
            );

        }

    }


    let pendingAutoplay =
        false;


    /* =========================================================
       TOGGLE PLAY
    ========================================================= */

    function togglePlayback() {

        getAudioContext();


        playInterfaceSfx(
            "click"
        );


        if (
            !playerReady ||
            !player
        ) {

            startRequested =
                true;


            pendingAutoplay =
                true;


            window.__WND_START_MUSIC_REQUESTED =
                true;


            return;

        }


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
                "Play failed:",
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
        )
            return;


        const removingCurrent =
            index ===
            currentTrackIndex;


        /*
         * =====================================================
         * 刪除「其他」歌曲
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
             * 如果刪的是目前歌曲前面的歌曲，
             * index 往前移。
             */

            if (
                index <
                currentTrackIndex
            ) {

                currentTrackIndex--;

            }


            /*
             * 保證 index 合法。
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
             * 防禦：
             *
             * 檢查 YouTube 是否正在播
             * 已被刪掉的影片。
             */

            if (
                playerReady &&
                player
            ) {

                try {

                    const videoData =
                        player.getVideoData();


                    const actualId =
                        videoData &&
                        videoData.video_id
                            ? videoData.video_id
                            : null;


                    const stillExists =
                        tracks.some(
                            track =>
                                track.id ===
                                actualId
                        );


                    if (
                        actualId &&
                        !stillExists
                    ) {

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

                            stopEverything();

                        }


                        return;

                    }

                } catch (
                    error
                ) {}

            }


            renderPlaylist();

            updateMusicUI();


            return;

        }


        /*
         * =====================================================
         * 刪除目前正在播放的歌曲
         * =====================================================
         */

        const oldPlaying =
            isPlaying;


        /*
         * 取消舊 operation。
         */

        ++operationSerial;


        stopFade();


        const finish =
            () => {

                /*
                 * 真正刪掉。
                 */

                const removed =
                    tracks.splice(
                        index,
                        1
                    )[0];


                if (
                    !removed
                ) {

                    return;

                }


                /*
                 * 沒歌。
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


                    startRequested =
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
                 * 選擇刪除位置的下一首。
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
                 * 如果原本沒在播，
                 * 只換 selected，不播放。
                 */

                if (
                    !oldPlaying
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


                    return;

                }


                /*
                 * 原本正在播放：
                 *
                 * 真正 load 新歌曲。
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
                        "Replacement track failed:",
                        error
                    );


                    isTransitioning =
                        false;

                }

            };


        if (
            oldPlaying &&
            playerReady &&
            player
        ) {

            fadeOut(
                finish
            );

        } else {

            finish();

        }

    }


    /* =========================================================
       STOP EVERYTHING
    ========================================================= */

    function stopEverything() {

        ++operationSerial;


        stopFade();


        pendingAutoplay =
            false;


        startRequested =
            false;


        isPlaying =
            false;


        isTransitioning =
            false;


        expectedVideoId =
            null;


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


        updateMusicUI();

        renderPlaylist();

    }


    /* =========================================================
       YOUTUBE ID
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


            const host =
                url.hostname
                    .toLowerCase();


            /*
             * youtu.be
             */

            if (
                host.includes(
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
                host.includes(
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


                if (
                    parts[0] ===
                    "v" &&
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
        ) {}


        return null;

    }


    /* =========================================================
       FETCH TITLE
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
        ) {}


        return null;

    }


    /* =========================================================
       ADD TRACK
    ========================================================= */

    if (
        youtubeAdd
    ) {

        youtubeAdd.addEventListener(
            "click",
            async () => {

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


                /*
                 * 防止連點
                 */

                youtubeAdd.disabled =
                    true;


                youtubeAdd.textContent =
                    "...";


                let title =
                    null;


                try {

                    title =
                        await fetchYoutubeTitle(
                            id
                        );

                } catch (
                    error
                ) {}


                /*
                 * 加入
                 */

                tracks.push({

                    name:
                        title ||
                        `Track [${id}]`,

                    id:
                        id

                });


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


                renderPlaylist();


                /*
                 * 直接切到剛加入的歌。
                 */

                switchTrack(
                    newIndex,
                    true
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
       CLOSE MUSIC PANEL
    ========================================================= */

    document.addEventListener(
        "click",
        event => {

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
         * 已經有 API
         */

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
                                 * 開機修復：
                                 *
                                 * 如果玩家在 YouTube Ready
                                 * 之前就按過 Boot，
                                 * 一定開始目前歌曲。
                                 * =================================================
                                 */

                                if (
                                    startRequested ||
                                    pendingAutoplay ||
                                    window.__WND_START_MUSIC_REQUESTED === true
                                ) {

                                    startRequested =
                                        false;


                                    pendingAutoplay =
                                        false;


                                    window.__WND_START_MUSIC_REQUESTED =
                                        false;


                                    const current =
                                        getCurrentTrack();


                                    if (
                                        current
                                    ) {

                                        currentTrackIndex =
                                            Math.min(
                                                currentTrackIndex,
                                                tracks.length - 1
                                            );


                                        expectedVideoId =
                                            current.id;


                                        setPlayerVolume(
                                            0
                                        );


                                        /*
                                         * 這裡直接呼叫。
                                         */

                                        try {

                                            player.playVideo();

                                        } catch (
                                            error
                                        ) {

                                            console.warn(
                                                "Autoplay start failed:",
                                                error
                                            );

                                        }

                                    }

                                }

                            },


                        /* =====================================
                           STATE
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


                                        actualId =
                                            data &&
                                            data.video_id
                                                ? data.video_id
                                                : null;

                                    } catch (
                                        error
                                    ) {}


                                    /*
                                     * 如果 YouTube 正在播一首
                                     * playlist 裡不存在的歌，
                                     * 不准它繼續。
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
                                         * 同步真正播放歌曲
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


                                    startRequested =
                                        false;


                                    window.__WND_START_MUSIC_REQUESTED =
                                        false;


                                    renderPlaylist();


                                    updateMusicUI();


                                    /*
                                     * 每次正式 PLAYING
                                     * 都 Fade In。
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
                                     * 如果沒有正在做 transition，
                                     * 才是正常 pause。
                                     */

                                    if (
                                        !isLoadingTrack &&
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


                                    if (
                                        tracks.length >
                                        0
                                    ) {

                                        nextTrack();

                                    }

                                }

                            }

                }

            );

    }


    /* =========================================================
       PUBLIC START
    ========================================================= */

    window.startMusic =
        function () {

            /*
             * 最先記住要求。
             */

            startRequested =
                true;


            pendingAutoplay =
                true;


            window.__WND_START_MUSIC_REQUESTED =
                true;


            /*
             * 還沒 Ready：
             * 直接回去，等 onReady。
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
       INITIAL STATE
    ========================================================= */

    createVolumeUI();

    renderPlaylist();

    updateMusicUI();


    /*
     * 如果 index.html 已經在 music_module.js
     * 載入前記下要求，這裡同步。
     */

    if (
        window.__WND_START_MUSIC_REQUESTED === true
    ) {

        startRequested =
            true;

    }


    /*
     * 開始載入 YouTube API
     */

    loadYoutubeAPI();

})();
