document.addEventListener('DOMContentLoaded', function() {

  //Event listeners to render register button visible
  document.querySelectorAll(".formInput").forEach((inp, i) => {
    inp.addEventListener('change', function() {
      showBtnRegister();
    })
  });

  document.querySelector("#password0").addEventListener('input', function(){
    let val = this.value;
    let result = zxcvbn(val); //Dropbox JavaScript library for password strength score
    updatePswScore(result);
    showBtnRegister();
  })

  document.querySelector("#btnRegister").onclick = () => {
    btnRegisterClicked();
  }

  document.querySelectorAll(".otpInput").forEach((inp, i) => {
    inp.addEventListener('keyup', function(e){
      otpWritten(this, e);
    });
  });

});

function updatePswScore(result) {
  let score = result["score"];
  let icon = "";
  if (score == 0) {
    icon = `<span class="material-icons" style="font-size:1.6rem;color:red;">sick</span>`;
  } else if (score == 1) {
    icon = `<span class="material-icons" style="font-size:1.6rem;color:orange;">sentiment_dissatisfied</span>`;
  } else if (score == 2) {
    icon = `<span class="material-icons-outlined" style="font-size:1.6rem;color:yellow;">sentiment_neutral</span>`;
  } else if (score == 3) {
    icon = `<span class="material-icons" style="font-size:1.6rem;color:cyan;">sentiment_satisfied</span>`;
  } else if (score == 4) {
    icon = `<span class="material-icons" style="font-size:1.6rem;color:green;">sentiment_very_satisfied</span>`;
  }

  document.querySelector("#pswStrengthSpan").innerHTML = icon;
}

function showBtnRegister() {
  let visible = true;
  let formInps = document.querySelectorAll(".formInput").forEach((inp, i) => {
    if (inp.id == "consentCheck"){
      if (!inp.checked){
        visible = false
      }
    } else {
      if (inp.value.trim() == ""){
        visible = false;
      }
    }
  });

  if (visible) {
    document.querySelector("#btnRegister").classList.remove("hidden");
  } else {
    document.querySelector("#btnRegister").classList.add("hidden");
  }

}

function otpWritten(inp, key) {
  let completeOTP = "";
  let inpNum = parseInt(inp.id.replace("OTPDigit-",""));
  let newNum = inpNum;

  //previous input
  if (key.keyCode === 8 || key.keyCode === 37) {
    if (inpNum > 1) {
      newNum = inpNum - 1;
    }
  } else {
    if (inpNum <= 5) {
      newNum = inpNum + 1;
    }
  }

  document.querySelector("#OTPDigit-" + newNum.toString()).focus();

  for(i=1;i<7;i++) {
    completeOTP += document.querySelector("#OTPDigit-"+ i.toString()).value;
  }

  document.querySelector("#OTPNum").value = "";
  document.querySelector("#OTPNum").value = completeOTP;

  document.querySelector("#btnRegister").disabled = completeOTP.trim().length < 6;

}

function btnRegisterClicked() {
  showLoading();
  sendOtp();
}

function sendOtp() {
  var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  const request = new XMLHttpRequest();
  const url = `/send_otp/`;
  request.open('POST', url);
  request.setRequestHeader('X-CSRFToken', csrftoken);

  request.onload = () => {
    const response = JSON.parse(request.responseText);

    if (response["RESULT"] == "OK") {
      //Updating button
      let btnReg = document.querySelector("#btnRegister");
      btnReg.disabled = true;
      btnReg.onclick = () => {};
      btnReg.setAttribute("type", "submit");

      //Rendering the otp input visible
      document.querySelector("#otpGroup").classList.remove("hidden");
    } else {
      alert(response["DESCRIPTION"]);
    }

    removeLoading();
  };
  const data = new FormData();

  let username = document.querySelector("#ninjaName").value;
  let email = document.querySelector("#email").value;

  data.append("username", username);
  data.append("email", email);

  request.send(data);
}
