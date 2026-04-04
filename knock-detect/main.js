// DISPLAY BUFFERS //////////////////////////////////////////////

const audioContext = new AudioContext()

let audioAnalyser = null

// Block size is the number of data points we read
const MAX_PTS = 1000
const FPS = 60

const biquadtmp = [ parseInt(document.querySelector('#min-bandpass').value), parseInt(document.querySelector('#max-bandpass').value) ]

const audioLowPassFilter = new BiquadFilterNode(audioContext, {
    type: 'lowpass',
    frequency: biquadtmp[1] / 2,
    Q: 0.707
}) 
const audioHighPassFilter = new BiquadFilterNode(audioContext, {
    type: 'highpass',
    frequency: biquadtmp[0] / 2,
    Q: 0.707
}) 

class BuffBoi {
    constructor(source, dest, color) {
        this.analyser = new AudioWorkletNode(audioContext, "knock-detector")

        this.drawables = {}

        const counter = document.querySelector('.hitcounter')

        const This = this
        this.analyser.port.onmessage = function(e) {

            for(const key in e.data) {

                if(!This.drawables[key])
                    This.drawables[key] = []

                This.drawables[key].push(e.data[key])
                if(This.drawables[key].length > MAX_PTS)
                    This.drawables[key].shift()
            }

            if(e.data['Hit'])
                counter.textContent = parseInt(counter.textContent) + 1
                
        }


        // Get the flow going
        source.connect(this.analyser)
        if(dest)
            this.analyser.connect(dest)
        this.color = getComputedStyle(canvas).getPropertyValue(`--pico-color-${color || 'blue'}-150`)
    }

    // Draw thing
    drawAsGraph() { 
        gfx.beginPath()
        gfx.strokeStyle = this.color

        let x = 0;
        const dx = canvas.width / (BLOCK_SIZE * COUNTS);//COUNTS * BLOCK_SIZE

        for(let i = 0; i < COUNTS; i++) {
            const k = (this.current + i) % COUNTS
            for(let j = 0; j < BLOCK_SIZE; j++) {
                const y = (1 - Math.pow(this.buffers[k][j], 2)) * canvas.height;
                if(x == 0)
                    gfx.moveTo(x, y)
                else
                    gfx.lineTo(x, y)
                x += dx
                if(x > canvas.width)
                    break
            }
        }

        gfx.stroke()
    }
}

function drawGraph(pts, color) {

        gfx.beginPath()
        gfx.strokeStyle = `hsl(${color}deg, 70%, 50%, 1)`

        let x = 0;
        const dx = canvas.width / MAX_PTS;

        for(let i = 0; i < pts.length; i++) {
            const y = (1 - pts[i]) * canvas.height

            if(x == 0)
                gfx.moveTo(x, y)
            else
                gfx.lineTo(x, y)

            x += dx
        }

        gfx.stroke()
}


// CANVAS DRAW FUNCTION//////////////////////////////////////////

const canvas = document.querySelector('#canv')
const gfx = canvas.getContext('2d')

function canvasResize() {
    canvas.width = canvas.parentNode.clientWidth
    canvas.height = canvas.parentNode.clientHeight
}
window.addEventListener('resize', canvasResize)
canvasResize()

let oldTime = null
let legendsDone = false
async function drawFrames(time) {

    requestAnimationFrame(drawFrames)

    if(oldTime == null) {
        // Drop the first frame cuz wtf
        oldTime = time
        return 
    }
    if(time - oldTime < 1000/FPS) {
        // don't render faster than 30fps
        return
    }

    const backgound = getComputedStyle(canvas).getPropertyValue("--pico-color-azure-900")

    // Background
    gfx.fillStyle = backgound
    gfx.fillRect(0, 0, canvas.width, canvas.height)

    if(audioAnalyser) {
        let i = 0;
        const di = 360 / Object.keys(audioAnalyser?.drawables).length
        for(const key in audioAnalyser?.drawables) {
            if(audioAnalyser.drawables[key])
                drawGraph(audioAnalyser.drawables[key], i)
            i += di;
        }

        document.querySelectorAll('.ossiloscope .entries').forEach(n => {

            if(legendsDone)
                return;

            n.innerHTML = ''    // clear out all the entries


            let i = 0;
            const di = 360 / Object.keys(audioAnalyser?.drawables).length
            for(const key in audioAnalyser?.drawables) {

                n.innerHTML += `<div>
                    <span class="probe"
                          style="background:hsl(${i}, 70%, 50%, 1)">
                    </span>
                    <span>&nbsp;&nbsp;${key}</span>
                </div>`

                i += di;
                legendsDone = true;
            }
        })
    }

    oldTime = time
}
requestAnimationFrame(drawFrames)

// AUDIO PROCESSING PIPELINE //////////////////////////////////////////

async function main() {

    await audioContext.audioWorklet.addModule('knock-detector.js')

    const recorder = await navigator.mediaDevices.getUserMedia({
        audio: true
    })

    const audioSource = audioContext.createMediaStreamSource(recorder)
    const audioChannelMerger = audioContext.createChannelMerger() 

    audioSource.connect(audioLowPassFilter)
    audioLowPassFilter.connect(audioHighPassFilter)
    audioHighPassFilter.connect(audioChannelMerger)
    audioAnalyser = new BuffBoi(audioChannelMerger, null, 'jade')

    console.log(audioAnalyser.analyser)
}

document.querySelector('#start').addEventListener('click', () => {
    audioContext?.resume()
})

document.querySelector('#stop').addEventListener('click', () => {
    audioContext?.suspend()
})

document.querySelector('#min-bandpass').addEventListener('input', (e) => {
    audioHighPassFilter.frequency.value = parseInt(e.target.value)
})

document.querySelector('#max-bandpass').addEventListener('input', (e) => {
    audioLowPassFilter.frequency.value = parseInt(e.target.value)
})

document.querySelector('#thresholdScaleFactor') .addEventListener('input', (e) => {
    audioAnalyser.analyser.parameters.get('thresholdScaleFactor').value = Number(e.target.value)
})
document.querySelector('#minThreshold') .addEventListener('input', (e) => {
    audioAnalyser.analyser.parameters.get('minThreshold').value = Number(e.target.value)
})
document.querySelector('#zeroCrossingRateLimit') .addEventListener('input', (e) => {
    audioAnalyser.analyser.parameters.get('zeroCrossingRateLimit').value = Number(e.target.value)
})
document.querySelector('#crestFactorScaler') .addEventListener('input', (e) => {
    audioAnalyser.analyser.parameters.get('crestFactorScaler').value = Number(e.target.value)
})


window.addEventListener('load', main) 
