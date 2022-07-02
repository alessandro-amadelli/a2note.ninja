document.addEventListener('DOMContentLoaded', function() {

  //Initialize password change button
  document.querySelector("#btnChangePsw").onclick = () => {
    showLoading();
    checkForm();
  }

  calculateRank();

});

function calculateRank(){
  let tdRank = document.querySelector("#tdRank");
  let fulfilledAchievements = tdRank.innerText;
  if (fulfilledAchievements == "") {
    fulfilledAchievements = "0";
  }
  fulfilledAchievements = parseInt(fulfilledAchievements);

  let rank = "";
  switch (fulfilledAchievements) {
    case 1:
    case 2:
      rank = gettext("Newbie");
      break;
    case 3:
    case 4:
    case 5:
      rank = gettext("Student");
      break;
    case 6:
    case 7:
    case 8:
    case 9:
    case 10:
      rank = gettext("Senpai");
      break;
    case 11:
    case 12:
    case 13:
    case 14:
    case 15:
      rank = gettext("Ninja helper");
      break;
    case 16:
    case 17:
    case 18:
      rank = gettext("Ninja of the lists");
      break;
    case 19:
      rank = gettext("Ninja master");
      break;
    case 20:
      rank = gettext("Legend");
      break;
  }

  let stars = "";
  full_stars = Math.floor(fulfilledAchievements/2);
  //Full stars to display
  for (i=0;i < full_stars; i++) {
    stars += "<span class='material-symbols-outlined'>star</span>";
  }
  //Display an half-full star if the remainder of the number is odd
  if (fulfilledAchievements % 2 != 0) {
    stars += "<span class='material-symbols-outlined'>star_half</span>";
    full_stars ++; //Increment full_stars to correct the number of empty stars to display
  }
  //Display empty stars 
  for (i=0;i < 10 - full_stars; i++) {
    stars += "<span class='material-symbols-outlined'>star_outline</span>"
  }

  tdRank.innerHTML = rank + "<br>" + stars;

}

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
