function setup()
{
	createCanvas(640, 480) ; 
}

var t = 0 ; 
var wy = [] ; 
var wx = [] ; 

function draw()
{
	background(220) ; 
	translate(640/2, 480/2) ; 

	if( t >= 2 * PI ) 
	{
		wx = [];  
		wy = []; 
		t = 0 ;  
	}

	var px = 0 ;
	var py = 0 ;
	var r = -50 * ( 2 - 2 * sin(t) + sin(t) * sqrt(abs(cos(t)))/(sin(t)+1.4)) ; 
	noFill() ; 
	for( var i = 0 ; i < 1 ; i++ )
	{
		r = -50 * ( 2 - 2 * sin(t) + sin(t) * sqrt(abs(cos(t)))/(sin(t)+1.4)) ; 
		ellipse(px, py, r*2) ; 
		var x = r * cos(t) + px; 
		var y = r * sin(t) + py;
		line(px,py,x,y) ;
		px = x ; 
		py = y ; 
	}
	
	wy.push(y) ; 
	wx.push(x) ; 

	beginShape() ;
	for( var i = 0 ; i < wx.length ; i++ )
	{
		vertex(wx[i], wy[i]) ; 
	}
	endShape() ;

	t += 0.01 ; 
}
