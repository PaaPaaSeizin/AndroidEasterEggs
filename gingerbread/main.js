document.addEventListener("DOMContentLoaded", () => {
    const content = document.getElementById("content");
    const toast = document.getElementById("toast");
    
    // Javaの mToast = Toast.makeText(this, "...", ...) の再現
    const toastMessage = "Zombie art by Jack Larson";
    let toastTimeout;

    function showToast() {
        // すでに表示中のタイマーがあればリセット
        clearTimeout(toastTimeout);
        
        toast.innerText = toastMessage;
        toast.classList.add("show");

        // Toast.LENGTH_SHORT（約2秒）で消す
        toastTimeout = setTimeout(() => {
            toast.classList.remove("show");
        }, 2000);
    }

    // Javaの dispatchTouchEvent (MotionEvent.ACTION_UP) の再現
    // マウスのクリック離し、およびスマホの画面離しの両方に対応（pointerup）
    window.addEventListener("pointerup", (event) => {
        showToast();
    });
});