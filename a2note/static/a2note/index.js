document.addEventListener('DOMContentLoaded', function(){

  document.querySelector("#info-toggle").style.cursor = "pointer";
  document.querySelector("#info-toggle").addEventListener("click", function(){
    showInfo(this.parentElement.parentElement);
  });

  initializeRadioBtn();

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

});

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
      let element_id = this.parentElement.parentElement.dataset.id;
      document.querySelector("#modalElementId").innerText = element_id;
    });
  });

}

function showInfo(item) {
  item.querySelector(".info-text").classList.toggle("hidden");
}

function initializeRadioBtn(){
  let radios = document.querySelectorAll(`input[type="radio"]`);

  radios.forEach((radio, i) => {
    radio.onclick = function() {
      filterLists(this);
    }
  });
}

function filterLists(radio) {
  if (radio.checked) {
    let val = radio.value;

    document.querySelectorAll(".list-thumbnail").forEach((thumbnail, i) => {
      if (val == "ALL") {
        thumbnail.parentElement.classList.remove("hidden");
      } else {
        let type = thumbnail.dataset.type;
        if (type == val) {
          thumbnail.parentElement.classList.remove("hidden");
        } else {
          thumbnail.parentElement.classList.add("hidden");
        }
      }
    });
  }
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
  } else {
    element_type = "TODOLIST";
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
