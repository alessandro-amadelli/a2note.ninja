document.addEventListener('DOMContentLoaded', function(){

  document.querySelector("#info-toggle").style.cursor = "pointer";
  document.querySelector("#info-toggle").addEventListener("click", function(){
    showInfo(this.parentElement.parentElement);
  });

});

function showInfo(item) {
  item.querySelector(".info-text").classList.toggle("hidden");
}
