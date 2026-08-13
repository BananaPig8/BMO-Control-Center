/*! Basic Compose YAML snippets for CodeMirror 5 (BMO appliance) */
(function (mod) {
  if (typeof CodeMirror !== "undefined") mod(CodeMirror);
})(function (CodeMirror) {
  "use strict";

  var SNIPPETS = [
    { text: "services:\n  ", displayText: "services:" },
    { text: "image: ", displayText: "image:" },
    { text: "ports:\n      - \"", displayText: "ports:" },
    { text: "volumes:\n      - ", displayText: "volumes:" },
    { text: "environment:\n      ", displayText: "environment:" },
    { text: "restart: unless-stopped", displayText: "restart:" },
    { text: "container_name: ", displayText: "container_name:" },
    { text: "networks:\n      - ", displayText: "networks:" },
    { text: "depends_on:\n      - ", displayText: "depends_on:" },
    { text: "command: ", displayText: "command:" },
  ];

  CodeMirror.registerHelper("hint", "yaml", function (cm) {
    var cur = cm.getCursor();
    var token = cm.getTokenAt(cur);
    var start = token.start;
    var end = cur.ch;
    var word = token.string.slice(0, Math.max(0, end - start));
    if (token.string === ":" || token.string === "-" || /\s/.test(token.string)) {
      word = "";
      start = end;
    }
    var list = SNIPPETS.filter(function (s) {
      if (!word) return true;
      return s.displayText.toLowerCase().indexOf(word.toLowerCase()) === 0;
    }).map(function (s) {
      return {
        text: s.text,
        displayText: s.displayText,
      };
    });
    return {
      list: list,
      from: CodeMirror.Pos(cur.line, start),
      to: CodeMirror.Pos(cur.line, end),
    };
  });
});
