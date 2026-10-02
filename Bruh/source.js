const canv = document.querySelector('#canv')
const gfx = canv.getContext('2d')

const SoundEffects = {
    boost: new Audio('boost.ogg'),
    ending: new Audio('ending.ogg'),
    every10th: new Audio('every10th.ogg'),
    explode: new Audio('explode.ogg'),
    gamestart: new Audio('gamestart.ogg'),
    magnet: new Audio('magnet.ogg'),
    faliure: new Audio('failure.ogg')
}

const ImageAssets = {
    semcarrier: document.querySelector('#semcarrier'),
    pooper: document.querySelector('#pooper'),

    normal: document.querySelector('#normal'),
    gravitron: document.querySelector('#gravitron'),
    trajectron: document.querySelector('#trajectron'),
    bacteratron: document.querySelector('#backteratron'),
}

function resize() {
    canv.width = window.innerWidth
    canv.height = window.innerHeight
}

const rez = new ResizeObserver(resize)
rez.observe(document.body)
resize()

// Game States may be smarter to just call out to a different file all together

const GameStates = {}

let CurrentGameState = 'MAIN_MENU'

function stateChanger() {

    const who = document.querySelector(`.ui .${GameStates[CurrentGameState].ui_class}`)
    who.classList.remove('select')

    switch(CurrentGameState)
    {
        case 'MAIN_MENU':
            SoundEffects.gamestart.play()
            CurrentGameState = 'COLLECT_EGGS'
            //CurrentGameState = 'ENDING'
            break

        case 'COLLECT_EGGS':
            SoundEffects.ending.play()
            CurrentGameState = 'ENDING'
            break
    }

    const when = document.querySelector(`.ui .${GameStates[CurrentGameState].ui_class}`)
    when.classList.add('select')
}

let elapsedTime = 0;
function update(time)
{
    const dt = Math.min((time - old) / 1000, 1/24)
    elapsedTime += dt
    old = time;
    GameStates[CurrentGameState].update(dt)
    AnimFrame = requestAnimationFrame(update)
}

function Now() {
    return elapsedTime
}

let AnimFrame = 0
let old = performance.now() 
window.addEventListener('load', () => {

    GameStates['MAIN_MENU'] = MainMenuState,
    GameStates['COLLECT_EGGS'] = CollectEggsState
    GameStates['ENDING'] = EndingState

    old = performance.now() 
    AnimFrame = requestAnimationFrame(update)
})
