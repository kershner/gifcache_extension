$(document).ready(function() {
	getCookie();
});

// Global colors to be used by various functions
var COLORS = ['#25B972', '#498FBD', '#ff6767', '#FFA533', '#585ec7', '#FF8359'];
function getColorScheme() {
	var randomnumber = (Math.random() * (COLORS.length) ) << 0;
	var mainColor = COLORS[randomnumber];
	COLORS.splice(COLORS.indexOf(mainColor), 1);
	return mainColor;
}

// Checks if user is logged in or not, grabs cookies set by GifCache server
function getCookie() {
	chrome.cookies.get({url: 'http://www.gifcache.com', name: 'logged_in'}, function(cookie) {
		showInitialScreen(cookie);
		if (cookie === null) {
			// Nothing
		} else {
			chrome.cookies.get({url: 'http://www.gifcache.com', name: 'avatar'}, function(cookie) {
				addAvatar(cookie);
				return false;
			});
			chrome.cookies.get({url: 'http://www.gifcache.com', name: 'username'}, function(cookie) {
				addUsernameLink(cookie);
				return false;
			});
		}
		return false;
	});
}

// Determines which initial screen to show based on cookie
function showInitialScreen(loggedIn) {
	navLogo();
	var color = getColorScheme();
	$('body').css({'background-color': color});
	if (loggedIn === null) {
		$('.gifcache-container, .profile-info').remove();
		var html = '<a id="login-btn" href="http://www.gifcache.com/login"><div class="animate">Log In</div></a>';
		$('body').append(html);
		$('#login-btn').on('click', function() {
			chrome.tabs.create({url: $(this).attr('href')});
			return false;
		});
	} else {
		$('body').prepend('<a class="profile-info animate"></a>');
		$('.nav-logo-not-logged-in').removeClass('nav-logo-not-logged-in').addClass('nav-logo');
		checkStorage();
	}
}

// Colors small logo circle and fades in text
function navLogo() {
	var randomnumber = (Math.random() * (COLORS.length - 0 + 1) ) << 0;
	var counter = randomnumber;
	$('.nav-logo-circle').css('background-color', COLORS[counter]);
	setTimeout(function() {
		$('#gif').fadeIn(200, function() {
			$('#cache').fadeIn(200);
		});
	}, 50);
}

// Returns formatted URL for display and the HTML element required to display it
function formatUrl(url, srcUrl) {
	var url = url.replace(/['"]+/g, '');
	var lastPeriod = url.lastIndexOf('.');
	var extension = url.slice(lastPeriod + 1, url.length);
	var formattedUrl = '';
	var element = '';
	if (extension === 'gif') {
		formattedUrl = url;
		element = 'img';
	} else if (extension === 'gifv') {
		formattedUrl = url.substr(0, lastPeriod) + '.mp4';
		element = 'video';
	} else if (extension === 'mp4' || extension === 'webm') {
		formattedUrl = url;
		element = 'video';
	} else if (url.indexOf('gfycat') > -1) {
		formattedUrl = srcUrl;
		element = 'video';
	} else {
		formattedUrl = 'error';
		element = 'error';
	}
	return [formattedUrl, element];
}

function addAvatar(avatar) {
	var results = formatUrl(avatar.value);
	var url = results[0];
	var type = results[1];
	if (type === 'img') {
		var avatar = '<div class="avatar-wrapper"><img src=' + url + '></div>';
	} else if (type === 'video')  {
		var avatar = '<div class="avatar-wrapper"><video src="' + url + '" autoplay loop poster="http://www.gifcache.com/static/img/preload.gif"></video></div>';
	} else if (type === 'error') {
		var avatar = '<div class="avatar-wrapper"><img src="http://www.gifcache.com/static/img/default-user-image.png"></div>';
	}
	$('.profile-info').prepend(avatar);
}

// Adds link to user profile
function addUsernameLink(username) {
	$('.profile-info').attr('href', 'http://www.gifcache.com/u/' + username.value);
	var username = '<div class="username animate">' + username.value + '</div>';
	$('.profile-info').prepend(username);
	$('.profile-info').on('click', function() {
		chrome.tabs.create({url: $(this).attr('href')});
		return false;
	});
}

// Checks Chrome local storage, displays results or 'empty' message
function checkStorage() {
	chrome.storage.local.get('stagedGifs', function(data) {
		$('.submit-btn, .gifcache-container, .controls, .control-bar').remove();
		if (!data['stagedGifs'] || data['stagedGifs'].length < 1) {
			$('body').append('<div class="staging-empty">The staging area is currently empty.</div>');
			addControls();
		} else {
			$('.staging-empty').remove();
			$('body').append('<div class="gifcache-container"><div class="grid"></div></div>');
			for (i=0; i<data['stagedGifs'].length; i++) {
				var properties = {
					'url': data['stagedGifs'][i]['url'],
					'srcUrl': data['stagedGifs'][i]['srcUrl'],
					'label': data['stagedGifs'][i]['label'],
					'tags': data['stagedGifs'][i]['tags']
				}
				var html = createElement(properties);
				$('.grid').append(html);
			}
			var submitBtn = '<div class="btn green-btn submit-btn">Add to Cache!</div>';
			$('body').append(submitBtn);
			addControls();
			animateContainers();
			colorGifContainers();
			removeElements();
			editElements();
			submitElements();
			bulkOperations();
			visualIndicators();
			grid();
		}
		return false;
	});
}

function grid() {
	setTimeout(function() {
		var grid = $('.grid').isotope({
			itemSelector: '.staged-container',
			masonry: {
				columnWidth: 10,
				isFitWidth: true
			}
		});
	}, 100);
}

// Adds counter for number of staged GIFs
function addControls() {
	$('.controls').remove();
	var numContainers = $('.staged-container').length;
	if (numContainers) {
		var html = 	'<div class="controls btn grey-btn">Bulk</div>' +
					'<div class="control-bar hidden">' +
					'<i class="fa fa-times close-controls"></i>' +
					'<div class="select-options"><div class="select-all animate"><i class="fa fa-circle"></i>Select All</div>' +
					'<div class="select-none animate"><i class="fa fa-circle-o"></i>Select None</div></div>' +
					'<div class="bulk-btns"><div class="bulk-add-btn bulk-btn btn green-btn">Add Tags</div>'  +
					'<div class="bulk-remove-btn bulk-btn btn blue-btn">Remove Tags</div><div class="bulk-delete-btn bulk-btn btn red-btn">Delete GIFs</div></div>' +
					'<div class="bulk-add-tags bulk-control hidden"><div class="bulk-control-title">Add Tags</div><input type="text" placeholder="Comma seperated tags"><div class="btn green-btn">Submit</div></div>' +
					'<div class="bulk-remove-tags bulk-control hidden"><div class="bulk-control-title">Remove Tags</div><div class="btn blue-btn">Submit</div></div>' +
					'<div class="bulk-delete bulk-control hidden"><div class="bulk-control-title">Delete GIFs</div><div class="btn red-btn">Submit</div></div>' +
					'</div>';
		$('body').prepend(html);
		chrome.browserAction.setBadgeText({text: numContainers.toString()});
	} else {
		chrome.browserAction.setBadgeText({text: ''});
	}
}

// One-by-one fadeIn of .staged-container elements
function animateContainers() {
	var containers = $('.gifcache-container').find('.staged-container');
	var index = 0;
	var length = containers.length;
	var timer = setInterval(containerFadeIn, 50);
	function containerFadeIn() {
		containers.eq(index).animate({'opacity': 1.0}, 50);
		index += 1;
		if (index >= length) {
			clearInterval(timer);
		}
	}
}

// Creates the individual HTML elements for staged GIFs
function createElement(data) {
	var results = formatUrl(data['url'], data['srcUrl']);
	var newUrl = results[0];
	console.log(newUrl);
	if (newUrl.indexOf('gfycat') > -1) {
		newUrl = data['srcUrl'];
	}
	var type = results[1];
	if (type === 'img') {
		var element = '<img src=' + newUrl + '>';
	} else if (type === 'video')  {
		var element = '<video src="' + newUrl + '" autoplay loop poster="http://www.gifcache.com/static/img/preload.gif"></video>';
	} else if (type === 'error') {
		var element = '<div class="not-a-gif">Not a GIF!</div>';
	}
	var html = 	'<div class="staged-container staged-container-small animate">' +
				'<div class="bulk-wrapper hidden"><i class="fa fa-circle-o bulk-icon"></i></div>' +
				'<i class="fa fa-times delete-image animate"></i>' +
				'<div class="img-wrapper">' + element +
				'</div><input class="label hidden" type="text" placeholder="Label" value="' + data['label'] + '">' +
				'<input class="tags hidden" type="text" placeholder="Comma seperated tags" value="' + data['tags'] + '">' +
				'<div class="hidden-icon label-icon hidden"><i class="fa fa-ticket"></i></div>' +
				'<div class="hidden-icon tags-icon hidden"><i class="fa fa-tags"></i></div>' +
				'<input type="text" class="hidden-url hidden" value="' + data['url'] + '">' +
				'</div>';
	return html
}

//  Picks random background color for staged GIF elements
function colorGifContainers() {
	var randomnumber = (Math.random() * (COLORS.length - 0 + 1) ) << 0;
	var counter = randomnumber;
	$('.staged-container').each(function() {
		if (counter > COLORS.length - 1 ) {
			counter = 0;
		}
		$(this).css('background-color', COLORS[counter]);
		counter += 1
	});
}

function removeElements() {
	$('.delete-image').on('click', function() {
		var url = $(this).parent().find('.hidden-url').val();
		// Finding the index of the URL in Chrome local storage array
		chrome.storage.local.get('stagedGifs', function(data) {
			for (i=0; i<data['stagedGifs'].length; i++) {
				if (data['stagedGifs'][i]['url'] === url) {
					// Splicing index from array and re-setting the Chrome local storage array
					data['stagedGifs'].splice(i, 1);
					chrome.storage.local.set(data, function() {
						// Updating popup
						checkStorage();
					});
				}
			}
			return false;
		});
	});
}

// Pops up fields to add tags/label when clicked
function editElements() {
	$('.staged-container').on('click', function(e) {
		var target = $(e.target);
		if (target.is('.label, .tags, .hidden-url, .bulk-wrapper')) {
			// Nothing
		} else {
			$(this).toggleClass('staged-container-expanded');
			$(this).toggleClass('staged-container-small');
			$(this).children('.label, .tags').toggleClass('hidden');
			$(this).children('.delete-image').toggleClass('delete-expanded');
		}
	});
	$('.label, .tags').focusout(function() {
		updateStagedObjects();
		visualIndicators();
	});
}

// Adds small icon to staged-container if label/tags present
function visualIndicators() {
	$('.staged-container').each(function() {
		var label = $(this).find('.label').val();
		var tags = $(this).find('.tags').val();
		if (label !== '') {
			$(this).find('.label-icon').removeClass('hidden');
		} else {
			$(this).find('.label-icon').addClass('hidden');
		}
		if (tags !== '') {
			$(this).find('.tags-icon').removeClass('hidden');
		} else {
			$(this).find('.tags-icon').addClass('hidden');
		}
	});
}

// Re-creates array of staged objects in Chrome local storage
function updateStagedObjects() {
	chrome.storage.local.remove('stagedGifs', function() {
		chrome.storage.local.get(function(data) {
			var objects = [];
			$('.staged-container').each(function() {
				var url = $(this).find('.hidden-url').val();
				var label = $(this).find('.label').val();
				var tags = $(this).find('.tags').val();
				// If video element, update with the 'src' attribute instead of 'url' attribute
				if ($(this).children('video')) {
					srcUrl = $(this).find('video').attr('src');
				} else {
					srcUrl = url;
				}
				var gifObject = {
					'url': url,
					'srcUrl': srcUrl,
					'label': label,
					'tags': tags
				}
				objects.push(gifObject);
			});
			data['stagedGifs'] = objects;
			chrome.storage.local.set(data, function() {
				console.log('Gif objects updated in local storage!');
				return false;
			});
		});
		return false;
	});
	return false;
}

// Grabs inputs from each GIF, send to AJAX function
function submitElements() {
	$('.submit-btn').on('click', function() {
		var finalValues = '';
		$('.staged-container').each(function() {
			var url = $(this).children('.hidden-url').val();
			var label = $(this).children('.label').val();
			var tags = $(this).children('.tags').val();
			var values = url + '*' + label + '*' + tags;
			finalValues += values + '|';
		});
		submitAjax(finalValues);
	});
}

// Handles clicking on bulk operation buttons/displaying menus
function bulkOperations() {
	$('.controls').on('click', function() {
		$(this).toggleClass('grey-btn-selected');
		$('.control-bar').toggleClass('hidden');
		$('.staged-container').each(function() {
			$(this).find('.bulk-wrapper').toggleClass('hidden');
		});
	});
	$('.close-controls').on('click', function() {
		$('.controls').toggleClass('grey-btn-selected');
		$('.control-bar').toggleClass('hidden');
		$('.staged-container').each(function() {
			$(this).find('.bulk-wrapper').toggleClass('hidden');
		});
	});
	$('.bulk-wrapper').on('click', function() {
		var isSelected = $(this).find('.bulk-icon').hasClass('fa-circle');
		if (isSelected) {
			$(this).find('.bulk-icon').removeClass('fa-circle');
			$(this).find('.bulk-icon').addClass('fa-circle-o');
		} else {
			$(this).find('.bulk-icon').removeClass('fa-circle-o');
			$(this).find('.bulk-icon').addClass('fa-circle');
		}
	});
	$('.select-all').on('click', function() {
		$('.staged-container').each(function() {
			$(this).find('.bulk-icon').removeClass('fa-circle-o');
			$(this).find('.bulk-icon').addClass('fa-circle');
		});
	});
	$('.select-none').on('click', function() {
		$('.staged-container').each(function() {
			$(this).find('.bulk-icon').removeClass('fa-circle');
			$(this).find('.bulk-icon').addClass('fa-circle-o');
		});
	});
	$('.bulk-add-btn').on('click', function() {
		$(this).toggleClass('green-btn-selected');
		$('.bulk-add-tags').toggleClass('hidden');
		$('.bulk-add-tags .btn').on('click', function() {
			bulkAddTags();
		});
	});
	$('.bulk-remove-btn').on('click', function() {
		$(this).toggleClass('blue-btn-selected');
		$('.bulk-remove-tags').toggleClass('hidden');
		$('.bulk-remove-tags .btn').on('click', function() {
			bulkRemoveTags();
		});
	});
	$('.bulk-delete-btn').on('click', function() {
		$(this).toggleClass('red-btn-selected');
		$('.bulk-delete').toggleClass('hidden');
		$('.bulk-delete .btn').on('click', function() {
			bulkDelete();
		});
	});
}

function bulkAddTags() {
	var objects = [];
	var tags = $('.bulk-add-tags input').val();
	$('.staged-container').each(function() {
		var selected = $(this).find('.bulk-icon').hasClass('fa-circle');
		if (selected) {
			var url = $(this).find('.hidden-url').val();
			var label = $(this).find('.label').val();
			var tags = $(this).find('.tags').val();
			var properties = {
				'url': url,
				'label': label,
				'tags': tags
			}
			objects.push(properties);
		}
	});
	// Finding the index of the URL in Chrome local storage array
	chrome.storage.local.get('stagedGifs', function(data) {
		for (i=0; i<objects.length; i++) {
			for (j=0; j<data['stagedGifs'].length; j++) {
				if (objects[i]['url'] === data['stagedGifs'][j]['url']) {
					data['stagedGifs'][j]['tags'] = tags;
				}
			}
		}
		chrome.storage.local.set(data, function() {
			// Updating popup
			checkStorage();
			return false;
		});
		return false;
	});
}

function bulkRemoveTags() {
	var urls = [];
	$('.staged-container').each(function() {
		var selected = $(this).find('.bulk-icon').hasClass('fa-circle');
		if (selected) {
			var url = $(this).find('.hidden-url').val();
			urls.push(url);
		}
	});
	// Finding the index of the URL in Chrome local storage array
	chrome.storage.local.get('stagedGifs', function(data) {
		for (i=0; i<urls.length; i++) {
			for (j=0; j<data['stagedGifs'].length; j++) {
				if (urls[i] === data['stagedGifs'][j]['url']) {
					data['stagedGifs'][j]['tags'] = '';
				}
			}
		}
		chrome.storage.local.set(data, function() {
			// Updating popup
			checkStorage();
			return false;
		});
		return false;
	});
}

function bulkDelete() {
	var urls = [];
	$('.staged-container').each(function() {
		var selected = $(this).find('.bulk-icon').hasClass('fa-circle');
		if (selected) {
			var url = $(this).find('.hidden-url').val();
			urls.push(url);
		}
	});
	// Finding the index of the URL in Chrome local storage array
	chrome.storage.local.get('stagedGifs', function(data) {
		for (i=0; i<urls.length; i++) {
			for (j=0; j<data['stagedGifs'].length; j++) {
				if (urls[i] === data['stagedGifs'][j]['url']) {
					data['stagedGifs'].splice(j, 1);
				}
			}
		}
		chrome.storage.local.set(data, function() {
			// Updating popup
			checkStorage();
			return false;
		});
		return false;
	});
}

// Handles the AJAX call to the Gifcache.com server
function submitAjax(values) {
	chrome.cookies.get({url: 'http://www.gifcache.com', name: 'user_id'}, function(cookie) {
		loadingScreen();
		$.ajax({
			url: 'http://www.gifcache.com/u/bulk-add-gifs/',
			type: 'POST',
			data: {
				'values': values,
				'user_id': cookie['value']
			},
			success: function(json) {
				chrome.storage.local.remove('stagedGifs', function() {
					$('.loading-wrapper').remove();
					var msg = 'Gifs succesfully added to your Cache!';
					notification(msg);
				});
			},
			error: function(xhr, errmsg, err) {
				console.log('Error!');
				console.log(errmsg);
				console.log(xhr.status + ': ' + xhr.responseText);
			}
		});
	});
}

// Loading animation
function loadingScreen() {
	var randomnumber = (Math.random() * (COLORS.length - 0 + 1) ) << 0;
	var html =	'<div class="loading-wrapper"><div class="loading">' +
				'<i class="fa fa-spinner fa-pulse"></i>Processing, one moment please...</div></div>';
	$('.loading i').css('color', COLORS[randomnumber]);
	$('body').append(html);
}

// Re-usable notification function
function notification(msg) {
	var html = '<div class="notification-wrapper"><div class="notification">' + msg + '</div></div>';
	$('body').append(html);
	setTimeout(function() {
		$('.notification-wrapper').fadeOut('slow', function() {
			$('.gifcache-container').empty();
			checkStorage();
			$('.notification-wrapper').remove();
		})
	}, 3000);
}