import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(_on, _config) {
      // implement node event listeners here
    },
    // Smanjen sa 10s na 6s — vecina UI assertion-a se zavrsava za <2s,
    // 10s je bio overkill. Ako neki specifican spec puca na timing race,
    // override-uj per-test sa { timeout: 15000 }.
    defaultCommandTimeout: 6000,
    // Page load: 20s (default 60s) — Vite 8 nginx serve je <2s, ovo je
    // safe margin.
    pageLoadTimeout: 20000,
    // Request timeout: 4s (default 5s).
    requestTimeout: 4000,
    // Response timeout: 15s (default 30s).
    responseTimeout: 15000,
    // Animation threshold: smanjen sa 5 na 20px — Cypress ne ce cekati
    // sub-pixel animacije (toast slideshow, hover transitions) jer su
    // sve brze < 300ms.
    animationDistanceThreshold: 20,
    // testIsolation: TRUE (default Cypress 12+) — VAZNO da bude `true` jer:
    //   1. Radix Dialog overlay (mock C4 SAGA modal-i) postavlja
    //      `body[data-scroll-locked="1"][style="pointer-events: none"]`;
    //      bez izolacije, sledeci test nasleduje to i pucaje na "click".
    //   2. Logout testovi (npr. C1 "Logout radi") brisu sessionStorage;
    //      sledeci test posle loginAsClient(targetUrl) bi gubio state.
    //   3. ThemeToggle u sidebar-u zavisi od mount-ovanog MainLayout-a;
    //      bez izolacije, sledeci test moze stici na rutu bez sidebar-a
    //      (npr. /login posle Logout testa) i ne nadje toggle.
    // Cypress automatski clear-uje cookies, localStorage, sessionStorage
    // izmedju testova, ali Cypress.env() (in-memory cache) PERZISTUJE,
    // pa loginAsX helperi i dalje cache-iraju tokene preko spec-a.
    testIsolation: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    // Numericki retries — flaky timing race retry-uje jednom pre fail-a.
    // Samo u `run` mode-u (CI), open mode 0 da ne maskira bugove u dev-u.
    retries: {
      runMode: 1,
      openMode: 0,
    },
  },
});
