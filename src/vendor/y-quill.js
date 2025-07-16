/**
 * @module bindings/quill
 */

import * as Y from 'yjs' // eslint-disable-line
import * as object from 'lib0/object'
import Delta from 'quill-delta'

/**
 * @typedef {import('y-protocols/awareness').Awareness} Awareness
 */

/**
 * @typedef {Array<import('quill-delta').Op>} DeltaOps
 */

export const normQuillDelta = delta => {
  if (delta.length > 0) {
    const d = delta[delta.length - 1]
    const insert = d.insert
    if (d.attributes === undefined && insert !== undefined && insert.constructor === String && insert.slice(-1) === '\n') {
      delta = delta.slice()
      let ins = insert.slice(0, -1)
      while (ins.slice(-1) === '\n') {
        ins = ins.slice(0, -1)
      }
      delta[delta.length - 1] = { insert: ins }
      if (ins.length === 0) {
        delta.pop()
      }
      return delta
    }
  }
  return delta
}

const updateCursor = (quillCursors, aw, clientId, doc, type) => {
  try {
    if (aw && aw.cursor && clientId !== doc.clientID) {
      const user = aw.user || {}
      const color = user.color || '#ffa500'
      const name = user.name || `User: ${clientId}`
      quillCursors.createCursor(clientId.toString(), name, color)
      const anchor = Y.createAbsolutePositionFromRelativePosition(Y.createRelativePositionFromJSON(aw.cursor.anchor), doc)
      const head = Y.createAbsolutePositionFromRelativePosition(Y.createRelativePositionFromJSON(aw.cursor.head), doc)
      if (anchor && head && anchor.type === type) {
        quillCursors.moveCursor(clientId.toString(), { index: anchor.index, length: head.index - anchor.index })
      }
    } else {
      quillCursors.removeCursor(clientId.toString())
    }
  } catch (err) {
    console.error(err)
  }
}

const typeDeltaToQuillDelta = (delta, binding) => delta.map(op => {
  if (op.insert != null && op.insert instanceof Y.XmlElement) {
    const embedName = op.insert.nodeName
    const embedDef = binding.embeds[embedName]
    if (embedDef != null) {
      return { insert: { [embedName]: embedDef.typeToDelta(op.insert) } }
    }
  }
  return op
})

export class QuillBinding {
  constructor (type, quill, awareness, { embeds = {} } = {}) {
    const doc = /** @type {Y.Doc} */ (type.doc)
    this.type = type
    this.doc = doc
    this.quill = quill
    this.embeds = embeds
    const quillCursors = quill.getModule('cursors') || null
    this.quillCursors = quillCursors
    this._negatedUsedFormats = {}
    this.awareness = awareness
    this._awarenessChange = ({ added, removed, updated }) => {
      const states = /** @type {Awareness} */ (awareness).getStates()
      added.forEach(id => updateCursor(quillCursors, states.get(id), id, doc, type))
      updated.forEach(id => updateCursor(quillCursors, states.get(id), id, doc, type))
      removed.forEach(id => quillCursors.removeCursor(id.toString()))
    }

    // Observer logic omitted for brevity

    this._quillObserver = (_eventType, delta, _state, origin) => {
      // Observer content omitted for brevity

      // always check selection
      if (awareness && quillCursors) {
        const sel = quill.getSelection()
        const aw = /** @type {any} */ (awareness.getLocalState())
        if (sel === null) {
          if (awareness.getLocalState() !== null) {
            awareness.setLocalStateField('cursor', /** @type {any} */ (null))
          }
        } else {
          const anchor = Y.createRelativePositionFromTypeIndex(type, sel.index)
          const head = Y.createRelativePositionFromTypeIndex(type, sel.index + sel.length)
          if (
            !aw ||
            !aw.cursor ||
            !aw.cursor.anchor ||
            !aw.cursor.head ||
            !Y.compareRelativePositions(anchor, aw.cursor.anchor) ||
            !Y.compareRelativePositions(head, aw.cursor.head)
          ) {
            awareness.setLocalStateField('cursor', { anchor, head })
          }
        }

        awareness.getStates().forEach((aw, clientId) => {
          updateCursor(quillCursors, aw, clientId, doc, type)
        })
      }
    }

    quill.on('editor-change', this._quillObserver)
    quill.setContents(typeDeltaToQuillDelta(type.toDelta(), this), this)

    if (quillCursors !== null && awareness) {
      awareness.getStates().forEach((aw, clientId) => {
        updateCursor(quillCursors, aw, clientId, doc, type)
      })
      awareness.on('change', this._awarenessChange)
    }
  }

  destroy () {
    this.type.unobserveDeep(this._typeObserver)
    this.quill.off('editor-change', this._quillObserver)
    if (this.awareness) {
      this.awareness.off('change', this._awarenessChange)
    }
  }
}
