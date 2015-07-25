"use strict";

var CodeMirror = require('codemirror')

require('codemirror/mode/gfm/gfm');
require('./en-markdown_mode');

function isInSection(cm, line) {
  var state = cm.getStateAfter(line);
  return state.base.inCitation;
}

function getSectionRange(cm, start=null, line) {
  if (start === null) {
    // Don't assume this line is the start; go backward first to find the
    // first line of the section.
    let startLine = line

    if (!isInSection(cm, line)) {
      throw new Error(`line ${line} is not in a section`);
    }

    while (startLine > 0) {
      if (!isInSection(cm, startLine - 1)) break;
      startLine -= 1;
    }

    return getSectionRange(cm, startLine);
  } else {
    // Go forward to find the last line of this section
    let numLines = cm.doc.lineCount()
      , checkLine = start
      , endLine = Infinity

    // FIXME: check if start is in section
    while (checkLine <= numLines) {
      if (!isInSection(cm, checkLine)) {
        endLine = checkLine;
        break;
      }
      checkLine += 1;
    }

    return [start, endLine]
  }
}

function sweepDocumentMarks(cm, fromLine=0, toLine) {
  var checkLine = fromLine
    , ranges = []

  if (toLine === undefined) toLine = cm.doc.lineCount();

  if (isInSection(cm, fromLine)) {
    let initialRange = getSectionRange(cm, null, fromLine);
    ranges.push(initialRange);

    // Advance past the end of this range
    checkLine = initialRange[1] + 1;
  }

  while (checkLine <= toLine) {
    if (isInSection(cm, checkLine)) {
      let range = getSectionRange(cm, checkLine);
      ranges.push(range);

      // Advance to the end of this range
      checkLine = range[1];
    }

    checkLine += 1;
  }

  updateDocumentMarks(cm, ranges);
}

function updateDocumentMarks(cm, ranges) {
  var currentMarks = cm._blockMarks.map(mark => mark.find())

  if (!currentMarks.length) {
    ranges.forEach(([fromLine, toLine]) => {
      cm._blockMarks.push(cm.doc.markText(
        { line: fromLine, ch: 0 },
        { line: toLine, ch: 999 }
      ));

      for (var i = fromLine; i <= toLine; i++) {
        if (i === fromLine) {
          cm.doc.addLineClass(i, 'wrap', 'docblock-first');
        }
        cm.doc.addLineClass(i, 'wrap', 'docblock');
        if (i === toLine) {
          cm.doc.addLineClass(i, 'wrap', 'docblock-last');
        }
      }

    });
  }

}

module.exports = function (el, initialValue) {
  var editor = CodeMirror(el, {
    value: initialValue,
    mode: 'en-markdown'
  });

  editor._blockMarks = [];

  editor.on('change', (cm, { from, to }) => {
    var fromLine = from.line
      , toLine = to.line

    sweepDocumentMarks(cm, fromLine, toLine);
  });

  sweepDocumentMarks(editor);

  return editor;
}
