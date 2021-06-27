document.addEventListener('DOMContentLoaded', function(){

  //Creates the sections of the shopping list in the correct order
  createSections();

  loadShoplist();

  updateProgressBar();
});

function enableSave(){
  updateProgressBar();
}

function saveShoplist(reload=false) {}

function loadShoplist(){
  Object.keys(items).forEach((item, i) => {
    let quantity = 1
    if (items[item].hasOwnProperty("quantity")) {
      quantity = items[item]["quantity"];
    }
    addItemViewOnly(items[item]["category"], item, quantity, items[item]["status"]);
  });

}

function addItemViewOnly(category=null, text=null, quantity=1, itemStatus=null) {
  //Adds a new element in the shopping list

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
  newItem.setAttribute("class", "element singleItem card rounded-3 d-flex");

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
  itemBody.setAttribute("class", "card-body row");

  let itemText = document.createElement("p");
  itemText.setAttribute("class", "taskTextArea card-text col-9 d-inline");
  itemText.innerText = text;
  itemBody.appendChild(itemText);
  newItem.appendChild(itemBody);

  //Quantity div
  let quantDiv = document.createElement("div");
  quantDiv.setAttribute("class", "col-3 d-inline");
  let quantInp = document.createElement("input");
  quantInp.setAttribute("type", "number");
  quantInp.setAttribute("class", "itemQuantity rounded rounded-pill p-1 shadow-sm");
  quantInp.setAttribute("readonly", "true");
  quantInp.value = quantity;
  quantInp.min = "1";
  quantInp.max = "200";

  quantDiv.appendChild(quantInp);
  itemBody.appendChild(quantDiv);

  //Animaiton when adding item
  newItem.addEventListener('animationend', function(){
    this.classList.remove("newTask");
  })
  newItem.classList.add('newTask');

  targetSection.appendChild(newItem);
}
