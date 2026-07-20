document.addEventListener("DOMContentLoaded", () => {
    // URLのパラメータから通常版かPreview版かを判定する
    const urlParams = new URLSearchParams(window.location.search);
    const isPreview = urlParams.get('type') === 'preview';

    const platlogo = document.getElementById("platlogo");
    const logoContainer = document.getElementById("logo-container");
    const canvas = document.getElementById("nyandroid-board");
    const ctx = canvas.getContext("2d");
    const toast = document.getElementById("toast");
// モードごとの画像とトーストテキストの設定 (strings.xml / Activityリライト)
    if (isPreview) {
        platlogo.src = "i_platlogo_preview.png"; 
        toast.textContent = "REZZZZZZZ...";
    } else {
        // ★ここを .png から .svg に変更します！
        platlogo.src = "i_platlogo.jpg"; 
        toast.textContent = "Android 4.0: Ice Cream Sandwich";
    }
    // --- 長押し処理の変数 (PlatLogoActivityの再現) ---
    let mCount = 0;
    let longPressTimeout = null;
    let toastTimeout = null;
    const LONG_PRESS_TIMEOUT = 500; // ViewConfiguration.getLongPressTimeout() 相当

    function showToast() {
        if (toastTimeout) clearTimeout(toastTimeout);
        toast.classList.add("show");
        toastTimeout = setTimeout(() => toast.classList.remove("show"), 2000);
    }

    // Javaの mSuperLongPress ループ処理を再現
    function triggerSuperLongPress() {
        mCount++;
        
        // スマホなどのバイブレーション機能を呼び出し (50ms * カウント)
        if (navigator.vibrate) {
            navigator.vibrate(50 * mCount);
        }

        // 段階的な巨大化計算: float scale = 1f + 0.25f * mCount * mCount;
        const scale = 1 + 0.25 * mCount * mCount;
        platlogo.style.transform = `scale(${scale})`;

        if (mCount <= 3) {
            // カウントが3を超えるまで連続ループ
            longPressTimeout = setTimeout(triggerSuperLongPress, LONG_PRESS_TIMEOUT);
        } else {
            // カウントが4に達したら裏ゲーム「Nyandroid」起動！
            startNyandroid();
        }
    }

    // タッチ＆クリックイベントのハンドリング
    logoContainer.addEventListener("pointerdown", (e) => {
        mCount = 0;
        platlogo.style.transform = "scale(1)";
        // Androidコードの「2 * getLongPressTimeout()」をシミュレートして長押し始動
        longPressTimeout = setTimeout(triggerSuperLongPress, LONG_PRESS_TIMEOUT * 2);
    });

    window.addEventListener("pointerup", () => {
        if (longPressTimeout) {
            clearTimeout(longPressTimeout);
            longPressTimeout = null;
            // カウントが上がっていない状態で指が離れたらトーストを表示
            if (mCount === 0) {
                showToast();
            }
        }
    });


    // =================================================================
    // 🌌 裏ゲーム：Nyandroid シミュレーター (Nyandroid.javaの移植)
    // =================================================================
    
    // 画像アセットのプリロード
    const starImages = [];
    for (let i = 0; i <= 5; i++) {
        const img = new Image();
        img.src = `i_star${i}.webp`;
        starImages.push(img);
    }

    const catImages = [];
    for (let i = 0; i <= 11; i++) {
        const img = new Image();
        img.src = `i_nyandroid${String(i).padStart(2, '0')}.webp`;
        catImages.push(img);
    }

    const NUM_CATS = 20;
    const fixedStars = [];
    const flyingCats = [];
    let lastTime = 0;
    let isRunning = false;

    // ヘルパー関数 (Javaの lerp, randfrange)
    function lerp(a, b, f) { return (b - a) * f + a; }
    function randfrange(a, b) { return lerp(a, b, Math.random()); }

    // キャンバスのリサイズ
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function startNyandroid() {
        logoContainer.style.display = "none";
        canvas.style.display = "block";
        isRunning = true;

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // 星（固定）の初期化 (FIXED_STARS = true)
        for (let i = 0; i < 20; i++) {
            fixedStars.push({
                x: randfrange(0, canvas.width),
                y: randfrange(0, canvas.height),
                scale: randfrange(0.1, 1.0),
                frame: Math.floor(Math.random() * 6),
                frameTimer: Math.random() * 200 // パラパラのアニメ速度調整用
            });
        }

        // 飛行する猫（Nyandroid）の初期化
        for (let i = 0; i < NUM_CATS; i++) {
            let z = i / NUM_CATS;
            z *= z; // 重なり具合の奥行き計算 (nv.z *= nv.z)

            const cat = {
                z: z,
                x: randfrange(0, canvas.width),
                y: 0, // reset()で決まる
                v: 0,
                scale: lerp(0.1, 2.0, z),
                frame: Math.floor(Math.random() * 12),
                frameTimer: Math.random() * 100,
                
                // Javaの nv.reset() を再現
                reset: function() {
                    this.x = -this.scale * 120; // 画面左外からスタート
                    this.y = randfrange(0, canvas.height - this.scale * 60);
                    this.v = lerp(100, 1000, this.z); // VMIN=100, VMAX=1000
                }
            };
            cat.reset();
            // 最初だけは画面内に散らばらせる
            cat.x = randfrange(0, canvas.width);
            flyingCats.push(cat);
        }

        // アニメーションループ開始 (TimeAnimator相当)
        lastTime = performance.now();
        requestAnimationFrame(loop);
    }

    function loop(now) {
        if (!isRunning) return;
        const dt = (now - lastTime) / 1000; // 経過時間（秒）
        lastTime = now;

        // 背景クリア
        ctx.fillStyle = "#003366";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 1. 星の描画とアニメーション
        fixedStars.forEach(star => {
            star.frameTimer += dt * 1000;
            if (star.frameTimer > 150) { // 150msごとにアニメのコマを進める
                star.frame = (star.frame + 1) % starImages.length;
                star.frameTimer = 0;
            }
            const img = starImages[star.frame];
            if (img.complete) {
                const w = img.width * star.scale;
                const h = img.height * star.scale;
                ctx.drawImage(img, star.x, star.y, w, h);
            }
        });

        // 2. 飛行する猫のアップデート＆描画
        flyingCats.forEach(cat => {
            // 位置の更新: nv.update()
            cat.x += cat.v * dt;

            // アニメのコマ更新
            cat.frameTimer += dt * 1000;
            if (cat.frameTimer > 80) { // 猫は少し早めにパタパタさせる
                cat.frame = (cat.frame + 1) % catImages.length;
                cat.frameTimer = 0;
            }

            const img = catImages[cat.frame];
            if (img.complete) {
                const w = img.width * cat.scale;
                const h = img.height * cat.scale;
                ctx.drawImage(img, cat.x, cat.y, w, h);

                // 画面外に出たらリセットして再登場
                if (cat.x > canvas.width + 10) {
                    cat.reset();
                }
            }
        });

        requestAnimationFrame(loop);
    }

    // ユーザー操作があったら終了して閉じる (onUserInteraction)
    canvas.addEventListener("click", () => {
        isRunning = false;
        // 親ポータルのメニューを展開できるように戻す
        const header = parent.document.getElementById("header");
        const menuToggle = parent.document.getElementById("menuToggle");
        if (header && menuToggle) {
            header.classList.remove("collapsed");
            menuToggle.textContent = "メニューを閉じる ▲";
        }
        // リロードして初期状態に戻す
        window.location.reload();
    });
});