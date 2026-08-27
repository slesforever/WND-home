(function () {

    /* =====================================================
       CONFIG
    ===================================================== */

    const MUSIC_ID =
        "eMqWJDP28p8";


    let player = null;

    let playerReady = false;

    let playing = false;

    let apiLoading = false;

    let bootStarted = false;


    const musicButton =
        document.getElementById(
            "music-button"
        );

    const musicLabel =
        document.getElementById(
            "music-label"
        );


    /* =====================================================
       AUDIO ENGINE
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


    /* =====================================================
       ORIGINAL UI SOUND
    ===================================================== */

    function playSfx(type) {

        try {

            const ctx =
                getAudioContext();

            const now =
                ctx.currentTime;


            /*
             * BOOT
             */

            if (type === "boot") {

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
                    720,
                    now + 0.75
                );


                gain.gain.setValueAtTime(
                    0.0001,
                    now
                );


                gain.gain.exponentialRampToValueAtTime(
                    0.06,
                    now + 0.20
                );


                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    now + 1.1
                );


                osc.connect(gain);

                gain.connect(
                    ctx.destination
                );


                osc.start(now);

                osc.stop(
                    now + 1.15
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
                    1050,
                    now + 0.45
                );


                sparkle.frequency.exponentialRampToValueAtTime(
                    1500,
                    now + 0.85
                );


                sparkleGain.gain.setValueAtTime(
                    0.0001,
                    now
                );


                sparkleGain.gain.exponentialRampToValueAtTime(
                    0.035,
                    now + 0.55
                );


                sparkleGain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    now + 1
                );


                sparkle.connect(
                    sparkleGain
                );

                sparkleGain.connect(
                    ctx.destination
                );


                sparkle.start(
                    now + 0.4
                );

                sparkle.stop(
                    now + 1.05
                );

            }


            /*
             * CLICK
             */

            if (type === "click") {

                const osc =
                    ctx.createOscillator();

                const gain =
                    ctx.createGain();


                osc.type =
                    "sine";


                osc.frequency.setValueAtTime(
                    650,
                    now
                );


                osc.frequency.exponentialRampToValueAtTime(
                    390,
                    now + 0.10
                );


                gain.gain.setValueAtTime(
                    0.045,
                    now
                );


                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    now + 0.11
                );


                osc.connect(gain);

                gain.connect(
                    ctx.destination
                );


                osc.start(now);

                osc.stop(
                    now + 0.12
                );

            }


            /*
             * PAGE
             */

            if (type === "page") {

                const osc =
                    ctx.createOscillator();

                const gain =
                    ctx.createGain();


                osc.type =
                    "triangle";


                osc.frequency.setValueAtTime(
                    240,
                    now
                );


                osc.frequency.exponentialRampToValueAtTime(
                    510,
                    now + 0.16
                );


                gain.gain.setValueAtTime(
                    0.035,
                    now
                );


                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    now + 0.18
                );


                osc.connect(gain);

                gain.connect(
                    ctx.destination
                );


                osc.start(now);

                osc.stop(
                    now + 0.20
                );


                /*
                 * 小高頻
                 */

                const high =
                    ctx.createOscillator();

                const highGain =
                    ctx.createGain();


                high.type =
                    "sine";


                high.frequency.setValueAtTime(
                    900,
                    now + 0.03
                );


                highGain.gain.setValueAtTime(
                    0.025,
                    now + 0.03
                );


                highGain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    now + 0.12
                );


                high.connect(
                    highGain
                );

                highGain.connect(
                    ctx.destination
                );


                high.start(
                    now + 0.03
                );

                high.stop(
                    now + 0.14
                );

            }

        } catch (error) {

            console.warn(
                "SFX unavailable",
                error
            );

        }

    }


    window.playInterfaceSfx =
        playSfx;


    /* =====================================================
       MUSIC UI
    ===================================================== */

    function updateMusicUI() {

        if (!musicButton)
            return;


        if (playing) {

            musicButton.textContent =
                "Ⅱ";

            musicButton.classList.add(
                "playing"
            );

            if (musicLabel) {

                musicLabel.textContent =
                    "MUSIC ON";

            }

        } else {

            musicButton.textContent =
                "♫";

            musicButton.classList.remove(
                "playing"
            );

            if (musicLabel) {

                musicLabel.textContent =
                    "MUSIC OFF";

            }

        }

    }


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


    /* =====================================================
       PLAYER
    ===================================================== */

    function initPlayer() {

        if (player)
            return;


        player =
            new YT.Player(
                "youtube-player",
                {

                    videoId:
                        MUSIC_ID,

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


                                updateMusicUI();

                            }

                    }

                }
            );

    }


    /* =====================================================
       PLAY MUSIC
    ===================================================== */

    window.startMusic =
        function () {

            if (!playerReady) {

                loadYouTubeAPI();

                return;

            }


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
       STOP MUSIC
    ===================================================== */

    function stopMusic() {

        if (
            !playerReady ||
            !player
        )
            return;


        player.pauseVideo();


        playing =
            false;


        updateMusicUI();

    }


    /* =====================================================
       MUSIC BUTTON
    ===================================================== */

    if (musicButton) {

        musicButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();


                getAudioContext();


                playSfx(
                    "click"
                );


                if (playing) {

                    stopMusic();

                } else {

                    window.startMusic();

                }

            }
        );

    }


    /* =====================================================
       BOOT OVERLAY
    ===================================================== */

    function createBootScreen() {

        const style =
            document.createElement(
                "style"
            );


        style.textContent = `

            #archive-boot {

                position: fixed;

                inset: 0;

                z-index: 10000;

                display: flex;

                align-items: center;

                justify-content: center;

                background:

                    radial-gradient(
                        circle at center,
                        #eafaff 0%,
                        #ccefff 35%,
                        #a7dff7 100%
                    );

                overflow: hidden;

                transition:
                    opacity 1s ease;

            }


            #archive-boot.hide {

                opacity: 0;

                pointer-events: none;

            }


            .boot-orbit {

                position: absolute;

                width: 190px;

                height: 190px;

                border:
                    1px solid
                    rgba(255,255,255,0.75);

                border-radius: 50%;

                box-shadow:
                    0 0 30px
                    rgba(89,201,247,0.25);

                opacity: 0;

            }


            .boot-orbit.o1 {

                animation:
                    orbitIn 2s
                    0.15s
                    forwards,
                    orbitSpin 12s
                    2.15s
                    linear infinite;

            }


            .boot-orbit.o2 {

                width: 235px;
                height: 235px;

                border-style:
                    dashed;

                animation:
                    orbitIn 2s
                    0.30s
                    forwards,
                    orbitSpinReverse 18s
                    2.3s
                    linear infinite;

            }


            .boot-orbit.o3 {

                width: 285px;
                height: 285px;

                border-color:
                    rgba(255,255,255,0.35);

                animation:
                    orbitIn 2s
                    0.45s
                    forwards,
                    orbitSpin 25s
                    2.45s
                    linear infinite;

            }


            @keyframes orbitIn {

                0% {

                    opacity: 0;

                    transform:
                        scale(0.3)
                        rotate(0deg);

                }

                60% {

                    opacity: 1;

                }

                100% {

                    opacity: 0.7;

                    transform:
                        scale(1)
                        rotate(120deg);

                }

            }


            @keyframes orbitSpin {

                to {

                    transform:
                        rotate(360deg);

                }

            }


            @keyframes orbitSpinReverse {

                to {

                    transform:
                        rotate(-360deg);

                }

            }


            .boot-seed {

                position: relative;

                width: 72px;
                height: 72px;

                border-radius: 50%;

                background:
                    radial-gradient(
                        circle at 35% 30%,
                        #ffffff,
                        #faffff 42%,
                        #b8ecff 100%
                    );

                box-shadow:

                    0 0 20px
                    #ffffff,

                    0 0 45px
                    rgba(255,255,255,0.95),

                    0 0 85px
                    rgba(89,201,247,0.75),

                    0 0 130px
                    rgba(89,201,247,0.45);

                transform:
                    scale(0);

                animation:
                    seedAppear 1.1s
                    0.2s
                    cubic-bezier(.22,1,.36,1)
                    forwards,

                    seedPulse 3s
                    1.3s
                    ease-in-out infinite;

                z-index: 4;

            }


            @keyframes seedAppear {

                0% {

                    transform:
                        scale(0)
                        rotate(-20deg);

                }

                70% {

                    transform:
                        scale(1.16)
                        rotate(5deg);

                }

                100% {

                    transform:
                        scale(1)
                        rotate(0);

                }

            }


            @keyframes seedPulse {

                0%,
                100% {

                    box-shadow:

                        0 0 20px #fff,

                        0 0 50px
                        rgba(255,255,255,.8),

                        0 0 90px
                        rgba(89,201,247,.55);

                }

                50% {

                    box-shadow:

                        0 0 35px #fff,

                        0 0 75px
                        rgba(255,255,255,1),

                        0 0 135px
                        rgba(89,201,247,.85);

                }

            }


            .boot-core {

                position: absolute;

                width: 19px;
                height: 19px;

                border-radius: 50%;

                background:
                    #ffffff;

                box-shadow:
                    0 0 20px
                    white;

                left: 50%;
                top: 50%;

                transform:
                    translate(-50%,-50%);

                animation:
                    corePulse 1.8s
                    ease-in-out infinite;

            }


            @keyframes corePulse {

                0%,
                100% {
                    transform:
                        translate(-50%,-50%)
                        scale(.8);
                }

                50% {
                    transform:
                        translate(-50%,-50%)
                        scale(1.15);
                }

            }


            .boot-label {

                position: absolute;

                bottom: 20%;

                color:
                    rgba(50,111,139,0.72);

                font-size: 10px;

                font-weight: 700;

                letter-spacing: 4px;

                opacity: 0;

                animation:
                    labelIn 1.2s
                    0.7s
                    forwards;

            }


            @keyframes labelIn {

                from {

                    opacity: 0;

                    transform:
                        translateY(8px);

                }

                to {

                    opacity: 1;

                    transform:
                        translateY(0);

                }

            }


            .boot-flash {

                position: absolute;

                width: 20px;
                height: 20px;

                border-radius: 50%;

                background: #ffffff;

                box-shadow:
                    0 0 100px
                    50px #ffffff;

                transform:
                    scale(0);

                pointer-events: none;

            }


            #archive-boot.complete .boot-seed {

                animation:
                    seedBurst
                    .8s
                    cubic-bezier(.22,1,.36,1)
                    forwards;

            }


            @keyframes seedBurst {

                0% {

                    transform:
                        scale(1);

                }

                45% {

                    transform:
                        scale(2.2);

                }

                100% {

                    transform:
                        scale(32);

                }

            }

        `;


        document.head.appendChild(
            style
        );


        const boot =
            document.createElement(
                "div"
            );


        boot.id =
            "archive-boot";


        boot.innerHTML = `

            <div class="boot-orbit o1"></div>

            <div class="boot-orbit o2"></div>

            <div class="boot-orbit o3"></div>


            <div class="boot-seed">

                <div
                    class="boot-core"
                ></div>

            </div>


            <div class="boot-label">
                ARCHIVE INITIALIZING
            </div>

            <div class="boot-flash"></div>

        `;


        document.body.appendChild(
            boot
        );


        return boot;

    }


    /* =====================================================
       BOOT
    ===================================================== */

    function startBoot() {

        if (bootStarted)
            return;


        bootStarted =
            true;


        const boot =
            createBootScreen();


        /*
         * 等待一下讓 UI 進入
         */

        setTimeout(
            () => {

                playSfx(
                    "boot"
                );

            },
            350
        );


        /*
         * 光之種爆發
         */

        setTimeout(
            () => {

                boot.classList.add(
                    "complete"
                );


                /*
                 * 同時啟動音樂
                 */

                if (
                    playerReady
                ) {

                    window.startMusic();

                }

            },
            2100
        );


        /*
         * 主畫面出現
         */

        setTimeout(
            () => {

                document.body.classList.add(
                    "booted"
                );


                boot.classList.add(
                    "hide"
                );


            },
            2550
        );


        /*
         * 完全移除
         */

        setTimeout(
            () => {

                boot.remove();

            },
            3700
        );

    }


    /* =====================================================
       FIRST USER INTERACTION
    ===================================================== */

    let firstInteraction =
        false;


    function userInteraction() {

        if (
            firstInteraction
        )
            return;


        firstInteraction =
            true;


        getAudioContext();


        /*
         * 直接啟動開機動畫
         */

        startBoot();


        /*
         * 有些瀏覽器這一瞬間可以
         * 允許 YouTube 開始播放
         */

        if (playerReady) {

            try {

                window.startMusic();

            } catch (e) {}

        }


        document.removeEventListener(
            "pointerdown",
            userInteraction
        );

    }


    document.addEventListener(
        "pointerdown",
        userInteraction,
        {
            passive: true
        }
    );


    /* =====================================================
       INIT
    ===================================================== */

    loadYouTubeAPI();


})();
