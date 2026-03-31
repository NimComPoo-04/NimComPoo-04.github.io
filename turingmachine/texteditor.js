// Orignal idea: https://dev.to/dperrymorrow/a-simple-mostly-css-code-editor-1832

Prism.languages.turingmachine = {
    keyword: {
        pattern: /^\s*(Initial|Final)\s+\w+\s*$/m,
        inside: {
            function: /\w+\s*$/m
        }
    },
    expression: {
        pattern: /^\s*\w+\s*:\s*\w?\s*=\s*\w+\s*(,\s*\w\s*(,\s*(Left|Right))?)?\s*$/m,
        inside: {
            function: [
                /^\s*\w+/m,
                /(?<==)\s*\w+/m,
            ],
            keyword: [
                /(?<=,)\s*(Left|Right)\s*$/
            ],
            constant: [
                /(?<=\:)\s*\w/m,
                /(?<=(,))\s*\w/m,
            ],
            operator: [
                /:/,
                /,/,
                /=/
            ]
        }
    }
}

Prism.hooks.add('after-tokenize', function (env) {
    if(env.language !== 'turingmachine') {
        return;
    }
})

window.addEventListener('load', function() {
    const preview = document.querySelector(".texteditor-display");
    const code = document.querySelector(".texteditor-input");

    function mirror() {
        code.style.height = code.scrollHeight + "px";
        preview.innerHTML = Prism.highlight(
            code.value,
            Prism.languages.markdown,
            "markdown",
        );
    }

    code.addEventListener("keydown", (ev) => {
        if (ev.code === "Tab") {
            ev.preventDefault();
            code.setRangeText("    ", code.selectionStart, code.selectionStart, "end");
            mirror();
        }
    });

    code.addEventListener("input", mirror);
    mirror();
});
