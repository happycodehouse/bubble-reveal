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
        {top: {min: 10, max: 40}, left: {min: 5, max: 45}},
        {top: {min: 10, max: 40}, left: {min: 55, max: 95}},
        {top: {min: 60, max: 90}, left: {min: 5, max: 45}},
        {top: {min: 60, max: 90}, left: {min: 55, max: 95}},
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
        imgSrc = src;
        if (bg) bg.style.backgroundImage = `url(${imgSrc})`;
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

    setup();
    animate();

    return {animate, reset, changeImg};
}

initBubbleReveal(document.querySelector(".bubble-reveal"));