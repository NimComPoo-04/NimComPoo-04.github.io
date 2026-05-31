const current_blobs = []

function add_audio_entry(blob) {

    const where_to_add = document.querySelector('.recorder-data')

    // reset the thing thats there
    if(current_blobs.length == 0)
        where_to_add.innerHTML = ''

    const div = document.createElement('div')
    div.classList.add('entry')

    const d = new Date();
    div.innerHTML = `<div class="icon"><i class="fa-solid fa-microchip"></i></div>
<div class="body">
    <div>${d.toLocaleTimeString()}</div>
    <div class="audio-thing"></div>
</div>`


    div.querySelector('.icon')
        .addEventListener('click', () =>
            invokeAnalyser(blob))

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    audio.addEventListener('canplaythrough', () => {
        URL.revokeObjectURL(url);
    })

    audio.setAttribute('controls', true);
    div.querySelector('.audio-thing').appendChild(audio)

    current_blobs.push(audio)
    where_to_add.appendChild(div)
}

function invokeAnalyser(blob) {
    const dodie = document.querySelector('.recorder-data')
    dodie.classList.add('nodisplay')

    const analyse = document.querySelector('.analyser')
    console.log(analyse)
    analyse.classList.remove('nodisplay')

    analyse_audio(blob).then(() => {
        console.log('done')
    })
}
