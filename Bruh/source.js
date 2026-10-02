const canv = document.querySelector('#canv')
const gfx = canv.getContext('2d')

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
            CurrentGameState = 'COLLECT_EGGS'
            //CurrentGameState = 'ENDING'
            break

        case 'COLLECT_EGGS':
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
