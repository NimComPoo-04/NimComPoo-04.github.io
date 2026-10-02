
// Ok so we have a dude who drops circles/ squares from the top
// We wait until the person has collected 30 eggs.
//
// first 5 + (n : dropped eggs) we drop one at a time
// second 10 + (n : dropped eggs) we drop 2 max at a time
// the next 10 + (n : dropped eggs) we drop 5 max at a time
//  also allow the eggs to change directions
//
// base speed of all eggs increase with the number of eggs collected
//
// Time between egg drops
//
//  Egg Types:
//  - Normal (Falls Linearly)
//
//  - Gravitreble (Speed increases asif there is gravity)
//      [collecting this increases max speed of player for a bit]
//
//  - Trajectron (Changes direction weirdly / does not fall normally)
//      [collecting gives the dude small magnetic field]
//
//  - Splitter (Bombs out into multiple eggs midway through)
//      [no special effects since eggs collected is normal]
//

const DroppingEggs = [ ]

let CollectedEggsCount = 0
let DroppedEggsCount = 0

let TotalEggsCount = 69

const ReductionFactor = {
    'normal': 0,
    'gravitron': 1.5,
    'trajectron': 1,
    'bacteratron': 2
}

const EggTypes = Object.keys(ReductionFactor)

const CollectorDude = {

    fx: canv.width/2,
    tx: canv.width/2,
    t: 1,

    x: canv.width / 2,
    y: canv.height * 0.86,
    w: canv.height * 0.075,
    h: canv.height * 0.1,

    vx: 0.8,
    boost: false,
    magnetism: false,
    boost_time: 0,
    magnetism_time: 0,

    update: function(dt) {
        if(this.t <= 1)
        {
            this.x = (this.tx - this.fx) * Math.sin(this.t * Math.PI / 2) + this.fx
            this.t += this.vx * (this.boost ? 2 : 1) * dt
        }
        else
        {
            this.x = this.tx
            this.fx = this.x
        }

        if(this.boost)
        {
            this.boost_time -= dt
            if(this.boost_time < 0)
                this.boost = false
        }
        if(this.magnetism)
        {
            this.magnetism_time -= dt
            if(this.magnetism_time < 0)
                this.magnetism = false
        }
    },

    collision: function(egg) {

        const dx = this.w * 0.1
        const dy = this.h * 0.1 

        const a = this.x - dx < egg.x + egg.w/2 && this.x + this.w + 2 * dx > egg.x - egg.w/2
        const b = this.y - dy < egg.y + egg.h/2 && this.y + this.h + 2 * dy > egg.y - egg.h/2

        if(a && b)
            return true
        else
            return false
    }
}

const DropperDude = {
    x: canv.width / 2,
    y: canv.height * 0.01,
    w: canv.height * 0.075,
    h: canv.height * 0.1,
    vx: 2,
    eggDropTime: 0,

    update: function(dt) {
        this.x += this.vx * this.w * dt
        if(this.x > canv.width - this.w)
            this.vx = (Math.random() * 3 + 1) * -1
        else if(this.x < 0)
            this.vx = (Math.random() * 3 + 1)

        // dropping nothing here
        const proportions = {
            'normal': 0,
            'gravitron': 0,
            'trajectron': 0,
            'bacteratron': 0
        }
        let shouldDrop = false
        const now = Now()

        if(CollectedEggsCount <= 3)
        {
            proportions.normal = 1

            shouldDrop = now - this.eggDropTime > 4
        }
        else if(CollectedEggsCount <= 10)
        {
            proportions.normal = 0.6
            proportions.gravitron = 0.4

            shouldDrop = now - this.eggDropTime > 3 && DroppingEggs.length <= 3
        }
        else if(CollectedEggsCount <= 20)
        {
            proportions.normal = 0.5
            proportions.gravitron = 0.3
            proportions.trajectron = 0.1

            shouldDrop = now - this.eggDropTime > 2 && DroppingEggs.length <= 4
        }
        else
        {
            proportions.normal = 0.4
            proportions.gravitron = 0.2
            proportions.trajectron = 0.2
            proportions.bacteratron = 0.3

            shouldDrop = now - this.eggDropTime > 1.5 && DroppingEggs.length <= 8
        }

        if(shouldDrop)
        {
            const which = Math.random()
            let cumul = 0
            let select = 'normal'
            for(const k in proportions)
            {
                cumul += proportions[k]
                if(which < cumul)
                {
                    select = k
                    break
                }
            }


            this.poopEgg(select)
            this.vx = Math.floor(Math.random() * 3 + 2) * (this.vx < 0 ? -1 : 1)
        }
    },
    poopEgg: function(kind, gx, gy, tx, timefactor) {

        this.eggDropTime = Now()

        // do the thing but don't poop egs
        if(!PlayingGame)
            return

        const kx = this.x
        const timmy = timefactor || 1

        const egg = {
            from_x: gx || kx + this.w / 2,
            from_y: gy || canv.height * 0.01 + DropperDude.h,

            to_x: tx || kx + this.w / 2,
            to_y: canv.height * 0.94,

            w: DropperDude.w * 0.75,
            h: DropperDude.w * 0.75,

            x: 0,
            y: 0,

            // time in seconds
            time: (4 - Math.min(CollectedEggsCount / 50 + ReductionFactor[kind], 2.5)) / timmy,
            t: 0,

            kind: kind,

            update: function(dt) {
                this.t += dt / this.time

                switch(this.kind)
                {
                    case 'normal':
                        this.x = this.from_x * (1 - this.t) + this.to_x * this.t
                        this.y = this.from_y * (1 - this.t) + this.to_y * this.t
                        break

                    case 'gravitron':
                    case 'bacteratron':
                        this.x = this.from_x * (1 - this.t * this.t) + this.to_x * this.t * this.t
                        this.y = this.from_y * (1 - this.t * this.t) + this.to_y * this.t * this.t
                        break

                    case 'trajectron':
                        {
                            const f0x = this.from_x * (1 - this.t) + this.mid_x * this.t
                            const f0y = this.from_y * (1 - this.t) + this.mid_y * this.t

                            const f1x = this.mid_x * (1 - this.t) + this.to_x * this.t
                            const f1y = this.mid_y * (1 - this.t) + this.to_y * this.t

                            this.x = f0x * (1 - this.t) + f1x * this.t
                            this.y = f0y * (1 - this.t) + f1y * this.t
                        }
                        break
                }
            }
        }

        if(kind == 'bacteratron')
        {
            egg.to_x = Math.random() * canv.width * 0.7 + canv.width * 0.15 + egg.w/2
            egg.to_y = Math.random() * canv.height * 0.4 + canv.height * 0.1 + egg.h/2
        }
        else if(kind == 'trajectron')
        {
            egg.mid_x = Math.random() * canv.width
            egg.mid_y = Math.random() * canv.height * 0.5 + canv.height * 0.25

            if(egg.mid_x < canv.width / 2)
                egg.mid_x *= -1
            else
                egg.mid_x += canv.width / 2
        }

        DroppingEggs.push(egg)
    }
}

// Update all eggs
function UpdateEggs(dt)
{
    for(let i = DroppingEggs.length - 1; i >= 0; i--)
    {
        // out of bounds
        if(DroppingEggs[i].t >= 1)
        {
            if(DroppingEggs[i].kind == 'bacteratron')
            {
                const a = EggTypes[Math.floor(Math.random() * EggTypes.length)]
                const b = EggTypes[Math.floor(Math.random() * EggTypes.length)]

                const k = Math.random()
                DropperDude.poopEgg(a, DroppingEggs[i].x, DroppingEggs[i].y, k * canv.width * 0.8 + canv.width * 0.1, 2)
                DropperDude.poopEgg(b, DroppingEggs[i].x, DroppingEggs[i].y, (0.5 + k)%1 * canv.width * 0.8 + canv.width * 0.1, 2)
            }
            DroppingEggs.splice(i, 1)
            DroppedEggsCount += 1;
        }
        else if(CollectorDude.collision(DroppingEggs[i]))
        {
            if(DroppingEggs[i].kind == 'trajectron')
            {
                CollectorDude.magnetism = true
                CollectorDude.magnetism_time = 8
            }
            else if(DroppingEggs[i].kind == 'gravitron')
            {
                CollectorDude.boost = true
                CollectorDude.boost_time = 8
            }

            DroppingEggs.splice(i, 1)
            CollectedEggsCount += 1;
        }
        else
            DroppingEggs[i].update(dt)
    }
}

let PlayingGame = false

function collectEggsStart() {
    const when = document.querySelector(`.ui .${GameStates[CurrentGameState].ui_class}`)
    when.classList.remove('select')
    PlayingGame=true
}

function CollectEggsUpdate(dt) {

    // Quickly change the state of things
    if(CollectedEggsCount == TotalEggsCount)
    {
        PlayingGame = false
        stateChanger()
    }

    DropperDude.update(dt)
    CollectorDude.update(dt)
    UpdateEggs(dt)


    gfx.fillStyle = 'darkgreen'
    gfx.fillRect(0, 0, canv.width, canv.height)

    // Background platforms
    gfx.fillStyle = 'brown'
    gfx.fillRect(0, canv.height * 0.1, canv.width, canv.height * 0.01)

    gfx.fillStyle = 'green'
    gfx.fillRect(0, canv.height * 0.95, canv.width, canv.height * 0.05)

    if(PlayingGame)
    {
        gfx.strokeStyle = 'midnightblue'

        gfx.fillStyle = `hsl(${Now() % 360}deg 75% 65%)`

        gfx.lineWidth = canv.height * 0.003
        gfx.lineCap = 'round'
        gfx.setLineDash([5, 15])
        gfx.lineDashOffset += dt * 10

        const heit = Math.floor(canv.height*0.15)
        gfx.font = `${heit}px serif`
        const txt = `${CollectedEggsCount} / ${TotalEggsCount}`
        const wid = gfx.measureText(txt).width

        gfx.fillText(txt, canv.width/2 - wid/2, canv.height/2 + heit/2)
        gfx.strokeText(txt, canv.width/2 - wid/2, canv.height/2 + heit/2)
    }

    // Pooper
    gfx.fillStyle = 'purple'
    gfx.fillRect(DropperDude.x, DropperDude.y, DropperDude.w, DropperDude.h)

    for(const k of DroppingEggs)
    {
        switch(k.kind)
        {
            case 'normal':
                gfx.fillStyle = 'burlywood'
                break
            case 'gravitron':
                gfx.fillStyle = 'yellowgreen'
                break
            case 'trajectron':
                gfx.fillStyle = 'goldenrod'
                break
            case 'bacteratron':
                gfx.fillStyle = 'violet'
                break
        }
        gfx.fillRect(k.x - k.w/2, k.y - k.h/2, k.w, k.h)
    }

    gfx.fillStyle = 'goldenrod'
    gfx.fillRect(CollectorDude.x, CollectorDude.y, CollectorDude.w, CollectorDude.h)

    if(CollectorDude.boost)
    {
        gfx.fillStyle = 'lime'
        gfx.fillRect(CollectorDude.x, CollectorDude.y + CollectorDude.h * 0.9, CollectorDude.w, CollectorDude.h * 0.1)
    }
    if(CollectorDude.magnetism)
    {
        gfx.strokeStyle = 'darkred'
        gfx.lineWidth = 5

        const dx = CollectorDude.w * 0.1
        const dy = CollectorDude.h * 0.1 
        gfx.strokeRect(CollectorDude.x - dx, CollectorDude.y - dy, CollectorDude.w + dx * 2, CollectorDude.h + dy * 2)
    }
}

const CollectEggsState = {
    ui_class: 'collect-eggs',
    update: CollectEggsUpdate
}

window.addEventListener('pointerdown', (eve) => {
    if(PlayingGame)
    {
        CollectorDude.fx = CollectorDude.x
        CollectorDude.tx = eve.x - CollectorDude.w/2
        CollectorDude.t = 0
    }
})
