
// Commands
//
// We get the description of the Turing machine in markdown text, that is
// simple and accessible.
//
// We extract bits in ``` ... ``` and compile them.
//
// The possible format of this is:
// 'Initial' <State>
// 'Final' <State>
// <State> ':' <Current Character> '~' <Next State> ',' <Character Change> ',' (Left|Right)


const BLOCK_SIZE = 64

class Tape {
    constructor(iter) {

        this.posetive_tape = {
            0: new Array(BLOCK_SIZE)
        }

        this.negative_tape = { }

        if(iter)
            for(let i = 0; i < iter.length; i++)
                this.posetive_tape[0][i] = iter[i]

        this.head = 0
    }

    read(n) {
        if(!n) n = this.head
        if(n < 0) {

            const which = parseInt(n / BLOCK_SIZE)
            const offset = -(n % BLOCK_SIZE)

            if(this.negative_tape[which])
                return this.negative_tape[which][offset]
            else
                return undefined
        }
        else {
            const which = parseInt(n / BLOCK_SIZE)
            const offset = n % BLOCK_SIZE

            if(this.posetive_tape[which])
                return this.posetive_tape[which][offset]
            else
                return undefined
        }
    }

    write(c) {

        if(this.head < 0) {

            const which = parseInt(this.head / BLOCK_SIZE)
            const offset = -(this.head % BLOCK_SIZE)

            if(!this.negative_tape[which])
                this.negative_tape[which] = new Array(BLOCK_SIZE)
            this.negative_tape[which][offset] = c
        }
        else {

            const which = parseInt(this.head / BLOCK_SIZE)
            const offset = this.head % BLOCK_SIZE

            if(!this.posetive_tape[which])
                this.posetive_tape[which] = new Array(BLOCK_SIZE)

            this.posetive_tape[which][offset] = c
        }
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

        this.tt_table_dom = null
        this.tt_diagram_dom = null

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
    }

    // Load string for program exection
    loadString(str) {
        this.tape = new Tape(str)
        this.current_state = this.initial_state
    }

    // single step the program
    step() {

        if(!this.transitions[this.current_state])
            return {halted: true, accepted: this.final_state.has(this.current_state)}

        // read the damn tap
        const k = this.tape.read()

        if(!this.transitions[this.current_state][k])
            return {halted: true, accepted: this.final_state.has(this.current_state)}

        const d = this.transitions[this.current_state][k]

        this.tape.write(d.new_character)
        this.current_state = d.next_state

        if(d.direction == 'Left')
            this.tape.moveLeft()
        else if(d.direction == 'Right')
            this.tape.moveRight()

        return {halted: false, accepted: false}
    }

    getNextNode() {

        const k = this.tape.read()

        if(!this.transitions[this.current_state])
            return undefined
        if(!this.transitions[this.current_state][k])
            return undefined
        return this.transitions[this.current_state][k].next_state
    }

    getNextEdge() {
        const k = this.tape.read()

        if(!this.transitions[this.current_state])
            return undefined
        if(!this.transitions[this.current_state][k])
            return undefined
        return `L${this.current_state}U${k}R${this.transitions[this.current_state][k].next_state}`
    }

    displayTransactionsTable() {

        let symbols = '<th></th>'
        for(const syms of this.symbols) {
            symbols += `<th>${syms}</th>`
        }

        console.log(this.states)

        let items = ''
        for(const name of this.states) {

            if(name == undefined)
                continue

            let classes = ''
            if(this.final_state.has(name))
                classes += 'final '
            if(name == this.initial_state)
                classes += 'initial '

            let k = `<tr class="${classes}"><th>${name || 'ε'}</th>`
            for(const syms of this.symbols) {
                if(this.transitions[name]) {

                    const f = this.transitions[name][syms]
                    if(!f)
                        k += `<td>---</td>`
                    else
                    {
                        const dir = f.direction ? f.direction[0] : 'ε'
                        k += `<td>(${f.next_state}, ${f.new_character}, ${dir})</td>`
                    }
                }
                else
                    k += `<td>ε</td>`
            }
            k += '</tr>\n'
            items += k
        }

        const table = `
        <table>
        <caption>Transition Table</caption>
            <thead>
                <tr>${symbols}</tr>
            </thead>
            <tbody>
                ${items}
            </tbody>
        </table>
        `

        this.tt_table_dom = document.querySelector('#transition-table')
        this.tt_table_dom.innerHTML = table
    }
    
    // 8 behind and 8 from the head
    displayTape() {
        const array = []
        for(let i = -8; i <= 8; i++)  {
            const f = this.tape.read(this.tape.head + i)
            array.push(f || 'ε')
        }

        const html = array.map((a, i) => `<div class='tape-ent ${i == 8 ? 'tape-head' : ''}'>
            ${this.tape.head - 8 + i} : ${a}
            </div>`).join('\n')

        document.querySelector('#turing-tape').innerHTML =  html
    }

    async displayTransactionDiagram() {

        const vn = this.states.difference(this.final_state)

        let nodes = ''
        for(let v of vn) {
            if(v)
                nodes += `${v} [label="${v || 'ε'}", id="${v || 'ε'}"]\n`
        }
        for(let v of this.final_state) {
            if(v)
                nodes += `${v} [label="${v || 'ε'}", id="${v || 'ε'}", shape=doublecircle, class="final"]\n`
        }

        let edges = ''
        for(let v of this.states) {
            if(this.transitions[v])
            for(let k of this.symbols) {
                const j = this.transitions[v][k]
                if(j)
                {
                    const ge = (j.difference ? j.direction[0] : 'ε')
                    edges += `${v} -> ${j.next_state} [label="(${k || 'ε'}, ${j.new_character || 'ε'}, ${ge})", id="L${v}U${k || 'ε'}R${j.next_state}"]`
                }
            }
        }

        const dot = `
        digraph {
          rankdir=LR;
          node [shape=circle];

          ${nodes}
          ${edges}
        }
      `;

        const viz =  new Viz()
        const element = await viz.renderSVGElement(dot)
        this.tt_diagram_dom = element
        const k = document.querySelector('#transition-diagram')
        k.innerHTML = ''
        k.appendChild(element)
    }

    dump() {
        console.log(this.symbols)
        console.log(this.output_symbols)
        console.log(this.states)
        console.log(this.initial_state)
        console.log(this.final_state)

        console.table(this.transitions)
    }
}


function compile_string(s) {

    const a = /((?<current_state>\w+)\s*:\s*(?<character>\w)?\s*=\s*(?<next_state>\w+)\s*(,\s*(?<new_character>\w)\s*(,\s*(?<direction>Left|Right)\s*)?)?)|(\s*Final\s*(?<final_state>\w+)\s*)|(\s*Initial\s*(?<initial_state>\w+)\s*)/.exec(s)

    return a?.groups
}

// compiles the thing but has to now communicate somehow with the rest of the system.
// How would it do that?
async function compile_turing_machine(e) {

    // simple HTML source we don't care
    const html_source = marked.parse(e.target.value)

    // Just convert to markdown and show it folks
    const element = document.querySelector('#source-output')
    element.innerHTML = html_source

    // Select all the compatible 'coins'
    const compilables = []
    let statements = []

    // Anything that is code is selected quickly cuz why not.
    const selections = element.querySelectorAll('code')

    selections.forEach((a) => {

        const blocks = a.textContent.split('\n').map(compile_string).filter(k => k != null)

        compilables.push({
            data: blocks,
            elem: a
        })

        // what is this horsecrap yo
        statements = statements.concat(blocks)
    })


    console.log(statements)

    const turn = new TuringMachine(statements)

    // Update the transactions table
    turn.displayTransactionsTable()
    await turn.displayTransactionDiagram()
    turn.dump()

    return turn
}

let turing_machine = null
document.querySelector('#source').addEventListener('change', async (e) => {
    turing_machine = await compile_turing_machine(e)
})

document.querySelector('#submit').addEventListener('click', async (e) => {
    // just in case
    document.getElementById(turing_machine.current_state)?.classList.remove('halt')
    document.getElementById(turing_machine.current_state)?.classList.remove('next')
    document.getElementById(turing_machine.current_state)?.classList.remove('current')
    document.querySelector('.edge.next')?.classList.remove('next');

    turing_machine?.loadString(document.querySelector('#input').value)
    document.getElementById(turing_machine.current_state)?.classList.add('current')
    document.getElementById(turing_machine.getNextNode())?.classList.add('next')
    document.getElementById(turing_machine.getNextEdge())?.classList.add('next')

    turing_machine?.displayTape()
})

document.querySelector('#step').addEventListener('click', async (e) => {

    if(!turing_machine)
        return

    const old = turing_machine.current_state

    const value = turing_machine.step()

    document.getElementById(turing_machine.current_state).classList.remove('next')
    document.getElementById(old).classList.remove('current')
    document.querySelector('.edge.next')?.classList.remove('next');

    if(value.halted)
        document.getElementById(turing_machine.current_state).classList.add('halt')

    document.getElementById(turing_machine.current_state).classList.add('current')
    document.getElementById(turing_machine.getNextNode())?.classList.add('next')
    document.getElementById(turing_machine.getNextEdge())?.classList.add('next')

    turing_machine?.displayTape()
})
