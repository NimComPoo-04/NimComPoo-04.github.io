var w = [] ; 
var t = 0 ;

function setup() 
{
	createCanvas(500, 500) ; 
}

function draw() 
{
	var radius= 0 ;
	var prevx = 0 ; 
	var prevy = 0 ; 
	
	translate(50,0) ; 
	background(0) ;	
	stroke(255) ;
	translate(100,250) ;
	noFill() ; 

	for( var i = 1 ; i <= 500 ; i++ )
	{
		// the vector sucker
		var n = 2 * (i-1) + 1; 
		radius = 100 * ( 4 / (n * PI )); 
		var x = radius/2 * cos(t*n) + prevx ;
		var y = radius/2 * sin(t*n) + prevy ; 

		// the circle 
		stroke(50) ; 
		ellipse(prevx,prevy,radius) ;	
		// the line 
		stroke(255) ; 
		line(prevx, prevy, x, y) ; 

		prevx = x ; 
		prevy = y ;
	}
	
	w.unshift(y) ; 
	translate(150,0) ; 
	stroke(255,0,0) ; 
	line(x-150, y, 0, w[0]) ; 
	stroke(0,255,0) ; 
	// drawing a point at the damascus
	beginShape() ; 
	for( var j = 0 ; j < w.length ; j++ )
		vertex(j, w[j]) ;
	endShape() ; 
	if( w.length > 500 )
		w.pop(0) ; 
	t+=0.05; 
}
