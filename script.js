// 移植が完了したイースターエッグの定義リスト
// 移植が完了したイースターエッグの定義リスト
const easterEggs = [
    {
        id: "gingerbread",
        name: "Gingerbread (Android 2.3)",
        path: "gingerbread/index.html",
        logo: "gingerbread/g_android_logo.webp"
    },
    {
        id: "honeycomb",
        name: "Honeycomb (Android 3.0 - 3.2)",
        path: "honeycomb/index.html",
        logo: "honeycomb/h_android_logo.webp"
    },
    {
        id: "icecreamsandwich",
        name: "Ice Cream Sandwich (Android 4.0)",
        path: "icecreamsandwich/index.html",
        logo: "icecreamsandwich/i_platlogo.jpg" // ※適宜実際のファイル名に合わせてください
    },
    {
        id: "ics_preview",
        name: "ICS Preview (Android 4.0 Beta)",
        path: "icecreamsandwich/index.html?type=preview",
        logo: "icecreamsandwich/i_platlogo_preview.png"
    },
{
        id: "jellybean",
        name: "Jelly Bean (Android 4.1 - 4.3)",
        path: "jellybean/index.html",
        logo: "jellybean/j_platlogo.webp"
    },
    {
        id: "kitkat",
        name: "Kitkat (Android 4.4)",
        path: "kitkat/index.html",
        logo: "kitkat/k_android_logo.webp"
    },
        {
        id: "lollipop",
        name: "Lollipop (Android 5.0)",
        path: "lollipop/index.html",
        logo: "lollipop/l_android_logo.webp"
    },
];

// （※以下の DOMContentLoaded などの処理は、前回提供したコードから変更ありません。このまま上の配列を上書きすればOKです！）
document.addEventListener("DOMContentLoaded", () => {
    const eggList = document.getElementById("eggList");
    const iframe = document.getElementById("eggViewer");
    const placeholder = document.getElementById("placeholder");
    const header = document.getElementById("header");
    const menuToggle = document.getElementById("menuToggle");

    // メニューの折りたたみ・展開処理
    menuToggle.addEventListener("click", () => {
        const isCollapsed = header.classList.toggle("collapsed");
        if (isCollapsed) {
            menuToggle.textContent = "メニューを開く ▼";
        } else {
            menuToggle.textContent = "メニューを閉じる ▲";
        }
    });

    // リストを動的に生成
    easterEggs.forEach(egg => {
        const li = document.createElement("li");
        li.className = "egg-item";
        li.innerHTML = `
            <img src="${egg.logo}" alt="${egg.name} logo">
            <span>${egg.name}</span>
        `;
        
        // クリックした時にiframeを切り替える処理
        li.addEventListener("click", () => {
            placeholder.style.display = "none";
            iframe.style.display = "block";
            iframe.src = egg.path;
            
            // エッグを選択したら、画面を広く使うために自動でメニューを畳む
            header.classList.add("collapsed");
            menuToggle.textContent = "メニューを開く ▼";
        });

        eggList.appendChild(li);
    });
});
