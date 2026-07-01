function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function debounce(func, wait) {
    let timeout;
    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(func, wait);
    };
}

const defaults = {
    radius: {min: 5, max: 10},
    animation: {
        duration: 1.2,
        ease: "power2.out",
        staggerDelay: 0.12,
        scale: {from: 0, to: 1},
        translateZ: {min: 10, max: 65},
    },
    zones: [
        { top: { min: 15, max: 40 }, left: { min: 15, max: 40 } },
        { top: { min: 15, max: 40 }, left: { min: 60, max: 85 } },
        { top: { min: 60, max: 85 }, left: { min: 15, max: 40 } },
        { top: { min: 60, max: 85 }, left: { min: 60, max: 85 } },
    ],
};

function initBubbleReveal(el, userOptions) {
    const options = Object.assign({}, defaults, userOptions);
    let imgSrc = el.dataset.bubbleReveal || "";
    const bg = el.querySelector("[data-bubble-reveal-bg]");
    const items = [...el.querySelectorAll("[data-bubble-reveal-item]")];
    const dots = [...document.querySelectorAll(".bubble-reveal-dots button")];
    const prevBtn = document.querySelector(".bubble-reveal-prev");
    const nextBtn = document.querySelector(".bubble-reveal-next");
    const opt = options.animation;
    let active = false;

    if (bg) bg.style.backgroundImage = `url(${imgSrc})`;

    function setup(src) {
        const currentImg = src || imgSrc;
        const zonesTotal = options.zones.length;

        items.forEach((item, i) => {
            const zone = options.zones[i % zonesTotal];
            const cx = randInt(zone.left.min, zone.left.max);
            const cy = randInt(zone.top.min, zone.top.max);
            const r = randInt(options.radius.min, options.radius.max);

            item.dataset.cx = cx;
            item.dataset.cy = cy;
            item.dataset.r = r;
            item.style.filter = "drop-shadow(0 20px 30px rgba(0,0,0,0.4))";
            item.classList.add("is-ready");

            const bubble = item.querySelector(".bubble-reveal-bubble");
            if (bubble) {
                bubble.style.backgroundImage = `url(${currentImg})`;
                bubble.style.webkitClipPath = `circle(${r}% at ${cx}% ${cy}%)`;
                bubble.style.clipPath = `circle(${r}% at ${cx}% ${cy}%)`;
                bubble.style.transformOrigin = `${cx}% ${cy}%`;
            }
        });
    }

    function animate() {
        if (active) return;
        active = true;

        items.forEach((item, i) => {
            const bubble = item.querySelector(".bubble-reveal-bubble");
            const tz = randInt(opt.translateZ.min, opt.translateZ.max);
            const isLast = i === items.length - 1;

            if (bubble) {
                gsap.fromTo(
                    bubble,
                    {scale: opt.scale.from},
                    {
                        scale: opt.scale.to,
                        z: tz,
                        duration: opt.duration,
                        delay: i * opt.staggerDelay,
                        ease: opt.ease,
                        onComplete: () => {
                            if (isLast) active = false;
                        },
                    }
                );
            }
        });
    }

    function reset() {
        active = false;
        items.forEach((item) => {
            const bubble = item.querySelector(".bubble-reveal-bubble");
            if (bubble) {
                gsap.killTweensOf(bubble); // 진행중인 애니메이션 즉시 종료
                gsap.set(bubble, { scale: opt.scale.from, z: 0 });
            }
        });
    }

    function changeImg(src) {
        if (src === imgSrc) return;

        imgSrc = src;
        if (bg) bg.style.backgroundImage = `url(${imgSrc})`;

        // 버블을 즉시(트랜지션 없이) 숨김 상태로 되돌리고,
        // 새 이미지를 채운 뒤 처음 로드 때와 같은 reveal 애니메이션을 재생한다.
        reset();
        setup(imgSrc);
        animate();
    }

    // dots 클릭
    dots.forEach((dot) => {
        dot.addEventListener("click", () => {
            if (dot.classList.contains("active")) return;
            dots.forEach((d) => d.classList.remove("active"));
            dot.classList.add("active");
            changeImg(dot.dataset.bgImg);
        });
    });

    // prev/next 클릭
    function getCurrentIndex() {
        return dots.findIndex((d) => d.classList.contains("active"));
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            const cur = getCurrentIndex();
            const prev = (cur - 1 + dots.length) % dots.length;
            dots[prev].click();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            const cur = getCurrentIndex();
            const next = (cur + 1) % dots.length;
            dots[next].click();
        });
    }

    // resize
    window.addEventListener("resize", debounce(() => {
        setup();
        if (active) animate();
    }, 200));

    // 초기 세팅: 클립 상태만 먼저 잡아둔다.
    // 실제 첫 reveal(animate)은 이미지 로딩 완료 후(window load) 별도로 호출한다.
    setup();

    return {animate, reset, changeImg};
}

// ------------------------------------------------------------
// 초기화 타이밍 분리
// - DOMContentLoaded: HTML 파싱 완료 즉시 실행 → setup()으로 클립 상태를
//   미리 적용해서, 사용자가 원본 이미지를 볼 틈이 없게 만든다.
// - load: 이미지 등 모든 리소스가 로드된 후 실행 → 이 시점에만 최초
//   reveal(animate) 애니메이션을 재생한다.
// ------------------------------------------------------------
let bubbleInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    const el = document.querySelector(".bubble-reveal");
    if (!el) return;
    bubbleInstance = initBubbleReveal(el);
});

window.addEventListener("load", () => {
    if (bubbleInstance) bubbleInstance.animate();
});