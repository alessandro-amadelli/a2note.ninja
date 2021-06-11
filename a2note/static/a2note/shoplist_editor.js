document.addEventListener('DOMContentLoaded', function(){

  document.querySelector("#btnAddItem").onclick = () => {
    addItem();
    //Reset category selection to 'other'
    document.querySelector("#categorySelect").value = 'other';
  }

  document.querySelector("#itemText").addEventListener("keydown", function(e) {
    // Enter is pressed
    if (e.keyCode == 13) {
      addItem();
      //Reset category selection to 'other'
      document.querySelector("#categorySelect").value = 'other';
    }
  });

  createSections();

  //Get all products from the database
  retrieveAllProducts();

  loadShoplist();

});

function saveShoplist() {
  showLoading();
  saveShoplistToDB();
}

function getListItems() {
  let itemList = document.querySelectorAll(".singleItem");
  let listItems = {};

  itemList.forEach((item, i) => {
    let name = item.querySelector(".taskTextArea").innerText;
    let category = item.parentElement.dataset.category;
    let status = item.dataset.status;
    listItems[name] = {
      "category": category,
      "status": status
  }
  });

  return JSON.stringify(listItems);

}

function saveShoplistToDB() {
  var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  const request = new XMLHttpRequest();
  const url = `/save_list_view/`;
  request.open('POST', url);
  request.setRequestHeader('X-CSRFToken', csrftoken);
  request.onload = () => {
    const response = JSON.parse(request.responseText);
    removeLoading();
  };
  const data = new FormData();
  element_id = document.querySelector("#elementID").innerText;
  if (element_id.substring(0,2) == "SL") {
    element_type = "SHOPLIST";
  } else {
    element_type = "TODOLIST";
  }
  data.append("element_id", element_id);
  data.append("element_type", element_type);
  data.append("items", getListItems());
  data.append("shared", "False");
  data.append("edit_enabled", "False");

  request.send(data);
}

function loadShoplist(){

  Object.keys(items).forEach((item, i) => {
    addItem(items[item]["category"], item, items[item]["status"], true);
  });


}
