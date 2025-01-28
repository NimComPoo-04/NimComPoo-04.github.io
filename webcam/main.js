function printObject(str) {
	if((str) instanceof Object)
	{
		for(let t in str) {
			const prop = document.createElement('div')
			prop.innerText = t + ' : ' + str[t]
			document.body.appendChild(prop)
		}
	}
	else
	{
		const prop = document.createElement('div')
		prop.innerText = str
		document.body.appendChild(prop)
	}
}

const vs = `#version 300 es
precision mediump float;

in vec4 aPos;

out vec2 fragCoord;
out vec2 uv;

uniform vec2 resolution;

void main () {

	uv.x = (1.0 - aPos.x) * 0.5;
	uv.y = (1.0 - aPos.y) * 0.5;

	fragCoord = uv * resolution;

	gl_Position = aPos;
}
`;

const fs_common = `#version 300 es
		precision mediump float;

		in vec2 fragCoord;
		in vec2 uv;
		out vec4 fragColor;

		uniform vec2 resolution;
		uniform sampler2D img;
		uniform vec4 color;
		`;

function GetUnifrom(gl, program) {
	return {
		resolution : gl.getUniformLocation(program, 'resolution'),
		img : gl.getUniformLocation(program, 'img'),
		color: gl.getUniformLocation(program, 'color')
	};
}

const fss = {
	original : `${fs_common}

	void main() {
		fragColor = texture(img, uv);
	}
	`,
	tint: `${fs_common}

	void main() {
		fragColor = texture(img, uv) * color;
	}
	`,
	werid: `${fs_common}

	void main() {
		fragColor = texture(img, uv);
		fragColor.r = floor(fragColor.r * 5.0)/5.0;
		fragColor.g = floor(fragColor.g * 5.0)/5.0;
		fragColor.b = floor(fragColor.b * 5.0)/5.0;
	}
	`,
	error: `${fs_common}

	void main() {
		fragColor = vec4(mod(uv.x * 10., 1.), 0., mod(uv.y * 10., 1.), 1.);
	}
	`
};

function LoadShader(gl) {

	let programs = []

	const vsid = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vsid, vs);
	gl.compileShader(vsid);
	if(!gl.getShaderParameter(vsid, gl.COMPILE_STATUS)) {
		console.log(gl.getShaderInfoLog(vsid));
	}

	for (let indx in fss)
	{
		const fs = fss[indx]

		const fsid = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fsid, fs);
		gl.compileShader(fsid);

		if(!gl.getShaderParameter(fsid, gl.COMPILE_STATUS)) {
			console.log(gl.getShaderInfoLog(fsid));
		}

		const program = gl.createProgram();
		gl.attachShader(program, vsid);
		gl.attachShader(program, fsid);
		gl.linkProgram(program);

		if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.log(gl.getProgramInfoLog(program));
			gl.deleteProgram(program);
			program = 0;
		}

		gl.deleteShader(fsid);

		programs.push(program)
	}

	gl.deleteShader(vsid);

	return programs
}

function GenPlanes(gl, program) {

	const buffer = [
		-1.0, -1.0,
		1.0, -1.0,
		1.0, 1.0,

		1.0, 1.0,
		-1.0, 1.0,
		-1.0, -1.0
	]

	const data = new Float32Array(buffer);

	const vao = gl.createVertexArray();
	gl.bindVertexArray(vao);

	const vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

	const aPos = gl.getAttribLocation(program, 'aPos');
	gl.enableVertexAttribArray(aPos);
	gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

	return [vao, vbo]
}

function SetupTexture(gl, img)
{
	const tex = gl.createTexture();

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
	gl.generateMipmap(gl.TEXTURE_2D);

	return tex;
}

function UpdateTexture(gl, img, width, height) {
	gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, img);
}

function SetupVideo() {
	const str = navigator.mediaDevices;
	if(str == undefined)
		return undefined

	return str.getUserMedia({video: true}).then((vidSrc) => {
		const video = document.querySelector('video')
		video.srcObject = vidSrc

		video.addEventListener('loadeddata', () => {
			const canvas = document.querySelector('canvas');
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;

			Main(canvas, video);
		})

		return true
	}).catch((err) => Main(document.querySelector('canvas'), undefined));
}

function Main(canvas, video) {
	const img = document.querySelector('img');

	const gl = canvas.getContext('webgl2');

	gl.viewport(0, 0, canvas.width, canvas.height)

	canvas.addEventListener('resize', () => gl.viewport(0, 0, canvas.width, canvas.height));
	

	const program = LoadShader(gl)[2];
	const [vao, vbo] = GenPlanes(gl, program);

	const uniforms = GetUnifrom(gl, program);

	gl.useProgram(program);
	gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
	gl.uniform1i(uniforms.img, 0);

	let tex;

	if(video)
		tex = SetupTexture(gl, video);
	else
		tex = SetupTexture(gl, img);

	function GameLoop() {

		gl.clearColor(0.8, 0.0, 1.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.bindVertexArray(vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

		gl.drawArrays(gl.TRIANGLES, 0, 6);

		if(video)
			UpdateTexture(gl, video, video.videoWidth, video.videoHeight);

		requestAnimationFrame(GameLoop);
	}
	requestAnimationFrame(GameLoop);
}

window.onload = () => { SetupVideo(); };
