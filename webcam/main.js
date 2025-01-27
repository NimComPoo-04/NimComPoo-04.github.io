const str = navigator.mediaDevices;

printObject(str)

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

printObject(navigator.mediaDevices)

str.enumerateDevices().then((e) => {
	for(const k in e)
		printObject(e[k])
})

str.getUserMedia({video: true}).then((e) => {
	printObject('------------------------------------')
	printObject(e)
	printObject('------------------------------------')

	const video = document.querySelector('video')
	video.srcObject = e

	video.addEventListener('loadeddata', () => {
		printObject(video.videoWidth)
		printObject(video.videoHeight)

		const canvas = document.querySelector('canvas')

		canvas.width = video.videoWidth
		canvas.height = video.videoHeight

		const gfx = canvas.getContext('2d')

		function loop(time = 0) {
			gfx.drawImage(video, 0, 0, canvas.width, canvas.height)
			requestAnimationFrame(loop);
		}
		requestAnimationFrame(loop);
	})
})
.catch((error) => {
	printObject('------------------------------------')
	printObject(error)
	printObject('------------------------------------')
})
