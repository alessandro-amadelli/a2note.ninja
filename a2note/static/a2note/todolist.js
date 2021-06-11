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

  if (!is_authenticated) {
    loadTodoFromLocalStorage();
    updateStats();
  }

});

function saveTodoList() {
  saveTodoToLocalStorage();
}

function saveTodoToLocalStorage() {
  //Generate a JSON object representing the To-do list and save it to the local storage
  //This function will overwrite an existing list if already present

  let jsonList = {};
  document.querySelectorAll(".singleTask").forEach((task, i) => {
    let contentText = task.querySelector(".taskTextArea").innerText;
    let creationTime = task.querySelector(".taskCreationTime").innerText;
    let status = task.dataset.status;
    jsonList[i] = {"taskContent": contentText, "taskCreationTime": creationTime, "taskStatus": status};
  });

  localStorage.setItem("localNinjaTodo", JSON.stringify(jsonList));
}

function loadTodoFromLocalStorage() {
  //Load the locally saved to-do list (if present)

  let localTodo = localStorage.getItem("localNinjaTodo");
  if (!localTodo) {
    return false;
  }

  localTodo = JSON.parse(localTodo);

  Object.keys(localTodo).forEach((key) => {
    //addTask(text, datetime, status, loadedFromStorage)
    addTask(localTodo[key].taskContent, localTodo[key].taskCreationTime, localTodo[key].taskStatus, true);
  });

}
