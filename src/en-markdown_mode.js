"use strict";

var CodeMirror = require('codemirror')

require('codemirror/mode/markdown/markdown')

CodeMirror.defineMode('en-markdown', function (config) {
  var enOverlay = {
    startState: function () {
      return { inCitation: false }
    },

    token: function (stream, state) {
      if (!state.inCitation && stream.match(/^::: document/, true)) {
        state.inCitation = true;
        stream.skipToEnd();
        return null;
      }

      if (state.inCitation && stream.match(/^:::/)) {
        state.inCitation = false;
        stream.skipToEnd();
        return null;
      }

      stream.skipToEnd();
      return null;
    }
  }

  return CodeMirror.overlayMode(enOverlay, CodeMirror.getMode(config, 'markdown'));
});
