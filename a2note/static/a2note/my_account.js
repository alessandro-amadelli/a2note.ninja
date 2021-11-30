document.addEventListener('DOMContentLoaded', function() {

  //Initialize password change button
  document.querySelector("#btnChangePsw").onclick = () => {
    showLoading();
    checkForm();

  }

});

function checkForm(){
  let psw_old = document.querySelector("#psw_old").value;
  let psw_new1 = document.querySelector("#psw_new1").value;
  let psw_new2 = document.querySelector("#psw_new2").value;

  if (psw_old.trim() == "" || psw_new1.trim() == "" || psw_new2.trim() == "") {
    showPageMessage("alert alert-danger alert-dismissible", gettext("Please, enter all fields"));
    removeLoading();
    scroll(0,0);
    return false;
  }
  changePsw();
}

function changePsw() {
  let psw_old_inp = document.querySelector("#psw_old");
  let psw_new1_inp = document.querySelector("#psw_new1");
  let psw_new2_inp = document.querySelector("#psw_new2");
  let psw_old = psw_old_inp.value;
  let psw_new1 = psw_new1_inp.value;
  let psw_new2 = psw_new2_inp.value;

  var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  const request = new XMLHttpRequest();
  const url = `/psw_change_view/`;
  request.open('POST', url);
  request.setRequestHeader('X-CSRFToken', csrftoken);
  request.onload = () => {
    const response = JSON.parse(request.responseText);
    showPageMessage(response["message"]["class"], response["message"]["text"]);
    psw_old_inp.value = "";
    psw_new1_inp.value = "";
    psw_new2_inp.value = "";
    removeLoading();
    scroll(0,0);
  };
  const data = new FormData();

  data.append("psw_old", psw_old);
  data.append("psw_new1", psw_new1);
  data.append("psw_new2", psw_new2);

  request.send(data);
}
