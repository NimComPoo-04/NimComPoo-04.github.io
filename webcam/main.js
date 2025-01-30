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
precision highp float;

layout(location = 0) in vec4 aPos;

out vec2 fragCoord;
out vec2 uv;

uniform vec2 resolution;

void main () {

	uv.x = (aPos.x + 1.0) * 0.5;
	uv.y = (1.0 - aPos.y) * 0.5;

	fragCoord = uv * resolution;

	gl_Position = aPos;
}
`;

const fs_common = `#version 300 es
		precision highp float;

		in vec2 fragCoord;
		in vec2 uv;
		out vec4 fragColor;

		uniform vec2 resolution;
		uniform sampler2D img;
		uniform vec4 color;
		uniform float time;

		vec3 hsv2rgb(vec3 c)
		{
			vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
			vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
			return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
		}

		`;

function GetUnifrom(gl, program) {
	return {
		resolution : gl.getUniformLocation(program, 'resolution'),
		img : gl.getUniformLocation(program, 'img'),
		color: gl.getUniformLocation(program, 'color'),
		time: gl.getUniformLocation(program, 'time')
	};
}

const fss = {
	original : `${fs_common}

	void main() {
		fragColor = texture(img, uv);
	}
	`,
	tint: `${fs_common}

	vec3 f() {

		float t = 0.;

		t += sin(time * 0.001 + uv.x * 5.);
		t += sin(time * 0.001 + uv.y * 7.);
		t += sin(time * 0.001 + (uv.y + uv.x) * 9.);
		t += sin(time * 0.001 + length(uv) * 15.);

		t /= 4.;

		return hsv2rgb(vec3((t + 1.0) * 0.5, 1.0, 1));
	}

	void main() {
		fragColor = texture(img, uv) * vec4(f(), 1.0);
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
	ordered_dither: `${fs_common}

	float M[16] = float[16](
		 0.0,  8.0,  2.0, 10.0,
		12.0,  4.0, 14.0,  6.0,
		 3.0, 11.0,  1.0,  9.0,
		15.0,  7.0, 13.0,  5.0
	);

	void main() {
		fragColor = texture(img, uv);

		int j = int(mod(fragCoord.x/2.0, 4.0));
		int i = int(mod(fragCoord.y/2.0, 4.0));

		float ns = (M[i * 4 + j] / 16.0 - 0.5);
		float s  = 1./16.;

		fragColor.r = floor((fragColor.r + s * ns) * 7.0 - 0.5) / 7.0;
		fragColor.g = floor((fragColor.g + s * ns) * 7.0 - 0.5) / 7.0;
		fragColor.b = floor((fragColor.b + s * ns) * 7.0 - 0.5) / 7.0;
	}
	`,
	box_blur: `${fs_common}

	void main() {
		fragColor = vec4(0, 0, 0, 1);

		vec2 siz = vec2(3.0 / resolution.x, 3.0 / resolution.y);
		vec2 dsiz = vec2(1.0 / resolution.x, 1.0 / resolution.y);

		float count = 0.0;

		for(float i = -siz.y; i <= siz.y; i += dsiz.y)
		{
			for(float j = -siz.x; j <= siz.x; j += dsiz.x)
			{
				fragColor = fragColor + texture(img, uv + vec2(j, i)); 
				count = count + 1.0;
			}
		}

		fragColor /= count;
	}
	`,
	edge_detect: `${fs_common}

	mat3 kernel = mat3(
		-2, -2, 2,
		-2, 0, 2,
		-2, 2, 2
	);

	// Get the correct position
	vec2 get_pos(int indx) {
		return vec2[9](
			vec2(-1, -1), vec2(0, -1), vec2(1, -1),
			vec2(-1,  0), vec2(0,  0), vec2(1,  0),
			vec2(-1,  1), vec2(0,  1), vec2(1,  1)
		)[indx] / resolution;
	}

	mat3[3] get_space() {
		vec4 region[9];

		for(int i = 0; i < 9; i++)
			region[i] = texture(img, uv + get_pos(i));

		mat3 mregs[3];

		for(int i = 0; i < 3; i++)
			mregs[i] = mat3(
				region[0][i], region[1][i], region[2][i],
				region[3][i], region[4][i], region[5][i],
				region[6][i], region[7][i], region[8][i]
			);

		return mregs;
	}

	vec4 edge_detect()
	{
		vec4 fragment = vec4(0., 0., 0., 1.0);

		mat3 region[3] = get_space();

		for(int i = 0; i < 3; i++)
		{
			mat3 rc = region[i];
			mat3 c = matrixCompMult(kernel, rc);

			float r = c[0][0] + c[0][1] + c[0][2]+
				  c[1][0] + c[1][1] + c[1][2]+
				  c[2][0] + c[2][1] + c[2][2];

			fragment[i] = r;
		}

		return fragment;
	}

	void main() {
		fragColor = edge_detect();
	}
	`,
	error: `${fs_common}

	void main() {
		fragColor = vec4(mod(uv.x * 10., 1.), 0., mod(uv.y * 10., 1.), 1.);
	}
	`
};

function LoadShader(gl) {

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

	//const aPos = gl.getAttribLocation(program, 'aPos');
	gl.enableVertexAttribArray(0);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

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

	return str.getUserMedia({video: { facingMode: {exact: 'environment'}}}).then((vidSrc) => {
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

let programs = []
let program = 0
let current_shader = 0;
let gl = 0;
let uniforms = {};

function NextShader()
{
	current_shader++;
	current_shader %= programs.length - 1;

	program = programs[current_shader];

	uniforms = GetUnifrom(gl, programs[current_shader]);
}

function Main(canvas, video) {
	const img = document.querySelector('img');

	gl = canvas.getContext('webgl2');

	gl.viewport(0, 0, canvas.width, canvas.height)

	canvas.addEventListener('resize', () => gl.viewport(0, 0, canvas.width, canvas.height));
	

	programs = LoadShader(gl);
	program = programs[current_shader];

	const [vao, vbo] = GenPlanes(gl, program);

	uniforms = GetUnifrom(gl, program);

	let tex;

	if(video)
		tex = SetupTexture(gl, video);
	else
		tex = SetupTexture(gl, img);

	function GameLoop(time) {

		gl.useProgram(program);
		gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
		gl.uniform1i(uniforms.img, 0);

		gl.uniform1f(uniforms.time, time);

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
