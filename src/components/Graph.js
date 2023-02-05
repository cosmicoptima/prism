import "./Graph.css"
import "./Node.css"

import { nanoid } from "nanoid"
import { Configuration, OpenAIApi } from "openai"
import React, { createRef, useEffect, useState } from "react"
import ContentEditable from "react-contenteditable"
import { Oval } from "react-loader-spinner"

const createEmptyNode = parentId => ({
  id: nanoid(),
  parentId,
  text: "",
  pending: false,
})

function Node(props) {
  const ref = createRef()

  const { focus, nodes, onEdit, onKey } = props
  const childProps = { focus, nodes, onEdit, onKey }

  useEffect(() => {
    if (focus === props.id) ref.current.focus()
  })

  return (
    <div className="node">
      <div className="node-content">
        <div className="node-bullet" />
        <Oval
          color="#ccc"
          secondaryColor="#444"
          height={14}
          width={14}
          strokeWidth={6}
          secondaryStrokeWidth={6}
          visible={props.pending} />
        <ContentEditable
          className="node-text"
          disabled={props.pending}
          onBlur={() => onEdit(props.id, ref.current.innerText)}
          onChange={() => onEdit(props.id, ref.current.innerText)}
          onKeyDown={e => onKey(e, props.id, ref.current.innerText)}
          spellCheck={false}
          innerRef={ref}
          html={props.text} />
      </div>

      <div className="node-children">
        {nodes
          .filter(node => node.parentId === props.id)
          .map(node => <Node key={node.id} {...childProps} {...node} />)}
      </div>
    </div>
  )
}

export default function Graph({ apiKey, name, updateGraphs }) {
  const config = new Configuration({ apiKey })
  const openai = new OpenAIApi(config)

  let initialNodes = localStorage.getItem(`graph-${name}`)
  if (initialNodes) initialNodes = JSON.parse(initialNodes)
  else initialNodes = [createEmptyNode(null)]

  let [nodes, setNodes] = useState(initialNodes)
  let [focus, setFocus] = useState(null)

  const save = () => {
    localStorage.setItem(`graph-${name}`, JSON.stringify(nodes))
    updateGraphs(name)
  }

  const onEdit = (id, text) => {
    setNodes(nodes.map(node => {
      if (node.id === id) return { ...node, text }
      return node
    }))
    
    save()
  }

  const onKey = (e, id, text) => {
    setFocus(null)

    if (e.key === "Enter") {
      e.preventDefault()

      const newNode = createEmptyNode(nodes.find(node => node.id === id).parentId)

      const children = nodes.filter(node => node.parentId === id)
      const putAfter = children.length ? children[children.length - 1].id : id
      const index = nodes.findIndex(node => node.id === putAfter)

      setNodes([...nodes.slice(0, index + 1), newNode, ...nodes.slice(index + 1)])
      setFocus(newNode.id)

    } else if (e.key === "Backspace" && text === "") {
      e.preventDefault()

      if (nodes.length === 1) return
      if (nodes.some(node => node.parentId === id)) return

      const prevId = nodes[nodes.findIndex(node => node.id === id) - 1].id
      setNodes(nodes.filter(node => node.id !== id))
      setFocus(prevId)

    } else if (e.key === "Tab") {
      e.preventDefault()

      const parentId = nodes.find(node => node.id === id).parentId
      let newParentId = parentId

      if (e.shiftKey) {
        if (parentId) {
          const parentNode = nodes.find(node => node.id === parentId)
          newParentId = parentNode.parentId
        }
      } else {
        const index = nodes.findIndex(node => node.id === id)
        const nodesAbove = nodes.slice(0, index)
        const siblingsAbove = nodesAbove.filter(node => node.parentId === parentId)

        if (siblingsAbove.length > 0)
          newParentId = siblingsAbove[siblingsAbove.length - 1].id
      }

      setNodes(nodes.map(node => {
        if (node.id === id) return { ...node, parentId: newParentId }
        return node
      }))
      setFocus(id)

    } else if (e.key === "`" && text === "") {
      e.preventDefault()

      setNodes(nodes.map(node => {
        if (node.id === id) return { ...node, pending: true }
        return node
      }))

      const index = nodes.findIndex(node => node.id === id)
      const nodesAbove = nodes.slice(0, index + 1)

      let indentedNodes = []
      for (const node of nodesAbove)
        if (node.parentId === null)
          indentedNodes.push({ id: node.id, text: node.text, indent: 0 })
        else {
          const parentNode = indentedNodes.find(node_ => node_.id === node.parentId)
          indentedNodes.push({ id: node.id, text: node.text, indent: parentNode.indent + 1 })
        }

      console.log(indentedNodes)

      const prompt_ = indentedNodes
          .map(node => "  ".repeat(node.indent) + node.text)
          .join("\n")

      openai.createCompletion({
        model: "code-davinci-002",
        prompt: prompt_,
        max_tokens: 256,
        stop: "\n",
        temperature: 1,
      }).then(response => {
        setNodes(nodes.map(node => {
          if (node.id === id)
            return { ...node, text: response.data.choices[0].text.trim(), pending: false }
          return node
        }))
      })

    } else if (e.key === "ArrowUp") {
      e.preventDefault()

      const index = nodes.findIndex(node => node.id === id)
      if (index > 0) setFocus(nodes[index - 1].id)

    } else if (e.key === "ArrowDown") {
      e.preventDefault()

      const index = nodes.findIndex(node => node.id === id)
      if (index < nodes.length - 1) setFocus(nodes[index + 1].id)
    }

    save()
  }

  const props = { focus, nodes, onEdit, onKey }

  return <div className="graph">
    <span className="graph-name">{name}</span>
    {nodes
      .filter(node => node.parentId === null)
      .map(node => <Node
        key={node.id}
        {...props}
        {...node}
      />)
    }
  </div>
}
