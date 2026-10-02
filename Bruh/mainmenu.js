

function MainMenuUpdate(dt) {
    gfx.fillStyle = 'darkred'
    gfx.fillRect(0, 0, canv.width, canv.height)
}

const MainMenuState = {
    ui_class: 'main-menu',
    update: MainMenuUpdate
}

function EndingUpdate(dt) {
    gfx.fillStyle = 'midnightblue'
    gfx.fillRect(0, 0, canv.width, canv.height)

    document.querySelector('#collected').innerHTML = CollectedEggsCount
    document.querySelector('#dropped').innerHTML = DroppedEggsCount

    cancelAnimationFrame(AnimFrame)
}

const EndingState = {
    ui_class: 'ending',
    update: EndingUpdate
}
