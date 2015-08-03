function pasted(channelId) {
	var parentdiv = document.getElementById("playlists");
	parentdiv.innerHTML = "<div id='playlist' name='playlist'></div>";
	setTimeout(function() {
		getPlaylistsFromChannelId(channelId.value);
	}, 0);
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
		var entries = [];
		var numberOfPlaylists = response.pageInfo.totalResults;
		if(numberOfPlaylists == 0) {
			div.innerHTML = "No public playlists";
		}
		for (var i=0; i<numberOfPlaylists-1; i++) {
			document.getElementById("playlists").appendChild(div.cloneNode(true));
		}
		$.each(response.items, function(key, val) {
			console.log(key);
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
			var video_id = val.snippet.resourceId.videoId;
			entry.video_id = video_id;
			entry.image_src = val.snippet.thumbnails.medium.url;
			var title = val.snippet.title;
			entry.title = title;
			entries.push(entry);
		});
		window[player_id] = new YouTubePlayList(player_id, entries, playlistTitle);
		var playListPlayer = $.templates("#playListPlayerTemplate");
		//$('#playlist').html($('#playListPlayerTemplate').render(window[player_id]));
		document.getElementsByName("playlist")[key].innerHTML = $('#playListPlayerTemplate').render(window[player_id]);
	});
}

function cueThisVideo(player_id, video_id, time) {
	time = time || 0;
	var currently_playing_video_id = window[player_id].getCurrentlyPlaying();
	window[player_id].setCurrentlyPlaying(video_id);
	loadVideoForPlayer(currently_playing_video_id, player_id, time);
}

function onYouTubePlayerReady(playerApiId) {
	var player = document.getElementById(playerApiId);
	window["onStateChange" + playerApiId] = function(state) {
		switch(state) {
			case 0: 
				loadNextVideo(playerApiId);
				break;
		}
	};
	player.addEventListener("onStateChange", "onStateChange" + playerApiId);
}	

function loadNextVideo(player_id) {
	var currently_playing_video_id = window[player_id].getCurrentlyPlaying();
	if(window[player_id].next()) {
		loadVideoForPlayer(currently_playing_video_id, player_id);
	}
}

function loadVideoForPlayer(currently_playing_video_id, player_id, time) {
	time = time || 0;
	var video_id = window[player_id].getCurrentlyPlaying();
	$('#' + currently_playing_video_id).removeClass('nowPlaying')
		$('#' + video_id).addClass('nowPlaying');
	document.getElementById(player_id).loadVideoById(video_id, time, "large");
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
