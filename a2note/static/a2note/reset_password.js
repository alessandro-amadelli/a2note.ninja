document.addEventListener('DOMContentLoaded', function(){
  document.querySelector("#divForm2").style.display = "none";
  document.querySelector("#pEmailSent").style.display = "none";

});

function formStep1Submission(event) {
  event.preventDefault();
  //Mandare la mail al server in modo da controllare l'esistenza
  sendOtpRequest();
  //Rendere visibile l'altro form per confermare il reset password
}

function resetPswSecondStep(){
  let pEmailSent = document.querySelector("#pEmailSent");
  let divForm2 = document.querySelector("#divForm2");
  let inpEmail = document.querySelector("#inpEmail");
  let form1Btn = document.querySelector("#form1Btn");

  inpEmail.disabled = true;
  form1Btn.disabled = true;
  form1Btn.style.display = "none";

  pEmailSent.style.display = "block";
  pEmailSent.style.color = "red";

  divForm2.style.display = "block";
}

function sendOtpRequest(){
  showLoading();
  var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  const request = new XMLHttpRequest();
  const url = `/send_reset_otp/`;

  request.open('POST', url);
  request.setRequestHeader('X-CSRFToken', csrftoken);
  request.onload = () => {
    const response = JSON.parse(request.responseText);
    if (response["RESULT"] == "OK"){
      resetPswSecondStep();
    }
    removeLoading();
  };
  const data = new FormData();
  let emailAddr = document.querySelector("#inpEmail").value;
  data.append("email_address", emailAddr);

  request.send(data);
}

function restartResetProcedure() {
  //Clear second form
  document.querySelector("#inpPsw1").value = "";
  document.querySelector("#inpPsw2").value = "";
  document.querySelector("#inpOtp").value = "";
  document.querySelector("#divForm2").style.display = "none";
  document.querySelector("#form2Btn").disabled = false;

  //Re-enable form1
  document.querySelector("#inpEmail").disabled = false;
  document.querySelector("#form1Btn").disabled = false;
  document.querySelector("#form1Btn").style.display = "block";

  //Hide the pEmailSent paragraph
  document.querySelector("#pEmailSent").style.display = "none";

  //Return to top of the page
  window.scroll(0,0);

  //Show error message
  showPageMessage("alert alert-danger", gettext("Something went wrong, please try again..."));
}

function sendPasswordResetRequest(password, otp) {
  showLoading();
  var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  const request = new XMLHttpRequest();
  const url = `/reset_user_password/`;

  request.open('POST', url);
  request.setRequestHeader('X-CSRFToken', csrftoken);
  request.onload = () => {
    const response = JSON.parse(request.responseText);
    if (response["RESULT"] == "OK"){
      location.replace("/");
    } else {
      restartResetProcedure();
      removeLoading();
    }
  };
  const data = new FormData();
  let emailAddr = document.querySelector("#inpEmail").value;
  data.append("email_address", emailAddr);
  data.append("new_password", password);
  data.append("otp", otp);

  request.send(data);
}

function formStep2Submission(event) {
  event.preventDefault();

  //Form data
  let psw1 = document.querySelector("#inpPsw1").value;
  let psw2 = document.querySelector("#inpPsw2").value;
  let otp = document.querySelector("#inpOtp").value;

  //Checks
  if (psw1 == psw2) {
    document.querySelector("#form2Btn").disabled = true;
    sendPasswordResetRequest(psw1, otp);
  } else {
    window.scroll(0,0);
    showPageMessage("alert alert-danger", gettext("The two passwords don't correspond."));
  }

}
