import Graph from "./Graph.js"
import Header from "./Header.js"
import "./GraphViewer.css"

import AddCircle from "@mui/icons-material/AddCircle"
import Delete from "@mui/icons-material/Delete"
import Description from "@mui/icons-material/Description"
import React, { createRef, useState } from "react"

const noGraphsFlavorText = () => {
  const sentences = [
    "I haven't written flavor text yet. You have no graphs.",
  ]
  return sentences[Math.floor(Math.random() * sentences.length)]
}

function APIKeyModal({ callback }) {
  const ref = createRef()

  return <div className="graph-viewer-api">
    <div className="graph-viewer-api-text">please enter your openai api key:</div>
    <input className="graph-viewer-api-input" type="text" ref={ref} spellCheck={false} />
    <button className="graph-viewer-api-submit" onClick={() => callback(ref.current.value)}>submit</button>
  </div>
}

function GraphList({ graphs, deleteGraph, setGraph }) {
  return <div className="graph-viewer-list">
    {graphs.length
      ? <>
        {graphs
          .sort((a, b) => b.time - a.time)
          .map(g => <div
            className="graph-viewer-list-item"
            key={g.name}>
              <span
                className="graph-viewer-list-item-text"
                onClick={() => setGraph(g.name)}
                title={g.name}>
                <Description className="graph-viewer-list-item-icon" fontSize="small" />
                {g.name}
              </span>
              {graphs.length > 1
              ? <Delete
                  className="graph-viewer-list-item-icon"
                  fontSize="small"
                  onClick={() => deleteGraph(g.name)} />
              : null}
            </div>)}
      </>
      : <span className="graph-viewer-list-empty">{noGraphsFlavorText()}</span>}
  </div>
}

export default function GraphViewer() {
  let [apiKey, setApiKey] = useState(localStorage.getItem("apiKey"))
  let [graphs, setGraphs] = useState(JSON.parse(localStorage.getItem("graphs")) || [])
  let [graph, setGraph] = useState(graphs[0]?.name || "home")

  const onKey = e => {
    if (e.key === "Enter") {
      setGraph(e.target.value)
      e.target.value = ""
    }
  }

  const apiCallback = key => {
    localStorage.setItem("apiKey", key)
    setApiKey(key)
  }

  const updateGraphs = name => {
    let newGraphs
    if (graphs.find(g => g.name === name))
      newGraphs = graphs.map(g => g.name === name ? { ...g, time: Date.now() } : g)
    else
      newGraphs = [...graphs, { name, time: Date.now() }]

    setGraphs(newGraphs)
    localStorage.setItem("graphs", JSON.stringify(newGraphs))
  }

  const deleteGraph = name => {
    const newGraphs = graphs.filter(g => g.name !== name)
    setGraphs(newGraphs)
    localStorage.setItem("graphs", JSON.stringify(newGraphs))

    localStorage.removeItem(`graph-${name}`)
  }

  const renameGraph = (oldName, newName) => {
    const newGraphs = graphs.map(g => g.name === oldName ? { ...g, name: newName } : g)
    setGraphs(newGraphs)
    localStorage.setItem("graphs", JSON.stringify(newGraphs))

    localStorage.setItem(`graph-${newName}`, localStorage.getItem(`graph-${oldName}`))
    localStorage.removeItem(`graph-${oldName}`)

    setGraph(newName)
  }

  return <div className="graph-viewer">
    <Header />
    {apiKey
    ? <>
        <div className="graph-viewer-body">
          <div className="graph-viewer-sidebar">
            <div className="graph-viewer-input">
              <AddCircle fontSize="small" />
              <input
                className="graph-viewer-input-inner"
                placeholder="..."
                type="text"
                onKeyDown={onKey} />
            </div>
            <GraphList graphs={graphs} setGraph={setGraph} deleteGraph={deleteGraph} />
          </div>
          <Graph
            key={graph}
            apiKey={apiKey}
            name={graph}
            updateGraphs={updateGraphs}
            renameGraph={renameGraph} />
        </div>
      </>
    : <APIKeyModal callback={apiCallback} />}
  </div>
}
