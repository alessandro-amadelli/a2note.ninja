document.addEventListener('DOMContentLoaded', function() {
  let btnEdit = document.querySelector("#btnEditBulletin");
  let btnEditEmpty = document.querySelector("#btnEditBulletinEmpty");
  if (btnEdit) {
    btnEdit.onclick = () => {
      showBulletinModal();
    }
  }

  if (btnEditEmpty) {
    btnEditEmpty.onclick = () => {
      showBulletinModal();
    }
  }

  document.querySelector("#btnModalSave").onclick = () => {
    updateBulletinText(document.querySelector("#modalTextarea").value);
    //Show correct bulletin div
    showBulletinDiv();
    enableBtnSave();
  }

  //Button to save bulletin changes to db
  let btnSaveBulletin = document.querySelector("#btnSaveBulletin");
  btnSaveBulletin.onclick = () => {
    showLoading();
    saveBulletinToDB();
  }
  btnSaveBulletin.disabled = true;

  //Select to change bulletin board theme
  let themeSelect = document.querySelector("#bulletinThemeSelect");
  themeSelect.value = document.querySelector(".bulletin-not-empty").dataset.class;
  themeSelect.addEventListener('change', function(){
    updateBulletinClass(this.value);
    enableBtnSave();
  });

  //Delete button
  document.querySelector("#btnDeleteBulletin").onclick = () => {
    updateBulletin("","default");
    document.querySelector("#bulletinThemeSelect").value = "default";
    showBulletinDiv();
    enableBtnSave();
  }

  //Text area inside modal -> remaining characters counter
  document.querySelector("#modalTextarea").addEventListener("keyup", function() {
    updateRemainingChars();
  });

});

function updateRemainingChars() {
  let textArea = document.querySelector("#modalTextarea");
  let counter = document.querySelector("#remainingCharsText");
  let max = 1000;

  if (textArea.value.length > max) {
    counter.innerText = 0;
    textArea.value = textArea.value.substring(0, max);
  } else {
    counter.innerText = max - textArea.value.length;
  }

}

function showBulletinModal() {
  let modal = document.querySelector("#modalBulletin");
  let myMod = new bootstrap.Modal(modal, {show: false});

  let textarea = modal.querySelector("#modalTextarea");
  let oldText = document.querySelector("#bulletinContentDiv").innerText;
  textarea.value = oldText;

  updateRemainingChars();

  myMod.show();
}

function updateBulletin(newText, newClass) {
  updateBulletinClass(newClass);
  updateBulletinText(newText);
}

function updateBulletinText(newText) {
  //Updating bulletin content
  document.querySelector("#bulletinContentDiv").innerText = newText;
}

function updateBulletinClass(newClass) {
  //Updating bulletin content
  if (newClass == "") {
    newClass = "default";
  }
  document.querySelector(".bulletin-not-empty").dataset.class = newClass;
}

function showBulletinDiv(){
  let bulletinNotEmpty = document.querySelector(".bulletin-div");
  let bulletinText = document.querySelector("#bulletinContentDiv");
  let bulletinEmpty = document.querySelector(".bulletin-empty-div");

  if (bulletinText.innerText != ""){
    bulletinNotEmpty.classList.remove("hidden");
    bulletinEmpty.classList.add("hidden");
  } else {
    bulletinNotEmpty.classList.add("hidden");
    bulletinEmpty.classList.remove("hidden");
  }
}

function enableBtnSave(){
  let btnSaveBulletin = document.querySelector("#btnSaveBulletin");

  btnSaveBulletin.parentElement.classList.add("d-inline");
  btnSaveBulletin.parentElement.classList.remove("hidden");

  btnSaveBulletin.disabled = false;

  //Require confirmation if user tries to leave the page (there are unsaved changes)
  window.onbeforeunload = function() {
    return "";
  }

}

function disableBtnSave(){
  let btnSaveBulletin = document.querySelector("#btnSaveBulletin");

  btnSaveBulletin.parentElement.classList.remove("d-inline");
  btnSaveBulletin.parentElement.classList.add("hidden");

  btnSaveBulletin.disabled = true;

  //Remove the need of confirmation if user tries to leave the page (all the content is saved so it is not necessary)
  window.onbeforeunload = function() {
  }
}

function saveBulletinToDB() {
  console.log("savebulletin");
  var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

  let bulletinDiv = document.querySelector(".bulletin-not-empty");
  let bulletinText = bulletinDiv.innerText;
  let bulletinClass = bulletinDiv.dataset.class;

  const request = new XMLHttpRequest();
  const url = `/save_bulletin_view/`;
  request.open('POST', url);
  request.setRequestHeader('X-CSRFToken', csrftoken);
  request.onload = () => {
    const response = JSON.parse(request.responseText);
    updateBulletin(response["bulletin_content"], response["bulletin_class"]);
    disableBtnSave();
    removeLoading();
  };

  const data = new FormData();
  data.append("bulletin_content", bulletinText);
  data.append("bulletin_class", bulletinClass);

  request.send(data);
}
