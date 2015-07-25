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

var editor = require('./src/editor')(document.getElementById('editor'), sampleData);

editor.on('change', () => renderPreview(editor.getValue()));
