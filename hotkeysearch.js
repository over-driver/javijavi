console.log('inject')

var my_search_keyword = window.getSelection().toString().trim();

if (my_search_keyword.length == 0) {
    if (window.location.host.includes('javlibrary')) {
        my_search_keyword = document.querySelector('#video_id').querySelectorAll('td')[1].innerText
    } else if (window.location.host.includes('avmoo')) {
        my_search_keyword = document.querySelector('.info').querySelectorAll('span')[1].innerText
    }
}
if (my_search_keyword.length > 0) {
    chrome.runtime.sendMessage({ keyword: my_search_keyword, action: 'new' })
} 