var cnv ; 
var pos = [0, 0, 0, 0, 0, 0, 0, 0, 0];
var turn = false ; 

function setup()
{
	cnv = createCanvas(640, 480) ;
	cnv.mousePressed(doStuff) ; 
}

function draw()
{
	background(220) ;

	for( var i = 1 ; i < 3 ; i++ )
	{
		line(640/3*i,0,640/3*i,480) ;  
		line(0,480/3*i,640,480/3*i) ;  
	}

	for( var i = 0 ; i < 3 ; i++ )
	{
		for( var j = 0 ; j < 3 ; j++ )
		{ 
			if( pos[i*3 + j] == 1 )
			{
				fill(255,0,0) ; 
				ellipse(640/3*i+640/6, 480/3*j+480/6, 100, 100) ; 
				fill(255) ; 
			}
			if( pos[i*3 + j] == 2 )
			{
				fill(0,0,255) ; 
				ellipse(640/3*i+640/6, 480/3*j+480/6, 100, 100) ; 
				fill(255) ; 
			}
		}
	}

}

function doStuff()
{ 
	for( var i = 0 ; i < 3 ; i++ )
	{
		for( var j = 0 ; j < 3 ; j++ )
		{
			if( pos[i*3 + j] == 0)
				if( mouseX < 640/3*(i+1) && mouseX > 640/3*i)
					if( mouseY < 480/3*(j+1) && mouseY > 480/3*j)
						pos[i*3 + j] = turn ? 1 : 2; 
		}
	}
	
	turn = !turn ; 
}
