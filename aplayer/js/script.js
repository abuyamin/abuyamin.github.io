$(document).ready(function(){
  window.AP = new Object();
  // Check for the various File API support.
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
  } else {
    alert("The File APIs are not fully supported in this browser.");
  }

  // convert millisecond duration into minute and second
  window.secsToHours = function(seconds){
    var minutes = Math.floor(seconds / 60);
    seconds = (seconds % 60).toFixed(0);
    if(minutes>60){
      var hr = Math.floor(minutes / 60);
      var m = (minutes % 60).toFixed(0);
      minutes = hr + ":" + (m < 10 ? "0" : "") + m;
    }
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  };

  // shuffle array
  window.shuffle = function (array) {
    let counter = array.length;

    // While there are elements in the array
    var index, temp;
    while (counter > 0) {
      // Pick a random index
      index = Math.floor(Math.random() * counter);
      // Decrease counter by 1
      counter--;
      // And swap the last element with it
      temp = array[counter];
      array[counter] = array[index];
      array[index] = temp;
    }
    return array;
  };

  // Arreay generation
  window.Array.range = (start, end) => Array.from({length: (end - start)}, (v, k) => k + start);
  window.sortNumber = function(a,b) {
    return a - b;
  };

  // load input file and start processing it
  function HandleFileSelect(){
    var file = this.files[0];

    var reader = new FileReader();
    reader.onload = function(progressEvent){
      // text the input file
      xmlLoad(this.result);
    };
    reader.readAsText(file);
  };

  function xmlLoad(file){
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(file,"text/xml");

    var trackList = xmlDoc.querySelectorAll("trackList > track");

    // load track information if it exist
    function getTag(element, tag) {
      var res = element.getElementsByTagName(tag);
      if(res.length==0){
        return null;
      } else {
        return res[0].childNodes[0].nodeValue;
      }
    }

    // iterate over trackList generate tracks list of object
    var tracks = [];
    for(var i=0, t; t=trackList[i]; i++){
      var duration = getTag(t, "duration");
      var track = {track: i,
       name: getTag(t, "title"), 
       file: getTag(t, "location"), 
       length: secsToHours(duration/1000)};
      tracks.push(track); // append trucks object to the array
    }
    if(tracks.length){
      setupPlayer(tracks);
    }

  }

  function setupPlayer(tracks){
    // clear playlist for loading a new one 
    var elm = document.getElementById("plList");
    while (elm.hasChildNodes()) {
      elm.removeChild(elm.lastChild);
    }

    
    $.each(tracks, function(key, value) {
      var trackNumber = value.track,
      trackName = value.name,
      trackLength = value.length;
      if (trackNumber.toString().length === 1) {
        trackNumber = "&#160&#160;" + trackNumber;
      } else if (trackNumber.toString().length === 2){
       trackNumber = "&#160;" + trackNumber;
     }else {
      trackNumber = "" + trackNumber;
    }
    $('#plList').append('<tr class="plItem"><td class="plNum">' + trackNumber + '.</td><td class="plTitle">' + trackName + '</td><td class="plLength">' + trackLength + '</td></tr>');
      // $('#plList').append('<li><div class="plItem"><div class="plNum">' + trackNumber + '.</div><div class="plTitle">' + trackName + '</div><div class="plLength">' + trackLength + '</div></div></li>');
    });
    AP.playActive = false;
    AP.index = 0;
    AP.trackCount = tracks.length;
    AP.shuffleIndex = Array.range(0, AP.trackCount);
    var npAction = $("#npAction");
    var npTitle = $("#npTitle");

    AP.shuffleOn = function(){
      return $('#btnShuffle').hasClass('control-button--active')  
    }
    AP.repeatOn = function(){
      return $('#btnRepeat').hasClass('control-button--active') 
    }
    AP.playlistOn = function(){
      return $('#btnPlaylist').hasClass('control-button--active') 
    }
    // check if shuffle is on
    if (AP.shuffleOn()){
      shuffle(AP.shuffleIndex);
    }
    if (AP.playlistOn()) {
      $("#plwrap").show();
    } else {
      $("#plwrap").hide();
    }

    var audio = $('#audio1').bind('play', function () {
      AP.playActive = true;
      npAction.text('Now Playing...');
    }).bind('pause', function () {
      AP.playActive = false;
      npAction.text('Paused...');
    }).bind('ended', function () {
      npAction.text('Paused...');
      playNextAudio(1);
    }).get(0);

    $('#btnPrev').click(function () {
      playNextAudio(-1, AP.playActive);
    });
    
    $('#btnNext').click(function () {
      playNextAudio(1, AP.playActive);
    });

    $('#plList tr').click(function () {
      var id = parseInt($(this).index());
      var id_index = AP.shuffleIndex.indexOf(id)
      if (id_index !== AP.index) {
        AP.index = id_index;
        playTrack(true);
      }
    });

    var loadTrack = function (id) {
      id = AP.shuffleIndex[id];
      $('.plSel').removeClass('plSel');
      $('#plList tr:eq(' + id + ')').addClass('plSel');
      // scroll to current line 
      var topPos = document.getElementById('plList').rows[id].offsetTop;
      document.getElementById('plwrap').scrollTop = topPos - 46*5;;
      
      npTitle.text(tracks[id].name + " | Track " + id.toString());
      audio.src = tracks[id].file;
    };

    var playTrack = function(playStatus){
      playStatus = (typeof playStatus !== 'undefined') ?  playStatus : true;
      loadTrack(AP.index);
      if (playStatus) {
        audio.play();
        audio.onloadedmetadata = function() {
          var c_id = AP.shuffleIndex[AP.index];
          $('#plList tr:eq(' + c_id + ') td:eq(2)').html(secsToHours(audio.duration));
          // console.log('current id : '+ c_id + ' index : '+ AP.index);
        };
      }

    };

    var playNextAudio = function(dxn, playStatus){
      playStatus = (typeof playStatus !== 'undefined') ?  playStatus : true;
      var nextIndex = AP.index + dxn;
      if(nextIndex > -1 && nextIndex < AP.trackCount){
        AP.index = nextIndex;
        playTrack(playStatus);
      } else {
        if(!AP.repeatOn()){
          audio.pause();
          playStatus = false;
        }
        playTrack(playStatus);
      }
    };

    playTrack(true);
  }
  // listen to any update on the shuffling 
  $('#btnShuffle').click(function() {
    // change shuffle status 
    $('#btnShuffle').toggleClass('control-button--active');
    if(typeof AP.shuffleIndex != 'undefined'){
      if (AP.shuffleOn() ){
        AP.index = 0;
        shuffle(AP.shuffleIndex);
      } else {
        AP.index = AP.shuffleIndex[AP.index]
        AP.shuffleIndex.sort(sortNumber);
      }
    }
  });  
  $('#btnRepeat').click(function(){
    $('#btnRepeat').toggleClass('control-button--active');
  });

  $('#btnPlaylist').click(function(){
    $('#btnPlaylist').toggleClass('control-button--active');
    $("#plwrap").toggle("slow");
  });


  $('#files').change(HandleFileSelect);
  // document.getElementById('files').addEventListener('change', HandleFileSelect, false);
});
