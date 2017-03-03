var $ = document.querySelector.bind(document);;
navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia);


var contexteAudio = new AudioContext();
var source;

var oscillateur = contexteAudio.createOscillator();
var noeudGain = contexteAudio.createGain();
var analyserOut = contexteAudio.createAnalyser();
var analyserIn = contexteAudio.createAnalyser();

analyserOut.smoothingTimeConstant = 0.85;
oscillateur.connect(analyserOut);
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
		console.log("error : " + e);
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
		console.log("error : " + e);
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

var canvasTimeOut = document.querySelector('.canvasTimeOut');
var canvasFreqOut = document.querySelector('.canvasFreqOut');

canvasTimeOut.width = largeur;
canvasTimeOut.height = hauteur;
canvasFreqOut.width = largeur;
canvasFreqOut.height = hauteur;

//affichage
function canvasDraw(canvasTime, canvasFreq) {
	//affichage temps
	function DrawTime(canvasTime) {

		analyserOut.fftSize = 2048;
		var bufferLength = analyserOut.fftSize;
		var dataArray = new Uint8Array(bufferLength);
		analyserOut.getByteTimeDomainData(dataArray);


		var ctxTime = canvasTime.getContext('2d');	  


		ctxTime.fillStyle = 'rgb(200, 200, 200)';
		ctxTime.fillRect(0, 0, canvasTime.width, canvasTime.height);

		ctxTime.lineWidth = 2;
		ctxTime.strokeStyle = 'rgb(0, 0, 0)';

		ctxTime.beginPath();

		var sliceWidth = canvasTime.width * 1.0 / bufferLength;
		var x = 0;

		for (var i = 0; i < bufferLength; i++) {

			var v = dataArray[i] / 128.0;
			var y = v * canvasTime.height / 2;

			if (i === 0) {
				ctxTime.moveTo(x, y);
			} else {
				ctxTime.lineTo(x, y);
			}

			x += sliceWidth;
		}

		ctxTime.lineTo(canvasTime.width, canvasTime.height / 2);
		ctxTime.stroke();
	};
	//affichage frequence
	function DrawFreq(canvasFreq) {
		analyserOut.fftSize = 256;
		var bufferLength = analyserOut.frequencyBinCount;
		var dataArray = new Uint8Array(bufferLength);
		analyserOut.getByteFrequencyData(dataArray);

		var ctxFreq = canvasFreq.getContext('2d');

		ctxFreq.clearRect(0, 0, canvasFreq.width, canvasFreq.height);


		ctxFreq.fillStyle = 'rgb(0, 0, 0)';
		ctxFreq.fillRect(0, 0, canvasFreq.width, canvasFreq.height);

		var barWidth = (canvasFreq.width / bufferLength) * 2.5;
		var barHeight;
		var x = 0;

		for(var i = 0; i < bufferLength; i++) {
			barHeight = dataArray[i];

			ctxFreq.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
			ctxFreq.fillRect(x,canvasFreq.height-barHeight/2,barWidth,barHeight/2);

			x += barWidth + 1;
		}
	}

	DrawTime(canvasTimeOut);
	DrawFreq(canvasFreqOut);
	drawVisual = requestAnimationFrame(canvasDraw);
}

canvasDraw(canvasTimeOut, canvasFreqOut);

//entrée
if (navigator.getUserMedia) {
	console.log('getUserMedia supported.');
	navigator.getUserMedia ({
		audio: true
	},

	function(stream) {
		source = contexteAudio.createMediaStreamSource(stream);
		source.connect(analyserIn);
		noeudGain.connect(contexteAudio.destination);
	},
	// Error callback
	function(err) {
		console.log('The following gUM error occured: ' + err);
	});
} else {
	console.log('getUserMedia not supported on your browser!');
}

//affichage entrée (temporaire)
var canvasTimeIn = document.querySelector('.canvasTimeIn');
var canvasFreqIn = document.querySelector('.canvasFreqIn');

canvasTimeIn.width = largeur;
canvasTimeIn.height = hauteur;
canvasFreqIn.width = largeur;
canvasFreqIn.height = hauteur;

//var contexteCanvasTimeIn = canvasTimeIn.getContext('2d');
//var contexteCanvasFreqIn = canvasFreqIn.getContext('2d');

//canvasDraw(canvasTimeIn, canvasFreqIn);

function canvasDrawIn(canvasTime, canvasFreq) {
	//affichage temps
	function DrawTimeIn(canvasTime) {

		analyserIn.fftSize = 2048;
		var bufferLength = analyserIn.fftSize;
		var dataArray = new Uint8Array(bufferLength);
		analyserIn.getByteTimeDomainData(dataArray);

		var ctxTime = canvasTime.getContext('2d');	  

		ctxTime.fillStyle = 'rgb(200, 200, 200)';
		ctxTime.fillRect(0, 0, canvasTime.width, canvasTime.height);

		ctxTime.lineWidth = 2;
		ctxTime.strokeStyle = 'rgb(0, 0, 0)';

		ctxTime.beginPath();

		var sliceWidth = canvasTime.width * 1.0 / bufferLength;
		var x = 0;

		for (var i = 0; i < bufferLength; i++) {

			var v = dataArray[i] / 128.0;
			var y = v * canvasTime.height / 2;

			if (i === 0) {
				ctxTime.moveTo(x, y);
			} else {
				ctxTime.lineTo(x, y);
			}

			x += sliceWidth;
		}

		ctxTime.lineTo(canvasTime.width, canvasTime.height / 2);
		ctxTime.stroke();
	};
	//affichage frequence
	function DrawFreqIn(canvasFreq) {
		analyserIn.fftSize = 256;
		var bufferLength = analyserIn.frequencyBinCount;
		var dataArray = new Uint8Array(bufferLength);
		analyserIn.getByteFrequencyData(dataArray);

		var ctxFreq = canvasFreq.getContext('2d');

		ctxFreq.clearRect(0, 0, canvasFreq.width, canvasFreq.height);


		ctxFreq.fillStyle = 'rgb(0, 0, 0)';
		ctxFreq.fillRect(0, 0, canvasFreq.width, canvasFreq.height);

		var barWidth = (canvasFreq.width / bufferLength) * 2.5;
		var barHeight;
		var x = 0;

		for(var i = 0; i < bufferLength; i++) {
			barHeight = dataArray[i];

			ctxFreq.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
			ctxFreq.fillRect(x,canvasFreq.height-barHeight/2,barWidth,barHeight/2);

			x += barWidth + 1;
		}
	}

	DrawTimeIn(canvasTimeIn);
	DrawFreqIn(canvasFreqIn);
	drawVisual = requestAnimationFrame(canvasDrawIn);
}

canvasDrawIn(canvasTimeIn, canvasFreqIn);

/*
//affichage
function canvasDrawIn() {
	//affichage temps
	function DrawTimeIn() {
		analyserIn.fftSize = 2048;
		var bufferLength = analyserIn.fftSize;
		var dataArray = new Uint8Array(bufferLength);

		analyserIn.getByteTimeDomainData(dataArray);

		contexteCanvasTimeIn.fillStyle = 'rgb(200, 200, 200)';
		contexteCanvasTimeIn.fillRect(0, 0, canvasTimeIn.width, canvasTimeIn.height);

		contexteCanvasTimeIn.lineWidth = 2;
		contexteCanvasTimeIn.strokeStyle = 'rgb(0, 0, 0)';

		contexteCanvasTimeIn.beginPath();

		var sliceWidth = canvasTimeIn.width * 1.0 / bufferLength;
		var x = 0;

		for (var i = 0; i < bufferLength; i++) {
		
			var v = dataArray[i] / 128.0;
			var y = v * canvasTimeIn.height / 2;

			if (i === 0) {
				contexteCanvasTimeIn.moveTo(x, y);
			} else {
				contexteCanvasTimeIn.lineTo(x, y);
			}

			x += sliceWidth;
		}

		contexteCanvasTimeIn.lineTo(canvasTimeIn.width, canvasTimeIn.height / 2);
		contexteCanvasTimeIn.stroke();
	};
	//affichage frequence
	function DrawFreqIn() {
		analyserIn.fftSize = 256;
		var bufferLength = analyserIn.frequencyBinCount;
		var dataArray = new Uint8Array(bufferLength);

		contexteCanvasFreqIn.clearRect(0, 0, canvasFreqIn.width, canvasFreqIn.height);

		analyserIn.getByteFrequencyData(dataArray);

		contexteCanvasFreqIn.fillStyle = 'rgb(0, 0, 0)';
		contexteCanvasFreqIn.fillRect(0, 0, canvasFreqIn.width, canvasFreqIn.height);

		var barWidth = (canvasFreqIn.width / bufferLength) * 2.5;
		var barHeight;
		var x = 0;

		for(var i = 0; i < bufferLength; i++) {
			barHeight = dataArray[i];

			contexteCanvasFreqIn.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
			contexteCanvasFreqIn.fillRect(x,canvasFreqIn.height-barHeight/2,barWidth,barHeight/2);

			x += barWidth + 1;
		}
	};

	DrawTimeIn();
	DrawFreqIn();
	drawVisual = requestAnimationFrame(canvasDrawIn);
}

canvasDrawIn()*/
