export default {
  data() {
    return {
      currentYear: new Date().getFullYear()
    }
  },
  template: `
    <footer>
    <div class="p-4 bg-dark text-white position-relative mt-auto">
    <div class="container">
      <div class="row align-items-center">
        <div class="col-md-9 text-center text-xl-start">
          <span class="lead">Copyright &copy; {{ currentYear }} Instituto de Investigacion en Informática - LIDI</span>
          <a href="https://weblidi.info.unlp.edu.ar/"><img class="img-fluid d-none d-xl-inline m-1" style="height: 50px" src="../static/images/iii-lidi-logo.png" alt=""></a>
          <a href="https://unlp.edu.ar/"><img class="img-fluid d-none d-xl-inline m-1" style="height: 50px" src="../static/images/unlp-logo.png" alt=""></a>
        </div>
        <div class="col-md text-center text-xl-end">
          <a href="faq.html" class="footer-link nav-link" style="display:inline-block;">Preguntas Frecuentes</a>
        </div>
      </div>
    </div>
    </div>
    </footer>`
}