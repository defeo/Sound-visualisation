var $ = document.querySelector.bind(document);;

var contexteAudio = new AudioContext();

var oscillateur = contexteAudio.createOscillator();
var noeudGain = contexteAudio.createGain();
var analyser = contexteAudio.createAnalyser();

analyser.smoothingTimeConstant = 0.85;
oscillateur.connect(analyser);
oscillateur.connect(noeudGain);
noeudGain.connect(contexteAudio.destination);

oscillateur.type = 'triangle';
oscillateur.frequency.value = 500; // valeur en hertz

/*
 Bouton play et mute
/!\ stop arrete le flux définitivement (why ?)  
*/
$(".play").onclick = function(e) {
	if( $(".play").value == "off") {
		oscillateur.start();
		$(".play").value = "on";
		console.log("player set to on");
		$(".play").textContent = "stop";
	}
	else if ($(".play").value == "on") {
		oscillateur.stop();
		$(".play").value = "off";
		console.log("player set to off");
	}
	else {
		console.log("wubba lubba dub dub");
	}
}

$(".mute").onclick = function(e) {
	if( $(".mute").value == "off") {
		noeudGain.disconnect(contexteAudio.destination);
		$(".mute").value = "on";
		console.log("player set to on");
		$(".mute").textContent = "unmute";
	}
	else if ($(".mute").value == "on") {
		noeudGain.connect(contexteAudio.destination);
		$(".mute").value = "off";
		console.log("player set to off");
		$(".mute").textContent = "mute";
	}
	else {
		console.log("wubba lubba dub dub");
	}
}

/* 
 mouvement de la souris
*/
var frequenceMax = 6000;
var volumeMax = 1;

var frequenceInitiale = 3000;
var volumeInitial = 0.5;

// coordonnées de la souris

var positionX;
var positionY;

// récupère les nouvelles coordonnées de la souris quand elle bouge
// puis assigne les nouvelles valeurs de gain et de pitch

document.onmousemove = updatePage;

function updatePage(e) {   
    positionX = (window.Event) ? e.pageX : e.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);
    positionY = (window.Event) ? e.pageY : e.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);
    
    oscillateur.frequency.value = (positionX/largeur) * frequenceMax;
    noeudGain.gain.value = (positionY/hauteur) * volumeMax;

 //   ;
}

/*
 Canvas sortie
*/
var largeur = window.innerWidth/2 - 50;
var hauteur = window.innerHeight/2 - 100;

var canvasTime = document.querySelector('.canvasTime');
var canvasFreq = document.querySelector('.canvasFreq');

canvasTime.width = largeur;
canvasTime.height = hauteur;
canvasFreq.width = largeur;
canvasFreq.height = hauteur;

var contexteCanvasTime = canvasTime.getContext('2d');
var contexteCanvasFreq = canvasFreq.getContext('2d');

//affichage
function canvasDraw() {
  //affichage temps
  function DrawTime() {
      analyser.fftSize = 2048;
      var bufferLength = analyser.fftSize;
      var dataArray = new Uint8Array(bufferLength);

      analyser.getByteTimeDomainData(dataArray);

       drawVisual = requestAnimationFrame(canvasDraw);

      contexteCanvasTime.fillStyle = 'rgb(200, 200, 200)';
      contexteCanvasTime.fillRect(0, 0, canvasTime.width, canvasTime.height);

      contexteCanvasTime.lineWidth = 2;
      contexteCanvasTime.strokeStyle = 'rgb(0, 0, 0)';

      contexteCanvasTime.beginPath();

      var sliceWidth = canvasTime.width * 1.0 / bufferLength;
      var x = 0;

      for (var i = 0; i < bufferLength; i++) {

        var v = dataArray[i] / 128.0;
        var y = v * canvasTime.height / 2;

        if (i === 0) {
          contexteCanvasTime.moveTo(x, y);
        } else {
          contexteCanvasTime.lineTo(x, y);
        }

        x += sliceWidth;
      }

      contexteCanvasTime.lineTo(canvasTime.width, canvasTime.height / 2);
      contexteCanvasTime.stroke();
  };
  //affichage frequence
  function DrawFreq() {
    analyser.fftSize = 256;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    contexteCanvasFreq.clearRect(0, 0, canvasFreq.width, canvasFreq.height);

    analyser.getByteFrequencyData(dataArray);

    contexteCanvasFreq.fillStyle = 'rgb(0, 0, 0)';
    contexteCanvasFreq.fillRect(0, 0, canvasFreq.width, canvasFreq.height);

    var barWidth = (canvasFreq.width / bufferLength) * 2.5;
    var barHeight;
    var x = 0;

    for(var i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i];

      contexteCanvasFreq.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
      contexteCanvasFreq.fillRect(x,canvasFreq.height-barHeight/2,barWidth,barHeight/2);

      x += barWidth + 1;
    }
  };

  DrawTime();
  DrawFreq();
}

canvasDraw()
