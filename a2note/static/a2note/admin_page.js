document.addEventListener('DOMContentLoaded', function() {
    //Set the onclick property on each block/activate user button
    document.querySelectorAll(".btnBlock").forEach(btn => {
        btn.onclick = function(){
            showLoading("Please wait...");
            btn.setAttribute("class", "btn btn-warning");
            btn.innerHTML = `<span class='material-icons-outlined'>sync</span> Changed`;
            btn.disabled = true;
            blockUser(btn.dataset.action, btn.dataset.username);
        }
    });

    document.querySelectorAll(".triggerUserInfo").forEach(element => {
        element.onclick = () => {
            element.querySelector("table").classList.toggle("hidden");
        };
    });
});

function blockUser(action, username){
    var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const request = new XMLHttpRequest();
    const url = `/admin_block_user/`;
    request.open('POST', url);
    request.setRequestHeader('X-CSRFToken', csrftoken);
    request.onload = () => {
        const response = JSON.parse(request.responseText);
        removeLoading();
    }
    const data = new FormData();
    data.append("admin_action", action);
    data.append("user_involved", username);

    request.send(data);
}