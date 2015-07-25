"use strict";

var CodeMirror = require('codemirror')

require('codemirror/mode/markdown/markdown')

CodeMirror.defineMode('en-markdown', function (config) {
  var enOverlay = {
    startState: function () {
      return {
        inCitation: false,
        inNoteReference: false
      }
    },

    token: function (stream, state) {
      if (!state.inCitation && !state.inNoteReference && stream.match(/^::: document/, true)) {
        state.inCitation = true;
        stream.skipToEnd();
        return 'citation-start';
      }

      if (!state.inCitation && !state.inNoteReference && stream.match(/^::: note/, true)) {
        state.inNote = true;
        stream.skipToEnd();
        return 'noteReference-start';
      }

      if ((state.inCitation || state.inNote) && stream.match(/^:::/)) {
        let prefix = state.inCitation ? 'citation' : 'noteReference';
        state.inCitation = state.inNote = false;
        stream.skipToEnd();
        return prefix + '-stop';
      }

      stream.skipToEnd();
      return null;
    }
  }

  return CodeMirror.overlayMode(enOverlay, CodeMirror.getMode(config, 'markdown'));
});
