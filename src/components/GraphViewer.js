import Graph from "./Graph.js"
import Header from "./Header.js"
import "./GraphViewer.css"

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
            key={g.name}
            onClick={() => setGraph(g.name)}>
              {g.name}
              {graphs.length > 1
              ? <Delete
                  className="graph-viewer-list-item-delete"
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
  let [graph, setGraph] = useState("home")

  const onKey = e => {
    if (e.key === "Enter")
      setGraph(e.target.value)
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
    // if (name === graph)
    //   setGraph("home")

    const newGraphs = graphs.filter(g => g.name !== name)
    setGraphs(newGraphs)
    localStorage.setItem("graphs", JSON.stringify(newGraphs))

    localStorage.removeItem(`graph-${name}`)
  }

  return <div className="graph-viewer">
    <Header />
    {apiKey
    ? <>
        <div className="graph-viewer-input">
          <Description fontSize="small" />
          <input
            className="graph-viewer-input-inner"
            placeholder="..."
            type="text"
            onKeyDown={onKey} />
        </div>
        <GraphList graphs={graphs} setGraph={setGraph} deleteGraph={deleteGraph} />
        <Graph key={graph} apiKey={apiKey} name={graph} updateGraphs={updateGraphs} />
      </>
    : <APIKeyModal callback={apiCallback} />}
  </div>
}
