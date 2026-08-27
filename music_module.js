(function () {

    /* =========================================================
       DEFAULT TRACKS
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
                type ===
                "boot"
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
                 * 高頻光點
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
                type ===
                "click"
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
                type ===
                "page"
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


                /*
                 * 高頻 sparkle
                 */

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
                        ${String(index + 1).padStart(2,"0")}
                    </div>

                    <div class="track-name">
                        ${escapeHtml(track.name)}
                    </div>

                    <button
                        class="track-remove"
                        aria-label="Remove"
                    >
                        ×
                    </button>

                `;


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


                const removeButton =
                    item.querySelector(
                        ".track-remove"
                    );


                removeButton.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


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
            !tracks[index]
        )
            return;


        currentTrackIndex =
            index;


        if (
            !playerReady ||
            !player
        )
            return;


        try {

            getAudioContext();


            player.loadVideoById(
                tracks[index].id
            );


            player.setVolume(
                35
            );


            playing =
                true;


            updateMusicUI();

            renderPlaylist();


            playInterfaceSfx(
                "click"
            );

        } catch (
            error
        ) {

            console.warn(
                "Playback error:",
                error
            );

        }

    }


    /* =========================================================
       PLAY / PAUSE
    ========================================================= */

    function togglePlayback() {

        if (
            !playerReady ||
            !player
        ) {

            return;

        }


        getAudioContext();


        if (
            playing
        ) {

            player.pauseVideo();


            playing =
                false;

        } else {

            player.setVolume(
                35
            );


            player.playVideo();


            playing =
                true;

        }


        updateMusicUI();

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


        currentTrackIndex =
            (
                currentTrackIndex +
                1
            )
            %
            tracks.length;


        playTrack(
            currentTrackIndex
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


        currentTrackIndex =
            (
                currentTrackIndex -
                1 +
                tracks.length
            )
            %
            tracks.length;


        playTrack(
            currentTrackIndex
        );

    }


    /* =========================================================
       REMOVE
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


            renderPlaylist();

            return;

        }


        if (
            index <
            currentTrackIndex
        ) {

            currentTrackIndex--;

        }


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


            playTrack(
                currentTrackIndex
            );

        }


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


                const parts =
                    url.pathname
                        .split(
                            "/"
                        );


                const possible =
                    parts[
                        parts.length - 1
                    ];


                if (
                    /^[a-zA-Z0-9_-]{11}$/
                        .test(
                            possible
                        )
                ) {

                    return possible;

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
                    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
                );


            if (
                !response.ok
            )
                return null;


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


                if (
                    playerReady
                ) {

                    playTrack(
                        currentTrackIndex
                    );

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


                playInterfaceSfx(
                    "click"
                );


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

                        onReady:
                            function () {

                                playerReady =
                                    true;


                                player.setVolume(
                                    35
                                );


                                renderPlaylist();

                            },


                        onStateChange:
                            function (
                                event
                            ) {

                                if (
                                    event.data ===
                                    YT.PlayerState.PLAYING
                                ) {

                                    playing =
                                        true;

                                }


                                if (
                                    event.data ===
                                    YT.PlayerState.PAUSED
                                ) {

                                    playing =
                                        false;

                                }


                                if (
                                    event.data ===
                                    YT.PlayerState.ENDED
                                ) {

                                    nextTrack();

                                }


                                updateMusicUI();

                                renderPlaylist();

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

            if (
                !playerReady ||
                !player
            ) {

                return;

            }


            try {

                getAudioContext();


                player.setVolume(
                    35
                );


                player.playVideo();


                playing =
                    true;


                updateMusicUI();

            } catch (
                error
            ) {

                console.warn(
                    "Music start error:",
                    error
                );

            }

        };


    /* =========================================================
       INIT
    ========================================================= */

    loadYouTubeAPI();

    renderPlaylist();

})();
