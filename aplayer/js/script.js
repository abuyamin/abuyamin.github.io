$(document).ready(function(){
  var AP = new Object();
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

    var playActive = false,
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
    AP.shuffleIndex = Array.range(0, trackCount);
    AP.index = 0;
    // check if shuffle is on
    if ( $('#btnShuffle').hasClass('control-button--active') ){
      shuffle(AP.shuffleIndex);
    }

    var audio = $('#audio1').bind('play', function () {
      playActive = true;
      npAction.text('Now Playing...');
    }).bind('pause', function () {
      playActive = false;
      npAction.text('Paused...');
    }).bind('ended', function () {
      npAction.text('Paused...');
      if ((AP.index + 1) < trackCount) {
        AP.index++;
        loadTrack(AP.index);
        audio.play();
      } else {
        audio.pause();
        AP.index = 0;
        loadTrack(AP.index);
      }
    }).get(0),
    btnPrev = $('#btnPrev').click(function () {
      if ((AP.index - 1) > -1) {
        AP.index--;
        loadTrack(AP.index);
        if (playActive) {
          audio.play();
        }
      } else {
        audio.pause();
        AP.index = 0;
        loadTrack(AP.index);
      }
    }),
    btnNext = $('#btnNext').click(function () {
      if ((AP.index + 1) < trackCount) {
        AP.index++;
        loadTrack(AP.index);
        if (playActive) {
          audio.play();
        }
      } else {
        audio.pause();
        AP.index = 0;
        loadTrack(AP.index);
      }
    }),
    li = $('#plList tr').click(function () {
      var id = parseInt($(this).index());
      if (id !== AP.index) {
        playTrack(id, true);
      }
    }),

    loadTrack = function (id, direct) {
      if(direct===undefined){ direct = false;}
      // translte id into effective id using AP.shuffleIndex
      if(!direct){
        id = AP.shuffleIndex[id % AP.shuffleIndex.length];
      }
      $('.plSel').removeClass('plSel');
      $('#plList tr:eq(' + id + ')').addClass('plSel');
      // scroll to current line 
      var topPos = document.getElementById('plList').rows[id].offsetTop;
      document.getElementById('plwrap').scrollTop = topPos - 46*5;;

      npTitle.text(tracks[id].track +' >> '+ tracks[id].name);
      AP.index = id;
      audio.src = tracks[id].file;
      
    },

    playTrack = function (id, direct) {
      loadTrack(id, direct);
      audio.play();
      audio.onloadedmetadata = function() {
        $('#plList tr:eq(' + AP.index + ') td:eq(2)').html(millToMinutes(audio.duration*1000));
        console.log('current id : '+ id + ' index : '+ AP.index);
      };
      // var a = $('#audio1')[0];
      // console.log("Track duration \t "+ millToMinutes(a.duration*1000));
    };
    playTrack(AP.index);
  }
  // listen to any update on the shuffling 
  $('#btnShuffle').click(function() {
    // change shuffle status 
    $('#btnShuffle').toggleClass('control-button--active');
    if ( $('#btnShuffle').hasClass('control-button--active') ){
      shuffle(AP.shuffleIndex);
    } else {
      AP.shuffleIndex.sort(sortNumber);
    }
  });  
  $('#btnRepeat').click(function(){
    $('#btnRepeat').toggleClass('control-button--active');
  });


  $('#files').change(HandleFileSelect);
  // document.getElementById('files').addEventListener('change', HandleFileSelect, false);
});
