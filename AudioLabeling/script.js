let actual_data = []

function main() {
    const wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#AFAA85',
        progressColor: '#AF435A',
        fillParent: true,
        height: window.innerHeight * 0.5
    })

    // Loading Registrations
    const wsHover = new WaveSurfer.Hover()
    const wsTimeline = new WaveSurfer.Timeline()
    const wsRegion = new WaveSurfer.Regions()

    wavesurfer.registerPlugin(wsHover);
    wavesurfer.registerPlugin(wsTimeline);
    wavesurfer.registerPlugin(wsRegion);

    let current_region = null

    let old_t = 0;
    wavesurfer.on('timeupdate', (t) => {
        if(current_region && old_t != parseInt(t))
        {
            //const t = wavesurfer.getDuration() * x

            current_region.setOptions({
                start: parseInt(t),
                end: parseInt(t) + 1
            })

            old_t = parseInt(t)
        }
    })

    wavesurfer.on('click', (x, y) => {
        wavesurfer.seekTo(x)
        //wavesurfer.play()
        console.log(wavesurfer.getDecodedData().sampleRate )
    })

    wavesurfer.on('decode', () => {

        actual_data = []

        wsRegion.clearRegions()

        // reset that shit
        wavesurfer.seekTo(0)
        wavesurfer.pause()

        document.body.classList.add('paused')

        document.querySelector('#time-sheet tbody').innerHTML = ''

        document.querySelector('#zoomington').value = 0
        document.querySelector('#zoomington')
            .addEventListener('input', (e) => {
                const zoomFactor = parseInt(e.target.value)
                wavesurfer.zoom(zoomFactor)
            })

        current_region = wsRegion.addRegion({
            id: 'slider',
            start: 0,
            end: 1,
            content: 'frame',
            color: 'rgba(128, 235, 112, 0.5)',
            drag: false,
            resize: false
        })
    })

    document.querySelector('#filington').addEventListener('input', (e) => {
        wavesurfer.loadBlob(e.target.files[0])
    })

    document.body.addEventListener('keydown', (e) => {

        if(e.target.id != 'shouldi')
            return;

        const timesheet = document.querySelector('#time-sheet tbody')
        const container = document.querySelector('.two')

        if(e.key == ' ') {
            if(wavesurfer.isPlaying()) {
                wavesurfer.pause()
                document.body.classList.add('paused')
            }
            else {
                wavesurfer.play()
                document.body.classList.remove('paused')
            }
        }
        else if(e.key == 'Enter' && current_region) {


            // Three things need to happen
            // 1. add shit to the table
            // 2. add shit to the actual_data thing

            const docu = {
                'start': current_region.start,
                'end': current_region.end,
                'type': 'vehicle',
            }
            actual_data.push(docu)

            const tr = document.createElement('tr')
            tr.innerHTML = `<td>${current_region.start}</td>
<td>${current_region.end}</td>
<td><input value="vehicle"></td>`

            tr.querySelector('input').addEventListener('input', (e) => {
                docu.type = e.target.value
            })

            timesheet.appendChild(tr)

            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });

            wsRegion.addRegion({
                start: current_region.start,
                end: current_region.end,
                content: 'of-'+actual_data.length,
                color: 'rgba(128, 112, 235, 0.4)',
                drag: false,
                resize: false
            })
        }
    })

    document.querySelector('#download-shit').addEventListener('click', (e) => {

        const name = document.querySelector('#filington').files[0].name
        const data = JSON.stringify(actual_data)

        const file = new File([data], name+'.json', {
            type: 'text/plain'
        })

        const url = URL.createObjectURL(file)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        document.body.appendChild(a)
        a.click()

        setTimeout(() => {
            a.remove()
            URL.revokeObjectURL(url)
        }, 0)

        console.log(data)
    })
}


window.addEventListener('load', main)
