document.querySelectorAll('.output nav div').forEach(e => {
    e.addEventListener('click', k => {
        // remove the thing
        const m = document.querySelector('.output nav div.show')
        m.classList.remove('show')

        // remove the thing
        const l = document.querySelector('.output article.show')
        l.classList.remove('show')

        const who = e.attributes['data-who'].value
        document.querySelector(`.output article.${who}`).classList.add('show')
        e.classList.add('show')

        // Update all visible things

        document.querySelectorAll('.output .transition-table.show').forEach(e => {
            updateTransitionTable(e)
        })
        document.querySelectorAll('.output .transition-diagram.show').forEach(e => {
            updateTransitionDiagram(e)
        })
    }) 
})

document.querySelectorAll('.tape nav div').forEach(e => {
    e.addEventListener('click', k => {
        // remove the thing
        const m = document.querySelector('.tape nav div.show')
        m.classList.remove('show')

        // remove the thing
        const l = document.querySelector('.tape article.show')
        l.classList.remove('show')

        const who = e.attributes['data-who'].value
        document.querySelector(`.tape article.${who}`).classList.add('show')
        e.classList.add('show')

        // Update all visible things
        document.querySelectorAll('.tape .turingmachine-tape.show .long-tape').forEach(e => {
            // each time we switch into tape we reset the shit
            turing_machine.loadString(document.querySelector('.turingmachine-input textarea').value)

            updateMachineTape(e)
            updateTransitionTable(document.querySelector('#ttable'));
            updateTransitionDiagram(document.querySelector('#tdiagram'));
        })
    }) 
})

function createTransitionTable(node) {

    if(!turing_machine)
        return

    let symbols = '<th></th>'
    for(const syms of turing_machine.symbols) {
        symbols += `<th>${syms}</th>`
    }

    console.log(turing_machine.states)

    let items = ''
    for(const name of turing_machine.states) {

        if(name == undefined)
            continue

        let classes = ''
        if(turing_machine.final_state.has(name))
            classes += 'final '
        if(name == turing_machine.initial_state)
            classes += 'initial '

        let k = `<tr class="${classes}"><th>${name || 'ε'}</th>`
        for(const syms of turing_machine.symbols) {
            if(turing_machine.transitions[name]) {

                const f = turing_machine.transitions[name][syms]
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

    node.innerHTML = table

    updateTransitionTable(node);
}

async function createTransitionDiagram(node) {

    if(!turing_machine)
        return

    const vn = turing_machine.states.difference(turing_machine.final_state)

    let nodes = ''
    for(let v of vn) {
        if(v)
            nodes += `${v} [label="${v || 'ε'}", id="${v || 'ε'}"]\n`
    }
    for(let v of turing_machine.final_state) {
        if(v)
            nodes += `${v} [label="${v || 'ε'}", id="${v || 'ε'}", shape=doublecircle, class="final"]\n`
    }

    let edges = ''
    for(let v of turing_machine.states) {
        if(turing_machine.transitions[v])
            for(let k of turing_machine.symbols) {
                const j = turing_machine.transitions[v][k]
                if(j)
                {
                    const ge = (j.difference ? j.direction[0] : 'ε')
                    edges += `${v} -> ${j.next_state} [label="(${k || 'ε'}, ${j.new_character || 'ε'}, ${ge})", id="L${v}U${k || 'ε'}R${j.next_state}"]`
                }
            }
    }

    const has_initial = turing_machine.initial_state ?
    `
    Initial [label="", color="white", shape=point]
    Initial -> ${turing_machine.initial_state}
    ` : '';

    const dot = `
        digraph Diagram {
          rankdir=LR;
          node [shape=circle];

          ${has_initial}

          ${nodes}
          ${edges}
        }
      `;

    const viz =  new Viz()
    const element = await viz.renderSVGElement(dot)
    node.innerHTML = ''
    node.appendChild(element)

    updateTransitionDiagram(node);
}

function updateTransitionTable(node) {
}

function updateTransitionDiagram(node) {
    // Change the current dudes

    const stat = turing_machine.status()

    node.querySelector('.node.next')?.classList.remove('next')
    node.querySelector('.edge.next')?.classList.remove('next')
    node.querySelector('.node.current')?.classList.remove('current')
    node.querySelector('.node.halt')?.classList.remove('halt')

    if(stat)
    {
        node.querySelector('#'+turing_machine.current_state)?.classList.add('current')

        if(stat.halted)
            node.querySelector('#'+turing_machine.current_state)?.classList.add('halt')

        const next = turing_machine.getNextNode();
        node.querySelector('#'+next)?.classList.add('next')

        const edge = turing_machine.getNextEdge();
        node.querySelector('#'+edge)?.classList.add('next')
    }
}

function updateMachineTape(node) {

    if(!turing_machine || !turing_machine.tape)
        return

    const array = []
    for(let i = -8; i <= 8; i++)  {
        const f = turing_machine.tape.read(i)
        array.push(f || 'ε')
    }

    const html = array.map((a, i) => `<div class=${i == 8 ? 'tape-head' : ''}>
    <span class='overlay-address'>${turing_machine.tape.head + i - 8}</span>
        ${a}
    </div>`).join('\n')

    node.innerHTML = html
}
