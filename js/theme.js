export function initThemeToggle(buttonId = 'themeToggle'){
  if(localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
  }

  const themeBtn = document.getElementById(buttonId);
  if(!themeBtn) return;

  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });
}

export function initNavbarScroll(selector = '.navbar', threshold = 60){
  const updateNavbar = () => {
    const nav = document.querySelector(selector);
    if(nav) nav.classList.toggle('scrolled', window.scrollY > threshold);
  };

  window.addEventListener('scroll', updateNavbar);
  updateNavbar();
}
