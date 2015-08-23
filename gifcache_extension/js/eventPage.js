// Global colors to be used by various functions
var COLORS = ['#498FBD', '#ff6767', '#FFA533', '#585ec7', '#FF8359'];

chrome.contextMenus.create({
	title: 'Add to GifCache Staging Area',
	contexts: ['video', 'image'],
	onclick: function(info) {
		getImg(info.srcUrl);
	}
});

function getImg(url) {
	chrome.storage.local.get(function(data) {
		var gifObject = {
			'url': url,
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
			var randomnumber = (Math.random() * (COLORS.length - 0 + 1) ) << 0;
			var total = data['stagedGifs'].length;
			chrome.browserAction.setBadgeBackgroundColor({color: COLORS[randomnumber]});
			chrome.browserAction.setBadgeText({text: total.toString()});
		}
	});
}