(function () {

    /* =====================================
       Music
       ===================================== */

    const MUSIC_ID = "eMqWJDP28p8";

    let player = null;
    let ready = false;
    let playing = false;

    const musicButton =
        document.getElementById("music-button");

    const musicStatus =
        document.getElementById("music-status");

    /* =====================================
       狀態文字
       ===================================== */

    function showStatus(text) {

        if (!musicStatus) return;

        musicStatus.textContent = text;
        musicStatus.classList.add("show");

        clearTimeout(showStatus.timer);

        showStatus.timer = setTimeout(() => {
            musicStatus.classList.remove("show");
        }, 1800);
    }

    /* =====================================
       UI
       ===================================== */

    function updateButton() {

        if (!musicButton) return;

        if (playing) {
            musicButton.textContent = "◼";
            musicButton.classList.add("playing");
        } else {
            musicButton.textContent = "♫";
            musicButton.classList.remove("playing");
        }

    }

    /* =====================================
       YouTube API
       ===================================== */

    function loadYouTubeAPI() {

        if (window.YT && window.YT.Player) {
            initPlayer();
            return;
        }

        const existing =
            document.querySelector(
                'script[src="https://www.youtube.com/iframe_api"]'
            );

        if (!existing) {

            const script =
                document.createElement("script");

            script.src =
                "https://www.youtube.com/iframe_api";

            document.head.appendChild(script);
        }

        window.onYouTubeIframeAPIReady =
            initPlayer;
    }

    /* =====================================
       Player
       ===================================== */

    function initPlayer() {

        if (player) return;

        player = new YT.Player(
            "youtube-player",
            {
                height: "0",
                width: "0",

                videoId: MUSIC_ID,

                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    rel: 0,
                    modestbranding: 1,
                    playsinline: 1
                },

                events: {

                    onReady: function () {

                        ready = true;

                        player.setVolume(35);

                    },

                    onStateChange: function (event) {

                        if (
                            event.data ===
                            YT.PlayerState.PLAYING
                        ) {

                            playing = true;

                        }

                        if (
                            event.data ===
                            YT.PlayerState.PAUSED
                        ) {

                            playing = false;

                        }

                        if (
                            event.data ===
                            YT.PlayerState.ENDED
                        ) {

                            player.seekTo(0);
                            player.playVideo();

                        }

                        updateButton();
                    }

                }

            }
        );
    }

    /* =====================================
       播放
       ===================================== */

    function playMusic() {

        if (!ready || !player) {
            showStatus("MUSIC LOADING...");
            return;
        }

        player.setVolume(35);

        player.playVideo();

        playing = true;

        updateButton();

        showStatus("MUSIC ON");
    }

    /* =====================================
       暫停
       ===================================== */

    function pauseMusic() {

        if (!ready || !player) {
            return;
        }

        player.pauseVideo();

        playing = false;

        updateButton();

        showStatus("MUSIC OFF");
    }

    /* =====================================
       按鈕
       ===================================== */

    if (musicButton) {

        musicButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                if (playing) {
                    pauseMusic();
                } else {
                    playMusic();
                }

            }
        );

    }

    /* =====================================
       第一次操作網頁時播放
       ===================================== */

    let firstInteraction = true;

    function startMusicOnInteraction() {

        if (!firstInteraction) {
            return;
        }

        firstInteraction = false;

        if (ready) {
            playMusic();
        }

        document.removeEventListener(
            "pointerdown",
            startMusicOnInteraction
        );

    }

    document.addEventListener(
        "pointerdown",
        startMusicOnInteraction,
        { passive: true }
    );

    /* =====================================
       Hidden YouTube Player
       ===================================== */

    const playerContainer =
        document.createElement("div");

    playerContainer.id =
        "youtube-player";

    playerContainer.style.position = "fixed";
    playerContainer.style.width = "1px";
    playerContainer.style.height = "1px";
    playerContainer.style.left = "-9999px";
    playerContainer.style.top = "-9999px";
    playerContainer.style.pointerEvents = "none";

    document.body.appendChild(
        playerContainer
    );

    /* =====================================
       啟動 API
       ===================================== */

    loadYouTubeAPI();

})();
