/**
 * Created by joel on 6/19/16.
 */

var dialogs = document.getElementById('dialogs');
var settings = document.getElementById('settings-dialog');
$(settings).dialog({
    title: 'Settings',
    autoOpen: false,
    width: 400,
    buttons: { Close: function() { $(this).dialog( "close" ) } }
});

$('.setting').buttonset();

function plot(name, data) {
    var id = name.split(' ').join('-');
    var dialog = document.createElement('div');
    dialog.id = 'dialog-' + id;
    dialogs.appendChild(dialog);

    $(dialog).dialog({
        title: name,
        autoOpen: true,
        width: 400,
        // close: function() {$(dialog).dialog('destroy')},
        resizable: true,
        resize: function(event, ui) {
            var size = ui.size;
            size.width -= 12;
            size.height -= 12;
            Plotly.relayout('plot-' + id, size);
        }
    });

    var plot_container = document.createElement('div');
    plot_container.id = 'plot-' + id;
    dialog.appendChild(plot_container);
    plot_container.style.width = '100%';
    plot_container.style.height = '100%';

    Plotly.plot(plot_container, data, {
            title: name,
            showlegend: false,
            margin: {t: 0},
            dragmode: data.some(function(datum) {return datum.z}) ? 'orbit' : 'pan',
            zaxis: {color: '#ccc'}
        }, {
            scrollZoom: true,
            displaylogo: false,
            displayModeBar: false,
        }
    );
}

