onload = function() {
  editor = CodeMirror(
    document.getElementById("editor"),
    {
      mode: {
        name: 'gfm',
        highlightFormatting: true
      },
      lineWrapping: true,
      tabSize: 2,
      viewportMargin: Infinity,
      theme: "lesser-bright",
      value: "# This is some Markdown \nIt's **awesome**.",
      extraKeys: {
        "Cmd-S": function(instance) {
          // handleSaveButton();
        },
        "Ctrl-S": function(instance) {
          // handleSaveButton();
        },
      }
    }
  );
};
