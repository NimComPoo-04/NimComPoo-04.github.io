let yamnet = null
let classes = null

const analyser_canvas = document.querySelector('.analyser-display canvas')
const analyser_gfx = analyser_canvas.getContext('2d')

const converter_audio_context = new AudioContext({sampleRate: 16000});

function govern_time(time) {
    const sec = time%60
    const min = parseInt(time/60)%60
    const hrs = parseInt(time/3600)

    return `${parseInt(hrs/10)}${hrs%10}:${parseInt(min/10)}${min%10}:${parseInt(sec/10)}${sec%10}`
}

function draw_spectogram(spectogram, time) {

    analyser_gfx.resetTransform();
    analyser_gfx.clearRect(0, 0, analyser_canvas.width, analyser_canvas.height)

    analyser_gfx.lineWidth = 3

    let rad = analyser_canvas.height * 0.75 / 2
    let drad = rad / spectogram[time].length
    const dv = rad * 0.3


    const color_pallete = [
        [0x9E, 0x42, 0x44],
        [0xFC, 0x4C, 0x4E],
        [0xFE, 0x7D, 0x6A]
    ]

    const clamp = (a, b, c) => Math.max(a, Math.min(b, c))
    const lerp = (a, b, c) => (a * c + b * (1 - c))

    const get_color = (i) => {
        const t = i * color_pallete.length / spectogram[time].length

        const l = clamp(0, color_pallete.length - 1, parseInt(t))
        const m = clamp(0, color_pallete.length - 1, parseInt(t) + 1)

        const r = lerp(color_pallete[l][0], color_pallete[l][0], t - parseInt(t))
        const g = lerp(color_pallete[l][1], color_pallete[l][1], t - parseInt(t))
        const b = lerp(color_pallete[l][2], color_pallete[l][2], t - parseInt(t))

        return `rgba(${r}, ${g}, ${b}, ${i / spectogram[time].length})`
    }

    for(let i = 0; i < spectogram[time].length; i++) {

        // each of this is a path
        analyser_gfx.resetTransform();
        analyser_gfx.translate(analyser_canvas.width/2, analyser_canvas.height/2)

        analyser_gfx.beginPath()
        analyser_gfx.fillStyle = get_color(i + 1)
        analyser_gfx.strokeStyle = 'purple'

        for(let j = 0; j < spectogram[time][i].length; j++) {
            // each of these is a `circle`
            //

            const t = 2 * Math.PI * j / (spectogram[time][i].length + 1)


            const x = (rad + dv * Math.pow(spectogram[time][i][j], 2)) * Math.cos(t)
            const y = (rad + dv * Math.pow(spectogram[time][i][j], 2)) * Math.sin(t)

            if(j == 0) {
                analyser_gfx.moveTo(x, y)
            }
            else {
                analyser_gfx.lineTo(x, y)
            }
        }

        analyser_gfx.closePath()
        analyser_gfx.stroke()
        analyser_gfx.fill()

        rad -= drad
    }
}

function create_entry(indx, score, time, spectogram) {

    const {krook, icon} = AstheticsForLabels[indx] || AstheticsForLabels['default'];

    const label = classes['classes'][indx]

    const div = document.createElement('div');
    div.classList.add('entry')

    const {fg, bg} = getChipColors(score)

    div.innerHTML = `<div class="icon" style="background: ${bg}; color: ${fg}"><i class="${icon} fa-solid"></i></div>
<div class="body">
    <div>${label}</div>
    <div class="foobar">
        <div>${parseInt(score * 100)}% chance</div>
        <div class='fahh'></div>
        <div>${govern_time(time)}</div>
    </div>
</div>`

    div.querySelector('.icon').addEventListener('click', () => draw_spectogram(spectogram, time))

    return div
}

function populate_entries(indeces, scores, spectogram) {

    const element = document.querySelector('.analyser-list')
    element.innerHTML = ''

    for(let i = 0; i < indeces.length; i+=1)
    {
        element.appendChild(create_entry(indeces[i], scores[i], i, spectogram))
    }
}


async function analyse_audio(blob) {
    if(!yamnet)
        yamnet = await tf.loadGraphModel('assets/yamnet/model.json')

    // get the audio data
    const data = await blob.arrayBuffer()
    const buffer = await converter_audio_context.decodeAudioData(data)

    // get the tensor out of the thing
    const samples = tf.tensor(buffer.getChannelData(0))

    // predict what that stuff is.
    const [scores, embeddings, snoof] = yamnet.predict(samples)

    //scores.print(verbose=true)
    //embeddings.print(verbose=true)
    
    // This is the spectogram that we will use to draw the blob
    spectogram = await snoof.reshape([-1, 6, 8, 64]).mean(axis=1).sigmoid().array()
    console.log(spectogram)

    // This is the actual score of what the system thinks its listening to.

    const indeces = await scores.argMax(axis=1).array()
    const max_score = await scores.max(axis=1).array()

    populate_entries(indeces, max_score, spectogram)
    draw_spectogram(spectogram, 0)
}

window.addEventListener('load', async () => {
    // Load and fire once to keep everything on cache
    yamnet = await tf.loadGraphModel('assets/yamnet/model.json')

    const labels = await fetch('assets/labels.json')
    classes = await labels.json()
    console.log(classes)

    const waveform = tf.zeros([16000 * 3]);
    const [scores, embeddings, spectrogram] = yamnet.predict(waveform);
    scores.print(verbose=true);  // shape [N, 521]
    embeddings.print(verbose=true);  // shape [N, 1024]
    spectrogram.print(verbose=true);  // shape [M, 64]
    scores.mean(axis=0).argMax().print(verbose=true);

    // Canvas boids
    const k = document.querySelector('.analyser-display')
    const obsv = new ResizeObserver(() => {
        analyser_canvas.width = k.clientWidth
        analyser_canvas.height = k.clientHeight
    })
    obsv.observe(k)
})
