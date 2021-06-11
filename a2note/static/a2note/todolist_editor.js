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


});

function saveTodolist() {
  showLoading();
  saveTodolistToDB();
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
