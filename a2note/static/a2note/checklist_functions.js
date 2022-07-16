function addCheck(text=null, checkCol="M", loadedFromDB=false) {
  let checkList = document.querySelector("#checkList");

  let checkColumn = document.querySelector("#checkCol" + checkCol)

  if (text == null) {
    let inp = document.querySelector("#checkText");
    text = inp.value;
    if (text == "") {
      inp.addEventListener('animationend', function(){
        this.classList.remove("alertAnimated");
      });
      inp.classList.add("alertAnimated");
      return false;
    }
    //Clear the original input text
    inp.value = "";
  }

  //Creation of new checklist element
  // ### CHECK ###
  let newCheck = document.createElement("div");
  newCheck.setAttribute("class", "element singleCheck card rounded-3");

  // ### CHECK BODY ###
  let checkBody = document.createElement("div");
  checkBody.setAttribute("class", "checkBody card-body row");
  newCheck.appendChild(checkBody);

  // ### LEFT SECTION###
  let checkLeft = document.createElement("div");
  checkLeft.setAttribute("class", "checkLeftSection col-md-2 col-sm-12 align-middle");
  leftArrow = document.createElement("span");
  leftArrow.setAttribute("class", "material-symbols-outlined float-start");
  leftArrow.innerText = "chevron_left";

  checkLeft.style.cursor = "pointer"; // Cursor pointer
  
  // Onclick event
  checkLeft.addEventListener('click', () => {
    moveCheck(newCheck, text, checkCol, 'L');
  });

  checkLeft.appendChild(leftArrow);
  checkBody.appendChild(checkLeft);

  // ### MIDDLE SECTION###
  let checkMiddle = document.createElement("div");
  checkMiddle.setAttribute("class", "checkMiddleSection col-md-8 col-sm-12");
  checkText = document.createElement("span");
  checkText.setAttribute("class", "checkContent");
  checkText.innerText = text;
  checkMiddle.appendChild(checkText);
  checkBody.appendChild(checkMiddle);

  // ### RIGHT SECTION###
  let checkRight = document.createElement("div");
  checkRight.setAttribute("class", "checkRightSection col-md-2 col-sm-12 align-middle");
  rightArrow = document.createElement("span");
  rightArrow.setAttribute("class", "material-symbols-outlined float-end");
  rightArrow.innerText = "chevron_right";
  
  checkRight.style.cursor = "pointer"; // Cursor pointer
  
  checkRight.appendChild(rightArrow);
  checkBody.appendChild(checkRight);
 
  // Onclick event
  checkRight.addEventListener('click', () => {
    moveCheck(newCheck, text, checkCol, 'R');
  });

  // ### FOOTER ###
  let checkFooter = document.createElement("div");
  checkFooter.setAttribute("class", "checkFooter card-footer");
  let deleteBtn = document.createElement("span");
  deleteBtn.setAttribute("class", "material-symbols-outlined deleteCheckTrigger");
  deleteBtn.innerText = "delete";
  deleteBtn.style.cursor = "pointer";

  // On click event for the check deletion
  deleteBtn.addEventListener('click', () => {
    newCheck.remove();
    enableSave();
  });

  checkFooter.appendChild(deleteBtn);
  newCheck.appendChild(checkFooter);

  // Appending Check to the correct column
  checkColumn.appendChild(newCheck);

  if (!loadedFromDB) {
    enableSave();
  }

}

function moveCheck(singleCheck, text, currentCol, newCol) {
  // If new column is equal to the current column: do nothing
  if (currentCol == newCol) {
    return false;
  }

  // Choosing the right destination column
  let newColName = "";
  if (currentCol == "M") {
    newColName = newCol;
  } else {
   newColName = "M";
  }

  //Deleting old check
  singleCheck.remove();

  //Creating a new check and appending to the right column
  addCheck(text, newColName);

}

function loadChecklist(){
  Object.keys(checks).forEach((check, i) => {
    addCheck(checks[check]["text"], checks[check]["column"], true);
  });
}

function styleListColumns() {
  document.querySelector("#checkColL").style.backgroundColor = column_config["column_left"]["color"];
  document.querySelector("#checkColM").style.backgroundColor = column_config["column_middle"]["color"];
  document.querySelector("#checkColR").style.backgroundColor = column_config["column_right"]["color"];

  document.querySelector("#colLName").innerText = column_config["column_left"]["name"];
  document.querySelector("#colMName").innerText = column_config["column_middle"]["name"];
  document.querySelector("#colRName").innerText = column_config["column_right"]["name"];
}

var checklistChart = null;
function buildReportModal() {
  //Numerics
  let colLNum = document.querySelector("#checkColL").querySelectorAll(".singleCheck").length;
  let colMNum = document.querySelector("#checkColM").querySelectorAll(".singleCheck").length;
  let colRNum = document.querySelector("#checkColR").querySelectorAll(".singleCheck").length;
  let totalNum = colLNum + colMNum + colRNum;

  //Chart data
  let labels = [
    document.querySelector("#colLName").innerText,
    document.querySelector("#colMName").innerText,
    document.querySelector("#colRName").innerText
  ]

  let colors = [
    column_config["column_left"]["color"],
    column_config["column_middle"]["color"],
    column_config["column_right"]["color"]
  ]

  let values = [colLNum,colMNum,colRNum]

  let data = {
    labels: labels,
    datasets: [{
      label: '',
      backgroundColor: colors,
      data: values,
      hoverOffset: 10,
      borderWidth: 0,
      spacing: 5
    }],
  };

  let config = {
    type: 'doughnut',
    data,
    options: {
      cutout: "88%"
    }
  };

  //Numerics on modal table
  document.querySelector("#modalTableC1Name").innerText = labels[0];
  document.querySelector("#modalTableC1Num").innerText = colLNum;
  document.querySelector("#modalTableC2Name").innerText = labels[1];
  document.querySelector("#modalTableC2Num").innerText = colMNum;
  document.querySelector("#modalTableC3Name").innerText = labels[2];
  document.querySelector("#modalTableC3Num").innerText = colRNum;
  document.querySelector("#modalTableTot").innerText = totalNum;


  //Destroy previously created graph
  if (checklistChart) {
    checklistChart.destroy();
  }

  checklistChart = new Chart(
    document.querySelector('#checklistChart'),
    config
  );

}