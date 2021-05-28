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

  retrieveAllProducts();

});

var PRODUCTLIST = {};

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

function retrieveAllProducts() {
  //httprequest to get all products from the database and save them in a
  //variable
  showLoading(gettext("Browsing my interesting recipe book..."));

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
