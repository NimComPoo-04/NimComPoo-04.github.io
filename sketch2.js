// here we have the euler's formula get it XD
// no .... i am sorry 
// e^t*i = cos(t) + i*sin(t) :-: unit circle travern
// then we multiply a constant to make it no-unit circle
// then we multiply contstant to t to make it move faster
// after doing $#!T we change the imaginary no to vector
// SIKE >:-)


function setup()
{
	createCanvas(640,480) ; 
	background(0) ;
}

var r = 0 ; // this is the radius
var t = 0 ; // this is the angle
var x = 0 ; 
var y = 0 ;
var px = 0 ;
var py = 0 ; 

function draw()
{	
	if( t >= 2*PI )
	{
		background(0) ;
		t = 0 ;
		r = 0 ;
		px = 0 ;
		py = 0 ;
	}
	translate(640/2, 480/2) ; 

	noFill() ;
	stroke(255) ;
	x = r * cos(t) ; // this is the real part 
	y = r * sin(t) ; // this is the imaginary part

	line(px, py, x, y) ; 
	//line((t-0.01)*10 + 150, py, t*10 + 150, y) ; 

	// do something
	px = x ;  
	py = y ; 

	// changing the angle and the radius
	r += t * 2 *sin(2*t) * cos(2*t); 
	t += 0.01 ; 

	translate(-640/2, -480/2) ; 
}
