"use strict"
		var stage = {
			w:1280,
			h:720
		}

		var _pexcanvas = document.getElementById("canvas");
		_pexcanvas.width = stage.w;
		_pexcanvas.height = stage.h;
		var ctx = _pexcanvas.getContext("2d");




		var pointer = {
			x:0,
			y:0
		}

		var scale = 1;
		var portrait = true;
		var loffset = 0;
		var toffset = 0;
		var mxpos = 0;
		var mypos = 0;


// ------------------------------------------------------------------------------- Gamy

function drawArrow(fromx, fromy, tox, toy,lw,hlen,color) {
	var dx = tox - fromx;
	var dy = toy - fromy;
	var angle = Math.atan2(dy, dx);
	ctx.fillStyle=color;
	ctx.strokeStyle=color;
	ctx.lineCap = "round";
	ctx.lineWidth = lw;
	ctx.beginPath();
	ctx.moveTo(fromx, fromy);
	ctx.lineTo(tox, toy);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(tox, toy);
	ctx.lineTo(tox - hlen * Math.cos(angle - Math.PI / 6), toy - hlen * Math.sin(angle - Math.PI / 6));
	ctx.lineTo(tox - hlen * Math.cos(angle)/2, toy - hlen * Math.sin(angle)/2);
	ctx.lineTo(tox - hlen * Math.cos(angle + Math.PI / 6), toy - hlen * Math.sin(angle + Math.PI / 6));
	ctx.closePath();
	ctx.stroke();
	ctx.fill();
}




var arrows = [];
function Arrow() {
	this.x = Math.floor(Math.random()*stage.w);
	this.y = Math.floor(Math.random()*stage.h)-stage.h;
	this.s = Math.floor(Math.random()*40)+10;
}

for (var i=0;i<150;i++) {
	arrows[i] = new Arrow();
}
var skip = 0;
function enginestep() {
		ctx.fillStyle = "rgba(0,0,0,0.05)";
		ctx.fillRect(0,0,stage.w,stage.h);
	skip++;
	if (skip > 3) {



		for (var i=0;i<arrows.length;i++) {
			var arr = arrows[i];
			arr.y += arr.s/1.1;
			if (arr.y>stage.h+100) {
				arr.y = -100;

				arr.x = Math.floor(Math.random()*stage.w);
			}
			var color = arr.s*4+55;
			drawArrow(arr.x,arr.y,arr.x,arr.y+arr.s/1.8,arr.s/5,arr.s/20,"rgb(0,"+color+",0)");
		}
		skip = 0;
	}
}


// ------------------------------------------------------------------------------- events
// ------------------------------------------------------------------------------- events
// ------------------------------------------------------------------------------- events
// ------------------------------------------------------------------------------- events

function toggleFullScreen() {
	var doc = window.document;
	var docEl = doc.documentElement;

	var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
	var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

	if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
		requestFullScreen.call(docEl);

	}
	else {
		cancelFullScreen.call(doc);

	}
}



function motchstart(e) {
	mxpos = (e.pageX-loffset)*scale;
	mypos = (e.pageY-toffset)*scale;


}
function motchmove(e) {
	mxpos = (e.pageX-loffset)*scale;
	mypos = (e.pageY-toffset)*scale;
	pointer.x = mxpos;
	pointer.y = mypos;
}

function motchend(e) {

}






window.addEventListener('mousedown', function(e) {
	motchstart(e);
}, false);
window.addEventListener('mousemove', function(e) {
	motchmove(e);
}, false);
window.addEventListener('mouseup', function(e) {
	motchend(e);
}, false);
window.addEventListener('touchstart', function(e) {
	e.preventDefault();
	motchstart(e.touches[0]);
}, false);
window.addEventListener('touchmove', function(e) {
	e.preventDefault();
	motchmove(e.touches[0]);
}, false);
window.addEventListener('touchend', function(e) {
	e.preventDefault();
	motchend(e.touches[0]);
}, false);



// ------------------------------------------------------------------------ stager
// ------------------------------------------------------------------------ stager
// ------------------------------------------------------------------------ stager
// ------------------------------------------------------------------------ stager
function _pexresize() {
	var cw = window.innerWidth;
	var ch = window.innerHeight;
	if (cw<=ch*stage.w/stage.h) {
		portrait = true;
		scale = stage.w/cw;
		loffset = 0;
		toffset = Math.floor(ch-(cw*stage.h/stage.w))/2;
		_pexcanvas.style.width = cw + "px";
		_pexcanvas.style.height = Math.floor(cw*stage.h/stage.w) + "px";
		_pexcanvas.style.marginLeft = loffset +"px";
		_pexcanvas.style.marginTop = toffset +"px";
	} else {
		scale = stage.h/ch;
		portrait = false;
		loffset = Math.floor(cw-(ch*stage.w/stage.h))/2;
		toffset = 0;
		_pexcanvas.style.height = ch + "px";
		_pexcanvas.style.width = Math.floor(ch*stage.w/stage.h) + "px";
		_pexcanvas.style.marginLeft = loffset +"px";
		_pexcanvas.style.marginTop = toffset +"px";
	}
}


window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame    ||
	window.oRequestAnimationFrame      ||
	window.msRequestAnimationFrame     ||
	function( callback ){
		window.setTimeout(callback, 1000 / 60);
	};})();



	var fps = 60;


	var nfcount = 0;

function animated() {
	requestAnimFrame(animated);
	enginestep();

	ctx.clearRect(1200,690,60,20)
   	nfcount++;

    ctx.fillStyle='#008800';
    ctx.font = "12px arial";
    ctx.textAlign = "center";
    ctx.textBaseline = 'middle'; 
    ctx.fillText("FPS: "+Math.floor(fps),1230,700);
}

_pexresize();
animated();


function countfps() {
	fps = nfcount;
	nfcount = 0;
}
setInterval(countfps,1000);