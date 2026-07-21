(function() {
    'use strict';

    // ======================================================================
    // 1. 密度 (DisplayMetrics.density) の取得
    // ======================================================================
    const DENSITY = window.devicePixelRatio || 1;

    // ======================================================================
    // 2. DOM 参照
    // ======================================================================
    const normalContainer = document.getElementById('platlogo-normal');
    const previewContainer = document.getElementById('platlogo-preview');
    const dessertContainer = document.getElementById('dessertcase-container');
    const dessertView = document.getElementById('dessertcase-view');

    const bgNormal = document.getElementById('bg-normal');
    const letterNormal = document.getElementById('letter-normal');
    const logoNormal = document.getElementById('logo-normal');
    const subNormal = document.getElementById('sub-normal');

    const letterPreview = document.getElementById('letter-preview');
    const logoPreview = document.getElementById('logo-preview');
    const subPreview = document.getElementById('sub-preview');

    // ======================================================================
    // 3. 密度に基づくサイズ設定 (dp/sp → px)
    // ======================================================================
    // 文字サイズ: 300sp
    const LETTER_SIZE = 300 * DENSITY;
    // 下部テキスト: 30sp
    const SUB_SIZE = 30 * DENSITY;
    // パディング: 4dp
    const PADDING = 4 * DENSITY;
    // 下部マージン: 10 * p = 40dp (p = 4*density)
    const BOTTOM_MARGIN = 40 * DENSITY;

    // K に適用
    [letterNormal, letterPreview].forEach(el => {
        if (el) {
            el.style.fontSize = LETTER_SIZE + 'px';
        }
    });
    // 下部テキストに適用
    [subNormal, subPreview].forEach(el => {
        if (el) {
            el.style.fontSize = SUB_SIZE + 'px';
            el.style.padding = PADDING + 'px';
            el.style.marginBottom = BOTTOM_MARGIN + 'px'; // 位置調整
        }
    });

    // ======================================================================
    // 4. モード判定 (URLパラメータ ?type=preview)
    // ======================================================================
    const urlParams = new URLSearchParams(window.location.search);
    const isPreview = urlParams.get('type') === 'preview';

    if (isPreview) {
        normalContainer.style.display = 'none';
        previewContainer.style.display = 'flex';
        dessertContainer.style.display = 'none';
    } else {
        normalContainer.style.display = 'flex';
        previewContainer.style.display = 'none';
        dessertContainer.style.display = 'none';
    }

    // ======================================================================
    // 5. 通常版 (PlatLogoActivity) ロジック
    // ======================================================================
    let clickCount = 0;
    let isLongPressed = false;
    let pressTimer = null;
    let currentRotation = 0; // 累積回転角度

    if (!isPreview) {
        // ---- クリックイベント (OnClickListener) ----
        letterNormal.addEventListener('click', function(e) {
            clickCount++;
            if (clickCount >= 6) {
                // 6回クリックで長押しを強制発火
                triggerNormalLongPress();
                return;
            }
            // 回転アニメーション (DecelerateInterpolator, 700ms)
            // ランダムに ±360° を累積
            const delta = (Math.random() > 0.5) ? 360 : -360;
            currentRotation += delta;
            letterNormal.style.transition = 'transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)';
            letterNormal.style.transform = 'rotate(' + currentRotation + 'deg)';
        });

        // ---- 長押し検知 (OnLongClickListener) ----
        letterNormal.addEventListener('pointerdown', function(e) {
            pressTimer = setTimeout(function() {
                triggerNormalLongPress();
            }, 1000); // 1秒
        });
        letterNormal.addEventListener('pointerup', function(e) {
            clearTimeout(pressTimer);
        });
        letterNormal.addEventListener('pointerleave', function(e) {
            clearTimeout(pressTimer);
        });

        // ---- 長押し発火関数 ----
        function triggerNormalLongPress() {
            if (isLongPressed) return;
            isLongPressed = true;
            clickCount = 0; // カウントリセット

            // 背景 (bg) を表示 (0.5s 遅延で alpha 1, scaleX 1)
            bgNormal.classList.add('visible');

            // K のアニメーション: alpha 0, scale 0.5, rotationBy(360), AccelerateInterpolator, 1000ms
            letterNormal.style.transition = 'transform 1s cubic-bezier(0.5, 0, 0.75, 0), opacity 1s ease';
            letterNormal.style.transform = 'scale(0.5) rotate(360deg)';
            letterNormal.style.opacity = '0';

            // ロゴ (logo) を表示: 0.5s 遅延でフェードイン + AnticipateOvershoot
            logoNormal.style.display = 'block';
            setTimeout(function() {
                logoNormal.classList.add('visible');
            }, 500);

            // テキスト (tv) を表示: 1s 遅延でフェードイン
            setTimeout(function() {
                subNormal.classList.add('visible');
            }, 1000);

            // ---- ロゴ長押しで DessertCase 起動 ----
            let logoPressTimer = null;
            const startGame = function() {
                if (!isLongPressed) return;
                // アンロック時刻を保存 (SharedPreferences 相当)
                try {
                    localStorage.setItem('k_egg_mode', Date.now().toString());
                } catch (e) {}
                // 画面切り替え
                normalContainer.style.display = 'none';
                dessertContainer.style.display = 'block';
                if (dessertGame) {
                    dessertGame.start();
                }
            };

            logoNormal.addEventListener('pointerdown', function onLogoDown(e) {
                logoPressTimer = setTimeout(function() {
                    startGame();
                }, 1000);
            });
            // クリア用
            const clearLogoPress = function() {
                clearTimeout(logoPressTimer);
                document.removeEventListener('pointerup', clearLogoPress);
                document.removeEventListener('pointerleave', clearLogoPress);
            };
            document.addEventListener('pointerup', clearLogoPress);
            document.addEventListener('pointerleave', clearLogoPress);
        }
    }

    // ======================================================================
    // 6. プレビュー版 (preview.PlatLogoActivity) ロジック
    // ======================================================================
    if (isPreview) {
        let previewRevealed = false;

        letterPreview.addEventListener('click', function(e) {
            if (previewRevealed) return;
            previewRevealed = true;

            // K のアニメーション: alpha 0.25, scale 0.75, 2000ms (Decelerate?)
            letterPreview.style.transition = 'transform 2s cubic-bezier(0.25, 1, 0.5, 1), opacity 2s ease';
            letterPreview.style.transform = 'scale(0.75)';
            letterPreview.style.opacity = '0.25';

            // ロゴ表示: 0.5s 遅延
            logoPreview.style.display = 'block';
            setTimeout(function() {
                logoPreview.classList.add('visible');
            }, 500);

            // テキスト表示: 1s 遅延
            setTimeout(function() {
                subPreview.classList.add('visible');
            }, 1000);
        });

        // 長押しは無視 (finish 相当) → 何もしない
    }

    // ======================================================================
    // 7. DessertCaseView 完全移植
    // ======================================================================
    // ---- 定数 ----
    const CELL_SIZE_DP = 192;          // R.dimen.k_dessert_case_cell_size
    const SCALE = 0.25;                // DessertCaseView.SCALE
    const START_DELAY = 5000;          // mHandler.postDelayed(mJuggle, START_DELAY)
    const JUGGLE_DELAY = 2000;         // DELAY
    const DURATION = 500;              // アニメーション時間

    // ---- 画像リスト (リソースID の代わりにファイル名) ----
    const PASTRIES = [
        'k_dessert_kitkat.webp',
        'k_dessert_android.webp'
    ];
    const RARE_PASTRIES = [
        'k_dessert_cupcake.webp', 'k_dessert_donut.webp', 'k_dessert_eclair.webp',
        'k_dessert_froyo.webp', 'k_dessert_gingerbread.webp', 'k_dessert_honeycomb.webp',
        'k_dessert_ics.webp', 'k_dessert_jellybean.webp'
    ];
    const XRARE_PASTRIES = [
        'k_dessert_petitfour.webp', 'k_dessert_donutburger.webp',
        'k_dessert_flan.webp', 'k_dessert_keylimepie.webp'
    ];
    const XXRARE_PASTRIES = [
        'k_dessert_zombiegingerbread.webp', 'k_dessert_dandroid.webp',
        'k_dessert_jandycane.webp'
    ];

    // ---- DessertCaseView クラス ----
    class DessertCaseView {
        constructor(container) {
            this.container = container;
            // セルサイズ (px) = 192dp * density
            this.mCellSize = CELL_SIZE_DP * DENSITY;
            this.mScale = SCALE;
            this.mWidth = 0;
            this.mHeight = 0;
            this.mRows = 0;
            this.mColumns = 0;
            this.mCells = [];          // 一次元配列 (行*列)
            this.mFreeList = new Set(); // "col,row" 文字列のセット
            this.mStarted = false;
            this.mJuggleTimer = null;
            this.mDelayFillTimer = null;
            this.mChildren = [];        // 追加したViewを保持

            // リサイズハンドラ
            this._resizeHandler = this._onResize.bind(this);
            window.addEventListener('resize', this._resizeHandler);
            // 初回レイアウト
            requestAnimationFrame(() => this._onResize());
        }

        // ---- リサイズ処理 (onSizeChanged 相当) ----
        _onResize() {
            const w = window.innerWidth;
            const h = window.innerHeight;

            // RescalingContainer が与えるサイズ: w / SCALE, h / SCALE
            const containerW = w / this.mScale;
            const containerH = h / this.mScale;

            // 以前の値を保持 (再起動判定)
            const wasStarted = this.mStarted;
            if (wasStarted) {
                this.stop();
            }

            this.mWidth = containerW;
            this.mHeight = containerH;
            this.mColumns = Math.floor(this.mWidth / this.mCellSize);
            this.mRows = Math.floor(this.mHeight / this.mCellSize);
            if (this.mColumns < 1) this.mColumns = 1;
            if (this.mRows < 1) this.mRows = 1;

            // コンテナのサイズを設定 (CSS)
            this.container.style.width = containerW + 'px';
            this.container.style.height = containerH + 'px';
            // transform: scale(SCALE) を適用 (元のサイズを縮小)
            this.container.style.transform = 'scale(' + this.mScale + ')';
            // transform-origin は 0 0 (デフォルト)

            // グリッド再構築
            this._clearGrid();
            this._initGrid();

            if (wasStarted) {
                this.start();
            }
        }

        // ---- グリッド初期化 ----
        _clearGrid() {
            // すべての子要素を削除
            while (this.container.firstChild) {
                this.container.removeChild(this.container.firstChild);
            }
            this.mCells = [];
            this.mFreeList.clear();
            this.mChildren = [];
        }

        _initGrid() {
            const total = this.mRows * this.mColumns;
            this.mCells = new Array(total);
            for (let r = 0; r < this.mRows; r++) {
                for (let c = 0; c < this.mColumns; c++) {
                    this.mFreeList.add(c + ',' + r);
                }
            }
        }

        // ---- ユーティリティ (Java の static メソッド) ----
        _frand() { return Math.random(); }
        _irand(a, b) { return Math.floor(this._frand() * (b - a) + a); }
        _pick(arr) { return arr[this._irand(0, arr.length)]; }

        // ---- random_color() ----
        _randomColor() {
            const COLORS = 12;
            const hue = this._irand(0, COLORS) * (360 / COLORS);
            // Android: Color.HSVToColor(hsv) で Value=0.85f → ここでは hsl(h, 100%, 42%) に変換 (0.85*0.5 = 0.425)
            return 'hsl(' + hue + ', 100%, 42%)';
        }

        // ---- pickDrawable() ----
        _pickDrawable() {
            const r = this._frand();
            let list;
            if (r < 0.0005) {
                list = XXRARE_PASTRIES;
            } else if (r < 0.005) {
                list = XRARE_PASTRIES;
            } else if (r < 0.5) {
                list = RARE_PASTRIES;
            } else if (r < 0.7) {
                list = PASTRIES;
            } else {
                list = null;
            }
            if (list && list.length) {
                return this._pick(list);
            }
            return null;
        }

        // ---- getOccupied (占有マスを取得) ----
        _getOccupied(view) {
            const span = parseInt(view.dataset.span) || 1;
            const pos = view.dataset.pos;
            if (!pos) return [];
            const parts = pos.split(',');
            const cx = parseInt(parts[0]);
            const cy = parseInt(parts[1]);
            const result = [];
            for (let i = 0; i < span; i++) {
                for (let j = 0; j < span; j++) {
                    const x = cx + i;
                    const y = cy + j;
                    if (x < this.mColumns && y < this.mRows) {
                        result.push({ x: x, y: y });
                    }
                }
            }
            return result;
        }

        // ---- place (配置) ----
        _place(view, pt, animate) {
            const col = pt.x;
            const row = pt.y;
            let scale = 1;
            const rnd = this._frand();

            // 確率に基づいて拡大
            if (rnd < 0.01 && col <= this.mColumns - 4 && row <= this.mRows - 4) {
                scale = 4;
            } else if (rnd < 0.1 && col <= this.mColumns - 3 && row <= this.mRows - 3) {
                scale = 3;
            } else if (rnd < 0.33 && col <= this.mColumns - 2 && row <= this.mRows - 2) {
                scale = 2;
            }

            // 古い占有を解放
            if (view.dataset.pos) {
                const oldOccupied = this._getOccupied(view);
                for (let p of oldOccupied) {
                    const key = p.x + ',' + p.y;
                    this.mFreeList.add(key);
                    const idx = p.y * this.mColumns + p.x;
                    if (this.mCells[idx] === view) {
                        this.mCells[idx] = null;
                    }
                }
            }

            view.dataset.pos = col + ',' + row;
            view.dataset.span = scale;

            // 競合 (squatter) を検出
            const squatters = new Set();
            const occupied = this._getOccupied(view);
            for (let p of occupied) {
                const idx = p.y * this.mColumns + p.x;
                const existing = this.mCells[idx];
                if (existing && existing !== view) {
                    squatters.add(existing);
                }
            }

            // 競合を破棄
            for (let squatter of squatters) {
                const sqOccupied = this._getOccupied(squatter);
                for (let p of sqOccupied) {
                    const key = p.x + ',' + p.y;
                    this.mFreeList.add(key);
                    const idx = p.y * this.mColumns + p.x;
                    if (this.mCells[idx] === squatter) {
                        this.mCells[idx] = null;
                    }
                }
                squatter.dataset.pos = null;
                if (squatter !== view) {
                    if (animate) {
                        // アニメーション: AccelerateInterpolator, 500ms
                        squatter.classList.add('removing');
                        squatter.style.transition = 'transform 0.5s cubic-bezier(0.5, 0, 0.75, 0), opacity 0.5s cubic-bezier(0.5, 0, 0.75, 0)';
                        squatter.style.transform = 'scale(0.5)';
                        squatter.style.opacity = '0';
                        setTimeout(function() {
                            if (squatter.parentNode) {
                                squatter.parentNode.removeChild(squatter);
                            }
                        }, DURATION);
                    } else {
                        if (squatter.parentNode) {
                            squatter.parentNode.removeChild(squatter);
                        }
                    }
                }
            }

            // 占有を設定
            for (let p of occupied) {
                const idx = p.y * this.mColumns + p.x;
                this.mCells[idx] = view;
                const key = p.x + ',' + p.y;
                this.mFreeList.delete(key);
            }

            // 位置・回転を計算
            const size = this.mCellSize;
            // グリッド全体のオフセット (中央寄せ)
            const gridWidth = this.mColumns * size;
            const gridHeight = this.mRows * size;
            const offsetX = (this.mWidth - gridWidth) / 2;
            const offsetY = (this.mHeight - gridHeight) / 2;
            const left = offsetX + col * size;
            const top = offsetY + row * size;
            const rot = this._irand(0, 4) * 90;

            view.style.width = size + 'px';
            view.style.height = size + 'px';
            view.style.left = '0';
            view.style.top = '0';

            if (animate) {
                // アニメーション: 最初は 0.5*scale から始める
                view.style.transition = 'none';
                view.style.transform = 'translate(' + left + 'px, ' + top + 'px) scale(' + (scale * 0.5) + ') rotate(' + rot + 'deg)';
                view.style.opacity = '0';
                requestAnimationFrame(function() {
                    view.style.transition = 'transform 0.5s cubic-bezier(0.68, -0.6, 0.32, 1.6), opacity 0.5s ease';
                    view.style.transform = 'translate(' + left + 'px, ' + top + 'px) scale(' + scale + ') rotate(' + rot + 'deg)';
                    view.style.opacity = '1';
                });
            } else {
                view.style.transition = 'none';
                view.style.transform = 'translate(' + left + 'px, ' + top + 'px) scale(' + scale + ') rotate(' + rot + 'deg)';
                view.style.opacity = '1';
            }
        }

        // ---- fillFreeList (空きを埋める) ----
        _fillFreeList(animationLen) {
            if (this.mDelayFillTimer) {
                clearTimeout(this.mDelayFillTimer);
                this.mDelayFillTimer = null;
            }
            const animate = (animationLen > 0);
            while (this.mFreeList.size > 0) {
                // イテレータから一つ取得
                const key = this.mFreeList.values().next().value;
                const parts = key.split(',');
                const cx = parseInt(parts[0]);
                const cy = parseInt(parts[1]);
                this.mFreeList.delete(key);

                const idx = cy * this.mColumns + cx;
                if (this.mCells[idx] !== null) continue;

                // 新しい ImageView 相当の div を作成
                const view = document.createElement('div');
                view.className = 'dessert-cell';
                view.style.backgroundColor = this._randomColor();

                const imgSrc = this._pickDrawable();
                if (imgSrc) {
                    const img = document.createElement('img');
                    img.src = imgSrc;
                    img.alt = '';
                    // 読み込みエラー時はコンソールに出力
                    img.onerror = function() {
                        console.warn('Failed to load image:', imgSrc);
                    };
                    view.appendChild(img);
                }

                this.container.appendChild(view);
                this.mChildren.push(view);
                this._place(view, { x: cx, y: cy }, animate);
            }
        }

        // ---- juggle (シャッフル) ----
        _juggle() {
            const children = this.mChildren.filter(function(el) {
                return el.parentNode && !el.classList.contains('removing');
            });
            if (children.length === 0) return;
            const target = children[this._irand(0, children.length)];
            if (target) {
                const col = this._irand(0, this.mColumns);
                const row = this._irand(0, this.mRows);
                this._place(target, { x: col, y: row }, true);
                // 空きを埋める (遅延)
                clearTimeout(this.mDelayFillTimer);
                this.mDelayFillTimer = setTimeout(function() {
                    this._fillFreeList(DURATION / 2);
                }.bind(this), DURATION / 2);
            }
        }

        // ---- scheduleJuggle ----
        _scheduleJuggle() {
            if (this.mJuggleTimer) clearTimeout(this.mJuggleTimer);
            this.mJuggleTimer = setTimeout(function() {
                if (!this.mStarted) return;
                this._juggle();
                this._scheduleJuggle();
            }.bind(this), JUGGLE_DELAY);
        }

        // ---- start / stop ----
        start() {
            if (this.mStarted) return;
            this.mStarted = true;
            this._fillFreeList(DURATION * 4);
            // 初回の juggle は START_DELAY 後に開始
            setTimeout(function() {
                if (this.mStarted) {
                    this._scheduleJuggle();
                }
            }.bind(this), START_DELAY);
        }

        stop() {
            this.mStarted = false;
            if (this.mJuggleTimer) {
                clearTimeout(this.mJuggleTimer);
                this.mJuggleTimer = null;
            }
            if (this.mDelayFillTimer) {
                clearTimeout(this.mDelayFillTimer);
                this.mDelayFillTimer = null;
            }
        }

        // ---- 破棄 ----
        destroy() {
            this.stop();
            window.removeEventListener('resize', this._resizeHandler);
            this._clearGrid();
        }
    }

    // ======================================================================
    // 8. DessertCase インスタンス生成
    // ======================================================================
    let dessertGame = null;
    if (dessertView) {
        dessertGame = new DessertCaseView(dessertView);
        // 初期は非表示
        dessertContainer.style.display = 'none';
    }

    // ======================================================================
    // 9. デバッグ情報
    // ======================================================================
    console.log('Android KitKat Easter Egg loaded. Preview mode:', isPreview);
    console.log('Density:', DENSITY);
    console.log('Cell size (px):', CELL_SIZE_DP * DENSITY);
})();