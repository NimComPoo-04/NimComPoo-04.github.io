let media_recorder = null;
let chunks = null;

const recorder_waveform = document.querySelector('.waveform-display')
const recorder_display = document.querySelector('.recorder-data')
const recorder_analyser = document.querySelector('.analyser')

const rec_button = document.querySelector('.recorder-button');
const rec_cancel = document.querySelector('.recorder-button .cancel');
const rec_rec = document.querySelector('.recorder-button .rec .r2');
const rec_save = document.querySelector('.recorder-button .save');

let currently_recording = false;
let currently_recording_list = false;

rec_cancel.addEventListener('click', (e) => {
    rec_button.classList.remove('waveform-mode')

    recorder_display.classList.remove('nodisplay');
    recorder_waveform.classList.add('nodisplay');

    chunks = null

    media_recorder.stop()

    currently_recording = false;
    currently_recording_list = true;
})

rec_rec.addEventListener('click', (e) => {

    if(!currently_recording_list) {
        currently_recording = !currently_recording;

        if(currently_recording) {
            rec_rec.classList.add('started');

            if(media_recorder.state == 'inactive')
                media_recorder.start(1000)
            else
                media_recorder.resume()
        }
        else {
            rec_rec.classList.remove('started');
            media_recorder.pause()
        }
    }
    else {
        currently_recording_list = false;
        currently_recording = false;

        rec_rec.classList.remove('started');

        document.querySelector('.waveform-display .duration').textContent = '00:00:00'

        const a = document.querySelector('.recorder-button')
        a.classList.add('waveform-mode');

        recorder_display.classList.add('nodisplay');
        recorder_waveform.classList.remove('nodisplay');
        recorder_analyser.classList.add('nodisplay');
    }
})

rec_save.addEventListener('click', (e) => {
    rec_button.classList.remove('waveform-mode')

    recorder_display.classList.remove('nodisplay');
    recorder_waveform.classList.add('nodisplay');

    media_recorder.stop()

    currently_recording = false;
    currently_recording_list = true;
})

// Recording the whole thing as expected please

window.addEventListener('load', async () => {
    const media_stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
    })

    media_recorder = new MediaRecorder(media_stream);


    let time_recorded = 0;
    const duration = document.querySelector('.waveform-display .duration')

    media_recorder.onstart = (e) => {
        chunks = []
        time_recorded = 0;
    }

    media_recorder.ondataavailable = (e) => {
        if(chunks)
        {
            chunks.push(e.data)
            time_recorded += 1;

            sec = time_recorded % 60
            min = parseInt(time_recorded / 60) % 60
            hrs = parseInt(time_recorded / 3600)

            duration.textContent = `${parseInt(hrs/10)}${hrs%10}:${parseInt(min/10)}${min%10}:${parseInt(sec/10)}${sec%10}`
        }
    }

    media_recorder.onstop = (e) => {
        if(chunks) {
            const blob = new Blob(chunks, {type: media_recorder.mimeType});
            add_audio_entry(blob)
        }
        chunks = null;
        time_recorded = 0;
    }

    waveform_resize();

    const resize_obs = new ResizeObserver(waveform_resize)
    resize_obs.observe(waveform)

    waveform_draw(media_stream);
})

const waveform = document.querySelector('.waveform');
const waveform_canvas = document.querySelector('.waveform canvas');
function waveform_resize() {
    waveform_canvas.width = waveform.clientWidth;
    waveform_canvas.height = waveform.clientHeight;
}

function waveform_draw(media_stream) {

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(media_stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    source.connect(analyser)

    const buffer = new Uint8Array(analyser.fftSize) 

    const gfx = waveform_canvas.getContext('2d');

    let lastTimePoint = performance.now();

    function draw() {
        requestAnimationFrame(draw)

        // if shit is not visible don't bother drawing
        if(!waveform_canvas.checkVisibility()) {
            return
        }

        if(performance.now() - lastTimePoint < 25) {
            return
        }
        else {
            lastTimePoint = performance.now()
        }

        // get PCM data
        analyser.getByteTimeDomainData(buffer);

        gfx.clearRect(0, 0, waveform_canvas.width, waveform_canvas.height)

        const top_path = new Path2D();
        const bottom_path = new Path2D();
 
        gfx.lineWidth = 5;
        gfx.strokeStyle = 'brown';
        gfx.fillStyle = 'burlywood';

        const h = waveform_canvas.height
        
        for(let i = 0; i < buffer.length; i++) {
            let t = Math.sin(i * 2 * Math.PI / buffer.length)
            t *= t

            let d = 0
            let ci = 10
            for(let j = -ci; j <= ci; j++)
                if(i + j >= 0 && i + j < buffer.length)
                    d += buffer[j + i]
            d /= 2 * ci + 1

            const y = (d * 2 / 256 - 1) * t * h * 3/4
            const x = i

            if(i == 0) {
                top_path.moveTo(x, h/2 - y)
                bottom_path.moveTo(x, h/2 + y)
            }
            else {
                top_path.lineTo(x, h/2 - y)
                bottom_path.lineTo(x, h/2 + y)
            }
        }

        // why the fuck does this work????
        top_path.addPath(bottom_path)

        gfx.fill(top_path)
        gfx.stroke(top_path)
        //gfx.stroke(bottom_path)
    }

    draw()
}
