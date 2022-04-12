document.addEventListener('DOMContentLoaded', function(){

  document.querySelector("#darkModeSelector").addEventListener('click', () => {
    toggleTheme();
    assignAchievement6();
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

  //Event listener: user back online
  window.addEventListener('online', () => {
    offlineNotification('online');
    backOnlineNotification();
  });

  //Event listener: user goes offline
  window.addEventListener('offline', () => {
    offlineNotification('offline');
  });

  //Check on page load if user is online
  if (!navigator.onLine) {
    offlineNotification('offline');
  }

});

function deleteOfflineNotif() {
  document.querySelectorAll(".offline-notification").forEach( (item) => {
    item.remove();
  });
}

function offlineNotification(status) {
  deleteOfflineNotif();
  if (status == "offline") {
    let notif = document.createElement("div");
    notif.setAttribute("class", "offline-notification p-1 px-2 rounded-3");
    notif.innerHTML = `<span class="material-icons-outlined">cloud_off</span> ` + gettext("Oops! It seems you are offline...");
    
    document.querySelector(".my-container").appendChild(notif);
  }    
}

function backOnlineNotification() {
  let notif = document.createElement("div");
    notif.setAttribute("class", "backonline-notification p-1 px-2 rounded-3");
    notif.innerHTML = `<span class="material-icons-outlined">cloud</span> ` + gettext("Wow! You are back online.");
    
    notif.addEventListener('animationend', () => {
      notif.remove();
    });

    document.querySelector(".my-container").appendChild(notif);
}

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

function showPageMessage(msgClass, msgText) {
  let newDiv = document.createElement("div");
  newDiv.setAttribute("class", msgClass + " fade show");
  newDiv.setAttribute("role", "alert");

  let closeBtn = document.createElement("div");
  closeBtn.setAttribute("type", "button");
  closeBtn.setAttribute("class", "btn-close");
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.setAttribute("data-bs-dismiss", "alert");
  newDiv.appendChild(closeBtn);

  let newSpan = document.createElement("span");
  newDiv.appendChild(newSpan);
  newSpan.innerHTML = msgText;


  document.body.querySelector(".container").prepend(newDiv);
}

function assignAchievement6(){
  //Assigns the achievement for theme toggling
  const request = new XMLHttpRequest();
  const url = `/theme_changed/`;
  request.open('GET', url);

  request.onload = () => {
    const response = JSON.parse(request.responseText);
  };

  request.send();
}

function assignAchievement19(){
  //Assigns the achievement for theme toggling
  const request = new XMLHttpRequest();
  const url = `/deletion_canceled/`;
  request.open('GET', url);

  request.onload = () => {
    const response = JSON.parse(request.responseText);
  };

  request.send();
}
