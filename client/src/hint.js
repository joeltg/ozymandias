/**
 * Created by joelg on 12/5/16.
 */

const hints = {
    reference: {element: document.getElementById('reference'), state: 0},
    settings: {element: document.getElementById('settings'), state: 0},
    graphics: {element: document.getElementById('graphics'), state: 0},
    console: {element: document.getElementById('console'), state: 0}
};

const handle = ['▲', '▼'];
const display = ['block', 'none'];

function update(obj, state) {
    obj.state = state;
    obj.element.firstElementChild.textContent = handle[state];
    obj.element.nextElementSibling.style.display = display[state];
}

Object.keys(hints).map(k => hints[k]).forEach(e => e.element.onclick = _ => update(e, (e.state + 1) % 2));

export {hints, update};