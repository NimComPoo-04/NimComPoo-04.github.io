const BLOCK_SIZE = 64

class Tape {
    constructor(iter) {

        this.tape = {
            0: new Array(BLOCK_SIZE)
        }

        if(iter)
            for(let i = 0; i < iter.length; i++)
                this.tape[0][i] = iter[i]

        this.head = 0
    }

    read(n) {
        if(!n) n = 0

        let f = this.head + n
        if(f < 0)
            f += 2 << 28

        const which = parseInt(f / BLOCK_SIZE)
        const offset = f % BLOCK_SIZE

        if(this.tape[which])
            return this.tape[which][offset]
        else
            return undefined
    }

    write(c) {

        let f = this.head
        if(f < 0)
            f += 2 << 28


        const which = parseInt(f / BLOCK_SIZE)
        const offset = f % BLOCK_SIZE

        if(!this.tape[which])
            this.tape[which] = new Array(BLOCK_SIZE)

        this.tape[which][offset] = c
    }

    moveLeft() {
        this.head -= 1
    }

    moveRight() {
        this.head += 1
    }

    getHead() {
        return this.head
    }
}

class TuringMachine {
    constructor(rules) {

        this.tape = null
        this.current_state = null

        this.stats = {halted: false, accepted: false}

        this.symbols = new Set()               // has all the symbols
        this.output_symbols = new Set()        // subset of the symbols
        this.states = new Set()
        this.initial_state = null
        this.final_state = new Set()

        this.transitions = {}

        // Find out all the possible states
        for(const rule of rules) {
            this.states.add(rule.current_state)
            this.states.add(rule.next_state)
        }

        for(const rule of rules) {
            this.symbols.add(rule.character || 'ε')
            this.symbols.add(rule.new_character || 'ε')
            this.output_symbols.add(rule.new_character || 'ε')
        }

        for(const rule of rules) {
            if(rule.final_state)
                this.final_state.add(rule.final_state)
        }

        for(const rule of rules) {
            if(rule.initial_state)
                this.initial_state = rule.initial_state
        }

        // Find out the transitions
        for(const rule of rules) {
            if(rule.final_state != null || rule.initial_state != null)
                continue

            const temp = {
                    next_state: rule.next_state,
                    new_character: rule.new_character || 'ε',
                    direction: rule.direction || 'ε',
                }

            if(!this.transitions[rule.current_state]) {
                this.transitions[rule.current_state] = {}
            }

            this.transitions[rule.current_state][rule.character || 'ε'] = temp
        }

        this.current_state = this.initial_state
    }

    // Load string for program exection
    loadString(str) {
        this.tape = new Tape(str)
        this.current_state = this.initial_state
        this.stats = {halted: false, accepted: false}
    }

    status() {
        return this.stats
    }

    // single step the program
    step() {

        if(!this.transitions[this.current_state]) {
            this.stats = {halted: true, accepted: this.final_state.has(this.current_state)}
            return
        }

        // read the damn tap
        const k = this.tape?.read() || 'ε'

        if(!this.transitions[this.current_state][k])
        {
            this.stats = {halted: true, accepted: this.final_state.has(this.current_state)}
            return
        }

        const d = this.transitions[this.current_state][k]

        this.tape.write(d.new_character || 'ε')
        this.current_state = d.next_state

        if(d.direction == 'Left')
            this.tape.moveLeft()
        else if(d.direction == 'Right')
            this.tape.moveRight()

        this.stats = {halted: false, accepted: false}
        return
    }

    getNextNode() {

        const k = this.tape?.read() || 'ε'

        if(!this.transitions[this.current_state])
            return undefined
        if(!this.transitions[this.current_state][k])
            return undefined
        return this.transitions[this.current_state][k].next_state
    }

    getNextEdge() {
        const k = this.tape?.read() || 'ε'

        if(!this.transitions[this.current_state])
            return undefined
        if(!this.transitions[this.current_state][k])
            return undefined
        return `L${this.current_state}U${k}R${this.transitions[this.current_state][k].next_state}`
    } 
}

function compile_string(s) {

    const a = /^(((?<current_state>\w+)\s*:\s*(?<character>\w)?\s*=\s*(?<next_state>\w+)\s*(\,\s*(?<new_character>\w)\s*(\,\s*(?<direction>Left|Right)\s*)?)?)|(\s*Final\s*(?<final_state>\w+)\s*)|(\s*Initial\s*(?<initial_state>\w+)\s*))$/.exec(s)

    return a?.groups
}

let older_format = ''
function compile_turing_machine(value) {

    const html_source = marked.parse(value)
    const element = document.createElement('div')
    element.innerHTML = html_source

    // Select all the compatible 'coins'
    const compilables = []
    let statements = []

    // Anything that is code is selected quickly cuz why not.
    const selections = element.querySelectorAll('code')

    const text_source_blocks = []

    selections.forEach((a) => {

        const text = a.textContent.split('\n').map(compile_string)
        const blocks = text.filter(k => k)

        if(blocks.length != 0) {
            text_source_blocks.push(a.textContent
                .split('\n')
                .filter(compile_string)
                .join('\n'))

            compilables.push({
                data: blocks,
                elem: a
            })

            // what is this horsecrap yo
            statements = statements.concat(blocks)
        }
    })

    const text = text_source_blocks.join('\n')
    if(text == older_format)
        return
    else
        older_format = text

    turing_machine = new TuringMachine(statements)

    // These are triggered when a new turing machine is created
    createTransitionTable(document.querySelector('#ttable'));
    createTransitionDiagram(document.querySelector('#tdiagram'));
}

let turing_machine = undefined;

document.querySelector(".texteditor-input").addEventListener('input', e => {
    compile_turing_machine(e.target.value)
})

document.querySelector("#turingmachine-step").addEventListener('click', () => {

    turing_machine?.step()

    const e = document.querySelector('.turingmachine-tape .status-info')
    e.innerHTML = `<div style='font-size: 1.8em'> MACHINE HALTED: ${turing_machine.stats.halted} </div>
                   <div style='font-size: 1.8em'> MACHINE ACCPETED STRING: ${turing_machine.stats.accepted}</div>`

    updateTransitionTable(document.querySelector('#ttable'));
    updateTransitionDiagram(document.querySelector('#tdiagram'));
    updateMachineTape(document.querySelector('#tlongtape'))
})


window.addEventListener('load', (e) => {
    compile_turing_machine(document.querySelector(".texteditor-input").value)
})
