function $(a) {
				return document.querySelector(a)
}

const SMALL_BUFF_SIZE = 16

function createMediaRecorder() {
				const recorder = { }

				if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
								console.log("getUserMedia supported.");
								navigator.mediaDevices
												.getUserMedia(
																// constraints - only audio needed for this app
																{
																				video: false,
																				audio: true,
																},
												)

								// Success callback
												.then((stream) => {

																recorder.context = new AudioContext()
																recorder.source = recorder.context.createMediaStreamSource(stream)

																recorder.analyser = recorder.context.createAnalyser({
																				fftSize: SMALL_BUFF_SIZE,
																				smoothingTimeConstant: 0
																});

																recorder.time_domain_buffer = new Float32Array(recorder.analyser.frequencyBinCount) 
																recorder.frequency_domain_buffer = new Float32Array(recorder.analyser.frequencyBinCount) 

																recorder.source.connect(recorder.analyser)
												})

								// Error callback
												.catch((err) => {
																console.error(`The following getUserMedia error occurred: ${err}`);
												})
				} else {
								console.log("getUserMedia not supported on your browser!")
				}

				return recorder
}

function main() {

				const canvas = $('#canv')
				const gfx = canvas.getContext('2d')

				let recorder = createMediaRecorder()
				let counter = 0;

				// Externalities
				let threshold = parseInt($('#threshold').value)
				let buffer = new Array(parseInt($('#smoother').value))					// total buffer read size = something * fftSize
				let bufcount = 0

				///////////// Recording Stream Handler ///////////////

				$('#start').addEventListener('click', function (e) {
								console.log('starting')
								recorder.context?.resume();
				})

				$('#stop').addEventListener('click', function (e) {
								console.log('pausing')
								recorder.context?.suspend();
				})

				$('#threshold').addEventListener('change', function (e) {
								threshold = parseInt($('#threshold').value)
				})
				$('#smoother').addEventListener('change', function (e) {
								buffer = new Array(parseInt($('#smoother').value))
								bufcount = 0
				})

				let avg = 0;
				function update(dt) {
								//recorder?.update_time_buffer()
								recorder.analyser?.getFloatTimeDomainData(recorder?.time_domain_buffer)
								recorder.analyser?.getFloatFrequencyData(recorder?.frequency_domain_buffer)

								// Time domain checks and stuff
								// energy of a single window
								const energy = recorder?.time_domain_buffer?.reduce((a, b) => a + b * b)

								// check if energy beyond adaptive threshold
								if(energy > avg + threshold) {
												counter += 1
												$('#count').innerHTML = counter
												console.log(energy, avg, energy / avg)
								}

								// save the energy each term for the avarage
								buffer[bufcount] = energy
								bufcount = (bufcount + 1) % buffer.length

								// avarage enenrgy of the system
								avg = buffer.reduce((a, b) => Math.max(a, b))
				}

				///////////// Rendering ///////////////

				// get the thing resizing
				function resize() {
								canvas.width = window.innerWidth;
								canvas.height = window.innerHeight / 2;
				}
				window.addEventListener('resize', resize)
				resize()

				// get a thing printing
				let oldtime = performance.now()
				function animate(newtime) {
								const dt = newtime - oldtime
								oldtime = newtime

								// we may need some way to trigger the thing periodically
								update(dt);

								// fill the background
								gfx.fillStyle = 'beige';
								gfx.fillRect(0, 0, canvas.width, canvas.height);

								// fill the 0 mark line
								gfx.beginPath()
								gfx.strokeStyle = 'teal';
								gfx.moveTo(0, canvas.height / 2)
								gfx.lineTo(canvas.width, canvas.height / 2)
								gfx.stroke()

								//const avg = buffer.reduce((a, b) => a + b) / buffer.length + threshold

								gfx.beginPath()
								gfx.strokeStyle = 'orange';
								gfx.moveTo(0, canvas.height/2 + avg + threshold)
								gfx.lineTo(canvas.width, canvas.height/2 + avg + threshold)
								gfx.moveTo(0, canvas.height/2 - avg - threshold)
								gfx.lineTo(canvas.width, canvas.height/2 - avg - threshold)
								gfx.stroke()

								// create the line
								{
												const buff = recorder.time_domain_buffer

												gfx.beginPath()
												gfx.strokeStyle = 'maroon'
												for(let i = 0; i < buff?.length; i++)
												{
																const x = i * canvas.width / buff?.length;
																const y = (buff[i] * canvas.height / 2) + canvas.height / 2;

																if(i == 0)
																				gfx.moveTo(x, y)
																else
																				gfx.lineTo(x, y)
												}
												gfx.stroke()
								}

								////////////////////
								{
												const buff = recorder.frequency_domain_buffer

												gfx.beginPath()

												if(buff && Math.pow(10, buff[0]/20) > 0.0005)
																gfx.strokeStyle = 'crimson'
												else
												{
																//console.log(buff && buff[0])
																gfx.strokeStyle = 'blue'
												}

												for(let i = 0; buff && i < 300; i++)
												{
																const x = i * canvas.width / 300;
																const y = -canvas.height * 50 * Math.pow(10, buff[i]/20) + canvas.height;

																if(i == 0)
																				gfx.moveTo(x, y)
																else
																				gfx.lineTo(x, y)
												}
												gfx.stroke()
								}

								window.requestAnimationFrame(animate)
				}
				window.requestAnimationFrame(animate)
}

window.onload = main
