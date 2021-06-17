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

});

function btnSaveClick() {
  //Remove stop if user tries to leave the page (all the content is saved so it is not necessary)
  window.onbeforeunload = function() {
  }

  let btnSave = document.querySelector("#btnSaveList");
  btnSave.disabled = true;
  btnSave.classList.add("hidden");
  saveTodolist();
  oldTitle = document.querySelector("#inpListTitle").value;
}

function saveTodolist() {
  showLoading();
  saveTodolistToDB();
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

function saveTodolistToDB() {
  var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  const request = new XMLHttpRequest();
  const url = `/save_list_view/`;
  request.open('POST', url);
  request.setRequestHeader('X-CSRFToken', csrftoken);
  request.onload = () => {
    const response = JSON.parse(request.responseText);
    removeLoading();
    notify(gettext("List saved"));
  };
  const data = new FormData();
  title = document.querySelector("#inpListTitle").value;
  element_id = document.querySelector("#elementID").innerText;
  if (element_id.substring(0,2) == "SL") {
    element_type = "SHOPLIST";
  } else {
    element_type = "TODOLIST";
  }
  data.append("element_id", element_id);
  data.append("element_type", element_type);
  data.append("title", title);
  data.append("items", getListTasks());
  data.append("shared", "False");
  data.append("edit_enabled", "False");

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
