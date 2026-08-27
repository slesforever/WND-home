(function () {

    /* =====================================================
       DEFAULT TRACK
    ===================================================== */

    const tracks = [

        {
            name:
                "Background Music",

            id:
                "eMqWJDP28p8"

        }

    ];


    let player = null;

    let playerReady = false;

    let currentTrackIndex = 0;

    let playing = false;


    /* =====================================================
       DOM
    ===================================================== */

    const musicButton =
        document.getElementById(
            "music-button"
        );


    const playlist =
        document.getElementById(
            "playlist"
        );


    const playlistList =
        document.getElementById(
            "playlist-list"
        );


    const youtubeInput =
        document.getElementById(
            "youtube-input"
        );


    const youtubeAdd =
        document.getElementById(
            "youtube-add"
        );


    /* =====================================================
       AUDIO CONTEXT
    ===================================================== */

    let audioContext = null;


    function getAudioContext() {

        if (!audioContext) {

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


    /* =====================================================
       SFX
    ===================================================== */

    function playSfx(type) {

        try {

            const ctx =
                getAudioContext();


            const now =
                ctx.currentTime;


            /* =============================================
               BOOT
            ============================================= */

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
                    220,
                    now
                );


                osc.frequency.exponentialRampToValueAtTime(
                    780,
                    now + .75
                );


                gain.gain.setValueAtTime(
                    .0001,
                    now
                );


                gain.gain.exponentialRampToValueAtTime(
                    .05,
                    now + .18
                );


                gain.gain.exponentialRampToValueAtTime(
                    .0001,
                    now + 1.05
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
                    now + .25
                );


                sparkle.frequency.exponentialRampToValueAtTime(
                    1700,
                    now + .75
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
                    now + .2
                );


                sparkle.stop(
                    now + 1
                );

            }


            /* =============================================
               CLICK
            ============================================= */

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
                    620,
                    now
                );


                osc.frequency.exponentialRampToValueAtTime(
                    350,
                    now + .10
                );


                gain.gain.setValueAtTime(
                    .035,
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


            /* =============================================
               PAGE
            ============================================= */

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
                    260,
                    now
                );


                osc.frequency.exponentialRampToValueAtTime(
                    560,
                    now + .17
                );


                gain.gain.setValueAtTime(
                    .035,
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


                const high =
                    ctx.createOscillator();


                const highGain =
                    ctx.createGain();


                high.type =
                    "sine";


                high.frequency.setValueAtTime(
                    900,
                    now + .02
                );


                highGain.gain.setValueAtTime(
                    .022,
                    now + .02
                );


                highGain.gain.exponentialRampToValueAtTime(
                    .0001,
                    now + .12
                );


                high.connect(
                    highGain
                );


                highGain.connect(
                    ctx.destination
                );


                high.start(
                    now + .02
                );


                high.stop(
                    now + .14
                );

            }

        } catch (error) {

            console.warn(
                "SFX error:",
                error
            );

        }

    }


    window.playInterfaceSfx =
        playSfx;


    /* =====================================================
       UI UPDATE
    ===================================================== */

    function updateMusicUI() {

        if (!musicButton)
            return;


        musicButton.classList.toggle(
            "playing",
            playing
        );


        musicButton.textContent =
            playing
                ? "Ⅱ"
                : "♫";

    }


    /* =====================================================
       PLAYLIST RENDER
    ===================================================== */

    function renderPlaylist() {

        if (!playlistList)
            return;


        playlistList.innerHTML =
            "";


        if (
            tracks.length === 0
        ) {

            playlistList.innerHTML =
                `
                <div style="
                    padding:18px;
                    text-align:center;
                    color:#8ca0ab;
                    font-size:10px;
                    letter-spacing:1px;
                ">
                    NO TRACKS
                </div>
                `;

            return;

        }


        tracks.forEach(
            (track, index) => {

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


                const name =
                    document.createElement(
                        "div"
                    );


                name.className =
                    "track-name";


                name.textContent =
                    `${index + 1}. ${track.name}`;


                const remove =
                    document.createElement(
                        "button"
                    );


                remove.className =
                    "track-remove";


                remove.textContent =
                    "×";


                row.appendChild(
                    name
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


                playlistList.appendChild(
                    row
                );

            }
        );

    }


    /* =====================================================
       PLAY TRACK
    ===================================================== */

    function playTrack(index) {

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

    }


    /* =====================================================
       REMOVE TRACK
    ===================================================== */

    function removeTrack(index) {

        if (
            index < 0 ||
            index >= tracks.length
        )
            return;


        const wasPlaying =
            index === currentTrackIndex;


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


            updateMusicUI();

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
            wasPlaying
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


    /* =====================================================
       YOUTUBE ID
    ===================================================== */

    function extractYoutubeId(value) {

        if (!value)
            return null;


        value =
            value.trim();


        /*
         * 純 ID
         */

        if (
            /^[a-zA-Z0-9_-]{11}$/
                .test(value)
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


            if (
                url.hostname
                    .includes("youtu.be")
            ) {

                const id =
                    url.pathname
                        .replace(
                            "/",
                            ""
                        );


                if (
                    /^[a-zA-Z0-9_-]{11}$/
                        .test(id)
                ) {

                    return id;

                }

            }


            if (
                url.hostname
                    .includes("youtube.com")
            ) {

                const id =
                    url.searchParams.get(
                        "v"
                    );


                if (
                    id &&
                    /^[a-zA-Z0-9_-]{11}$/
                        .test(id)
                ) {

                    return id;

                }


                const parts =
                    url.pathname
                        .split("/");


                const possible =
                    parts[
                        parts.length - 1
                    ];


                if (
                    /^[a-zA-Z0-9_-]{11}$/
                        .test(possible)
                ) {

                    return possible;

                }

            }

        } catch (error) {}



        return null;

    }


    /* =====================================================
       FETCH TITLE
    ===================================================== */

    async function fetchYoutubeTitle(id) {

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


            return data.title ||
                null;

        } catch (error) {

            return null;

        }

    }


    /* =====================================================
       ADD
    ===================================================== */

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


                if (!id) {

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


                youtubeInput.value =
                    "";


                currentTrackIndex =
                    tracks.length - 1;


                renderPlaylist();


                youtubeAdd.disabled =
                    false;


                youtubeAdd.textContent =
                    "ADD";


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


    /* =====================================================
       MUSIC BUTTON
    ===================================================== */

    if (
        musicButton
    ) {

        musicButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                getAudioContext();


                playSfx(
                    "click"
                );


                if (
                    playlist.classList.contains(
                        "open"
                    )
                ) {

                    playlist.classList.remove(
                        "open"
                    );

                } else {

                    playlist.classList.add(
                        "open"
                    );

                }

            }
        );

    }


    /* =====================================================
       CLICK OUTSIDE PLAYLIST
    ===================================================== */

    document.addEventListener(
        "click",
        event => {

            if (
                !playlist.contains(
                    event.target
                ) &&
                !musicButton.contains(
                    event.target
                )
            ) {

                playlist.classList.remove(
                    "open"
                );

            }

        }
    );


    /* =====================================================
       YOUTUBE API
    ===================================================== */

    function loadYouTubeAPI() {

        if (
            window.YT &&
            window.YT.Player
        ) {

            initPlayer();

            return;

        }


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


    /* =====================================================
       INIT PLAYER
    ===================================================== */

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
                                        tracks.length === 0
                                    )
                                        return;


                                    currentTrackIndex =
                                        (
                                            currentTrackIndex
                                            + 1
                                        )
                                        % tracks.length;


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


    /* =====================================================
       START MUSIC
    ===================================================== */

    window.startMusic =
        function () {

            if (
                !playerReady ||
                !player
            )
                return;


            getAudioContext();


            player.setVolume(
                35
            );


            player.playVideo();


            playing =
                true;


            updateMusicUI();

        };


    /* =====================================================
       INIT
    ===================================================== */

    loadYouTubeAPI();

    renderPlaylist();


})();
