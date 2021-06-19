document.addEventListener('DOMContentLoaded', function(){

  document.querySelector("#taskViewSelect").addEventListener('change', function() {
    displayTasks();
  });

  loadTodolist();
  updateStats();

});

function saveTodolist() {}

function enableSave() {}

function loadTodolist(){
  Object.keys(tasks).forEach((task, i) => {
    addTaskViewOnly(tasks[task]["text"], tasks[task]["task_creation"], tasks[task]["status"]);
  });
}

function addTaskViewOnly(text=null, creationTime=null, taskStatus=null){
  //Adds a new task to the list by creating a new list element
  //if text is null then the text is taken from the input field

  let taskList = document.querySelector("#taskList");

  //Creation of new list element
  // ### TASK ###
  let newTask = document.createElement("div");
  newTask.setAttribute("class", "element singleTask card rounded-3");

  newTask.dataset.status = taskStatus;
  if (taskStatus == "Done") {
    newTask.classList.add("doneTask");
  }


  // ### HEADER ###
  let taskHeader = document.createElement("div");
  taskHeader.setAttribute("class", "card-header");

  let taskDone = document.createElement("div");
  taskDone.setAttribute("class", "input-group-append taskDoneArea col-1 col-lg-1 col-sm-1 d-inline");
  let taskDoneText = document.createElement("span");
  taskDoneText.setAttribute("class", "float-end");
  taskDoneText.innerHTML = `<span class="material-icons-outlined">task_alt</span>`;
  taskDone.appendChild(taskDoneText);

  //On mouse over event
  taskDone.addEventListener('mouseover', function(){
    if (!newTask.classList.contains('doneTask')) {
      newTask.classList.add('completingTask');
      this.style.color = "#33ff33";
    }

  });
  //On mouse out event
  taskDone.addEventListener('mouseout', function(){
  newTask.classList.remove('completingTask');
    this.style.color = "inherit";
  });

  //Onclick event for task completion
  taskDone.addEventListener('click', function() {
    completeTask(newTask);
  });

  taskHeader.appendChild(taskDone);
  newTask.appendChild(taskHeader);

  // ### TASK BODY ###
  let taskBody = document.createElement("div");
  taskBody.setAttribute("class", "card-body");

  let taskText = document.createElement("p");
  taskText.setAttribute("class", "taskTextArea card-text");
  taskText.innerText = text;
  taskBody.appendChild(taskText);
  newTask.appendChild(taskBody);

  // ### TASK FOOTER ###
  let taskFooter = document.createElement("div");
  taskFooter.setAttribute("class", "card-footer taskFooter d-flex");
  let timeDiv = document.createElement("div");
  timeDiv.setAttribute("class", "col-10 col-sm-10 col-lg-11 text-muted d-inline");

  //take the timestamp already present in the saved to-do list
  timeDiv.innerHTML = `<i class="material-icons-outlined">schedule</i><span class="taskCreationTime">${creationTime}</span>`;

  taskFooter.appendChild(timeDiv);

  newTask.appendChild(taskFooter);

  //Animaiton when adding tasks
  newTask.addEventListener('animationend', function(){
    this.classList.remove("newTask");
  })
  newTask.classList.add('newTask');

  taskList.appendChild(newTask);

  updateStats();
  displayTasks();

}
