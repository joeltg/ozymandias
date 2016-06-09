/**
 * Created by joel on 6/8/16.
 */

var dialogs = document.getElementById('dialogs');

var settings = document.getElementById('settings-dialog');
$(settings).dialog({
    title: 'Settings',
    autoOpen: false,
    width: 400,
    buttons: {
        Close: function() {
            $(this).dialog( "close" );
        }
    }
});

$('.setting').buttonset();

function makeDialog(name, resize) {
    var dialog = document.createElement('div');
    dialog.id = 'dialog-' + name.replace(' ', '-');

    dialogs.appendChild(dialog);

    $(dialog).dialog({
        title: name,
        autoOpen: true,
        width: 400,
        // close: function() {$(dialog).dialog('destroy')},
        resizeStop: resize
    });
    return dialog;
}
