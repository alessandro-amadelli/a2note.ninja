document.addEventListener('DOMContentLoaded', function(){
  document.querySelector("#btnAddCheck").onclick = () => {
    addCheck();
  }

  document.querySelector("#checkText").addEventListener("keydown", function(e) {
    // Enter is pressed
    if (e.keyCode == 13) {
      addCheck();
    }
  });

  //Load elements to the check list
  loadChecklist();

  //Initialize of the column edit modal
  initializeColEditModal();

  //Column styling according to configurations
  styleListColumns();

  //Modal button to save column configs
  document.querySelector("#btnSaveColumns").onclick = () => {
    updateConfigs();
  }

  initializeBtnDelete();

  //Button to save the to-do list
  document.querySelector("#btnSaveList").onclick = () => {
    btnSaveClick();
  }

  let inpListTitle = document.querySelector("#inpListTitle");
  var oldTitle = inpListTitle.value;
  inpListTitle.addEventListener('keyup', () => {
    if (inpListTitle.value != oldTitle) {
      enableSave();
    }
  });

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

});

function initializeColEditModal() {
  document.querySelector("#modalC1Name").value = column_config["column_left"]["name"];
  document.querySelector("#modalC1Color").value = column_config["column_left"]["color"];

  document.querySelector("#modalC2Name").value = column_config["column_middle"]["name"];
  document.querySelector("#modalC2Color").value = column_config["column_middle"]["color"];

  document.querySelector("#modalC3Name").value = column_config["column_right"]["name"];
  document.querySelector("#modalC3Color").value = column_config["column_right"]["color"];

}

function styleListColumns() {
  document.querySelector("#checkColL").style.backgroundColor = column_config["column_left"]["color"];
  document.querySelector("#checkColM").style.backgroundColor = column_config["column_middle"]["color"];
  document.querySelector("#checkColR").style.backgroundColor = column_config["column_right"]["color"];

  document.querySelector("#colLName").innerText = column_config["column_left"]["name"];
  document.querySelector("#colMName").innerText = column_config["column_middle"]["name"];
  document.querySelector("#colRName").innerText = column_config["column_right"]["name"];
}

function updateConfigs() {
  column_config["column_left"]["name"] = document.querySelector("#modalC1Name").value;
  column_config["column_left"]["color"] = document.querySelector("#modalC1Color").value;

  column_config["column_middle"]["name"] = document.querySelector("#modalC2Name").value;
  column_config["column_middle"]["color"] = document.querySelector("#modalC2Color").value;

  column_config["column_right"]["name"] = document.querySelector("#modalC3Name").value;
  column_config["column_right"]["color"] = document.querySelector("#modalC3Color").value;

  styleListColumns();
  enableSave();
}

function loadChecklist(){
  Object.keys(checks).forEach((check, i) => {
    addCheck(checks[check]["text"], checks[check]["column"], true);
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
  let element_id = document.querySelector("#elementID").innerText;
  let element_type = "CHECKLIST"
  data.append("element_id", element_id);
  data.append("element_type", element_type);

  request.send(data);
}

function btnSaveClick(reload=false) {
  //Remove stop if user tries to leave the page (all the content is saved so it is not necessary)
  window.onbeforeunload = function() {
  }

  let btnSave = document.querySelector("#btnSaveList");
  btnSave.disabled = true;
  btnSave.classList.add("hidden");
  saveChecklist(reload);
  oldTitle = document.querySelector("#inpListTitle").value;
}

function saveChecklist(reload=false) {
  showLoading();
  saveChecklistToDB(reload);
}

function enableSave() {
  let btnSave = document.querySelector("#btnSaveList");
  btnSaveList.disabled = false;
  btnSaveList.classList.remove("hidden");
  //Enable stop if user tries to leave the page (there are unsaved changes)
  window.onbeforeunload = function() {
    return "";
  }
}

function saveError() {
  enableSave();
  removeLoading();
  notify(gettext("Sorry, an error occurred. Check your connection."));
}

function saveChecklistToDB(reload=false) {
  var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  const request = new XMLHttpRequest();

  request.timeout = 10000; //Timeout in millisecond
  request.addEventListener('error', () => saveError());

  const url = `/save_list_view/`;
  request.open('POST', url);
  request.setRequestHeader('X-CSRFToken', csrftoken);
  //After request is loaded
  request.onload = () => {
    const response = JSON.parse(request.responseText);
    if (!reload) {
      removeLoading();
      notify(gettext("List saved"));
    } else {
      location.reload();
    }
  };
  //If a timeout is received
  request.ontimeout = () => {
    saveError();
    return false;
  };

  const data = new FormData();
  title = document.querySelector("#inpListTitle").value;
  let element_id = document.querySelector("#elementID").innerText;
  let element_type = "CHECKLIST";

  let shared = "False";
  let edit_enabled = "False";
  try {
    if (document.querySelector("#listPrivacySwitch").checked) {
      shared = "True";
      if (document.querySelector("#editEnableSwitch").checked) {
        edit_enabled = "True";
      }
    }
  } catch {}

  let colLName = document.querySelector("#colLName").innerText;
  let colLColor = column_config["column_left"]["color"];
  let colMName = document.querySelector("#colMName").innerText;
  let colMColor = column_config["column_middle"]["color"];
  let colRName = document.querySelector("#colRName").innerText;
  let colRColor = column_config["column_right"]["color"];

  data.append("element_id", element_id);
  data.append("element_type", element_type);
  data.append("title", title);
  data.append("items", getListChecks());
  data.append("colLName", colLName);
  data.append("colLColor", colLColor);
  data.append("colMName", colMName);
  data.append("colMColor", colMColor);
  data.append("colRName", colRName);
  data.append("colRColor", colRColor);
  data.append("shared", shared);
  data.append("edit_enabled", edit_enabled);

  request.send(data);
}

function getListChecks() {
  let itemList = document.querySelectorAll(".singleCheck");
  let listItems = {};

  itemList.forEach((item, i) => {
    let order = i;
    let text = item.querySelector(".checkContent").innerText;
    let column = item.parentElement.id;
    column = column.substring(column.length - 1);
    listItems[order] = {
      "text": text,
      "column": column
    }
  });

  return JSON.stringify(listItems);

}