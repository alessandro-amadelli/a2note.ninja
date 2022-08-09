document.addEventListener('DOMContentLoaded', function(){

  document.querySelector("#info-toggle").style.cursor = "pointer";
  document.querySelector("#info-toggle").addEventListener("click", function(){
    showInfo(this.parentElement.parentElement);
  });

  initializeFilter();

  //list dletion
  initializeModalDeleteBtn();
  initializeDeleteListTriggers();

  //Initialize lists creation
  document.querySelectorAll(".newList-card").forEach((item, i) => {
    item.addEventListener('click', function() {
      showLoading();
      createList(this.dataset.type);
    });
  });

  //Initialize filter trigger functionality (showing/hiding option menu)
  let filterTrigger = document.querySelector("#filterTrigger");
  filterTrigger.addEventListener("click", () => {
    toggleFilterVisibility();
  });
  let optionMenu = document.querySelector("#filterListSelect");
  optionMenu.addEventListener("animationend", () => {
    if (optionMenu.classList.contains("disappearingElement")) {
      optionMenu.classList.remove("d-inline");
      optionMenu.classList.add("hidden");
      optionMenu.classList.remove("disappearingElement");
    } else {
      optionMenu.classList.add("d-inline");
      optionMenu.classList.remove("appearingElement");
    }    
  });

});

function toggleFilterVisibility() {
  let optionMenu = document.querySelector("#filterListSelect");
  if (optionMenu.classList.contains("hidden")) {
    optionMenu.classList.add("d-inline");
    optionMenu.classList.remove("hidden");
    optionMenu.classList.add("appearingElement");
  } else {
    optionMenu.classList.add("disappearingElement");
  }
}

function initializeModalDeleteBtn() {
  document.querySelector("#btnDeleteList").onclick = function() {
    let element_id = document.querySelector("#modalElementId").innerText;
    deleteList(element_id);
  }

  document.querySelector("#btnNevermind").onclick = function() {
    assignAchievement19();
  }
}

function initializeDeleteListTriggers() {
  document.querySelectorAll(".deleteTrigger").forEach((trig, i) => {
    trig.addEventListener("click", function(){
      let element_id = this.parentElement.parentElement.parentElement.parentElement.dataset.id;
      document.querySelector("#modalElementId").innerText = element_id;
    });
  });

}

function showInfo(item) {
  item.querySelector(".info-text").classList.toggle("hidden");
}

function initializeFilter(){
  let filterSelect = document.querySelector("#filterListSelect");

  filterSelect.addEventListener('change', function() {
    filterLists(filterSelect.value);
    toggleFilterVisibility();
  });
}

function filterLists(filter) {
  document.querySelectorAll(".list-thumbnail").forEach((thumbnail, i) => {
    if (filter == "ALL") {
      thumbnail.parentElement.classList.remove("hidden");
    } else {
      if (thumbnail.dataset.type == filter) {
        thumbnail.parentElement.classList.remove("hidden");
      } else {
        thumbnail.parentElement.classList.add("hidden");
      }
    }
  });
}

function deleteList(element_id) {
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
  if (element_id.substring(0,2) == "SL") {
    element_type = "SHOPLIST";
  } else if (element_id.substring(0,2) == "TL") {
    element_type = "TODOLIST";
  } else if (element_id.substring(0,2) == "CL") {
    element_type = "CHECKLIST";
  } else {
    element_type = "";
  }
  data.append("element_id", element_id);
  data.append("element_type", element_type);

  request.send(data);
}

function createList(element_type){
  var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  const request = new XMLHttpRequest();
  const url = `/create_list_view/`;
  request.open('POST', url);
  request.setRequestHeader('X-CSRFToken', csrftoken);
  request.onload = () => {
    const response = JSON.parse(request.responseText);
    window.location.href = '/list_editor/' + response["element_id"];
  };
  const data = new FormData();

  data.append("element_type", element_type);

  request.send(data);
}
