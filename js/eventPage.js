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
	});
}