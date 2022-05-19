const sections = document.querySelectorAll("section");
const navLi = document.querySelectorAll("nav .container #navmenu .nav-item .nav-link");
//console.log(navLi);
window.onscroll = () => {
  var current = "";

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    if (window.pageYOffset >= sectionTop - 100) {
      current = section.getAttribute("id");
      //console.log(current);
    }
  });

  navLi.forEach((li) => {
    li.classList.remove("active");
    //console.log(li.hash)
    //console.log(typeof(li.hash))
    if(li.hash == ('#'+current)){//if (li.hash.contains(current)) {
      li.classList.add("active");
    }
  });
};