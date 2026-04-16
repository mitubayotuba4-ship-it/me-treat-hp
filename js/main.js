/* ============================================
   Me Treat - メインJavaScript
   ============================================ */

/* ---------- ヘッダー：スクロール時の背景変化 ---------- */
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

/* ---------- ハンバーガーメニュー ---------- */
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  nav.classList.toggle('open');
  // メニューが開いているときはボディのスクロールを止める
  document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
});

// ナビリンクをクリックしたらメニューを閉じる
nav.querySelectorAll('.header__nav-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    nav.classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* ---------- スクロールアニメーション（fade-up） ---------- */
const fadeUpElements = document.querySelectorAll('.fade-up');

// IntersectionObserver で要素が画面に入ったら visible クラスを付与
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // 一度表示したら監視を外す
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.12,     // 要素の12%が見えたら発火
    rootMargin: '0px 0px -40px 0px'  // 画面下端から40px手前で発火
  }
);

fadeUpElements.forEach(el => observer.observe(el));

/* ---------- ヒーロースライドショー ---------- */
const slides = document.querySelectorAll('.hero__slide');
const indicators = document.querySelectorAll('.hero__indicator');
let currentSlide = 0;
let slideTimer;

function goToSlide(index) {
  // 現在のスライドを非表示
  slides[currentSlide].classList.remove('active');
  indicators[currentSlide].classList.remove('active');

  // 新しいスライドを表示
  currentSlide = index;
  slides[currentSlide].classList.add('active');
  indicators[currentSlide].classList.add('active');
}

function nextSlide() {
  const next = (currentSlide + 1) % slides.length;
  goToSlide(next);
}

// 5秒ごとに自動切り替え
function startSlider() {
  slideTimer = setInterval(nextSlide, 5000);
}

// インジケーターのクリックで手動切り替え
indicators.forEach((indicator, index) => {
  indicator.addEventListener('click', () => {
    clearInterval(slideTimer);
    goToSlide(index);
    startSlider(); // タイマーリセット
  });
});

startSlider();

/* ---------- スムーズスクロール（ヘッダーの高さ分オフセット） ---------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;

    const target = document.querySelector(targetId);
    if (!target) return;

    e.preventDefault();

    const headerHeight = header.offsetHeight;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight;

    window.scrollTo({
      top: targetTop,
      behavior: 'smooth'
    });
  });
});
