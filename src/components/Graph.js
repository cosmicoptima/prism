import "./Graph.css"
import "./Node.css"

import { nanoid } from "nanoid"
import { Configuration, OpenAIApi } from "openai"
import React, { createRef, useEffect, useRef, useState } from "react"
import { Oval } from "react-loader-spinner"
import { useBeforeunload } from "react-beforeunload"

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

  useBeforeunload(() => {
    onEdit(props.id, ref.current.innerText)
  })

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
          height={13}
          width={13}
          strokeWidth={6}
          secondaryStrokeWidth={6}
          visible={props.pending} />
        <div
          className={`node-text${props.color ? ` node-text-${props.color}` : ""}`}
          contentEditable={!props.pending}
          ref={ref}
          suppressContentEditableWarning={true} 
          spellCheck={false}
          onBlur={e => onEdit(props.id, e.target.innerText)}
          onKeyDown={e => onKey(e, props.id, e.target.innerText)}>
          {props.text}
        </div>
      </div>

      <div className="node-children">
        {nodes
          .filter(node => node.parentId === props.id)
          .map(node => <Node key={node.id} {...childProps} {...node} />)}
      </div>
    </div>
  )
}

export default function Graph({ apiKey, name, renameGraph, updateGraphs }) {
  const config = new Configuration({ apiKey })
  const openai = new OpenAIApi(config)

  let initialNodes = localStorage.getItem(`graph-${name}`)
  if (initialNodes) initialNodes = JSON.parse(initialNodes)
  else initialNodes = [createEmptyNode(null)]

  let [nodes, setNodes] = useState(initialNodes)
  let [focus, setFocus] = useState(null)

  useEffect(() => {
    localStorage.setItem(`graph-${name}`, JSON.stringify(nodes))
    updateGraphs(name)
  }, [nodes])

  const onEdit = (id, text) =>
    setNodes(nodes.map(node => {
      if (node.id === id) return { ...node, text }
      return node
    }))

  const onKey = (e, id, text) => {
    setFocus(null)

    if (e.key === "Enter") {
      e.preventDefault()

      const newNode = createEmptyNode(nodes.find(node => node.id === id).parentId)

      let index
      if (e.shiftKey) {
        index = nodes.findIndex(node => node.id === id) - 1
      } else {
        const children = nodes.filter(node => node.parentId === id)
        const putAfter = children.length ? children[children.length - 1].id : id
        index = nodes.findIndex(node => node.id === putAfter)
      }

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

      const prompt_ = indentedNodes
          .map(node => "  ".repeat(node.indent) + "-* " + node.text)
          .join("\n")
      console.log(prompt_)

      openai.createCompletion({
        model: "code-davinci-002",
        prompt: prompt_,
        max_tokens: 256,
        temperature: 1,
        stop: ["\n"],
      }).then(res =>
          setNodes(nodes.map(node => {
            if (node.id === id) return {
              ...node,
              text: res.data.choices[0].text,
              pending: false 
            }
            return node
        }))
      )

    } else if (e.key === "ArrowUp") {
      e.preventDefault()

      const index = nodes.findIndex(node => node.id === id)
      if (index > 0) setFocus(nodes[index - 1].id)

    } else if (e.key === "ArrowDown") {
      e.preventDefault()

      const index = nodes.findIndex(node => node.id === id)
      if (index < nodes.length - 1) setFocus(nodes[index + 1].id)

    } else if (e.ctrlKey && e.key >= "1" && e.key <= "3") {
      let color = e.key === "1" ? "red" : e.key === "2" ? "yellow" : "green"

      const node = nodes.find(node => node.id === id)
      if (node.color === color) color = null

      setNodes(nodes.map(node => node.id === id ? { ...node, color } : node))
    }
  }

  const props = { focus, nodes, onEdit, onKey }

  return <div className="graph">
    <span
      className="graph-name"
      contentEditable={true}
      onBlur={e => renameGraph(name, e.target.innerText)}
      onKeyDown={e => e.key === "Enter" && e.target.blur()}
      spellCheck={false}
      suppressContentEditableWarning={true}>
      {name}
    </span>
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
