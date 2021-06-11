document.addEventListener('DOMContentLoaded', function(){

  document.querySelector("#darkModeSelector").addEventListener('click', () => {
    toggleTheme();
  });

  //Loading of current theme saved on localStorage
  loadTheme();

});

function loadTheme(){

  let currTheme = localStorage.getItem("currentTheme");

  if (currTheme) {
    toggleTheme(currTheme);
  }

}


function toggleTheme(selection=""){
  let body = document.querySelector("body");
  let darkSelector = document.querySelector("#darkModeSelector");
  let nav = document.querySelector("nav");

  if (selection == "") {
    body.classList.toggle("light-theme");
  } else if (selection == "light") {
    body.classList.add("light-theme");
  } else {
    body.classList.remove("light-theme");
  }


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

    //tables
    document.querySelectorAll(".table").forEach((table, i) => {
      table.classList.remove("table-dark");
      table.classList.add("table-light");
    });

    //localstorage
    localStorage.setItem("currentTheme", "light");

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

    //tables
    document.querySelectorAll(".table").forEach((table, i) => {
      table.classList.remove("table-light");
      table.classList.add("table-dark");
    });

    //localstorage
    localStorage.setItem("currentTheme", "dark");

  }
}

function showLoading(message=""){
  if (message == "") {
    //If message is empty, choose a random message from the array
    messages = [
      gettext("Throwing some ninja stars..."),
      gettext("Browsing my interesting recipe book..."),
      gettext("Using my ninja techniques..."),
      gettext("Polishing my katana..."),
      gettext("Lunch break...be right back!"),
      gettext("Breaking some boards..."),
      gettext("Practicing with nunchacks..."),
      gettext("Throwing some kunais..."),
      gettext("Hiding somewhere in the shadows..."),
      gettext("Doing laundry..."),
      gettext("Meditating, please wait..."),
      gettext("Doing some top-secret thing...be right back!")
    ]

    let randMsg = Math.floor(Math.random() * messages.length);
    message = messages[randMsg];
  }

  let overlay = document.createElement("div");
  overlay.setAttribute("class", "loading-overlay")
  let overlayContent = document.createElement("div");
  overlayContent.setAttribute("class", "overlay-content");

  let loadDiv = document.createElement("div");
  loadDiv.setAttribute("class", "spinner-border text-primary overlay-content");
  loadDiv.setAttribute("role", "status");
  let loadSpan = document.createElement("span");
  loadSpan.setAttribute("class", "sr-only");
  loadSpan.innerText = "";

  let loadingText = document.createElement("p");
  loadingText.style.color = "white";
  loadingText.innerText = message;

  loadDiv.appendChild(loadSpan);
  overlayContent.appendChild(loadDiv);
  overlayContent.appendChild(loadingText);
  overlay.appendChild(overlayContent);
  document.querySelector(".container").appendChild(overlay);
}

function removeLoading(){
  document.querySelectorAll(".loading-overlay").forEach((item, i) => {
    item.remove();
  });
}
