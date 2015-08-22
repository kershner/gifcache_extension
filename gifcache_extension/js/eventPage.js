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
		if (typeof(data['urls']) !== 'undefined' && data['urls'] instanceof Array) {
			data['urls'].push(url);
		} else {
			data['urls'] = [url];
		}
		chrome.storage.local.set(data, function() {
			console.log('URL sent to staging area!');
		});
		if(data['urls']) {
			var randomnumber = (Math.random() * (COLORS.length - 0 + 1) ) << 0;
			var total = data['urls'].length;
			chrome.browserAction.setBadgeBackgroundColor({color: COLORS[randomnumber]});
			chrome.browserAction.setBadgeText({text: total.toString()});
		}
	});
}