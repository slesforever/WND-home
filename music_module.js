(function () {

    const MUSIC_ID =
        "eMqWJDP28p8";


    let player = null;

    let playerReady = false;

    let playing = false;

    let apiLoading = false;


    const button =
        document.getElementById(
            "music-button"
        );

    const label =
        document.getElementById(
            "music-label"
        );


    /* =====================================
       UI
    ===================================== */

    function updateUI() {

        if (!button || !label)
            return;


        if (playing) {

            button.textContent = "Ⅱ";

            button.classList.add(
                "playing"
            );

            label.textContent =
                "MUSIC ON";

        } else {

            button.textContent = "♫";

            button.classList.remove(
                "playing"
            );

            label.textContent =
                "MUSIC OFF";

        }

    }


    /* =====================================
       YouTube API
    ===================================== */

    function loadAPI() {

        if (
            window.YT &&
            window.YT.Player
        ) {

            initPlayer();

            return;

        }


        if (apiLoading)
            return;


        apiLoading = true;


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


    /* =====================================
       PLAYER
    ===================================== */

    function initPlayer() {

        if (player)
            return;


        player =
            new YT.Player(
                "youtube-player",
                {

                    videoId:
                        MUSIC_ID,

                    width: 1,

                    height: 1,

                    playerVars: {

                        autoplay: 0,

                        controls: 0,

                        disablekb: 1,

                        fs: 0,

                        iv_load_policy: 3,

                        modestbranding: 1,

                        playsinline: 1,

                        rel: 0

                    },


                    events: {

                        onReady:
                            function () {

                                playerReady =
                                    true;

                                player.setVolume(
                                    35
                                );

                                updateUI();

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

                                    player.seekTo(
                                        0,
                                        true
                                    );

                                    player.playVideo();

                                }


                                updateUI();

                            }

                    }

                }
            );

    }


    /* =====================================
       PLAY
    ===================================== */

    window.startMusic =
        function () {

            if (
                !playerReady ||
                !player
            ) {

                loadAPI();

                return;

            }


            player.setVolume(35);

            player.playVideo();

            playing = true;

            updateUI();

        };


    /* =====================================
       PAUSE
    ===================================== */

    function stopMusic() {

        if (
            !playerReady ||
            !player
        )
            return;


        player.pauseVideo();

        playing = false;

        updateUI();

    }


    /* =====================================
       BUTTON
    ===================================== */

    if (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();


                if (!playerReady) {

                    loadAPI();

                    setTimeout(
                        () => {

                            if (
                                playerReady
                            ) {

                                player.setVolume(
                                    35
                                );

                                player.playVideo();

                                playing = true;

                                updateUI();

                            }

                        },
                        800
                    );

                    return;

                }


                if (playing) {

                    stopMusic();

                } else {

                    startMusic();

                }

            }
        );

    }


    /* =====================================
       第一次點擊頁面
       ===================================== */

    let firstInteraction =
        true;


    function firstClick() {

        if (!firstInteraction)
            return;


        firstInteraction = false;


        startMusic();


        document.removeEventListener(
            "pointerdown",
            firstClick
        );

    }


    document.addEventListener(
        "pointerdown",
        firstClick,
        {
            passive: true
        }
    );


    /* =====================================
       LOAD
    ===================================== */

    loadAPI();

})();
