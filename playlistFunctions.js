function pasted(channelId) {
	var tag = document.createElement('script');
	tag.src = "https://www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	var parentdiv = document.getElementById("playlists");
	parentdiv.innerHTML = "<div id='playlist' name='playlist'></div>";
	setTimeout(function() {
		$('.pre-auth').hide();
		getPlaylistsFromChannelId(channelId.value);
	}, 0);

}
function handleAPILoaded() {
	getPlaylists();
}

function getPlaylistsFromChannelId(channelId) {
	var div = document.getElementById("playlist");
	var requestOptions = {
		channelId: channelId,
		part: 'snippet',
		maxResults: 50
	};
	var request = gapi.client.youtube.playlists.list(requestOptions);
	request.execute(function(response) {
		if(response.error) {
			document.getElementById("playlists").innerHTML = '<p class="errorMessage">Incorrect channel ID or No public playlists</p>';
			setTimeout(function() {
				$('.pre-auth').show();
			}, 5000);
		}
		var entries = [];
		var numberOfPlaylists = response.pageInfo.totalResults;
		for (var i=0; i<numberOfPlaylists-1; i++) {
			document.getElementById("playlists").appendChild(div.cloneNode(true));
		}
		$.each(response.items, function(key, val) {
			var entry = {};
			var playlistId = val.id;
			var playlistTitle = val.snippet.title;
			addPlaylistToElement(playlistId, playlistTitle, key);
		});
	});
}
function getPlaylists() {
	var div = document.getElementById("playlist");
	var requestOptions = {
		mine: true,
		part: 'snippet',
		maxResults: 50
	};
	var request = gapi.client.youtube.playlists.list(requestOptions);
	request.execute(function(response) {
		var entries = [];
		var numberOfPlaylists = response.pageInfo.totalResults;
		if(numberOfPlaylists == 0) {
			div.innerHTML = "No public playlists";
		}
		for (var i=0; i<numberOfPlaylists-1; i++) {
			document.getElementById("playlists").appendChild(div.cloneNode(true));
		}
		$.each(response.items, function(key, val) {
			var entry = {};
			var playlistId = val.id;
			var playlistTitle = val.snippet.title;
			addPlaylistToElement(playlistId, playlistTitle, key);
		});
	});
}
function addPlaylistToElement(playlist_id, playlistTitle, key) {
	var player_id = playlist_id;
	var requestOptions = {
		playlistId: playlist_id,
		part: 'snippet',
		maxResults: 50
	};
	var request = gapi.client.youtube.playlistItems.list(requestOptions);
	request.execute(function(response) {
		var entries = [];
		$.each(response.items, function(key, val) {
			var entry = {};
			video_id = val.snippet.resourceId.videoId;
			entry.video_id = video_id;
			entry.image_src = val.snippet.thumbnails.medium.url;
			var title = val.snippet.title;
			entry.title = title;
			entries.push(entry);
		});
		window[player_id] = new YouTubePlayList(player_id, entries, playlistTitle);
		var playListPlayer = $.templates("#playListPlayerTemplate");
		document.getElementsByName("playlist")[key].innerHTML = $('#playListPlayerTemplate').render(window[player_id]);
		initVideoPlayer(playlist_id, entries[0].video_id);
	});
}
var player = {};
function initVideoPlayer(playlist_id, video_id) {
	window.player[playlist_id] = new YT.Player(playlist_id, {
		width: '270',
		height: '360',
		videoId: video_id,
		playerVars: {
			playlist: playlist_id,
			controls: 2,
			cc_load_policy: 0,
			fs: 0,
			iv_load_policy: 3,
			enablejsapi: 1,
		},
		events: {
			'onReady': onReady
		}
	});
	function onReady() {
		player[playlist_id].addEventListener('onStateChange', function(e) {
			if(e.data == 0) {
				loadNextVideo(playlist_id);
			}
		})
	}
}

function onYouTubeIframeAPIReady() { 
}

function cueThisVideo(player_id, video_id, time) {
	time = time || 0;
	var currently_playing_video_id = window[player_id].getCurrentlyPlaying();
	window[player_id].setCurrentlyPlaying(video_id);
	loadVideoForPlayer(currently_playing_video_id, player_id, time);
}

function loadNextVideo(player_id) {
	var currently_playing_video_id = window[player_id].getCurrentlyPlaying();
	if(window[player_id].next()) {
		loadVideoForPlayer(currently_playing_video_id, player_id);
	}
}
function loadPreviousVideo(player_id) {
	var currently_playing_video_id = window[player_id].getCurrentlyPlaying();
	if(window[player_id].previous()) {
		loadVideoForPlayer(currently_playing_video_id, player_id);
	}
}

function loadVideoForPlayer(currently_playing_video_id, player_id, time) {
	time = time || 0;
	var video_id = window[player_id].getCurrentlyPlaying();
	$('#' + currently_playing_video_id).removeClass('nowPlaying');
		$('#' + video_id).addClass('nowPlaying');
	//document.getElementById(player_id).loadVideoById(video_id, time, "large");
	player[player_id].loadVideoById(video_id, time, "medium");
	arrangePlayerControls(player_id);
}

function arrangePlayerControls(player_id) {
	var playListPlayer = $('#' + player_id + 'playListPlayer');
	if(window[player_id].isRandomized()) {
		$('#' + player_id + 'Backward').addClass('disabled');
		$('#' + player_id + 'Forward').removeClass('disabled');
		$('#' + player_id + 'Random').addClass('randomizeActive');
	}
	else {
		$('#' + player_id + 'Random').removeClass('randomizeActive');
		var playListEntries = $('#' + player_id + 'playListEntries');
		if(playListEntries.children(":first").hasClass('nowPlaying')) {
			$('#' + player_id + 'Backward').addClass('disabled');
		}
		else {
			$('#' + player_id + 'Backward').removeClass('disabled');
		}
		if(playListEntries.children(":last").hasClass('nowPlaying')) {
			$('#' + player_id + 'Forward').addClass('disabled');
		}
		else {
			$('#' + player_id + 'Forward').removeClass('disabled');
		}
	}
}

