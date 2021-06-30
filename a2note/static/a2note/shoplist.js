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

  if (!is_authenticated) {
    loadShoplistFromLocalStorage();
  }

  //Get all products from the database
  retrieveAllProducts();
  updateProgressBar();
  
  //Initialize button to show modalRundown
  document.querySelector("#btnShowRundown").onclick = () => {
    showModalRundown();
  }
});


function saveShoplistToLocalStorage(){
  //Generate a JSON object representing the Shopping list and save it to the local storage
  //This function will overwrite an existing list if already present
  let jsonList = {};
  document.querySelectorAll(".section").forEach((section) => {
    let elementList = section.querySelectorAll(".element");
    if (elementList.length > 0) {
      let secName = section.dataset.category;
      jsonList[secName] = {};
      elementList.forEach((element, e) => {
        let elemStatus = element.dataset.status;
        let elemContent = element.querySelector(".taskTextArea").innerText;
        let quantity = element.querySelector(".itemQuantity").value;
        let elemData = {"itemContent": elemContent, "itemStatus": elemStatus,
      "quantity": quantity};
        jsonList[secName][e] = elemData;
      });
    }
  });

  localStorage.setItem("localNinjaShoplist", JSON.stringify(jsonList));
  updateProgressBar();
}

function loadShoplistFromLocalStorage() {
  //Load the locally saved shopping list (if present)

  let localShoplist = localStorage.getItem("localNinjaShoplist");
  if (!localShoplist) {
    return false;
  }

  localShoplist = JSON.parse(localShoplist);

  Object.keys(localShoplist).forEach((section) => {
    Object.keys(localShoplist[section]).forEach((element) => {
      //addItem(category, text, quantity, status, loadedFromStorage)
      let quantity = localShoplist[section][element].quantity;
      if (!quantity) {
        quantity = 1;
      }
      addItem(section, localShoplist[section][element].itemContent, quantity, localShoplist[section][element].itemStatus, true);
    });
  });

}
