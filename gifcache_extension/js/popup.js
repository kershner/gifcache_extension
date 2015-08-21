$(document).ready(function() {	
	getCookie();	
});

// Global colors to be used by various functions
var COLORS = ['#498FBD', '#ff6767', '#FFA533', '#585ec7', '#FF8359'];

// Grabs cookie set by GifCache server - checks if user is logged in or not
function getCookie() {
	chrome.cookies.get({url: 'http://www.gifcache.com', name: 'logged_in'}, function(cookie) {		
		showInitialScreen(cookie);
		if (cookie === null) {
			// Nothing
		} else {
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
	if (loggedIn === null) {
		$('.gifcache-container').remove();
		var html = '<a id="login-btn" href="http://www.gifcache.com/login"><div class="btn red-btn">Please Log In</div></a>';
		$('body').append(html);
		$('#login-btn').on('click', function() {
			chrome.tabs.create({url: $(this).attr('href')});
			return false;
		});
	} else {
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

// Adds link to username profile
function addUsernameLink(username) {
	var username = '<a class="username animate" href="http://www.gifcache.com/u/' + username.value + '">' + username.value + '</a>';
	$('body').prepend(username);
	$('.username').on('click', function() {
		chrome.tabs.create({url: $(this).attr('href')});
		return false;
	});
}

// Checks Chrome local storage, displays results or 'empty' message
function checkStorage() {	
	chrome.storage.local.get('urls', function(data) {
		$('.submit-btn, .gifcache-container').remove();
		if (!data['urls'] || data['urls'].length < 1) {
			$('body').append('<div class="staging-empty">The staging area is currently empty.</div>');
			gifCounter();
		} else {
			$('.staging-empty').remove();
			$('body').append('<div class="gifcache-container"></div>');
			for (i=0; i<data['urls'].length; i++) {
				var html = createElement(data['urls'][i]);
				$('.gifcache-container').append(html);
			}			
			var submitBtn = '<div class="btn blue-btn submit-btn">Add to Cache!</div>';
			$('body').append(submitBtn);
			gifCounter();
			animateContainers();
			colorGifContainers();
			removeElements();
			editElements();
			submitElements();
		}
		return false;
	});
}

// Adds counter for number of staged GIFs
function gifCounter() {
	$('.staged-gifs-number').remove();
	var randomnumber = (Math.random() * (COLORS.length - 0 + 1) ) << 0;
	var numContainers = $('.staged-container').length;
	if (numContainers) {
		var html = '<div class="staged-gifs-number"><div class="number"></div><div class="blurb">Staged GIFs</div></div>';
		$('body').prepend(html);
		$('.number').text(numContainers).css('color', COLORS[randomnumber]);
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
function createElement(url) {
	var lastPeriod = url.lastIndexOf('.');
	var extension = url.slice(lastPeriod + 1, url.length);
	if (extension === 'gif') {
		var element = '<img src="' + url + '">';
	} else if (extension === 'gifv') {
		newUrl = url.substring(0, lastPeriod) + '.mp4';
		var element = '<video src="' + newUrl + '" autoplay loop poster="http://www.gifcache.com/static/img/preload.gif"></video>';
	} else if (extension === 'webm' || extension === 'mp4') {
		var element = '<video src="' + url + '" autoplay loop poster="http://www.gifcache.com/static/img/preload.gif"></video>';	
	} else {
		var element = '<div class="not-a-gif">Not a GIF file!</div>';
	}
	var html = 	'<div class="staged-container staged-container-small animate">' +
				'<i class="fa fa-times delete-image animate"></i>' + 
				'<div class="img-wrapper">' + element + 
				'</div><input class="label hidden" type="text" placeholder="Label">' +
				'<input class="tags hidden" type="text" placeholder="Comma seperated tags">' +
				'<input type="text" class="hidden-url hidden" value="' + url + '">' +
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
		chrome.storage.local.get('urls', function(data) {
			for (i=0; i<data['urls'].length; i++) {
				if (data['urls'][i] === url) {					
					// Splicing index from array and re-setting the Chrome local storage array
					data['urls'].splice(i, 1);
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
		if (target.is('.label, .tags, .hidden-url')) {
			// Nothing
		} else {
			$(this).toggleClass('staged-container-expanded');
			$(this).toggleClass('staged-container-small');
			$(this).children('.label, .tags').toggleClass('hidden');
			$(this).children('.delete-image').toggleClass('delete-expanded');
		}
	});
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
				chrome.storage.local.remove('urls', function() {
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