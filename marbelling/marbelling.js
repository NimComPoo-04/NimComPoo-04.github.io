const can = document.getElementById('canvas');
const gfx = can.getContext('2d');

const output = document.getElementById('selected');
const color = document.getElementById('drop-color');

let debug = false;
let ink = [];
let drop = {
	x: 400,
	y: 400,
	color: 'white',
	radius: 10,
	angle: 0
};

// dp = 2 * PI / res
// => da * r = 2 * PI / res => da = (2 * PI) / (res * r)
// if r = 1, da = 2 * PI / res
const res = 50;

can.width = window.innerWidth;
can.height = window.innerHeight;

class Ink
{
	constructor(x, y, rad, col) {
		this.x = x;
		this.y = y;

		this.col = col;
		this.rad = rad;

		this.verts = []
		const da =  (2 * Math.PI) / (res * rad);
		for(let a = 0; a < 2 * Math.PI; a += da)
		{
			const v = { x : Math.cos(a) * rad + x, y : Math.sin(a) * rad + y };
			this.verts.push(v);
		}
	}

	draw() {
		gfx.beginPath();
		gfx.fillStyle = this.col;
		gfx.moveTo(this.verts[0].x, this.verts[0].y);
		for(let i = 0; i < this.verts.length; i++)
		{
			const v1 = this.verts[i];
			const v2 = this.verts[(i + 1) % this.verts.length];

			gfx.lineTo(v2.x, v2.y);
		}
		gfx.fill();

		if(debug)
		{
			gfx.strokeStyle = this.col;
			gfx.filter = 'invert(1)';
			for(let i = 0; i < this.verts.length; i++)
			{
				const v1 = this.verts[i];
				gfx.strokeRect(v1.x-1, v1.y-1, 2, 2);
			}
		}
	}

	// deformed by other ink drop
	deform(other) {
		const C = {x : other.x, y : other.y};
		const rad = other.rad;

		for(let i = 0; i < this.verts.length; i++)
		{
			const oth = {
				x : this.verts[i].x - C.x,
				y : this.verts[i].y - C.y,
			};

			let dist = oth.y * oth.y + oth.x * oth.x;

			const favl = Math.sqrt(1 + rad * rad / dist);

			this.verts[i].x = C.x + oth.x * favl;
			this.verts[i].y = C.y + oth.y * favl;
		}

		const oth = {
			x : this.x - C.x,
			y : this.y - C.y,
		};

		let dist = oth.y * oth.y + oth.x * oth.x;

		const favl = Math.sqrt(1 - rad * rad / dist);

		this.x = C.x + oth.x * favl;
		this.y = C.y + oth.y * favl;
	}

	tineline(B, N, Z, C) {
		const U = 1/Math.pow(2, 1/C);

		for(let i = 0; i < this.verts.length; i++)
		{
			const BP = {x : this.verts[i].x - B.x, y : this.verts[i].y - B.y};
			const d  = Math.abs(BP.x * N.x + BP.y * N.y);

			const zu = Z * Math.pow(U, d);
			this.verts[i].x += zu * N.y;
			this.verts[i].y -= zu * N.x;
		}
	}

	circulartineline(B, rad, Z, C) {
		const U = 1/Math.pow(2, 1/C);

		for(let i = 0; i < this.verts.length; i++)
		{
			const BP = {x : this.verts[i].x - B.x, y : this.verts[i].y - B.y};
			const dl  = Math.sqrt(BP.x * BP.x + BP.y * BP.y);
			const d  = Math.abs(dl - rad);

			const l = Z * Math.pow(U, d);
			const a = l/dl;

			this.verts[i].x = B.x + BP.x * Math.cos(a) - BP.y * Math.sin(a);
			this.verts[i].y = B.y + BP.x * Math.sin(a) + BP.y * Math.cos(a);
		}
	}

	// This does not look very good unfortunately
	vortex(B, r, Z, C) {
		const U = 1/Math.pow(2, 1/C);

		for(let i = 0; i < this.verts.length; i++)
		{
			const BP = {x : this.verts[i].x - B.x, y : this.verts[i].y - B.y};

			const h  = Math.sqrt(BP.x * BP.x + BP.y * BP.y);
			const l = Z * Math.pow(U, h - r);
			const a = l/h;

			this.verts[i].x = B.x + BP.x * Math.cos(a) - BP.y * Math.sin(a);
			this.verts[i].y = B.y + BP.x * Math.sin(a) + BP.y * Math.cos(a);
		}
	}
}

function redraw () {
	gfx.fillStyle = 'darkcyan';
	gfx.fillRect(0, 0, can.width, can.height);
	for(let k of ink) k.draw()

	if(selected == 'drop-type')
	{
		gfx.beginPath();
		gfx.strokeStyle = drop.color;
		gfx.setLineDash([10, 10]);
		gfx.ellipse(drop.x, drop.y, drop.radius, drop.radius, 0, 0, Math.PI * 2);
		gfx.stroke();
	}
	else if(selected == 'tineline-type')
	{
		let points = [];

		if((drop.angle > 45 && drop.angle < 90+45) || (drop.angle > 45+180 && drop.angle < 90+45+180))
		{
			const m = 1/Math.tan(drop.angle/180 * Math.PI);
			const c = drop.x - m * drop.y;

			points.push([c, 0]);
			points.push([c + m * can.height, can.height]);
		}
		else
		{
			const m = Math.tan(drop.angle/180 * Math.PI);
			const c = drop.y - m * drop.x;

			points.push([0, c]);
			points.push([can.width, c + m * can.width]);
		}

		gfx.beginPath();
		gfx.strokeStyle = 'white';
		gfx.setLineDash([10, 10]);

		gfx.moveTo(points[0][0], points[0][1]);
		gfx.lineTo(points[1][0], points[1][1]);

		gfx.stroke();

		gfx.beginPath();
		gfx.fillStyle = 'tomato';
		gfx.ellipse(drop.x, drop.y, 3, 3, 0, 0, Math.PI * 2);
		gfx.fill();
	}
	else if(selected == 'circtine-type')
	{
		gfx.beginPath();
		gfx.strokeStyle = 'white';
		gfx.setLineDash([10, 10]);
		gfx.ellipse(drop.x, drop.y, drop.radius, drop.radius, 0, 0, Math.PI * 2);
		gfx.stroke();

		gfx.beginPath();
		gfx.fillStyle = 'tomato';
		gfx.ellipse(drop.x, drop.y, 3, 3, 0, 0, Math.PI * 2);
		gfx.fill();
	}
	else if(selected == 'vortex-type')
	{
		gfx.beginPath();
		gfx.strokeStyle = 'white';
		gfx.ellipse(drop.x, drop.y, drop.radius, drop.radius, 0, 0, Math.PI * 2);
		gfx.stroke();

		gfx.beginPath();
		gfx.fillStyle = 'tomato';
		gfx.ellipse(drop.x, drop.y, 3, 3, 0, 0, Math.PI * 2);
		gfx.fill();
	}
}

let selected = 'drop-type';

addEventListener('click', (e) => {

	if(selected == 'drop-type')
	{
		let newink = new Ink(e.x, e.y, drop.radius, drop.color);
		for(let j = 0; j < ink.length; j++)
			ink[j].deform(newink)
		ink.push(newink)
	}
	else if(selected == 'tineline-type')
	{
		const N = {
			x : Math.cos(drop.angle / 180 * Math.PI + Math.PI/2),
			y : Math.sin(drop.angle / 180 * Math.PI + Math.PI/2)
		};

		const B = {
			x : drop.x,
			y : drop.y
		};

		for(let j = 0; j < ink.length; j++)
			ink[j].tineline(B, N, 20, 8);
	}
	else if(selected == 'circtine-type')
	{
		const rad = drop.radius;

		const B = {
			x : drop.x,
			y : drop.y
		};

		for(let j = 0; j < ink.length; j++)
			ink[j].circulartineline(B, rad, 20, 8);
	}
	else if(selected == 'vortex-type')
	{
		const rad = drop.radius;

		const B = {
			x : drop.x,
			y : drop.y
		};

		for(let j = 0; j < ink.length; j++)
			ink[j].vortex(B, rad, 20, 8);
	}

	redraw();
});

redraw();

addEventListener('resize', () => {
	can.width = window.innerWidth;
	can.height = window.innerHeight;
	redraw();
})

document.getElementById('drop-type').addEventListener('click', (e) => {
	selected = 'drop-type';
	output.innerText = "Drop Color";
	e.stopPropagation();
})
document.getElementById('circtine-type').addEventListener('click', (e) => {
	selected = 'circtine-type';
	output.innerText = "Circular";
	e.stopPropagation();
})
document.getElementById('tineline-type').addEventListener('click', (e) => {
	selected = 'tineline-type';
	output.innerText = "Tineline";
	e.stopPropagation();
})
document.getElementById('vortex-type').addEventListener('click', (e) => {
	selected = 'vortex-type';
	output.innerText = "Vortex";
	e.stopPropagation();
})
document.getElementById('drop-color').addEventListener('input', (e) => {
	drop.color = color.value;
	e.stopPropagation();
})
document.getElementById('drop-color').addEventListener('click', (e) => {
	e.stopPropagation();
})
document.getElementById('reset').addEventListener('click', (e) => {
	ink = []
	redraw();
	e.stopPropagation();
})

addEventListener('mousemove', (e) => {
	redraw();

	drop.x = e.x;
	drop.y = e.y;
})

addEventListener('wheel', (e) => {
	redraw();

	if(selected == 'drop-type')
	{
		const scroll = e.deltaY;
		if(scroll > 0)
			drop.radius -= 5;
		else
			drop.radius += 5;

		drop.radius = Math.min(Math.max(drop.radius, 10), 1000);
	}
	else if(selected == 'tineline-type')
	{
		const scroll = e.deltaY;
		if(scroll > 0)
			drop.angle -= 1;
		else
			drop.angle += 1;

		drop.angle = Math.min(Math.max(drop.angle, 0), 360);
	}
	else if(selected == 'circtine-type')
	{
		const scroll = e.deltaY;
		if(scroll > 0)
			drop.radius -= 5;
		else
			drop.radius += 5;

		drop.radius = Math.min(Math.max(drop.radius, 10), 1000);
	}
	else if(selected == 'vortex-type')
	{
		const scroll = e.deltaY;
		if(scroll > 0)
			drop.radius -= 5;
		else
			drop.radius += 5;

		drop.radius = Math.min(Math.max(drop.radius, 10), 1000);
	}
})
