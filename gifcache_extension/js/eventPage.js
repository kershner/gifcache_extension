// Global colors to be used by various functions
var COLORS = ['#498FBD', '#ff6767', '#FFA533', '#585ec7', '#FF8359'];

chrome.contextMenus.create({
	title: 'Add to GifCache Staging Area',
	contexts: ['video', 'image'],
	onclick: function(info) {
		// checkUrl(info.srcUrl);
		var url = checkUrl(info.srcUrl);
		getImg(url, info.srcUrl);
	}
});

// Getting orignal URL from element's src attribute
// Imgur/Gfycat etc obfuscate their webm/mp4 files behind gifv/gfycat formats
function checkUrl(url) {
	var lastPeriod = url.lastIndexOf('.');
	var extension = url.slice(lastPeriod + 1, url.length);
	formattedUrl = '';
	if (extension === 'mp4' || extension === 'webm') {
		// Imgur URL
		if (url.indexOf('imgur') > -1) {
			formattedUrl = url.substr(0, lastPeriod) + '.gifv';
		// GfyCat URL
		} else if (url.indexOf('gfycat') > -1) {
			var lastForwardSlash = url.lastIndexOf('/');
			var gfyname = url.slice(lastForwardSlash + 1, lastPeriod);
			formattedUrl = 'gfycat.com/' + gfyname;
		} else {
			formattedUrl = url;
		}
	} else {
		formattedUrl = url;
	}
	return formattedUrl
}

function getImg(url, srcUrl) {
	chrome.storage.local.get(function(data) {
		var gifObject = {
			'url': url,
			'srcUrl': srcUrl,
			'label': '',
			'tags': ''
		}
		if (typeof(data['stagedGifs']) !== 'undefined' && data['stagedGifs'] instanceof Array) {
			data['stagedGifs'].push(gifObject);
		} else {
			data['stagedGifs'] = [gifObject];
		}
		chrome.storage.local.set(data, function() {
			console.log('Gif sent to staging area!');
		});
		if(data['stagedGifs']) {
			var randomnumber = (Math.random() * (COLORS.length) ) << 0;
			var total = data['stagedGifs'].length;
			chrome.browserAction.setBadgeBackgroundColor({color: COLORS[randomnumber]});
			chrome.browserAction.setBadgeText({text: total.toString()});
		}
	});
}