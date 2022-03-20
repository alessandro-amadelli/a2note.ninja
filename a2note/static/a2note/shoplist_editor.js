document.addEventListener('DOMContentLoaded', function(){

  document.querySelector("#btnAddItem").onclick = () => {
    addItem();
    //Reset category selection to 'other'
    document.querySelector("#categorySelect").value = 'other';
  }

  document.querySelector("#itemText").addEventListener("keydown", function(e) {
    // Enter is pressed
    if (e.keyCode == 13) {
      addItem();
      //Reset category selection to 'other'
      document.querySelector("#categorySelect").value = 'other';
    }
  });

  //Creates the sections of the shopping list in the correct order
  createSections();

  //Get all products from the database
  retrieveAllProducts();

  loadShoplist();
  updateProgressBar();
  //Button to delete list
  initializeBtnDelete();

  try {
    initializeShareBtns();
  } catch {}

  //Event listener for privacy setting switch
  try {
    document.querySelector("#listPrivacySwitch").addEventListener('change', function(){
      document.querySelector("#editEnableSwitch").disabled = !this.checked;
      if (!this.checked) {
        document.querySelector("#editEnableSwitch").checked = false;
      }
    });

    //Button to save list settings
    document.querySelector("#btnSaveSettings").onclick = () => {
      btnSaveClick(reload=true); //Saving and reloading the page
    };

    //Copy to clipboard function
    let urlText = document.querySelector("#urlText");
    urlText.value = window.location.href;

    document.querySelector("#btnCopyClipboard").addEventListener("click", function() {
      urlText.classList.remove("hidden");
      urlText.select();
      urlText.setSelectionRange(0, 99999);
      document.execCommand("copy");
      urlText.classList.add("hidden");
      notify("Link copied");
    });

  } catch {}

  let inpListTitle = document.querySelector("#inpListTitle");
  var oldTitle = inpListTitle.value;
  inpListTitle.addEventListener('keyup', () => {
    if (inpListTitle.value != oldTitle) {
      enableSave();
    }
  });

  //Button to save the shopping list
  document.querySelector("#btnSaveList").onclick = () => {
    btnSaveClick();
  }

  //Initialize button to show modalRundown
  document.querySelector("#btnShowRundown").onclick = () => {
    showModalRundown();
  }

  //Initialize button to show modalRundown
  document.querySelector("#btnShowStats").onclick = () => {
    showModalBarChart();
  }

  //Initialize button to show modalAutoList
  document.querySelector("#btnShowAutoList").onclick = () => {
    showModalAutoList();
  }

  initializeModalAutoList();

});

MODIFICATIONS = {"add": {}, "mod":{}, "del":{}};

function updateModification(operation, name, content){
  //operations: add, mod, del
  MODIFICATIONS[operation][name] = content;

  //Removing conflicting operations
  if (operation == "add") {
    delete MODIFICATIONS["del"][name];
  } else if (operation == "del") {
    delete MODIFICATIONS["add"][name];
    delete MODIFICATIONS["mod"][name];
  }
}

function initializeShareBtns() {
  let text = gettext("Hi! Check out this cool list I created on a2note.ninja...")

  let btnWhatsapp = document.querySelector("#btnWhatsapp");
  btnWhatsapp.href = "https://api.whatsapp.com/send?text=" + text + window.location.href;

  let btnTelegram = document.querySelector("#btnTelegram");
  btnTelegram.href = "https://telegram.me/share/url?url=" + window.location.href + "&text=" + text;

  let bntEmail = document.querySelector("#btnEmail");
  btnEmail.href = "mailto:?subject='Shopping list'&body=" + text + window.location.href;

}

function btnSaveClick(reload=false) {
  //Remove stop if user tries to leave the page (all the content is saved so it is not necessary)
  window.onbeforeunload = function() {
  }

  let btnSave = document.querySelector("#btnSaveList");
  btnSave.disabled = true;
  btnSave.classList.add("hidden");
  saveShoplist(reload);
  oldTitle = document.querySelector("#inpListTitle").value;
}

function enableSave() {
  let btnSave = document.querySelector("#btnSaveList");
  btnSaveList.disabled = false;
  btnSaveList.classList.remove("hidden");

  //Enable stop if user tries to leave the page (there are unsaved changes)
  window.onbeforeunload = function() {
    return "";
  }

  //Since a change has been made, update the progress
  updateProgressBar();
}

function saveShoplist(reload=false) {
  showLoading();
  saveShoplistToDB(reload);
}

function getListItems() {
  let itemList = document.querySelectorAll(".singleItem");
  let listItems = {};

  itemList.forEach((item, i) => {
    let name = item.querySelector(".taskTextArea").innerText;
    let category = item.parentElement.dataset.category;
    let quantity = item.querySelector(".itemQuantity").value;
    let status = item.dataset.status;
    listItems[name] = {
      "category": category,
      "quantity": quantity,
      "status": status
  }
  });

  return JSON.stringify(listItems);
}

function saveShoplistToDB(reload) {
  var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  let element_id = document.querySelector("#elementID").innerText;
  const request = new XMLHttpRequest();
  const url = `/save_list_view/`;
  request.open('POST', url);
  request.setRequestHeader('X-CSRFToken', csrftoken);
  request.onload = () => {
    const response = JSON.parse(request.responseText);
    if (reload) {
      location.reload();
    } else {
      removeLoading();
    }
    notify(gettext("List saved"));
  };
  const data = new FormData();
  title = document.querySelector("#inpListTitle").value;

  if (element_id.substring(0,2) == "SL") {
    element_type = "SHOPLIST";
  } else {
    element_type = "TODOLIST";
  }
  shared = "False";
  edit_enabled = "False";

  try {
    if (document.querySelector("#listPrivacySwitch").checked) {
      shared = "True";
      if (document.querySelector("#editEnableSwitch").checked) {
        edit_enabled = "True";
      }
    }
  } catch {}

  data.append("element_id", element_id);
  data.append("element_type", element_type);
  data.append("title", title);
  // data.append("items", getListItems());
  data.append("modifications", JSON.stringify(MODIFICATIONS));
  data.append("shared", shared);
  data.append("edit_enabled", edit_enabled);

  request.send(data);
}

function loadShoplist(){

  Object.keys(items).forEach((item, i) => {
    let quantity = 1
    if (items[item].hasOwnProperty("quantity")) {
      quantity = items[item]["quantity"];
    }
    addItem(items[item]["category"], item, quantity, items[item]["status"], true);
  });

}

function initializeBtnDelete(){
  let btnDel = document.querySelector("#btnDeleteList");
  if (btnDel) {
    btnDel.onclick = () => {
      showLoading();
      deleteList();
    }
  }

  let btnNever = document.querySelector("#btnNevermind");
  if (btnNever) {
    btnNever.onclick = () => {
      assignAchievement19();
    }
  }
}

function deleteList() {
  var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  const request = new XMLHttpRequest();
  const url = `/delete_list/`;
  request.open('POST', url);
  request.setRequestHeader('X-CSRFToken', csrftoken);
  request.onload = () => {
    const response = JSON.parse(request.responseText);
    if (response["RESULT"] == "OK"){
      window.location.href = `/`;
    }
    removeLoading();
  };
  const data = new FormData();
  element_id = document.querySelector("#elementID").innerText;
  if (element_id.substring(0,2) == "SL") {
    element_type = "SHOPLIST";
  } else {
    element_type = "TODOLIST";
  }
  data.append("element_id", element_id);
  data.append("element_type", element_type);

  request.send(data);
}

function initializeModalAutoList(){
  let row = document.querySelector("#modalAutoListRow");

  document.querySelector("#categorySelect").querySelectorAll("option").forEach(opt => {
    let w100 = document.createElement("div")
    w100.setAttribute("class", "w-100");

    let sliderCol = document.createElement("div");
    sliderCol.setAttribute("class", "col");
    
    let textDiv = document.createElement("div");
    textDiv.setAttribute("class", "col");
    textDiv.innerText = opt.innerText;
    
    let slider = document.createElement("input");
    slider.setAttribute("class", "auto-list-slider");
    slider.setAttribute("type", "range");
    slider.setAttribute("min", "0");
    slider.setAttribute("max", "100");
    slider.dataset.category = opt.value;
    
    row.appendChild(textDiv);
    sliderCol.appendChild(slider);
    row.appendChild(sliderCol);
    row.appendChild(w100);
  });
  document.querySelector("#btnConfirmAutoList").onclick = () => {
    createAutoList();
  }
}

function createAutoList() {
  var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  const request = new XMLHttpRequest();
  const url = `/random_list/`;
  request.open('POST', url);
  request.setRequestHeader('X-CSRFToken', csrftoken);
  request.onload = () => {
    const response = JSON.parse(request.responseText);
    populateAutoList(response);
    notify(gettext("List created"));
  };
  const data = new FormData();
  //Desired length of the list
  let listLength = parseInt(document.querySelector("#modalAutoListLength").value);

  //Retrieving all the user's parameters
  let params = {}
  document.querySelectorAll(".auto-list-slider").forEach(slider => {
    params[slider.dataset.category] = parseInt(slider.value);
  });
  params["list_length"] = listLength;

  data.append("parameters", JSON.stringify(params));

  request.send(data);
}

function populateAutoList(dict) {
  //Delete old items
  document.querySelectorAll(".singleItem").forEach(item => {
    deleteItem(item);
  });

  //adding new items
  Object.keys(dict).forEach(key => {
    addItem(dict[key], key);
  });

}