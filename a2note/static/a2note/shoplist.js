document.addEventListener('DOMContentLoaded', function(){

  document.querySelector("#btnAddItem").onclick = () => {
    addItem();
  }

  document.querySelector("#itemText").addEventListener("keydown", function(e) {
    // Enter is pressed
    if (e.keyCode == 13) {
      addItem();
    }
  });

  createSections();

});

function createSections() {
  //Creation of all the sections in the correct order by taking them from the dropdown select
  let catSelect = document.querySelector("#categorySelect");
  catSelect.querySelectorAll("option").forEach((option, i) => {
    let category = option.value;
    let secTitle = option.innerText;
    let targetSection = document.createElement("div");
    targetSection.setAttribute("class", `container p-5 section ${category}-section hidden`);
    secIcon = option.dataset.icon;

    let sectionTitle = document.createElement("div");
    sectionTitle.setAttribute("class", "section-title row p-1 rounded-3");
    sectionTitle.innerHTML = `<span class="d-inline">${secTitle} <i class="material-icons-outlined d-inline">${secIcon}</i></span>`;

    targetSection.appendChild(sectionTitle);

    document.querySelector("body").appendChild(targetSection);
  });

}

function addItem() {
  //Adds a new element in the shopping list

  let catSelect = document.querySelector("#categorySelect");
  let category = catSelect.value;
  let inp = document.querySelector("#itemText");
  let text = inp.value;

  if (text == "") {
    inp.addEventListener('animationend', function(){
      this.classList.remove("alertAnimated");
    });
    inp.classList.add("alertAnimated");
    return false;
  }

  //Adding section class to main container to make it the right size now that at least one
  //category section is added
  let mainContainer = document.querySelector("#main-container");
  if (!mainContainer.classList.contains("section")){
    mainContainer.classList.add("section");
  }

  //Selection of correct section and render it visible
  let targetSection = document.querySelector(`.${category}-section`);
  if (targetSection.classList.contains("hidden")) {
    targetSection.classList.remove("hidden");
  }

  //Creation of new list item
  // ### ITEM ###
  let newItem = document.createElement("div");
  newItem.setAttribute("class", "element card rounded-3");

  // ### HEADER ###
  let itemHeader = document.createElement("div");
  itemHeader.setAttribute("class", "card-header");

  let itemDel = document.createElement("div");
  itemDel.setAttribute("class", "input-group-prepend taskDeleteArea col-1 col-lg-1 col-sm-1 d-inline");
  let itemDelText = document.createElement("span");
  itemDelText.setAttribute("class", "float-start");
  itemDelText.innerHTML = `<span class="material-icons-outlined">delete</span>`;
  itemDel.appendChild(itemDelText);

  //On mouse over event
  itemDel.addEventListener('mouseover', function(){
    newItem.classList.add('deletingTask');
    this.style.color = "red";
  });
  //On mouse out event
  itemDel.addEventListener('mouseout', function(){
    newItem.classList.remove('deletingTask');
    this.style.color = "inherit";
  });
  //Onclick event for task deletion
  itemDel.addEventListener('click', function() {
    deleteItem(newItem);
  });

  itemHeader.appendChild(itemDel);

  let itemDone = document.createElement("div");
  itemDone.setAttribute("class", "input-group-append taskDoneArea col-1 col-lg-1 col-sm-1 d-inline");
  let itemDoneText = document.createElement("span");
  itemDoneText.setAttribute("class", "float-end");
  itemDoneText.innerHTML = `<span class="material-icons-outlined">task_alt</span>`;
  itemDone.appendChild(itemDoneText);

  //On mouse over event
  itemDone.addEventListener('mouseover', function(){
    if (!newItem.classList.contains('doneTask')) {
      newItem.classList.add('completingTask');
      this.style.color = "#33ff33";
    }

  });
  //On mouse out event
  itemDone.addEventListener('mouseout', function(){
  newItem.classList.remove('completingTask');
    this.style.color = "inherit";
  });

  //Onclick event for task completion
  itemDone.addEventListener('click', function() {
    completeItem(newItem);
  });

  itemHeader.appendChild(itemDone);
  newItem.appendChild(itemHeader);

  // ### ITEM BODY ###
  let itemBody = document.createElement("div");
  itemBody.setAttribute("class", "card-body");

  let itemText = document.createElement("p");
  itemText.setAttribute("class", "taskTextArea card-text");
  itemText.innerText = text;
  itemBody.appendChild(itemText);
  newItem.appendChild(itemBody);


  //Animaiton when adding item
  newItem.addEventListener('animationend', function(){
    this.classList.remove("newTask");
  })
  newItem.classList.add('newTask');

  targetSection.appendChild(newItem);

  //Clear the original input text
  inp.value = "";

  notify(`<strong>${text}</strong> added`);

}

function deleteItem(item) {
  //Deletion of an item from the shopping list

  //Removing animation interfering with the deletion
  item.classList.remove("deletingTask");
  item.querySelector(".taskDeleteArea").remove();

  //Event listener for animation end
  item.addEventListener('animationend', () => {

    //If the current one is the last remaining item in section, then
    //all section i eliminated
    let itemsInSection = item.parentElement.querySelectorAll('.element');
    if (itemsInSection.length <= 1) {
      item.parentElement.classList.add("hidden");
    } else {
      item.remove();
    }

  });

  //Adding class for deletion animation
  item.classList.add('deletedTask');
}

function completeItem(item){
  //Completion of a task from the to-do list
  item.classList.toggle('doneTask');
}

/**
function toggleTheme(){
  let body = document.querySelector("body");
  let darkSelector = document.querySelector("#darkModeSelector");
  let nav = document.querySelector("nav");

  //Toggling dark/light theme
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
*/

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
  document.querySelector("#main-container").appendChild(divAlign);

  toast.addEventListener('animationend', () => {
    toast.classList.remove("show");
    toast.classList.hide("hide");
  })

}
