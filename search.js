let search_results = [];
let n_per_page = 10;
let n_page = 1;
let n_current = 0;
let keyword = ''

function displayResults() {

    document.querySelector('.search_meta_header').innerText = 'About ' + search_results.length + ' results';

    var html_total = ''
    for (i = n_current; i < n_per_page; i++) {
        var j = (n_page - 1) * n_per_page + i;
        if (j >= search_results.length) {
            break;
        }
        n_current += 1;
        var data = search_results[j];
        var website_detail = '';
        var keys = ['actors', 'keywords', 'duration', 'date', 'likes', 'views'];
        var names = ['演员', '关键词', '时长', '发布日期', '点赞数', '观看数'];
        for (let i in keys) {
            if (data[keys[i]]) {
                website_detail += '<span style="display:inline-block;width:' + ((i < 2) ? '100%' : '50%') + ';">' + names[i] + ': ' + data[keys[i]] + '</span>';
            }
        }
        html_total += '<div class="website_results">' +
            '<div class="mydivleft"><img src="' + data.thumbnail + '" alt="' + (data.preview || '') + '" width="200"></div>' +
            '<div class="mydivright"><h3 class="website_title">' + data.title + '</h3>' +
            '<p class="website_link">' + data.link + '</p>' +
            '<p class="website_details">' + website_detail + '</p></div></div>';
    }
    if (html_total.length > 0) {
        document.querySelector('#result_list').innerHTML += html_total;
        for (let div of document.querySelectorAll('.website_results')) {
            let title = div.querySelector('.website_title');
            title.addEventListener('click', function () {
                chrome.runtime.sendMessage({ action: 'play', source: title.nextSibling.innerText })
            })
            div.addEventListener('mouseenter', function () {
                let v = document.querySelector('video');
                let src = div.firstChild.firstChild.getAttribute("alt");
                if (src) {
                    v.src = src;
                    v.style.backgroundColor = 'black';
                }
            })
            div.addEventListener('mouseleave', function () {
                let v = document.querySelector('video');
                v.src = '';
                v.style.backgroundColor = 'white';
            })
        }
    }
    updatePagination()

    if (n_current < n_per_page) {
        searchResults();
    }

}

let PAGE_CURRENT = -1;
let PAGE_MAX = -1;
let PAGE_MIN = -1;

function updatePagination() {
    var n_page_min = Math.max(1, n_page - 4);
    var n_page_max = Math.min(n_page_min + 9, Math.ceil(search_results.length / n_per_page))
    n_page_min = Math.max(1, Math.min(n_page_min, n_page_max - 9))

    if ((n_page == PAGE_CURRENT) && (n_page_min == PAGE_MIN) && (n_page_max == PAGE_MAX)) {
        return;
    } else {
        PAGE_CURRENT = n_page;
        PAGE_MAX = n_page_max;
        PAGE_MIN = n_page_min;
    }

    if (n_page_max == n_page_min) {
        return;
    }

    var html_total = n_page > 1 ? '<div class="general_page_container "><a href="#" class="previous_page page_number">Previous</a></div>' : '';
    for (var i = n_page_min; i <= n_page_max; i++) {
        html_total += '<div class="general_page_container"><a class="' + ((i == n_page) ? 'current page_number' : 'page_number') + '">' + i + '</a></div>';
    }
    if (n_page < n_page_max) {
        html_total += '<div class="general_page_container"><a href="#" class="next_page page_number">Next</a></div>';
    }
    document.querySelector('.pages_container').innerHTML = html_total;

    document.querySelectorAll('.general_page_container').forEach(function (currentValue, currentIndex, listObj) {
        currentValue.addEventListener('click', function () {
            var p = currentValue.innerText;
            var n_page_new = n_page;
            if (p == 'Previous') {
                n_page_new -= 1
            } else if (p == 'Next') {
                n_page_new += 1
            } else {
                n_page_new = parseInt(p)
            }
            if (n_page_new != n_page) {
                n_page = n_page_new;
                clearResults();
                scroll(0, 0);
                displayResults();
            }
        })
    },
        'myThisArg')

}

function clearResults() {
    document.querySelector('#result_list').innerHTML = ""
    n_current = 0
}

var avgle_page = 0;
var netflav_page = 1;
var javopen_page = 1;
var bestjavporn_page = 1;
var seventv_type = ['censored', 'amateurjav', 'chinese', 'uncensored'];
var seventv_page = { censored: 1, amateurjav: 1, chinese: 1, uncensored: 1 };
var hpjav_page = 1;

function searchResults() {
    if (avgle_page >= 0) {
        fetch(avgleUrl()).then(r => r.json()).then(avgleParse).then(displayResults)
    }
    if (netflav_page >= 0) {
        fetch(netflavUrl()).then(r => r.text()).then(netflavParse).then(displayResults)
    }
    if (javopen_page >= 0) {
        fetch(javopenUrl()).then(r => r.text()).then(javopenParse).then(displayResults)
    }
    if (bestjavporn_page >= 0) {
        fetch(bestjavpornUrl()).then(r => r.text()).then(bestjavpornParse).then(displayResults)
    }
    for (t of seventv_type) {
        if (seventv_page[t] >= 0) {
            fetch(seventvUrl(t)).then(r => r.text()).then(seventvParse).then(displayResults)
        }
    }
    if (hpjav_page >= 0) {
        fetch(hpjavUrl()).then(r => r.text()).then(hpjavParse).then(displayResults)
    }
}

function bestjavpornUrl() {
    var url = 'https://bestjavporn.com/page/' + bestjavporn_page + '/?s=' + keyword;
    bestjavporn_page = -bestjavporn_page - 1;
    return url;
}

function bestjavpornParse(result) {
    var domparser = new DOMParser()
    var doc = domparser.parseFromString(result, 'text/html')
    var articles = doc.querySelectorAll('article')
    keywords = keyword.split(' ')
    var updated = false;
    for (article of articles) {
        var title = article.querySelector('header').innerText;
        var match = true;
        for (k of keywords) {
            match = match && title.includes(k);
        }
        if (!match) {
            continue;
        }
        updated = true;
        var video = article.querySelector('video')
        var thumbnail = null
        var preview = null
        if (video == null) {
            thumbnail = article.querySelector('img').getAttribute('data-src')
        } else {
            thumbnail = video.getAttribute('poster')
            preview = video.firstChild.src;
        }
        search_results.push({
            thumbnail: thumbnail, link: article.querySelector('a').href, title: title,
            duration: article.querySelector('.duration').innerText,
            preview: preview, views: article.querySelector('.views').innerText
        })
    }
    if (updated) {
        bestjavporn_page = -bestjavporn_page;
    }
}

function javopenUrl() {
    var url = 'https://javopen.co/page/' + javopen_page + '/?s=' + keyword
    javopen_page = -javopen_page - 1;
    return url
}

function javopenParse(result) {
    var domparser = new DOMParser();
    var doc = domparser.parseFromString(result, 'text/html');
    var vs = doc.querySelector('.video-section')
    var count = 0;
    if (vs != null) {
        var items = vs.querySelectorAll('.item');
        for (item of items) {
            var a = item.querySelector('h3').firstChild;
            count += 1;
            search_results.push({
                thumbnail: item.querySelector('img').src, link: a.href, title: a.innerText,
                date: item.querySelector('.date').innerText, views: item.querySelector('.views').innerText,
                likes: item.querySelector('.heart').innerText
            })
        }
    }
    if (count == 21) {
        javopen_page = -javopen_page;
    }
}

function netflavUrl() {
    var url = 'https://www.netflav.com/search?type=title&keyword=' + keyword + '&page=' + netflav_page;
    netflav_page = - netflav_page - 1;
    return url
}

function netflavParse(result) {
    var domparser = new DOMParser();
    var doc = domparser.parseFromString(result, 'text/html');
    var data = JSON.parse(doc.querySelector('#__NEXT_DATA__').innerText)
    var items = data.props.initialState.search.docs
    var keywords = keyword.split(' ')
    var updated = false;
    for (item of items) {
        var match = true;
        for (k of keywords) {
            match = match && item.title.includes(k);
        }
        if (!match) {
            continue
        }
        updated = true;
        var actors = '';
        for (let actor of item.actors) {
            if (actor.includes('jp:')) {
                actors += actor.substring(3);
            }
        }
        search_results.push({
            thumbnail: item.preview, link: 'https://www.netflav.com/video?id=' + item.videoId, title: item.title,
            date: item.sourceDate.split('T')[0], actors: actors, views: item.views
        })
    }
    if (updated) {
        netflav_page = -netflav_page;
    }
}

function avgleUrl() {
    var url = "https://api.avgle.com/v1/search/" + keyword + "/" + avgle_page;
    avgle_page = -avgle_page - 1;
    return url
}

function avgleParse(data) {
    for (video of data.response.videos) {
        //video.embedded_url
        //video.video_url
        search_results.push({
            thumbnail: video.preview_url, link: video.embedded_url, title: video.title,
            duration: new Date(video.duration * 1000).toISOString().substr(11, 8),
            date: new Date(video.addtime * 1000).toISOString().substr(0, 10),
            likes: video.likes, views: video.viewnumber,
            preview: video.preview_video_url, keywords: video.keyword
        })
    }
    if (data.response.has_more) {
        avgle_page = -avgle_page;
    }
}

function seventvUrl(search_type) {
    // amateurjav, chinese, censored
    var url = 'https://7mmtv.tv/zh/' + search_type + '_search/all/' + keyword + '/' + seventv_page[search_type] + '.html';
    seventv_page[search_type] = -seventv_page[search_type] - 1;
    return url;
}

function seventvParse(result) {
    var domparser = new DOMParser();
    var doc = domparser.parseFromString(result, 'text/html');
    var videos = doc.querySelectorAll('.latest-korean-box-row')
    var count = 0;
    for (video of videos) {
        var v = video.querySelector('video');
        var thumbnail = null;
        var preview = null;
        if (v == null) {
            thumbnail = video.querySelector('.img-cover').src;
        } else {
            thumbnail = v.getAttribute('poster');
            preview = v.getAttribute('srcmv');
        }
        var link = video.querySelector('a').href;
        if (!count) {
            search_type = link.split('/')[4].split('_')[0];
        }
        count += 1;
        search_results.push({
            thumbnail: thumbnail, link: link, title: video.querySelector('h2').innerText,
            date: video.querySelector('.date-part').innerText.split(' ')[0],
            preview: preview
        })
    }
    if (count >= 20) {
        seventv_page[search_type] = -seventv_page[search_type]
    }
}

function hpjavUrl() {
    var url = 'https://hpjav.tv/tw/page/' + hpjav_page + '?s=' + keyword;
    hpjav_page = - hpjav_page - 1;
    return url;
}

function hpjavParse(result) {
    var domparser = new DOMParser();
    var doc = domparser.parseFromString(result, 'text/html');
    var videos = doc.querySelectorAll('.video-item')
    for (video of videos) {
        var title_elem = video.querySelector('.entry-title');
        search_results.push({
            thumbnail: video.querySelector('img').getAttribute('data-original'),
            link: video.querySelector('a').href, title: title_elem.firstChild.innerText,
            duration: title_elem.lastChild.textContent,
            views: video.querySelector('.model-view').innerText.split(' ')[0]
        })
    }
    if (videos.length >= 24) {
        hpjav_page = -hpjav_page;
    }
}

document.addEventListener('DOMContentLoaded', function () {

    keyword = decodeURIComponent(window.location.search.split('=').pop()).trim();
    document.querySelector('.search_edittext').value = keyword;

    document.onkeydown = function (e) {
        if (!e) e = window.event;
        if ((e.keyCode || e.which) == 13) {
            document.querySelector('.search_button').click()
        }
    }

    document.querySelector('.search_button').addEventListener('click', function () {
        var kw = document.querySelector('.search_edittext').value;
        if (kw.length > 0) {
            window.location.assign(chrome.extension.getURL("search.html") + '?keyword=' + encodeURIComponent(kw))
        }
    })

    if (keyword.length) {
        searchResults();
    }

});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.action == 'search_selected') {
            var kw = window.getSelection().toString().trim();
            if (kw.length > 0) {
                window.location.assign(chrome.extension.getURL("search.html") + '?keyword=' + encodeURIComponent(kw))
            }
        }
    }
)

