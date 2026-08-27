(function () {

    "use strict";


    /* =========================================================
       CONFIGURATION
    ========================================================= */

    /*
     * 預設 100%
     */

    const DEFAULT_VOLUME = 100;


    /*
     * UI 最大值可以顯示到 200%
     *
     * 注意：
     * YouTube IFrame API 的實際 setVolume 上限是 100。
     *
     * 所以：
     *
     * 0~100
     * = 真正作用於 YouTube Player
     *
     * 101~200
     * = Boost UI 保留區，
     *   目前 YouTube iframe 無法真正放大。
     *
     * 若之後換成 Web Audio 可控制的直接音源，
     * 可以把這部分改成真正 Gain > 1。
     */

    const MAX_UI_VOLUME = 200;


    /*
     * Fade
     */

    const FADE_OUT_MS = 800;

    const FADE_IN_MS = 1200;


    /*
     * Fade 更新頻率
     */

    const FADE_INTERVAL_MS = 20;


    /*
     * LocalStorage
     */

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


    let playing =
        false;


    let currentTrackIndex =
        0;


    let requestedTrackIndex =
        null;


    let apiLoading =
        false;


    let fadeTimer =
        null;


    let fadeToken =
        0;


    let transitionToken =
        0;


    let switchingTrack =
        false;


    let pendingInitialPlay =
        false;


    /*
     * YouTube state change callback
     * 在某些情況下會連續觸發，
     * 所以需要知道我們目前到底想播放哪首。
     */

    let expectedVideoId =
        null;


    /* =========================================================
       LOAD SAVED VOLUME
    ========================================================= */

    function loadSavedVolume() {

        try {

            const raw =
                localStorage.getItem(
                    VOLUME_STORAGE_KEY
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
                value <= MAX_UI_VOLUME
            ) {

                return value;

            }

        } catch (
            error
        ) {}

        return DEFAULT_VOLUME;

    }


    let volume =
        loadSavedVolume();


    /* =========================================================
       LOAD MUTED
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
       VOLUME UI
    ========================================================= */

    let volumeContainer =
        null;


    let volumeSlider =
        null;


    let volumeValue =
        null;


    let muteButton =
        null;


    /*
     * 建立音量控制器
     */

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
                        48px;

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
                        6px;

                    outline:
                        none;

                    cursor:
                        pointer;

                    background:
                        linear-gradient(
                            to right,
                            #63d2fa 0%,
                            #63d2fa 50%,
                            rgba(120,165,180,.18) 50%,
                            rgba(120,165,180,.18) 100%
                        );

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

                    border-radius:
                        50%;

                    border:
                        2px solid
                        white;

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

                    border-radius:
                        50%;

                    border:
                        2px solid
                        white;

                    background:
                        #63d2fa;

                    box-shadow:
                        0 0 9px
                        rgba(99,210,250,.50);

                }


                .wnd-volume-value {

                    width:
                        45px;

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
                        #4c9fbe;

                    text-shadow:
                        0 0 6px
                        rgba(99,210,250,.22);

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
                        rgba(99,210,250,.18);

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

                    transition:
                        all .18s ease;

                }


                .wnd-mute:hover {

                    background:
                        rgba(99,210,250,.12);

                    color:
                        #3c91b3;

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
                    max="${MAX_UI_VOLUME}"
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
                    class="wnd-volume-note"
                >
                    ${MAX_UI_VOLUME}% RANGE
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


                /*
                 * 玩家只要手動調音量，
                 * 就解除 mute。
                 */

                muted =
                    false;


                saveVolume();

                saveMutedState();

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


                saveMutedState();

                updateVolumeUI();

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
       UPDATE VOLUME UI
    ========================================================= */

    function updateVolumeUI() {

        if (
            !volumeSlider ||
            !volumeValue ||
            !muteButton
        ) {

            return;

        }


        volumeSlider.value =
            String(volume);


        if (
            muted
        ) {

            volumeValue.textContent =
                "MUTE";

        } else {

            volumeValue.textContent =
                `${volume}%`;

        }


        /*
         * 超過 100 顯示 Boost
         */

        volumeValue.classList.toggle(
            "boost",
            !muted &&
            volume > 100
        );


        muteButton.textContent =
            muted
                ? "UNMUTE"
                : "MUTE";


        /*
         * Slider fill
         */

        const percentage =
            (
                volume /
                MAX_UI_VOLUME
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
       EFFECTIVE YOUTUBE VOLUME
    ========================================================= */

    function getEffectiveYoutubeVolume() {

        if (
            muted
        ) {

            return 0;

        }


        /*
         * YouTube API 最大就是 100。
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
                getEffectiveYoutubeVolume()
            );

        } catch (
            error
        ) {

            console.warn(
                "Volume apply error:",
                error
            );

        }

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


        const safeVolume =
            Math.max(
                0,
                Math.min(
                    100,
                    value
                )
            );


        try {

            player.setVolume(
                safeVolume
            );

        } catch (
            error
        ) {}

    }


    /* =========================================================
       CLEAR FADE
    ========================================================= */

    function clearFade() {

        fadeToken++;


        if (
            fadeTimer
        ) {

            clearTimeout(
                fadeTimer
            );


            fadeTimer =
                null;

        }


        return fadeToken;

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


        const token =
            clearFade();


        return new Promise(
            resolve => {

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
                        getEffectiveYoutubeVolume();

                }


                if (
                    !Number.isFinite(
                        startVolume
                    )
                ) {

                    startVolume =
                        0;

                }


                if (
                    startVolume <=
                    0
                ) {

                    setPlayerVolume(
                        0
                    );


                    resolve();

                    return;

                }


                const startTime =
                    performance.now();


                function step() {

                    if (
                        token !==
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
                     * Smooth ease out
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


                        resolve();

                        return;

                    }


                    fadeTimer =
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


        const token =
            clearFade();


        return new Promise(
            resolve => {

                const targetVolume =
                    getEffectiveYoutubeVolume();


                if (
                    targetVolume <=
                    0
                ) {

                    setPlayerVolume(
                        0
                    );


                    resolve();

                    return;

                }


                const startTime =
                    performance.now();


                function step() {

                    if (
                        token !==
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
                     * Smoothstep
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


                        resolve();

                        return;

                    }


                    fadeTimer =
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
       HTML ESCAPE
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
       UPDATE MUSIC UI
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

            const current =
                tracks[
                    currentTrackIndex
                ];


            nowPlaying.textContent =
                current
                    ? current.name
                    : "—";

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
                        type="button"
                        class="track-remove"
                        aria-label="Remove track"
                    >
                        ×
                    </button>

                `;


                /*
                 * 點歌曲
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
       SAFE CURRENT TRACK VALIDATION
    ========================================================= */

    function getCurrentTrack() {

        return tracks[
            currentTrackIndex
        ] || null;

    }


    /* =========================================================
       TRANSITION TO TRACK
    ========================================================= */

    async function transitionToTrack(
        targetIndex,
        options = {}
    ) {

        const {

            autoplay = true,

            sfx = true

        } = options;


        /*
         * 如果目標不存在
         */

        if (
            targetIndex < 0 ||
            targetIndex >= tracks.length
        ) {

            return;

        }


        /*
         * 建立自己的 transition token。
         *
         * 舊 transition 完成時，
         * 如果 token 不對，就直接放棄。
         */

        const token =
            ++transitionToken;


        const targetTrack =
            tracks[
                targetIndex
            ];


        if (
            !targetTrack
        )
            return;


        switchingTrack =
            true;


        /*
         * 先讓舊 fade 失效。
         */

        clearFade();


        /*
         * 先保存舊 playing 狀態。
         */

        const wasPlaying =
            playing;


        /*
         * 如果目前真的有歌在播，
         * 先淡出。
         */

        if (
            playerReady &&
            player &&
            wasPlaying
        ) {

            await fadeOut(
                FADE_OUT_MS
            );

        }


        /*
         * 如果使用者在 fade 過程中
         * 又點了別的歌，
         * 這個 transition 已經過時。
         */

        if (
            token !==
            transitionToken
        ) {

            return;

        }


        /*
         * 重要：
         *
         * 這裡才正式設定 currentTrackIndex。
         *
         * 避免之前那個：
         *
         * currentTrackIndex = newIndex
         * 然後 transition 誤認為
         * 已經是同一首。
         */

        currentTrackIndex =
            targetIndex;


        requestedTrackIndex =
            targetIndex;


        expectedVideoId =
            targetTrack.id;


        renderPlaylist();

        updateMusicUI();


        /*
         * 如果播放器還沒 Ready
         */

        if (
            !playerReady ||
            !player
        ) {

            pendingInitialPlay =
                autoplay;


            switchingTrack =
                false;


            return;

        }


        /*
         * 先確保靜音，
         * 避免 loadVideo 時突然出聲。
         */

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


        /*
         * 真正載入目標歌曲。
         */

        try {

            player.loadVideoById(
                targetTrack.id
            );


            pendingInitialPlay =
                autoplay;

        } catch (
            error
        ) {

            console.warn(
                "Failed to load track:",
                error
            );


            switchingTrack =
                false;

        }

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
        )
            return;


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
       TOGGLE PLAYBACK
    ========================================================= */

    function togglePlayback() {

        if (
            !playerReady ||
            !player
        ) {

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
            playing
        ) {

            const token =
                ++transitionToken;


            fadeOut(
                FADE_OUT_MS
            )
            .then(
                () => {

                    if (
                        token !==
                        transitionToken
                    )
                        return;


                    try {

                        player.pauseVideo();

                    } catch (
                        error
                    ) {}


                    playing =
                        false;


                    pendingInitialPlay =
                        false;


                    switchingTrack =
                        false;


                    updateMusicUI();

                }
            );


            return;

        }


        /*
         * Resume
         */

        pendingInitialPlay =
            true;


        setPlayerVolume(
            0
        );


        try {

            player.playVideo();

        } catch (
            error
        ) {

            console.warn(
                "Unable to resume:",
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


        let nextIndex;


        if (
            currentTrackIndex >=
            tracks.length - 1
        ) {

            nextIndex =
                0;

        } else {

            nextIndex =
                currentTrackIndex +
                1;

        }


        transitionToTrack(
            nextIndex,
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


        let previousIndex;


        if (
            currentTrackIndex <=
            0
        ) {

            previousIndex =
                tracks.length - 1;

        } else {

            previousIndex =
                currentTrackIndex -
                1;

        }


        transitionToTrack(
            previousIndex,
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

    async function removeTrack(
        index
    ) {

        if (
            index < 0 ||
            index >= tracks.length
        )
            return;


        /*
         * 記錄被刪歌曲
         */

        const removingTrack =
            tracks[index];


        const wasCurrent =
            index ===
            currentTrackIndex;


        /*
         * 如果不是目前歌曲：
         *
         * 直接刪除。
         *
         * 但是要修正 index，
         * 避免播放位置錯掉。
         */

        if (
            !wasCurrent
        ) {

            tracks.splice(
                index,
                1
            );


            /*
             * 被刪的是目前歌曲前面的項目，
             * current index 要往前移。
             */

            if (
                index <
                currentTrackIndex
            ) {

                currentTrackIndex--;

            }


            /*
             * 保證 index 合法
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
             * 如果播放器目前播放的影片
             * 正好就是被刪的歌曲，
             * 這是防禦性修正。
             */

            if (
                playerReady &&
                player
            ) {

                try {

                    const data =
                        player.getVideoData();


                    if (
                        data &&
                        data.video_id ===
                        removingTrack.id
                    ) {

                        /*
                         * 不允許刪除後
                         * 繼續偷偷播舊歌。
                         */

                        const fallbackIndex =
                            Math.max(
                                0,
                                Math.min(
                                    currentTrackIndex,
                                    tracks.length - 1
                                )
                            );


                        if (
                            tracks.length > 0
                        ) {

                            await transitionToTrack(
                                fallbackIndex,
                                {
                                    autoplay:
                                        true,

                                    sfx:
                                        false
                                }
                            );

                        } else {

                            clearFade();

                            player.stopVideo();

                            playing =
                                false;

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
         * 刪除「正在播放」的歌曲
         * =====================================================
         */

        /*
         * 先讓所有舊 transition 失效。
         */

        ++transitionToken;

        clearFade();


        /*
         * 先淡出。
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
         * 確認歌曲陣列還存在。
         */

        const removed =
            tracks.splice(
                index,
                1
            )[0];


        if (
            !removed
        ) {

            switchingTrack =
                false;

            return;

        }


        /*
         * 沒有歌了
         */

        if (
            tracks.length ===
            0
        ) {

            currentTrackIndex =
                0;


            requestedTrackIndex =
                null;


            expectedVideoId =
                null;


            playing =
                false;


            pendingInitialPlay =
                false;


            switchingTrack =
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
         * =====================================================
         * 選擇刪除後要播放的歌曲
         * =====================================================
         *
         * 例如：
         *
         * [A][B][C][D]
         *      ↑
         *      刪 B
         *
         * 會變成：
         *
         * [A][C][D]
         *
         * current index 仍然是 1
         * → 播放 C
         *
         * 這是最自然的行為。
         */

        let fallbackIndex;


        if (
            index <
            tracks.length
        ) {

            fallbackIndex =
                index;

        } else {

            fallbackIndex =
                tracks.length - 1;

        }


        currentTrackIndex =
            fallbackIndex;


        requestedTrackIndex =
            fallbackIndex;


        expectedVideoId =
            tracks[
                fallbackIndex
            ].id;


        renderPlaylist();

        updateMusicUI();


        switchingTrack =
            true;


        const token =
            ++transitionToken;


        /*
         * 載入新歌曲。
         */

        try {

            setPlayerVolume(
                0
            );


            player.loadVideoById(
                tracks[
                    fallbackIndex
                ].id
            );


            pendingInitialPlay =
                true;


            /*
             * token 只為確保這次操作
             * 不會被其他 transition 搶掉。
             */

            if (
                token !==
                transitionToken
            ) {

                return;

            }

        } catch (
            error
        ) {

            console.warn(
                "Failed after removing current track:",
                error
            );


            switchingTrack =
                false;

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
                 * shorts / embed
                 */

                if (
                    parts.length >= 2 &&
                    (
                        parts[0] === "shorts" ||
                        parts[0] === "embed" ||
                        parts[0] === "v"
                    )
                ) {

                    const id =
                        parts[1];


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
                 * 最後保險
                 */

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
                    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(id)}&format=json`
                );


            if (
                !response.ok
            ) {

                return null;

            }


            const data =
                await response.json();


            return (
                data &&
                data.title
            )
                ? data.title
                : null;

        } catch (
            error
        ) {

            return null;

        }

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

                const raw =
                    youtubeInput
                        .value
                        .trim();


                const id =
                    extractYoutubeId(
                        raw
                    );


                /*
                 * 無效
                 */

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


                /*
                 * 避免連點
                 */

                youtubeAdd.disabled =
                    true;


                youtubeAdd.textContent =
                    "...";


                /*
                 * 先取得標題
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
                 * 這裡不要先直接偷偷修改
                 * currentTrackIndex。
                 *
                 * transitionToTrack 會負責
                 * 正確設定。
                 */

                const newIndex =
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
                 * 新增歌曲：
                 *
                 * 一定切到新歌曲。
                 */

                await transitionToTrack(
                    newIndex,
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
       ENTER KEY
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


                if (
                    musicPanel.classList.contains(
                        "open"
                    )
                ) {

                    musicPanel.classList.remove(
                        "open"
                    );

                } else {

                    musicPanel.classList.add(
                        "open"
                    );

                }

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
       CLICK OUTSIDE
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

                    /*
                     * 初始只載入第一首，
                     * 不自動播放。
                     */

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


                                applyVolume();


                                createVolumeUI();


                                renderPlaylist();


                                updateMusicUI();


                                /*
                                 * 如果進入網站時
                                 * 使用者已經觸發 startMusic，
                                 * 現在 Player Ready 了，
                                 * 才開始播放。
                                 */

                                if (
                                    pendingInitialPlay
                                ) {

                                    pendingInitialPlay =
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
                                            "Initial playback error:",
                                            error
                                        );

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

                                    /*
                                     * 找出現在 YouTube
                                     * 真正正在播放的 ID。
                                     */

                                    let actualVideoId =
                                        null;


                                    try {

                                        const data =
                                            player.getVideoData();


                                        actualVideoId =
                                            data &&
                                            data.video_id
                                                ? data.video_id
                                                : null;

                                    } catch (
                                        error
                                    ) {}


                                    /*
                                     * 防止舊歌曲突然
                                     * 在切換過程中跑回來。
                                     */

                                    if (
                                        expectedVideoId &&
                                        actualVideoId &&
                                        actualVideoId !==
                                        expectedVideoId
                                    ) {

                                        /*
                                         * 舊影片不應該繼續播放。
                                         */

                                        try {

                                            player.stopVideo();

                                        } catch (
                                            error
                                        ) {}


                                        return;

                                    }


                                    /*
                                     * 同步真正播放的歌曲。
                                     */

                                    if (
                                        actualVideoId
                                    ) {

                                        const realIndex =
                                            tracks.findIndex(
                                                track =>
                                                    track.id ===
                                                    actualVideoId
                                            );


                                        if (
                                            realIndex !==
                                            -1
                                        ) {

                                            currentTrackIndex =
                                                realIndex;


                                            requestedTrackIndex =
                                                realIndex;

                                        }

                                    }


                                    playing =
                                        true;


                                    switchingTrack =
                                        false;


                                    updateMusicUI();

                                    renderPlaylist();


                                    /*
                                     * 每次正式開始播放
                                     * 都從 0 Fade In。
                                     */

                                    fadeIn(
                                        FADE_IN_MS
                                    );

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
                                     * 如果不是 fade transition
                                     * 才視為正常 pause。
                                     */

                                    if (
                                        !switchingTrack
                                    ) {

                                        playing =
                                            false;

                                    }


                                    updateMusicUI();

                                    return;

                                }


                                /*
                                 * BUFFERING
                                 */

                                if (
                                    event.data ===
                                    YT.PlayerState.BUFFERING
                                ) {

                                    /*
                                     * 保持原本 playing 狀態，
                                     * 不要閃來閃去。
                                     */

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

                                    playing =
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
             * Player 尚未 Ready。
             *
             * 先記起來，
             * onReady 再播放。
             */

            if (
                !playerReady ||
                !player
            ) {

                pendingInitialPlay =
                    true;


                return;

            }


            getAudioContext();


            const current =
                getCurrentTrack();


            if (
                !current
            )
                return;


            pendingInitialPlay =
                true;


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
                    "startMusic error:",
                    error
                );

            }

        };


    /* =========================================================
       INITIALIZATION
    ========================================================= */

    /*
     * 建立 volume UI
     */

    createVolumeUI();


    /*
     * Render playlist
     */

    renderPlaylist();


    /*
     * Update UI
     */

    updateMusicUI();


    /*
     * 載入 YouTube
     */

    loadYouTubeAPI();


})();
