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

  updateStats();
});

function addTask(){
  //Adds a new task to the list by creating a new list element
  let inp = document.querySelector("#taskText");
  let text = inp.value;
  let taskList = document.querySelector("#taskList");

  if (text == "") {
    inp.addEventListener('animationend', function(){
      this.classList.remove("alertAnimated");
    });
    inp.classList.add("alertAnimated");
    return false;
  }

  //Creation of new list element
  // ### TASK ###
  let newTask = document.createElement("div");
  newTask.setAttribute("class", "singleTask element card rounded-3");
  newTask.dataset.status = 'ToDo';

  // ### HEADER ###
  let taskHeader = document.createElement("div");
  taskHeader.setAttribute("class", "card-header");

  let taskDel = document.createElement("div");
  taskDel.setAttribute("class", "input-group-prepend taskDeleteArea col-1 col-lg-1 col-sm-1 d-inline");
  let taskDelText = document.createElement("span");
  taskDelText.setAttribute("class", "float-start");
  taskDelText.innerHTML = `<span class="material-icons-outlined">delete</span>`;
  taskDel.appendChild(taskDelText);

  //On mouse over event
  taskDel.addEventListener('mouseover', function(){
    newTask.classList.add('deletingTask');
    this.style.color = "red";
  });
  //On mouse out event
  taskDel.addEventListener('mouseout', function(){
    newTask.classList.remove('deletingTask');
    this.style.color = "inherit";
  });
  //Onclick event for task deletion
  taskDel.addEventListener('click', function() {
    deleteTask(newTask);
  });

  taskHeader.appendChild(taskDel);

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
  //Current timestamp
  let timestamp = Date.now();
  let today = new Date(timestamp);
  let dateArr = [today.getFullYear(), String((today.getMonth()+1)).padStart(2,'0'), String(today.getDate()).padStart(2,'0'),
  String(today.getHours()).padStart(2,'0'),
  String(today.getMinutes()).padStart(2,'0'),
  String(today.getSeconds()).padStart(2,'0')]
  timeDiv.innerHTML = `<i class="material-icons-outlined">schedule</i>
    <span>${dateArr[0]}-${dateArr[1]}-${dateArr[2]} h.${dateArr[3]}:${dateArr[4]}:${dateArr[5]}</span>`;
  taskFooter.appendChild(timeDiv);

  let moveDiv = document.createElement("div");
  moveDiv.setAttribute("class", "col-2 col-sm-2 col-lg-1 d-inline");
  let arrDown = document.createElement("span");
  arrDown.setAttribute("class", "float-start taskArrow");
  arrDown.innerHTML = `<i class="material-icons-outlined">keyboard_arrow_down</i>`;
  let arrUp = document.createElement("span");
  arrUp.setAttribute("class", "float-end taskArrow");
  arrUp.innerHTML = `<i class="material-icons-outlined">keyboard_arrow_up</i>`;

  arrDown.addEventListener('click', () => {
    moveTaskDown(newTask);
  });

  arrUp.addEventListener('click', () => {
    moveTaskUp(newTask);
  });

  moveDiv.appendChild(arrDown);
  moveDiv.appendChild(arrUp);

  taskFooter.appendChild(moveDiv);
  newTask.appendChild(taskFooter);

  //Animaiton when adding tasks
  newTask.addEventListener('animationend', function(){
    this.classList.remove("newTask");
  })
  newTask.classList.add('newTask');

  taskList.appendChild(newTask);

  //Clear the original input text
  inp.value = "";

  updateStats();
  displayTasks();

}

function deleteTask(task) {
  //Deletion of a task from the to-do list

  //Removing animation interfering with the deletion
  task.classList.remove("deletingTask");
  task.querySelector(".taskDeleteArea").remove();

  //Event listener for animation end
  task.addEventListener('animationend', () => {
    task.remove();
    updateStats();
  });

  //Adding class for deletion animation
  task.classList.add('deletedTask');
}

function completeTask(task){
  //Completion of a task from the to-do list
  task.classList.toggle('doneTask');
  if (task.dataset.status == 'ToDo') {
    task.dataset.status = "Done";
  } else {
    task.dataset.status = "ToDo";
  }
  updateStats();
  displayTasks();
}

function displayTasks(){
  let val = document.querySelector("#taskViewSelect").value;
  document.querySelectorAll(".singleTask").forEach((item, i) => {
    if (val == item.dataset.status || val == "All") {
      item.classList.remove("hidden");
    } else {
      item.classList.add("hidden");
    }
  });
}

function moveTaskUp(task){

  if (task.previousSibling != null) {
    task.addEventListener('animationend', () => {
      task.classList.remove("movedTask");
    });
    task.parentElement.insertBefore(task, task.previousSibling);
    task.classList.add("movedTask");
  }
}

function moveTaskDown(task){
  if (task.nextSibling != null){
    task.addEventListener('animationend', () => {
      task.classList.remove("movedTask");
    });
    if (task.nextSibling.nextSibling != null){
      task.parentElement.insertBefore(task, task.nextSibling.nextSibling);
      task.classList.add("movedTask");
    } else {
      task.parentElement.insertBefore(task, null);
      task.classList.add("movedTask");
    }
  }
}


function updateStats() {
  //Updates stats regarding to-do and completed tasks
  let allTasks = document.querySelectorAll(".singleTask");
  let statDiv = document.querySelector("#statDiv");

  if (allTasks.length == 0) {
    statDiv.classList.add("hidden");
  } else {
    let total = 0;
    let done = 0;
    let todo = 0;

    allTasks.forEach((item, i) => {
      total += 1;
      if (item.dataset.status == "Done") {
        done += 1
      } else {
        todo += 1;
      }
    });

    //Textual statistics
    let statTotal = document.querySelector("#statTotal");
    let statDone = document.querySelector("#statDone");
    let statTodo = document.querySelector("#statTodo");

    //Old values for compare
    let oldTotal = statTotal.innerText;
    let oldDone = statDone.innerText;
    let oldTodo = statTodo.innerText;

    //Compare of statistic for animation purpose
    if (String(total) != oldTotal) {
      statTotal.innerText = total;
      statTotal.addEventListener('animationend', () => {
        statTotal.classList.remove("updatedStat");
      });
      statTotal.classList.add("updatedStat");
    }

    //Compare of statistic for animation purpose
    if (String(done) != oldDone) {
      statDone.innerText = done;
      statDone.addEventListener('animationend', () => {
        statDone.classList.remove("updatedStat");
      });
      statDone.classList.add("updatedStat");
    }

    //Compare of statistic for animation purpose
    if (String(todo) != oldTodo) {
      statTodo.innerText = todo;
      statTodo.addEventListener('animationend', () => {
        statTodo.classList.remove("updatedStat");
      });
      statTodo.classList.add("updatedStat");
    }

    //Progressbar
    let progrBar = document.querySelector("#taskProgress");
    let perc = (done / total) * 100;

    progrBar.style.width = `${perc}%`;

    //Rendering the main div visible
    statDiv.classList.remove("hidden");
  }
}

/**
function toggleTheme(){
  let body = document.querySelector("body");
  let darkSelector = document.querySelector("#darkModeSelector");
  let nav = document.querySelector("nav");

  body.classList.toggle("light-theme");
  if (body.classList.contains("light-theme")){
    //Applying LIGHT THEME
    //Darkmode icon
    darkSelector.innerHTML = `<span class="material-icons-outlined">dark_mode</span>`;

    //Logo
    document.querySelector("#logo-dark").classList.add("hidden");
    document.querySelector("#logo-light").classList.remove("hidden");

    //navbar
    nav.classList.remove("navbar-dark");
    nav.classList.remove("bg-dark");
    nav.classList.add("navbar-light");
    nav.classList.add("bg-light");

    //buttons
    document.querySelectorAll(".btn").forEach((button, i) => {
      button.classList.remove("btn-light");
      button.classList.add("btn-dark");
    });

  } else {
    //Applying DARK THEME
    //Darkmode icon
    darkSelector.innerHTML = `<span class="material-icons-outlined">light_mode</span>`;

    //Logo
    document.querySelector("#logo-light").classList.add("hidden");
    document.querySelector("#logo-dark").classList.remove("hidden");

    //navbar
    nav.classList.remove("navbar-light");
    nav.classList.remove("bg-light");
    nav.classList.add("navbar-dark");
    nav.classList.add("bg-dark");

    //buttons
    document.querySelectorAll(".btn").forEach((button, i) => {
      button.classList.remove("btn-dark");
      button.classList.add("btn-light");
    });
  }
}
*/
