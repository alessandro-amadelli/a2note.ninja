var PRODUCTLIST = {};

function showModalRundown() {
  let modal = document.querySelector("#modalRundown");
  let myMod = new bootstrap.Modal(modal, {show: false});

  let modBody = modal.querySelector(".modal-body");
  let itemList = document.querySelectorAll(".singleItem");
  let intemCount = document.querySelector("#modalRundownTot");
  intemCount.innerText = `(${itemList.length})`;
  modBody.querySelectorAll("p").forEach((p, i) => {
    p.remove();
  });

  myMod.show();

  itemList.forEach((item, i) => {
    let name = item.querySelector(".taskTextArea").innerText;
    let quant = item.querySelector(".itemQuantity").value;
    let status = item.dataset.status;

    let newP = document.createElement("P");
    newP.innerText = `${name} (x${quant})`;
    newP.setAttribute("class", "entrance-animated");
    newP.style.borderBottom = "solid thin";
    if (status == "Done") {
      newP.style.textDecoration = "line-through";
    }
    modBody.appendChild(newP);

  });
}

var shoplistBarChart = null;

function showModalBarChart() {
  let modal = document.querySelector("#modalBarChart");
  let myMod = new bootstrap.Modal(modal, {show: false});

  let modBody = modal.querySelector(".modal-body");
  let itemList = document.querySelectorAll(".singleItem");
  let totalItems = itemList.length;

  myMod.show();

  let dataJson = {};
  itemList.forEach((item, i) => {
    let category = item.parentElement.dataset.category;
    let quant = item.querySelector(".itemQuantity").value;
    let color = window.getComputedStyle(item.parentElement)["backgroundColor"];
    let status = item.dataset.status;

    if (dataJson.hasOwnProperty(category)){
      dataJson[category]["total"] += parseInt(quant);
    } else {
      dataJson[category] = {"total": parseInt(quant),
    "color": color};
    }
  });

  //Chart
  let labels = [];
  let colors = [];
  let values = [];

  Object.keys(dataJson).forEach((key, i) => {
    labels.push(key);
    colors.push(dataJson[key]["color"]);
    values.push(dataJson[key]["total"]);
  });


  let data = {
    labels: labels,
    datasets: [{
      label: 'Stats',
      backgroundColor: colors,
      borderColor: colors,
      data: values,
    }],
  };

  let config = {
    type: 'bar',
    data,
    options: {
      plugins: {
        legend: {
          display: false
        }
      }
    }
  };

  //Destroy previously created graph
  if (shoplistBarChart) {
    shoplistBarChart.destroy();
  }

  shoplistBarChart = new Chart(
    document.querySelector('#shoplistBarChart'),
    config
  );

}


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
    sectionTitle.setAttribute("class", "section-title w-100 p-1 rounded-3");
    sectionTitle.innerHTML = `<span class="d-inline">${secTitle} <i class="material-icons-outlined d-inline">${secIcon}</i></span>`;

    targetSection.appendChild(sectionTitle);

    document.querySelector("body").appendChild(targetSection);
  });

}

function retrieveAllProducts() {
  //httprequest to get all products from the database and save them in a
  //variable
  showLoading();

  var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  const request = new XMLHttpRequest();
  const url = `/product_list_view`;
  request.open('GET', url);
  request.setRequestHeader('X-CSRFToken', csrftoken);
  request.onload = () => {
    const response = JSON.parse(request.responseText);
    PRODUCTLIST = response;
    autocomplete(document.querySelector("#itemText"), PRODUCTLIST);
    removeLoading();
  };
  const data = new FormData();

  request.send();
}

function addItem(category=null, text=null, quantity=1, itemStatus=null, loadedFromStorage=false) {
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

  let alreadyPresent = false;
  //Check if item is already present
  document.querySelectorAll(".element").forEach((element, i) => {
    if (element.querySelector(".taskTextArea").innerText.toLowerCase() == text.toLowerCase()) {
      element.querySelector(".itemQuantity").value = (parseInt(element.querySelector(".itemQuantity").value) + 1).toString();
      alreadyPresent = true;
      return false;
    }
  });

  if (alreadyPresent) {
    try{
        enableSave();
      } catch {saveShoplistToLocalStorage();}
    notify(`<strong>${text}</strong> + 1`);
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
  quantInp.value = quantity;
  quantInp.min = "1";
  quantInp.max = "200";

  //Event listener on number change
  quantInp.addEventListener('change', function(){
    try{
        enableSave();
      } catch {saveShoplistToLocalStorage();}
  });

  quantDiv.appendChild(quantInp);
  itemBody.appendChild(quantDiv);

  //Animaiton when adding item
  newItem.addEventListener('animationend', function(){
    this.classList.remove("newTask");
  })
  newItem.classList.add('newTask');

  targetSection.appendChild(newItem);

  if (!loadedFromStorage) {
    //Save updated list
    //The function saveShoplist() contains a call to the correct saving function
    try{
        enableSave();
      } catch {saveShoplistToLocalStorage();}

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
    //Save updated list
    //The function saveShoplist() contains a call to the correct saving function
    try{
        enableSave();
      } catch {saveShoplistToLocalStorage();}
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
  //Try to enable the save button for the shopping list
  //If it fails then the user is using the site without an account
  try{
    enableSave();
  } catch {
    saveShoplistToLocalStorage();
  }
}

//W3Schools.com autocomplete solution adapted to my JSON object
function autocomplete(inp, arr) {
  /*the autocomplete function takes two arguments,
  the text field element and a JSON object of possible autocompleted values with
  relative category*/
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function(e) {
      var a, b, i, val = this.value;
      /*close any already open lists of autocompleted values*/
      closeAllLists();
      if (!val) { return false;}
      currentFocus = -1;
      /*create a DIV element that will contain the items (values):*/
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      /*append the DIV element as a child of the autocomplete container:*/
      this.parentNode.appendChild(a);
      /*for each item in the array... ADAPTED TO JSON OBJECT*/
      Object.keys(arr).forEach((item, i) => {
        /*check if the item starts with the same letters as the text field value:*/
        if (item.substr(0, val.length).toUpperCase() == val.toUpperCase()) {
          /*create a DIV element for each matching element:*/
          b = document.createElement("DIV");
          /*make the matching letters bold:*/
          b.innerHTML = "<strong>" + item.substr(0, val.length) + "</strong>";
          b.innerHTML += item.substr(val.length);
          /*insert a input field that will hold the current array item's value:*/
          b.innerHTML += "<input type='hidden' value='" + item + "'>";
          /*execute a function when someone clicks on the item value (DIV element):*/
              b.addEventListener("click", function(e) {
              /*insert the value for the autocomplete text field:*/
              //ADAPTED TO CHANGE THE SELECTED CATEGORY ACCORDINGLY
              valueToInsert = this.getElementsByTagName("input")[0].value;
              inp.value = valueToInsert;

              document.querySelector("#categorySelect").value = arr[valueToInsert];

              /*close the list of autocompleted values,
              (or any other open lists of autocompleted values:*/
              closeAllLists();
          });
          a.appendChild(b);
        }
      });

  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function(e) {
      var x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.keyCode == 40) {
        /*If the arrow DOWN key is pressed,
        increase the currentFocus variable:*/
        currentFocus++;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 38) { //up
        /*If the arrow UP key is pressed,
        decrease the currentFocus variable:*/
        currentFocus--;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 13) {
        /*If the ENTER key is pressed, prevent the form from being submitted,*/
        e.preventDefault();
        if (currentFocus > -1) {
          /*and simulate a click on the "active" item:*/
          if (x) x[currentFocus].click();
        }
      }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
      x[i].parentNode.removeChild(x[i]);
    }
  }
}
/*execute a function when someone clicks in the document:*/
document.addEventListener("click", function (e) {
    closeAllLists(e.target);
});
}

function updateProgressBar(){
  //Updates shoplist progressbar
  let progressContainer = document.querySelector(".footer-container");
  let progressbar = document.querySelector("#shopProgress");

  let totalItems = 0;
  let itemsBought = 0;

  //Items statistics
  document.querySelectorAll(".element").forEach((element, i) => {
    if (element.dataset.status == "Done") {
      itemsBought += parseInt(element.querySelector(".itemQuantity").value);
    }
    totalItems += parseInt(element.querySelector(".itemQuantity").value);
  });

  let progrPerc = (itemsBought * 100) / totalItems;

  progressbar.style.width = `${progrPerc}%`;
  if (progrPerc > 0) {
    progressContainer.classList.remove("hidden");
  } else {
    progressContainer.classList.add("hidden");
  }
}
