document.addEventListener('DOMContentLoaded', function(){

  document.querySelector("#darkModeSelector").addEventListener('click', () => {
    toggleTheme();
  });

  //Loading of current theme saved on localStorage
  loadTheme();

  //Back to top button
  let btnTop = document.querySelector("#btnBackTop");
  if (btnTop) {
    window.onscroll = () => {
      scrollFunc();
    }
    btnTop.onclick = () => {
      backToTop();
    }
  }

});

function scrollFunc() {
  let btnTop = document.querySelector("#btnBackTop");
  if (
    document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    btnTop.style.display = "block";
  } else {
    btnTop.style.display = "none";
  }
}

function backToTop() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

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
      if (button.classList.contains("btn-dark") || button.classList.contains("btn-light")) {
        button.classList.remove("btn-light");
        button.classList.add("btn-dark");
      }
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
      if (button.classList.contains("btn-dark") || button.classList.contains("btn-light")) {
        button.classList.remove("btn-dark");
        button.classList.add("btn-light");
      }
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

function notify(text) {
  //Deletion of pre-existing toasts
  let toastList = document.querySelectorAll(".toast");
  toastList.forEach((toast, i) => {
    toast.remove();
  });

  let divAlign = document.createElement("div");
  divAlign.setAttribute("class", "position-fixed bottom-0 end-0 p-3");
  divAlign.style = "z-index:5;color:black;";

  let toast = document.createElement("div");
  toast.setAttribute("class", "toast fade show toast-animated");
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");
  toast.setAttribute("data-bs-animation", "true");
  toast.setAttribute("data-autohide", "true");
  toast.setAttribute("data-bs-delay", "2000");

  let body = document.createElement("div");
  body.setAttribute("class", "toast-body");
  body.innerHTML = text;

  toast.appendChild(body);
  divAlign.appendChild(toast);
  document.querySelector("body").appendChild(divAlign);

  toast.addEventListener('animationend', () => {
    toast.classList.remove("show");
    toast.classList.add("hide");
  })
}
