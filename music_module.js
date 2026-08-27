(function () {

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


    let player =
        null;


    let playerReady =
        false;


    let currentTrackIndex =
        0;


    let playing =
        false;


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


    const currentTrack =
        document.getElementById(
            "current-track"
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
                    now + .25
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
                    .026,
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


                /*
                 * High ping
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
            !musicButton
        )
            return;


        if (
            playing
        ) {

            musicButton.textContent =
                "Ⅱ";


            musicButton.classList.add(
                "playing"
            );

        } else {

            musicButton.textContent =
                "♫";


            musicButton.classList.remove(
                "playing"
            );

        }


        if (
            currentTrack
        ) {

            if (
                tracks[currentTrackIndex]
            ) {

                currentTrack.textContent =
                    tracks[currentTrackIndex].name;

            } else {

                currentTrack.textContent =
                    "—";

            }

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
            tracks.length === 0
        ) {

            musicList.innerHTML = `

                <div
                    style="
                        padding:20px;
                        text-align:center;
                        color:#8ba0ad;
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

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "track";


                if (
                    index ===
                    currentTrackIndex
                ) {

                    row.classList.add(
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


                const main =
                    document.createElement(
                        "div"
                    );


                main.className =
                    "track-main";


                const name =
                    document.createElement(
                        "div"
                    );


                name.className =
                    "track-name";


                name.textContent =
                    track.name;


                main.appendChild(
                    name
                );


                const remove =
                    document.createElement(
                        "button"
                    );


                remove.className =
                    "track-remove";


                remove.textContent =
                    "×";


                row.appendChild(
                    number
                );


                row.appendChild(
                    main
                );


                row.appendChild(
                    remove
                );


                row.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target ===
                            remove
                        )
                            return;


                        playTrack(
                            index
                        );

                    }
                );


                remove.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        removeTrack(
                            index
                        );

                    }
                );


                musicList.appendChild(
                    row
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
        ) {

            return;

        }


        try {

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


        const wasCurrent =
            index ===
            currentTrackIndex;


        tracks.splice(
            index,
            1
        );


        if (
            tracks.length === 0
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
            wasCurrent
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
         * 純 YouTube ID
         */

        if (
            /^[a-zA-Z0-9_-]{11}$/
                .test(
                    value
                )
        ) {

            return value;

        }


        /*
         * URL
         */

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


                if (
                    !id
                ) {

                    youtubeInput.value =
                        "";


                    youtubeInput.placeholder =
                        "Invalid YouTube link";


                    setTimeout(
                        () => {

                            youtubeInput.placeholder =
                                "Paste YouTube link or ID...";

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


                const trackName =
                    title ||
                    `Track [${id}]`;


                tracks.push({

                    name:
                        trackName,

                    id:
                        id

                });


                currentTrackIndex =
                    tracks.length - 1;


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
       CLOSE MUSIC PANEL
    ========================================================= */

    document.addEventListener(
        "click",
        event => {

            if (
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
       PLAYER INIT
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

                renderPlaylist();

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
