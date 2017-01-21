/**
 * Created by joelg on 1/2/17.
 */
import {editor} from '../editor/editor';
import {state} from '../utils';
import {send} from '../connect';

const commands = {
    'A': 'show All bindings in current environment and its ancestors',
    'B': 'move (Back) to next reduction (earlier in time)',
    'C': 'show bindings of identifiers in the Current environment',
    'D': 'move (Down) to the previous subproblem (later in time)',
    // 'E': 'Enter a read-eval-print loop in the current environment',
    'F': 'move (Forward) to previous reduction (later in time)',
    // 'G': 'Go to a particular subproblem',
    'H': 'prints a summary (History) of all subproblems',
    'I': 'redisplay the error message Info',
    // 'J': 'return TO the current subproblem with a value',
    // 'K': 'continue the program using a standard restart option',
    'L': '(List expression) pretty print the current expression',
    'M': '(Frame elements) show the contents of the stack frame, in raw form',
    'O': 'pretty print the procedure that created the current environment',
    'P': 'move to environment that is Parent of current environment',
    'Q': 'Quit (exit debugger)',
    'R': 'print the execution history (Reductions) of the current subproblem level',
    'S': 'move to child of current environment (in current chain)',
    'T': 'print the current subproblem or reduction',
    'U': 'move (Up) to the next subproblem (earlier in time)',
    // 'V': 'eValuate expression in current environment',
    // 'W': 'enter environment inspector (Where) on the current environment',
    // 'X': 'create a read eval print loop in the debugger environment',
    'Y': 'display the current stack frame',
    // 'Z': 'return FROM the current subproblem with a value'
};

function clear(panel, errorInputs) {
    if (errorInputs) errorInputs.forEach(input => input.disabled = false);
    panel.clear();
    if (state.error === false) {
        editor.setOption('readOnly', false);
        editor.focus();
    }
    state.debug = false;
}

function command(letter, panel, errorInputs) {
    return function() {
        if (commands.hasOwnProperty(letter)) send('eval', letter + '\n');
        if (letter === 'Q') clear(panel, errorInputs);
    }
}

function attach(ul) {
    return function(letter, index) {
        const li = document.createElement('li'), span = document.createElement('span'), input = document.createElement('input');
        span.textContent = commands[letter];
        input.type = 'button';
        input.value = letter;
        li.appendChild(input);
        li.appendChild(span);
        ul.appendChild(li);
        return {input, letter};
    }
}

function debug(errorInputs) {
    if (errorInputs) errorInputs.forEach(input => input.disabled = true);
    send('eval', 'debug\n');
    const div = document.createElement('div'), ul = document.createElement('ul');
    const code = document.createElement('code');
    div.appendChild(ul);
    div.appendChild(code);
    div.classList.add('panel');
    div.classList.add('debug-panel');
    const inputs = Object.keys(commands).map(attach(ul));
    const panel = editor.addPanel(div, {position: 'before-bottom'});
    inputs.forEach(({input, letter}) => input.onclick = command(letter, panel, errorInputs));
    state.debug = {clear: () => clear(panel, errorInputs), console: code};
    editor.setOption('readOnly', 'nocursor');
    div.addEventListener('keydown', e => commands.hasOwnProperty(e.key.toUpperCase()) && command(e.key.toUpperCase(), panel, errorInputs)());
    panel.changed();
    inputs[0].input.focus();
}

export {debug}