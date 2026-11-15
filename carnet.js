const root = document.documentElement
const controls = document.querySelector('.carnet-tools')
const themes = document.querySelectorAll('[data-theme-choice]')
const grid = document.querySelector('[data-grid-toggle]')
const print = document.querySelector('[data-print]')

function setTheme(theme) {
  root.dataset.theme = theme
  for (const button of themes) {
    button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme))
  }
}

if (controls && themes.length && grid && print) {
  try {
    setTheme(localStorage.getItem('qg-theme') === 'dark' ? 'dark' : 'paper')
  } catch {
    setTheme('paper')
  }

  for (const button of themes) {
    button.addEventListener('click', () => {
      const theme = button.dataset.themeChoice
      setTheme(theme)
      try {
        localStorage.setItem('qg-theme', theme)
      } catch {
        // Le thème reste actif sur cette page si le stockage est inaccessible.
      }
    })
  }

  grid.addEventListener('click', () => {
    const visible = grid.getAttribute('aria-pressed') !== 'true'
    grid.setAttribute('aria-pressed', String(visible))
    root.toggleAttribute('data-dot-grid', visible)
  })

  print.addEventListener('click', async () => {
    await document.fonts.ready
    window.print()
  })
  controls.hidden = false
}
