document.addEventListener('DOMContentLoaded', function(){

  document.querySelector("#btnOpenList").onclick = () => {
    openSharedList();
  }

});


function openSharedList() {
  let listCode = document.querySelector("#listCode").value;

  if (listCode == "") {
    showPageMessage("alert alert-dismissible alert-danger", gettext("Please insert the code."))
    return false;
  }

  window.location.href = window.location.href.replace("open_shared", "list_editor") + `${listCode}`;

}
