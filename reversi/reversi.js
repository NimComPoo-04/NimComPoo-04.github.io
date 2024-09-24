const player1 = 0;
const player2 = 1;
const nothing = 2;

class Game {
	constructor(rows, cols) {
		this.cols = cols;
		this.rows = rows;

		this.grid = [];
		this.grid.length = rows * cols;
		for(let i = 0; i < this.grid.length; i++)
			this.grid[i] = {
				current: 2,
				neighbours: [0, 0]
			};

		this.turn = player1;

		this.set(this.rows/2, this.cols/2, player1);
		this.set(this.rows/2, this.cols/2 - 1, player2);
		this.set((this.rows/2 - 1), this.cols/2 - 1, player1);
		this.set((this.rows/2 - 1), this.cols/2, player2);
	}

	get(i, j) {
		if(i < 0 || j < 0 || i >= this.rows || j >= this.cols)
			return {
				current: -1,
				neighbours: [-1, -1]
			};

		return this.grid[i * this.cols + j];
	}

	set(i, j, cur) {
		if(i < 0 || j < 0 || i >= this.rows || j >= this.cols)
			return;

		const old = this.grid[i * this.cols + j].current
		this.grid[i * this.cols + j].current = cur;

		for(let k = -1; k <= 1; k++)
			for(let l = -1; l <= 1; l++) {
				const d = this.get(i + k, j + l)
				if(d.current >= 0)
					d.neighbours[cur]++;
				if(old == player1 || old == player2)
					d.neighbours[old]--;
			}
	}

	swapLines(i, j, v) {
		const k = this.get(i, j);

		if(k.current < -1 || k.current == nothing) return -1;
		if(k.current == this.turn)                 return 0;

		const other = this.turn == player1 ? player2 : player1;
		if(k.current == other)
		{
			const t = this.swapLines(i + v[0], j + v[1], v);

			if(t >= 0) {
				this.set(i, j, this.turn);
				return t + 1;
			}

			return -1;
		}

		return -1;
	}

	placePiece(x, y, width, height) {
		const j = Math.floor(x * this.cols / width);
		const i = Math.floor(y * this.rows / height);

		const k = this.get(i, j);
		const conv = this.turn == player1 ? player2 : player1

		if(k.current == nothing && k.neighbours[conv] != 0) {

			let t = false;

			t = (this.swapLines(i + 1, j, [1, 0]) > 0) || t;
			t = (this.swapLines(i - 1, j, [-1, 0]) > 0) || t;
			t = (this.swapLines(i, j + 1, [0, 1]) > 0) || t;
			t = (this.swapLines(i, j - 1, [0, -1]) > 0) || t;

			t = (this.swapLines(i + 1, j + 1, [1, 1]) > 0) || t;
			t = (this.swapLines(i - 1, j - 1, [-1, -1]) > 0) || t;

			t = (this.swapLines(i - 1, j + 1, [-1, 1]) > 0) || t;
			t = (this.swapLines(i + 1, j - 1, [1, -1]) > 0) || t;

			if(t) {
				this.set(i, j, this.turn);
				this.turn = conv;
			}
		}
	}

	drawBoard(gfx, width, height) {
		gfx.beginPath();
		gfx.lineWidth = 8;

		if     (this.turn == player1) gfx.strokeStyle = 'teal';
		else if(this.turn == player2) gfx.strokeStyle = 'maroon';
		else                          gfx.strokeStyle = 'gold';

		const dx = width / this.cols;
		const dy = height / this.rows;

		for(let x = 0; x < width; x += dx) {
			gfx.moveTo(x, 0);
			gfx.lineTo(x, height);
		}

		for(let y = 0; y < height; y += dy) {
			gfx.moveTo(0, y);
			gfx.lineTo(width, y);
		}

		gfx.stroke();

		for(let i = 0; i < this.rows; i++) {
			for(let j = 0; j < this.cols; j++) {

				switch(this.get(i, j).current) {

					case nothing:
						const k = this.get(i, j)

						if(k.neighbours[0] * k.neighbours[1] != 0)
							drawCircle(gfx, dx * j + dx/2, dy * i + dy/2, Math.hypot(dx, dy)/4,'violet');

						else if(k.neighbours[0] != 0)
							drawCircle(gfx, dx * j + dx/2, dy * i + dy/2, Math.hypot(dx, dy)/4,'orange');

						else if(k.neighbours[1] != 0)
							drawCircle(gfx, dx * j + dx/2, dy * i + dy/2, Math.hypot(dx, dy)/4,'skyblue');

						break;

					case player1:
						drawCircle(gfx, dx * j + dx/2, dy * i + dy/2, Math.hypot(dx, dy)/4, 'teal');
						break;

					case player2:
						drawCircle(gfx, dx * j + dx/2, dy * i + dy/2, Math.hypot(dx, dy)/4, 'maroon');
						break;

					default: 
						drawCircle(gfx, dx * j + dx/2, dy * i + dy/2, Math.hypot(dx, dy)/4, 'gold');
				}
			}
		}
	}
}

const game = new Game(8, 8);

function drawCircle(gfx, x, y, r, color) {
	gfx.beginPath();
	gfx.fillStyle = color;
	gfx.arc(x, y, r, 0, 2 * Math.PI);
	gfx.fill();
}

function main() {
	const can = document.querySelector('#can')
	const gfx = can.getContext('2d')

	gfx.fillStyle = 'burlywood'
	gfx.fillRect(0, 0, can.width, can.height)

	game.drawBoard(gfx, can.width, can.height)

	can.addEventListener('click', (e) => {
		const offsetX = e.x - can.getClientRects()[0].x;
		const offsetY = e.y - can.getClientRects()[0].y;

		game.placePiece(offsetX, offsetY, can.width, can.height);

		gfx.fillStyle = 'burlywood'
		gfx.fillRect(0, 0, can.width, can.height)

		game.drawBoard(gfx, can.width, can.height);
	})
}

window.addEventListener('load', main)
