document.addEventListener("DOMContentLoaded", () => {
    const platlogo = document.getElementById("platlogo");
    const logoContainer = document.getElementById("logo-container");
    const canvas = document.getElementById("beanbag-board");
    const ctx = canvas.getContext("2d");
    const toast = document.getElementById("toast");
    const toastVersion = document.getElementById("toast-version");

    // --- 第一段階：PlatLogoActivityの再現 ---
    let longPressTimeout = null;
    let toastTimeout = null;
    let isGameStarted = false;

    function showToast() {
        if (toastTimeout) clearTimeout(toastTimeout);
        // Android 4.1〜4.3 のランダム生成
        const minorVersion = Math.floor(Math.random() * 3) + 1;
        toastVersion.textContent = `Android 4.${minorVersion}`;
        
        toast.classList.add("show");
        toastTimeout = setTimeout(() => toast.classList.remove("show"), 3500); // Toast.LENGTH_LONG
    }

    logoContainer.addEventListener("pointerdown", (e) => {
        // 長押し判定 (約500msでBeanBag起動)
        longPressTimeout = setTimeout(() => {
            longPressTimeout = null;
            startBeanBag();
        }, 500);
    });

    logoContainer.addEventListener("pointerup", (e) => {
        if (longPressTimeout) {
            clearTimeout(longPressTimeout);
            longPressTimeout = null;
            
            // 単押し時の処理: 顔付きに変更してトースト表示
            platlogo.src = "j_platlogo.webp";
            showToast();
        }
    });

    // --- 第二段階：BeanBag (ビーンバッグ) のシミュレーター ---
    const NUM_BEANS = 40;
    const MIN_SCALE = 0.2;
    const MAX_SCALE = 1.0;
    const LUCKY = 0.001;

    // Javaのカラーコード (AARRGGBB -> #RRGGBB)
    const COLORS = [
        "#00CC00", "#CC0000", "#0000CC", "#FFFF00", 
        "#FF8000", "#00CCFF", "#FF0080", "#8000FF", 
        "#FF8080", "#8080FF", "#B0C0D0", "#DDDDDD", "#333333"
    ];

    const BEANS_SRC = [
        "j_redbean0.webp", "j_redbean0.webp", "j_redbean0.webp", "j_redbean0.webp",
        "j_redbean1.webp", "j_redbean1.webp",
        "j_redbean2.webp", "j_redbean2.webp",
        "j_redbeanandroid.webp"
    ];

    const loadedImages = {};
    let imagesToLoad = BEANS_SRC.length + 1; // + j_jandycane.webp

    // 画像プリロード関数
    function preloadImages(callback) {
        const sources = [...new Set(BEANS_SRC)]; // 重複削除
        sources.push("j_jandycane.webp");

        let loaded = 0;
        sources.forEach(src => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                loadedImages[src] = img;
                loaded++;
                if (loaded === sources.length) callback();
            };
        });
    }

    // ヘルパー関数群
    const lerp = (a, b, f) => (b - a) * f + a;
    const randfrange = (a, b) => lerp(a, b, Math.random());
    const randsign = () => Math.random() > 0.5 ? 1 : -1;
    const flip = () => Math.random() > 0.5;
    const mag = (x, y) => Math.sqrt(x * x + y * y);
    const clamp = (x, a, b) => (x < a) ? a : ((x > b) ? b : x);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    let beans = [];
    let lastTime = 0;
    let isRunning = false;
    let boardWidth = 0;
    let boardHeight = 0;

    class Bean {
        constructor(z) {
            this.z = z;
            this.grabbed = false;
            this.reset();
        }

        reset() {
            this.isJandycane = Math.random() <= LUCKY;
            this.src = this.isJandycane ? "j_jandycane.webp" : pick(BEANS_SRC);
            this.image = loadedImages[this.src];
            this.color = pick(COLORS);

            // 色付け用キャッシュキャンバス生成 (ColorMatrixColorFilterの再現)
           // 色付け用キャッシュキャンバス生成 (ColorMatrixColorFilterの再現)
            if (!this.isJandycane && this.image) {
                this.tintedCanvas = document.createElement("canvas");
                this.tintedCanvas.width = this.image.width;
                this.tintedCanvas.height = this.image.height;
                const tCtx = this.tintedCanvas.getContext("2d");
                
                // 1. まず元の画像（赤い豆）を描画
                tCtx.drawImage(this.image, 0, 0);
                
                // 2. 修正：合成モードを "color" に変更
                // 明暗（立体感）を維持しつつ、色相と彩度だけを塗り替えます
                tCtx.globalCompositeOperation = "color";
                tCtx.fillStyle = this.color;
                tCtx.fillRect(0, 0, this.tintedCanvas.width, this.tintedCanvas.height);
                
                // 3. 合成モードを "destination-in" にして、元の透明度（輪郭）で切り抜く
                tCtx.globalCompositeOperation = "destination-in";
                tCtx.drawImage(this.image, 0, 0);
                
                this.drawSource = this.tintedCanvas;
            } else {
                this.drawSource = this.image;
            }
            this.w = this.image ? this.image.width : 100;
            this.h = this.image ? this.image.height : 100;
            
            this.scale = lerp(MIN_SCALE, MAX_SCALE, this.z);
            this.r = 0.3 * Math.max(this.w, this.h) * this.scale;
            
            this.a = randfrange(0, 360);
            this.va = randfrange(-30, 30);
            
            this.vx = randfrange(-40, 40) * this.z;
            this.vy = randfrange(-40, 40) * this.z;

            // 画面外のランダムな位置からスタート
            if (flip()) {
                this.x = (this.vx < 0 ? boardWidth + 2 * this.r : -this.r * 4);
                this.y = randfrange(0, boardHeight - 3 * this.r) * 0.5 + (this.vy < 0 ? boardHeight * 0.5 : 0);
            } else {
                this.y = (this.vy < 0 ? boardHeight + 2 * this.r : -this.r * 4);
                this.x = randfrange(0, boardWidth - 3 * this.r) * 0.5 + (this.vx < 0 ? boardWidth * 0.5 : 0);
            }
        }

        update(dt) {
            if (this.grabbed) {
                // ドラック中の慣性計算
                this.vx = (this.vx * 0.75) + ((this.grabx - this.x) / dt) * 0.25;
                this.x = this.grabx;
                this.vy = (this.vy * 0.75) + ((this.graby - this.y) / dt) * 0.25;
                this.y = this.graby;
            } else {
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                this.a += this.va * dt;
            }

            // 画面外に大きく出たらリセット (MAX_RADIUS = 576 * MAX_SCALE の再現)
            const maxRadius = 576 * MAX_SCALE;
            if (this.x < -maxRadius || this.x > boardWidth + maxRadius || 
                this.y < -maxRadius || this.y > boardHeight + maxRadius) {
                this.reset();
            }
        }

        draw(ctx) {
            if (!this.drawSource) return;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.a * Math.PI / 180);
            const drawW = this.w * this.scale;
            const drawH = this.h * this.scale;
            ctx.drawImage(this.drawSource, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();
        }
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        boardWidth = canvas.width;
        boardHeight = canvas.height;
    }

    function startBeanBag() {
        if (isGameStarted) return;
        isGameStarted = true;
        
        logoContainer.style.display = "none";
        toast.style.display = "none";
        canvas.style.display = "block";

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        preloadImages(() => {
            beans = [];
            for (let i = 0; i < NUM_BEANS; i++) {
                let z = i / NUM_BEANS;
                z *= z;
                const bean = new Bean(z);
                // 最初は画面内に散らばらせる
                bean.x = randfrange(0, boardWidth);
                bean.y = randfrange(0, boardHeight);
                beans.push(bean);
            }
            isRunning = true;
            lastTime = performance.now();
            requestAnimationFrame(loop);
        });
    }

    function loop(now) {
        if (!isRunning) return;
        const dt = Math.min((now - lastTime) / 1000, 0.1); // 最大dtを制限
        lastTime = now;

        ctx.clearRect(0, 0, boardWidth, boardHeight);

        beans.forEach(bean => bean.update(dt));
        beans.forEach(bean => bean.draw(ctx));

        requestAnimationFrame(loop);
    }

    // --- ドラッグ＆フリック操作の実装 ---
    let grabbedBean = null;

    canvas.addEventListener("pointerdown", (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // 手前（配列の後ろ）から当たり判定をチェック
        for (let i = beans.length - 1; i >= 0; i--) {
            const b = beans[i];
            const dx = b.x - mx;
            const dy = b.y - my;
            if (mag(dx, dy) <= b.r) {
                grabbedBean = b;
                b.grabbed = true;
                b.grabx_offset = mx - b.x;
                b.graby_offset = my - b.y;
                b.va = 0;
                b.grabx = mx - b.grabx_offset;
                b.graby = my - b.graby_offset;
                
                // 最前面に描画するため配列の末尾に移動
                beans.splice(i, 1);
                beans.push(b);
                break;
            }
        }
    });

    canvas.addEventListener("pointermove", (e) => {
        if (!grabbedBean) return;
        const rect = canvas.getBoundingClientRect();
        grabbedBean.grabx = (e.clientX - rect.left) - grabbedBean.grabx_offset;
        grabbedBean.graby = (e.clientY - rect.top) - grabbedBean.graby_offset;
    });

    const releaseGrab = () => {
        if (grabbedBean) {
            grabbedBean.grabbed = false;
            // フリックによる回転速度の計算
            const a = randsign() * clamp(mag(grabbedBean.vx, grabbedBean.vy) * 0.33, 0, 1080);
            grabbedBean.va = randfrange(a * 0.5, a);
            grabbedBean = null;
        }
    };

    canvas.addEventListener("pointerup", releaseGrab);
    canvas.addEventListener("pointercancel", releaseGrab);
});