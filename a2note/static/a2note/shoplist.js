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

  loadShoplistFromLocalStorage();

});

function createSections() {
  //Creation of all the sections in the correct order by taking them from the dropdown select
  let catSelect = document.querySelector("#categorySelect");
  catSelect.querySelectorAll("option").forEach((option, i) => {
    let category = option.value;
    let secTitle = option.innerText;
    let targetSection = document.createElement("div");
    targetSection.setAttribute("class", `container p-5 section ${category}-section hidden`);
    targetSection.dataset.category = category;
    secIcon = option.dataset.icon;

    let sectionTitle = document.createElement("div");
    sectionTitle.setAttribute("class", "section-title row p-1 rounded-3");
    sectionTitle.innerHTML = `<span class="d-inline">${secTitle} <i class="material-icons-outlined d-inline">${secIcon}</i></span>`;

    targetSection.appendChild(sectionTitle);

    document.querySelector("body").appendChild(targetSection);
  });

}

function addItem(category=null, text=null, itemStatus=null, loadedFromStorage=false) {
  //Adds a new element in the shopping list

  if (category == null) {
    let catSelect = document.querySelector("#categorySelect");
    category = catSelect.value;
  }

  if (text == null) {
    let inp = document.querySelector("#itemText");
    text = inp.value;
    if (text == "") {
      inp.addEventListener('animationend', function(){
        this.classList.remove("alertAnimated");
      });
      inp.classList.add("alertAnimated");
      return false;
    }
    //Clear the original input text
    inp.value = "";
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

  //Item status
  if (itemStatus == null) {
    newItem.dataset.status = "ToDo";
  } else {
    newItem.dataset.status = itemStatus;
    if (itemStatus == "Done") {
      newItem.classList.add("doneTask");
    }
  }

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

  if (!loadedFromStorage) {
    //Save updated list to localStorage
    saveShoplistToLocalStorage();

    //Notification toast
    notify(`<strong>${text}</strong> ` + gettext("added"));
  }
}

function deleteItem(item) {
  //Deletion of an item from the shopping list

  //Removing animation interfering with the deletion
  item.classList.remove("deletingTask");
  item.querySelector(".taskDeleteArea").remove();

  //Event listener for animation end
  item.addEventListener('animationend', () => {
    //If the current one is the last remaining item in section, then
    //all section is hidden
    let itemsInSection = item.parentElement.querySelectorAll('.element');
    if (itemsInSection.length <= 1) {
      item.parentElement.classList.add("hidden");
    }
    item.remove();
    //Save updated list to local storage
    saveShoplistToLocalStorage();
  });

  //Adding class for deletion animation
  item.classList.add('deletedTask');
}

function completeItem(item){
  //Completion of a task from the to-do list
  item.classList.toggle('doneTask');
  if (item.dataset.status == 'ToDo') {
    item.dataset.status = "Done";
  } else {
    item.dataset.status = "ToDo";
  }
  //Save updated list to local storage
  saveShoplistToLocalStorage();
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
  document.querySelector("#main-container").appendChild(divAlign);

  toast.addEventListener('animationend', () => {
    toast.classList.remove("show");
    toast.classList.add("hide");
  })
}

function saveShoplistToLocalStorage(){
  //Generate a JSON object representing the Shopping list and save it to the local storage
  //This function will overwrite an existing list if already present

  let jsonList = {};
  document.querySelectorAll(".section").forEach((section) => {
    let elementList = section.querySelectorAll(".element");
    if (elementList.length > 0) {
      let secName = section.dataset.category;
      jsonList[secName] = {};
      elementList.forEach((element, e) => {
        let elemStatus = element.dataset.status;
        let elemContent = element.querySelector(".taskTextArea").innerText;
        let elemData = {"itemContent": elemContent, "itemStatus": elemStatus};
        jsonList[secName][e] = elemData;
      });
    }
  });

  localStorage.setItem("localNinjaShoplist", JSON.stringify(jsonList));
}

function loadShoplistFromLocalStorage() {
  //Load the locally saved shopping list (if present)

  let localShoplist = localStorage.getItem("localNinjaShoplist");
  if (!localShoplist) {
    return false;
  }

  localShoplist = JSON.parse(localShoplist);

  Object.keys(localShoplist).forEach((section) => {
    Object.keys(localShoplist[section]).forEach((element) => {
      //addItem(category, text, status, loadedFromStorage)
      addItem(section, localShoplist[section][element].itemContent, localShoplist[section][element].itemStatus, true);
    });
  });

}
