var $ = document.querySelector.bind(document);;
navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia);

var largeur = window.innerWidth/2 - 50;
var hauteur = window.innerHeight/3 -100;
var FREQUENCEMAX = 22000;
var VOLUMEMAX = 1;

var contexteAudio = new AudioContext();
var source;
var analyserIn = contexteAudio.createAnalyser();
//var biquad = contexteAudio.createBiquadFilter();
var GainTest = contexteAudio.createGain();
analyserIn.minDecibels = -200;


var oscillateur = contexteAudio.createOscillator();
oscillateur.type = 'sine';
var noeudGain = contexteAudio.createGain();
var analyserOut = contexteAudio.createAnalyser();

var musiqueSrc = $(".musique")
var musique = contexteAudio.createMediaElementSource(musiqueSrc);

analyserOut.smoothingTimeConstant = 0.85;
oscillateur.connect(analyserOut);
oscillateur.connect(noeudGain);
musique.connect(analyserOut);
musique.connect(noeudGain);

noeudGain.connect(contexteAudio.destination);


var freqSlider = $(".freqSlider");
var valeur = $("#percentValue");
freqSlider.addEventListener("change", function (e)  {
	valeur.textContent = e.target.value;
	updateFreq(e.target.value);
});

/* a refaire
var choix = $(".choixFreq");
choix.addEventListener("change", function(e) {
	if(e.target.value > FREQUENCEMAX) {
		updateFreq(e.target.value);
	}	
});

if (choix.value > FREQUENCEMAX) {
	updateFreq(choix.value);
	freqSlider.value = choix.value;
	percentValue = choix.value;
}else {
	console.log("ERREUR : Frequence trop haute");
}
*/

function updateFreq(freq) {  
    oscillateur.frequency.value = (freq/100) * FREQUENCEMAX;
	$(".FreqValue").textContent = oscillateur.frequency.value;
}

/*
 Bouton play et mute
/!\ stop arrete le flux définitivement
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
* Config Entrée micro
*/
if (navigator.getUserMedia) {
	console.log('getUserMedia supported.');
	navigator.getUserMedia ({
		audio: true
	},

	function(stream) {
		source = contexteAudio.createMediaStreamSource(stream);
		source.connect(analyserIn);
		//GainTest.connect(analyserIn);
	},
	// Error callback
	function(err) {
		console.log('The following gUM error occured: ' + err);
	});
} else {
	console.log('getUserMedia not supported on your browser!');
}


/*
* Config canvas sortie
*/
var canvasTimeOut = document.querySelector('.canvasTimeOut');
var canvasFreqOut = document.querySelector('.canvasFreqOut');

canvasTimeOut.width = largeur;
canvasTimeOut.height = hauteur;
canvasFreqOut.width = largeur;
canvasFreqOut.height = hauteur;


canvasDraw(canvasTimeOut, canvasFreqOut, analyserOut);

/*
* Config canvas Entrée
*/
var canvasTimeIn = document.querySelector('.canvasTimeIn');
var canvasFreqIn = document.querySelector('.canvasFreqIn');

canvasTimeIn.width = largeur;
canvasTimeIn.height = hauteur;
canvasFreqIn.width = largeur;
canvasFreqIn.height = hauteur;

canvasDraw(canvasTimeIn, canvasFreqIn, analyserIn);

/*
*AFFICHAGE
*/
function canvasDraw(canvasTime, canvasFreq, analyser) {
	//affichage temps
	function DrawTime() {
		analyser.fftSize = 2048;
		var bufferLength = analyserOut.fftSize;
		var dataArray = new Uint8Array(bufferLength);
		analyser.getByteTimeDomainData(dataArray);

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
	function DrawFreq() {
		analyser.fftSize = 256;
		var bufferLength = analyserOut.frequencyBinCount;
		var dataArray = new Uint8Array(bufferLength);
		analyser.getByteFrequencyData(dataArray);

		var ctxFreq = canvasFreq.getContext('2d');

		ctxFreq.clearRect(0, 0, canvasFreq.width, canvasFreq.height);


		ctxFreq.fillStyle = 'rgb(0, 0, 0)';
		ctxFreq.fillRect(0, 0, canvasFreq.width, canvasFreq.height);

		var barWidth = (canvasFreq.width / bufferLength);
		var barHeight;
		var x = 0;
		for(var i = 0; i < bufferLength; i++) {
			barHeight = dataArray[i];
			checkFreq(dataArray[i]);
			ctxFreq.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
			ctxFreq.fillRect(x,canvasFreq.height-(barHeight/2),barWidth,barHeight);

			x += barWidth;
		}
	}

	DrawTime();
	DrawFreq();
	drawVisual = requestAnimationFrame(canvasDraw.bind(null, canvasTime, canvasFreq, analyser));
}

function checkFreq(freq) {
	if(freq == 9240) {
			console.log("gotcha");
	}
}
