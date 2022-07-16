document.addEventListener('DOMContentLoaded', function(){
    //Load elements to the check list
    loadChecklist();
    
    //Column styling according to configurations
    styleListColumns();

    let reportTrigger = document.querySelector("#reportTrigger");
    reportTrigger.style.setProperty('cursor','pointer');
    reportTrigger.addEventListener('click', () =>{
      buildReportModal();
    });

  });

  function enableSave() {}