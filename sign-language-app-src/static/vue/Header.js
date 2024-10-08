export default {
  data() {
    return {}
  },
  template: `
    <header>
    <nav class="navbar navbar-expand-lg bg-dark navbar-dark py-3 sticky-top">
    <div class="container">
      <a href="index.html" class="navbar-brand">LSApp 👋</a>

      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navmenu">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navmenu">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <a href="translate.html" class="nav-link">Traductor LSA</a>
          </li>
          <li class="nav-item">
            <a href="practice.html" class="nav-link">Practica LSA</a>
          </li>
        </ul>
      </div>
    </div>
    </nav>
    </header>`
}