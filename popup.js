function mysearch() {
    var keyword = document.querySelector('#search_text').value
    chrome.runtime.sendMessage({ keyword: keyword, action: 'new' })
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#search_button').addEventListener('click', mysearch);

    document.onkeydown = function (e) {
        if (!e) e = window.event;
        if ((e.keyCode || e.which) == 13) {
            document.querySelector('#search_button').click()
        }
    }
});