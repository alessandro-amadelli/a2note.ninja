document.addEventListener('DOMContentLoaded', function(){

  document.querySelector("#info-toggle").style.cursor = "pointer";
  document.querySelector("#info-toggle").addEventListener("click", function(){
    showInfo(this.parentElement.parentElement);
  });

  initializeRadioBtn();

});

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
        thumbnail.classList.remove("hidden");
      } else {
        let type = thumbnail.dataset.type;
        if (type == val) {
          thumbnail.classList.remove("hidden");
        } else {
          thumbnail.classList.add("hidden");
        }
      }
    });



  }
}
