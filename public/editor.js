onload = function() {
  editor = CodeMirror(
    document.getElementById("editor"),
    {
      mode: {
        name: "Markdown",
        json: true
      },
      lineNumbers: true,
      theme: "lesser-dark",
      extraKeys: {
        "Cmd-S": function(instance) {
          handleSaveButton();
        },
        "Ctrl-S": function(instance) {
          handleSaveButton();
        },
      }
    }
  );
};
