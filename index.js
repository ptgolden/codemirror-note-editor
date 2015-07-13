"use strict";

const sampleData = `
# Header

This is the start of the note

::: document 187
this is a cited document

> passage from the document

comment on this passage
:::

and...

this is the end of the note.
`

var regex = /^document\s+(\d+)$/
  , md

md = require('markdown-it')()
  .use(require('markdown-it-container'), 'document', {
    validate: params => params.trim().match(regex),
    render: function (tokens, idx) {
      var match = tokens[idx].info.trim().match(regex);

      return tokens[idx].nesting === 1 ?
        `<div class="document"><h4>Document ${match[1]}</h4>\n` :
        '</div>\n'
    }
  })

function renderPreview(text) {
  document.getElementById('preview').innerHTML = md.render(text);
}

renderPreview(sampleData);

var CodeMirror = require('codemirror')

require('codemirror/mode/gfm/gfm');
require('./en-markdown_mode');

var editor = CodeMirror(document.getElementById('editor'), {
  value: sampleData,
  mode: 'en-markdown'
});

// CodeMirror.TextMarker instances, in order
editor._sectionMarks = [];

function isInSection(cm, line) {
  var state = cm.getStateAfter(line);
  return (state.base.inCitation || state.base.inNoteReference);
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

function updateDocumentMarks(cm, fromLine=0, toLine) {
  var checkLine = fromLine
    , ranges = [];

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

  // TODO: Now, run markText for each of these ranges if they do not already
  // exist in cm._sectionMarks
}

editor.on('change', () => renderPreview(editor.getValue()));

editor.on('change', function (cm, { from, to }) {
  var fromLine = from.line
    , toLine = to.line

  updateDocumentMarks(cm, fromLine, toLine);
});
