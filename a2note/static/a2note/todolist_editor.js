document.addEventListener('DOMContentLoaded', function(){

  document.querySelector("#btnAddTask").onclick = () => {
    addTask();
  }

  document.querySelector("#taskText").addEventListener("keydown", function(e) {
    // Enter is pressed
    if (e.keyCode == 13) {
      addTask();
    }
  });

  document.querySelector("#taskViewSelect").addEventListener('change', function() {
    displayTasks();
  });

  loadTodolist();
  updateStats();

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

function initializeShareBtns() {
  let text = gettext("Hi! Check out this cool list I created on a2note.ninja...")

  let btnWhatsapp = document.querySelector("#btnWhatsapp");
  btnWhatsapp.href = "https://api.whatsapp.com/send?text=" + text + window.location.href;

  let btnTelegram = document.querySelector("#btnTelegram");
  btnTelegram.href = "https://telegram.me/share/url?url=" + window.location.href + "&text=" + text;
  //<a href="tg://msg_url?url=https://valid.url&amp;text=text">Telegram</a>

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
  saveTodolist(reload);
  oldTitle = document.querySelector("#inpListTitle").value;
}

function saveTodolist(reload=false) {
  showLoading();
  saveTodolistToDB(reload);
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

function getListTasks() {
  let itemList = document.querySelectorAll(".singleTask");
  let listItems = {};

  itemList.forEach((item, i) => {
    let order = i;
    let text = item.querySelector(".taskTextArea").innerText;
    let creation_timestamp = item.querySelector(".taskCreationTime").innerText;
    let status = item.dataset.status;
    listItems[order] = {
      "text": text,
      "task_creation": creation_timestamp,
      "status": status
  }
  });

  return JSON.stringify(listItems);

}

function saveTodolistToDB(reload=false) {
  var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  const request = new XMLHttpRequest();
  const url = `/save_list_view/`;
  request.open('POST', url);
  request.setRequestHeader('X-CSRFToken', csrftoken);
  request.onload = () => {
    const response = JSON.parse(request.responseText);
    if (!reload) {
      removeLoading();
      notify(gettext("List saved"));
    } else {
      location.reload();
    }
  };
  const data = new FormData();
  title = document.querySelector("#inpListTitle").value;
  element_id = document.querySelector("#elementID").innerText;
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
  data.append("items", getListTasks());
  data.append("shared", shared);
  data.append("edit_enabled", edit_enabled);

  request.send(data);
}

function loadTodolist(){
  Object.keys(tasks).forEach((task, i) => {
    addTask(tasks[task]["text"], tasks[task]["task_creation"], tasks[task]["status"], true);
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
