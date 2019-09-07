chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.action == 'new') {
      chrome.tabs.create({ url: chrome.extension.getURL("search.html") + '?keyword=' + encodeURIComponent(request.keyword) });
    }
    else if (request.action == 'play') {
      chrome.tabs.create({ url: chrome.extension.getURL("play.html") + '?url=' + encodeURIComponent(request.source) });
    }
    else if (request.action == 'load_source') {
      sendResponse({ source: source })
    }
  }
)

chrome.commands.onCommand.addListener(function (command) {
  if (command == "my_search_action") {
    chrome.tabs.query({active:true}, function(tabs){
      if(tabs[0].url.startsWith('chrome-extension://')){
        chrome.tabs.sendMessage(tabs[0].id, {'action': 'search_selected'})
      }else{
        search_selected();
      }
    })
  } else if (command == 'my_clean_action'){
    cleanTabs();
  }
});

function cleanTabs(){
  chrome.tabs.query({url:'chrome-extension://'+chrome.runtime.id+'/*'}, function(tabs){
    var tids = [];
    for(let tab of tabs){
      tids.push(tab.id);
    }
    chrome.tabs.remove(tids);
  })
}

function search_selected(){
  chrome.tabs.executeScript({
    file: 'hotkeysearch.js'
  });
}

chrome.contextMenus.create({
  'title': "清空JaviJavi标签页",
  'contexts': ["browser_action", "page"], 
  'onclick': cleanTabs
});

chrome.contextMenus.create({
  'title': "搜索选择内容",
  'contexts': ["browser_action", "page", "selection"], 
  'onclick': search_selected
});