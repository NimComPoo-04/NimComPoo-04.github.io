// Temporary functions created for the sake of simplicity

function Print(x) {
	logger.textContent += x + '\n';
}

const sin = Math.sin;
const cos = Math.cos;
const tan = Math.tan;
const exp = Math.exp;
const pow = Math.pow;

let Plot = [];
let Offset = [0, 0];
let Range = [1, 1];
let Aspect = [1, 1];
let Samples = 1000;

function TransformScreenToWorld(a) {
	// screen: [0, canvas.width] [0, canvas.height]
	// world: [-Range + Offset].x [+Range + Offset].y

	return [
		(2 * a[0] / canvas.width - 1) * (Range[0] * Aspect[0]) + Offset[0],
		(1 - 2 * a[0] / canvas.height) * (Range[1] * Aspect[1]) + Offset[1],
	]
}

function TransformWorldToScreen(a) {
	// screen: [0, canvas.width] [0, canvas.height]
	// world: [-Range + Offset].x [+Range + Offset].y

	return [
		((a[0] - Offset[0])/ (Range[0] * Aspect[0])  + 1)/2 * canvas.width,
		(1 - (a[1] - Offset[1]) / (Range[1] * Aspect[1]))/2 * canvas.height
	]
}


function Zoom(x, y) {

	if(x <= 0 || y <= 0) {
		Print("Can not have a negetive or 0 zoom value.");
		return;
	}

	Range[0] *= x;
	Range[1] *= y;
}

function Origin(x, y) {
	Offset[0] = x;
	Offset[1] = y;
}

function Integrate(f, a, b, n, m) {

	if(m == undefined)
		m = 'simpson';

	if(n == undefined)
		n = 10;

	const h = (b - a)/n;
	let area = 0;

	for(let i = 0, x = a; i <= n; i++, x += h) {
		switch(m) {
			case 'trapizoidal':
				{
					const y = [];
					const nh = h / 1;
					for(let j = 0; j < 2; j++)
						y.push(f(x + nh * j));

					area += 0.5 * h * (y[0] + y[1]);
				}
				break;

			case 'simpson':
				{
					const y = [];
					const nh = h / 2;
					for(let j = 0; j < 3; j++)
						y.push(f(x + nh * j));

					area += h / 6 * (y[0] + 4 * y[1] + y[2]);
				}
				break;
		}
	}

	return area;
}

function FindConvergence(f, a, b, m) {
	setTimeout(() => {
		let n = 2;

		let area0 = 0;
		let area1 = 0;
		area1 = Integrate(f, a, b, n++, m);

		do {
			area0 = area1;
			area1 = Integrate(f, a, b, n++, m);
		} while(Math.abs(area1 - area0) > 1E-6 && n < 5000);

		Print(`Area = ${area0} N = ${n} Function = ${f.toString()}`);
	}, 0);
}

// Actual code
const canvas = document.querySelector('#canvas');
const gfx = canvas.getContext('2d');

const code = document.querySelector('.functions textarea');
const logger = document.querySelector('.logging');

// Resizing the window should resize the canvas 
function resizeCanvas() {
	canvas.width = window.innerWidth * 70 / 100;
	canvas.height = window.innerHeight * 70 / 100;

	if(canvas.width > canvas.height) {
		Aspect[0] = canvas.width / canvas.height;
		Aspect[1] = 1;
	}
	else {
		Aspect[0] = 1;
		Aspect[1] = canvas.height / canvas.width;
	}
	refreshCanvas();
}

resizeCanvas();

window.addEventListener('resize', resizeCanvas);

function Line(v1, v2, color) {
	gfx.beginPath();
	gfx.strokeStyle = color;
	const [l1, l2] = [TransformWorldToScreen(v1), TransformWorldToScreen(v2)];
	gfx.moveTo(l1[0], l1[1]);
	gfx.lineTo(l2[0], l2[1]);
	gfx.stroke();
}

function Point(v, r, color) {
	gfx.beginPath();
	gfx.fillStyle = color;
	const l = TransformWorldToScreen(v);
	gfx.arc(l[0], l[1], r, 0, 2 * Math.PI);
	gfx.fill();
}


function refreshCanvas() {

	gfx.font = '16px monospace';
	gfx.fillText(`(${Offset[0]}, ${Offset[1]})`, canvas.width/2, canvas.height/2);

	Line([-Aspect[0] * Range[0] + Offset[0], Offset[1]], [Aspect[0] * Range[0] + Offset[0], Offset[1]], 'lightgray');
	Line([Offset[0], -Aspect[1] * Range[1] + Offset[1]], [Offset[0], Aspect[1] * Range[1] + Offset[1]], 'lightgray');

	const colors = ['red', 'green', 'yellow', 'blue', 'cyan', 'magenta'];
	let i = 0;

	Plot.forEach((f) => {
		const dx = 2 * Aspect[0] * Range[0] / Samples;

		const color =  colors[i++];

		for(let x = -Aspect[0] * Range[0] + Offset[0]; x <= Aspect[0] * Range[0] + Offset[0]; x += dx) {
			const d = [x, f(x)]

			if(Math.abs(d[1]) < 1E-3) {
				const l = TransformWorldToScreen(d);
				const txt = `(${d[0].toFixed(3)}, ${d[1].toFixed(3)})`;

				gfx.font = '16px monospace';

				gfx.fillStyle = 'white';
				gfx.fillRect(l[0], l[1], gfx.measureText(txt).width, parseInt(gfx.font));

				gfx.textBaseline = 'top';
				gfx.fillStyle = color;
				gfx.fillText(txt, l[0], l[1]);
			}

			Point(d, 2, color)
		}
	})
}

// Compiling the javascript code in the thing, but we want it to have context
function compileCode() {
	logger.textContent = "";
	try {
		Plot = [];		// remove all the plottable functions
		Offset = [0, 0];
		Range = [1, 1];
		Aspect = [1, 1];
		Samples = 1000;

		eval?.(code.value);
	}
	catch(e) {
		logger.textContent = e.stack.replace('eval', 'line').match(/line:\d:\d/g) + '\n' + e.toString();
	}
}

code.addEventListener('keydown', () => {compileCode(); resizeCanvas();});
code.addEventListener('keypress', () => {compileCode(); resizeCanvas();});
code.addEventListener('keyup', () => {compileCode(); resizeCanvas();});

compileCode();
