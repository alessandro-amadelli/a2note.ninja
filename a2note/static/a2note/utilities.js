document.addEventListener('DOMContentLoaded', function(){

  document.querySelector("#darkModeSelector").addEventListener('click', () => {
    toggleTheme();
  });
});


function toggleTheme(){
  let body = document.querySelector("body");
  let darkSelector = document.querySelector("#darkModeSelector");
  let nav = document.querySelector("nav");

  body.classList.toggle("light-theme");
  if (body.classList.contains("light-theme")){
    //Applying LIGHT THEME
    //Darkmode icon
    darkSelector.innerHTML = `<span class="material-icons-outlined">dark_mode</span>`;

    //Logo
    document.querySelector("#logo-dark").classList.add("hidden");
    document.querySelector("#logo-light").classList.remove("hidden");

    //navbar
    nav.classList.remove("navbar-dark");
    nav.classList.remove("bg-dark");
    nav.classList.add("navbar-light");
    nav.classList.add("bg-light");

    //buttons
    document.querySelectorAll(".btn").forEach((button, i) => {
      button.classList.remove("btn-light");
      button.classList.add("btn-dark");
    });

  } else {
    //Applying DARK THEME
    //Darkmode icon
    darkSelector.innerHTML = `<span class="material-icons-outlined">light_mode</span>`;

    //Logo
    document.querySelector("#logo-light").classList.add("hidden");
    document.querySelector("#logo-dark").classList.remove("hidden");

    //navbar
    nav.classList.remove("navbar-light");
    nav.classList.remove("bg-light");
    nav.classList.add("navbar-dark");
    nav.classList.add("bg-dark");

    //buttons
    document.querySelectorAll(".btn").forEach((button, i) => {
      button.classList.remove("btn-dark");
      button.classList.add("btn-light");
    });
  }

}
