jwplayer.key = "P9VTqT/X6TSP4gi/hy1wy23BivBhjdzVjMeOaQ==";

var sources = []

function setUpSources(sourceId) {

    for (let i = 0; i < sources.length; i++) {
        var s = sources[i];
        if (typeof (s) == 'string' || s instanceof String) {
            s = [s];
        }
        if (s.name == undefined) {
            var name = 'unknown';
            if (s[0].includes('avgle')) {
                name = 'avgle';
            } else if (s[0].includes('jpvideo.live') || s[0].includes('avple.video') || s[0].includes('fembed') || s[0].includes('mm9841.com')) {
                name = 'fembed';
            } else if (s[0].includes('verystream')) {
                name = 'verystream';
            } else if (s[0].includes('bestjavporn')) {
                name = 'bestjavporn';
            }
            sources[i] = { name: name, sources: s, ready: 0 };

            var btn = document.createElement('button');
            btn.innerHTML = name;
            btn.onclick = function () {
                setUpSources(i);
            }
            btn.className = 'mybutton';
            document.querySelector('#buttongroup').appendChild(btn);
        }
    }

    for (let btn of document.querySelectorAll("button")) {
        btn.disabled = true;
    }

    sourceId = (sourceId == undefined) ? 0 : sourceId;

    if (sourceId < sources.length) {
        var s = sources[sourceId];

        if (!s.ready) {
            for (let i = 0; i < s.sources.length; i++) {

                function updateSource(ii) {
                    return function (ps) {
                        s.sources[ii] = ps;
                        s.ready += 1;
                        return s;
                    }
                }

                if (s.name == 'bestjavporn') {
                    fetch('https:' + s.sources[i]).then(r => r.text()).then(bestjavpornParseSource).then(updateSource(i)).then(loadSource)
                } else if (s.name == 'fembed') {
                    fetch(s.sources[i].replace('/v/', '/api/source/'), { method: 'POST' }).then(r => r.json()).then(fembedParseSource).then(updateSource(i)).then(loadSource)
                } else if (s.name == 'verystream') {
                    fetch(s.sources[i]).then(r => r.text()).then(verystreamParseSource).then(updateSource(i)).then(loadSource);
                } else if (s.name == 'avgle') {
                    s.ready += 1;
                    loadSource(s)
                } else {
                    console.log('unknown source')
                    console.log(s);
                    s.ready += 1;
                    loadSource(s)
                }
            }
        } else {
            loadSource(s)
        }
    }
}

function loadSource(s) {
    if (s.ready < s.sources.length) {
        return;
    }
    for (var btn of document.querySelectorAll("button")) {
        btn.disabled = false;
    }
    if (s.name == 'avgle') {
        if (jwplayer().id != undefined) {
            jwplayer().remove()
        }
        document.querySelector('#moviecontainer').innerHTML = '<iframe src="' + s.sources[0] + '" id="playeriframe" frameborder="0" width="800" height="600" scrolling="no" allowfullscreen></iframe>';
    } else {
        if (jwplayer().id == undefined) {
            document.querySelector('#moviecontainer').innerHTML = ""
            //setup_jw(null)
            setup_jw(s.sources)
        } else {
            jwplayer().load(s.sources)
        }
    }
}

function bestjavpornParse(html) {
    var domparser = new DOMParser()
    var doc = domparser.parseFromString(html, 'text/html')
    var box = doc.querySelector('.box-server')
    if (box != null) {
        box.querySelectorAll('span').forEach(function (v, k, p) {
            sources.push(v.getAttribute('data-link'))
        })
    }
    else {
        sources.push(html.match(/jQuery\("\.responsive-player"\)\.append\('<iframe src="(.*?)" /)[1])
    }
    console.log(sources)
}

function bestjavpornParseSource(html) {
    var n = html.lastIndexOf("sources");
    var a = html.indexOf('[', n);
    var b = html.indexOf(']', n);
    var txt = html.substring(a, b - 1).replace(/file/g, '"file"').replace(/label/g, '"label"') + ']';
    return { sources: JSON.parse(txt) }
}

function iframeParse(html) {
    var domparser = new DOMParser()
    var doc = domparser.parseFromString(html, 'text/html')
    sources.push(doc.querySelector('iframe').src)
}

function fembedParseSource(data) {
    return { sources: data.data };
}

function verystreamParseSource(html) {
    var domparser = new DOMParser()
    var doc = domparser.parseFromString(html, 'text/html')
    return {
        sources: [{
            file: "https://verystream.com/gettoken/" + doc.querySelector('#videolink').innerHTML + "?download=false",
            label: 'sd', type: 'mp4'
        }]
    };
}

function seventvParse(html) {
    var domparser = new DOMParser()
    var doc = domparser.parseFromString(html, 'text/html')
    var scripts = doc.querySelector('.video-introduction-row').querySelectorAll('script');
    var mvarr = eval(scripts[0].innerText + scripts[1].innerText.substring(0, scripts[1].innerText.lastIndexOf('}') + 1) + 'mvarr;');
    for (var k in mvarr) {
        if (k == '21_1' || k == '17_1' || k == '23_1') {
            doc = domparser.parseFromString(mvarr[k], 'text/html');
            var s = [];
            for (iframe of doc.querySelectorAll('iframe')) {
                s.push(iframe.src)
            }
            sources.push(s)
        } else {
            console.log('unknown 7tv source: ' + k);
        }
    }
}

function hpjavParse(results){
    for (let i=0; i < results.length; i++){
        let hex = results[i].split('=').pop(), bytes = [], str; 
        hex = hex.split("").reverse().join("")
        for (let i = 0; i < hex.length - 1; i += 2) { 
            bytes.push(parseInt(hex.substr(i, 2), 16)) 
        }; 
        str = String.fromCharCode.apply(String, bytes);
        hex = atob(str)
        results[i] = "https://verystream.com/stream/" + hex;
    }
    sources.push(results);
}

chrome.webRequest.onBeforeRequest.addListener(
    function(details){
        var req = new XMLHttpRequest();
        req.open('GET', details.url, false);
        req.send(null);
        var data = req.responseText;
        var idx = data.indexOf("':if(!window[_") + 2;
        data = ";document.addEventListener('DOMContentLoaded', function(){console.log('123');closeAd()});" + data.slice(0, idx) + 'return false;' + data.slice(idx);
        return {redirectUrl: "data:," + encodeURIComponent(data)};
    },
    {
        urls: ['https://avgle.com/templates/frontend/avgle-main-ah.js*'],
    },
    ['blocking']
)

document.addEventListener('DOMContentLoaded', function () {
    var url = decodeURIComponent(window.location.search.split('=').pop());
    if (url.includes('bestjavporn.com')) {
        fetch(url).then(r => r.text()).then(bestjavpornParse).then(setUpSources)
    } else if (url.includes('javopen.co') || url.includes('netflav.com')) {
        fetch(url).then(r => r.text()).then(iframeParse).then(setUpSources)
    } else if (url.includes('7mmtv.tv')) {
        fetch(url).then(r => r.text()).then(seventvParse).then(setUpSources)
    } else if (url.includes('avgle.com/embed')) {
        sources.push(url)
        setUpSources()
    } else if (url.includes('hpjav')){
        chrome.tabs.create({url:url, active:false}, function(tab){
            chrome.tabs.executeScript(tab.id, {file:'injecthpjav.js', runAt:'document_idle'}, function(results){
                chrome.tabs.remove(tab.id);
                hpjavParse(results[0]);
                setUpSources()
            })
        })
        //document.querySelector('#moviecontainer').innerHTML = '<iframe src="' + url + '" id="playeriframe" frameborder="0" width="800" height="600" scrolling="yes" allowfullscreen></iframe>';
    } else {
        console.log('unknown url: ' + url);
    }
});

function setup_jw(pl) {

    if(pl == null){
        pl = [{
            sources:[{file:'https://hanime.tv/api/v1/m3u8s/28509.m3u8'}]
        }]
    }

    jwplayer("moviecontainer").setup({
        flashplayer: "{{ url_for('static', filename='jwplayer/jwplayer.flash.swf') }}",
        playlist: pl,
        modes: [{ type: "html5" }, { type: "flash", src: "{{ url_for('static', filename='jwplayer/jwplayer.flash.swf') }}" },
        { type: "download" }],
        skin: { name: "stormtrooper" },
        "playlist.position": "left",
        "playlist.size": 400,
        height: 600,
        width: 800,
    });
}