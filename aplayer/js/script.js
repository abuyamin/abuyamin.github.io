$(document).ready(function(){
  // Check for the various File API support.
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
  } else {
    alert('The File APIs are not fully supported in this browser.');
  }

  // shuffle array
  window.shuffle = function (array) {
    let counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
      // Pick a random index
      let index = Math.floor(Math.random() * counter);
      // Decrease counter by 1
      counter--;
      // And swap the last element with it
      let temp = array[counter];
      array[counter] = array[index];
      array[index] = temp;
    }
    return array;
  }

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
    // convert millisecond duration into minute and second 
    window.millToMinutes = function(millis) {
      var minutes = Math.floor(millis / 60000);
      var seconds = ((millis % 60000) / 1000).toFixed(0);
      if(minutes >= 60){
        var hr = Math.floor(minutes / 60);
        var newMinutes = (minutes % 60).toFixed(0);
        minutes = hr + ":" + newMinutes;
      }
      return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    }

    // iterate over trackList generate tracks list of object
    var tracks = [];
    for(var i=0, t; t=trackList[i]; i++){
      var duration = getTag(t, 'duration');
      var track = {track: i,
       name: getTag(t, 'title'), 
       file: getTag(t, 'location'), 
       length: millToMinutes(duration)};
      tracks.push(track); // append trucks object to the array
    }
    if(tracks.length){
      setupPlayer(tracks);
    }

  }

  function setupPlayer(tracks){
    // clear playlist for loading a new one 
    var elm = document.getElementById('plList');
    while (elm.hasChildNodes()) {
      elm.removeChild(elm.lastChild);
    }

    var index = 0, 
    playActive = false,
    buildPlaylist = $.each(tracks, function(key, value) {
      var trackNumber = value.track,
      trackName = value.name,
      trackLength = value.length;
      if (trackNumber.toString().length === 1) {
        trackNumber = '&#160&#160;' + trackNumber;
      } else if (trackNumber.toString().length === 2){
       trackNumber = '&#160;' + trackNumber;
     }else {
      trackNumber = '' + trackNumber;
    }
    $('#plList').append('<tr class="plItem"><td class="plNum">' + trackNumber + '.</td><td class="plTitle">' + trackName + '</td><td class="plLength">' + trackLength + '</td></tr>');
      // $('#plList').append('<li><div class="plItem"><div class="plNum">' + trackNumber + '.</div><div class="plTitle">' + trackName + '</div><div class="plLength">' + trackLength + '</div></div></li>');
      // $('#plList').append('<li><div class="plItem"><span class="plNum">' + trackNumber + '.</span><span class="plTitle">' + trackName + '</span><span class="plLength">' + trackLength + '</span></div></li>');
    });
    trackCount = tracks.length,
    npAction = $('#npAction'),
    npTitle = $('#npTitle');
    window.shuffleIndex = Array.range(0, trackCount);
    // check if shuffle is on and shuffle index 
    if ($('#shuffle').is(":checked")){
      shuffle(shuffleIndex);
    }

    var audio = $('#audio1').bind('play', function () {
      playActive = true;
      npAction.text('Now Playing...');
    }).bind('pause', function () {
      playActive = false;
      npAction.text('Paused...');
    }).bind('ended', function () {
      npAction.text('Paused...');
      if ((index + 1) < trackCount) {
        index++;
        loadTrack(index);
        audio.play();
      } else {
        audio.pause();
        index = 0;
        loadTrack(index);
      }
    }).get(0),
    btnPrev = $('#btnPrev').click(function () {
      if ((index - 1) > -1) {
        index--;
        loadTrack(index);
        if (playActive) {
          audio.play();
        }
      } else {
        audio.pause();
        index = 0;
        loadTrack(index);
      }
    }),
    btnNext = $('#btnNext').click(function () {
      if ((index + 1) < trackCount) {
        index++;
        loadTrack(index);
        if (playActive) {
          audio.play();
        }
      } else {
        audio.pause();
        index = 0;
        loadTrack(index);
      }
    }),
    li = $('#plList tr').click(function () {
      var id = parseInt($(this).index());
      if (id !== index) {
        playTrack(id, true);
      }
    }),
    loadTrack = function (id, direct) {
      if(direct===undefined){ direct = false;}
      // translte id into effective id using shuffleIndex
      if(!direct){
        id = shuffleIndex[id % shuffleIndex.length];
      }
      $('.plSel').removeClass('plSel');
      $('#plList tr:eq(' + id + ')').addClass('plSel');
      // scroll to current line 
      var topPos = document.getElementById('plList').rows[id].offsetTop;
      document.getElementById('plwrap').scrollTop = topPos - 46*5;;

      npTitle.text(tracks[id].track +' >> '+ tracks[id].name);
      index = id;
      audio.src = tracks[id].file;
      
    },
    playTrack = function (id, direct) {
      loadTrack(id, direct);
      audio.play();
      var a = $('#audio1')[0];
      console.log("Track duration \t "+ millToMinutes(a.duration*1000));
    };
    playTrack(index);
  }
  // listen to any update on the shuffling 
  $('#shuffle').click(function() {
    if ($(this).is(':checked')) {
      shuffle(shuffleIndex);
    } else {
      shuffleIndex.sort(sortNumber);
    }
  });  

  document.getElementById('files').addEventListener('change', HandleFileSelect, false);
});
