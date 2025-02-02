const can = document.getElementById('canvas')
const gfx = can.getContext('2d')

const minspawn = 500
const maxspawn = 1000
const vel = 5
const cell = 20
const maxlen = 40
const minlen = 30

let cw = 0
let ch = 0

// Fixing the width and stuff if canvas is resized
let resize;
window.addEventListener('resize', resize = () => {
	can.width = window.innerWidth;
	can.height = window.innerHeight;

	cw = can.width / cell
	ch = can.height / cell
})
resize();


// Initializing the screen space
heads = []

function getStart() {
	return  -Math.random() * (maxspawn - minspawn) - minspawn;
}
//String.fromCharCode(Math.random() * (255 - 34) + 34)
function init() {
	for(let i = 0; i < cw; i++) {
		let len = parseInt(Math.random() * (maxlen - minlen) + minlen)
		let crank = []
		for(let i = 0; i <= len; i++)
			crank.push(String.fromCharCode(Math.random() * (0x30FF - 0x30AA) + 0x30AA))

		heads.push({ x : i * cell,
			y : Math.random() * 4 * can.height - 2 * can.height,
			vy : vel + Math.random() * 3,
			c : crank,
			l : len})
	}
}

function drawHeads() {
	gfx.font = (cell*0.75)+'px sans-serif'
	for(const t of heads) {
		gfx.fillStyle = 'lime';

		let i = 0
		// gfx.fillRect(t.x + 1, t.y + 1, cell - 2, cell - 2)
		gfx.fillText(t.c[i++], t.x, t.y)

		gfx.fillStyle = 'green';
		for(let f = 1; f <= t.l; f++)
		{
			gfx.fillText(t.c[i++], t.x, t.y - cell * f)
			//gfx.fillRect(t.x + 1, t.y + 1 - cell * f, cell - 2, cell - 2)
		}
	}
}


let k = 0
function loop(dt) {
	for(let i = 0; i < heads.length; i++) {
		heads[i].y += heads[i].vy
		if(heads[i].y - heads[i].l * cell > can.height)
			heads[i].y = getStart()
	}

	if(k++ % (cell/vel) == 0) {
		for(let i = 0; i < heads.length; i++) {
			heads[i].c.unshift(String.fromCharCode(Math.random() * (0x30FF - 0x30AA) + 0x30AA))
			heads[i].c.pop()
		}
	}

	gfx.fillStyle = 'black';
	gfx.fillRect(0, 0, can.width, can.height)

	drawHeads();

	window.requestAnimationFrame(loop)
}

init()
window.requestAnimationFrame(loop)
