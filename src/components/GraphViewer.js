import Graph from "./Graph.js"
import Header from "./Header.js"
import "./GraphViewer.css"

import Description from "@mui/icons-material/Description"
import React, { createRef, useState } from "react"

function APIKeyModal({ callback }) {
  const ref = createRef()

  return <div className="graph-viewer-api">
    <div className="graph-viewer-api-text">please enter your openai api key:</div>
    <input className="graph-viewer-api-input" type="text" ref={ref} spellCheck={false} />
    <button className="graph-viewer-api-submit" onClick={() => callback(ref.current.value)}>submit</button>
  </div>
}

export default function GraphViewer() {
  let [apiKey, setApiKey] = useState(localStorage.getItem("apiKey"))
  let [graph, setGraph] = useState("home")

  const onKey = e =>
    e.key === "Enter" && setGraph(e.target.value)

  const apiCallback = key => {
    localStorage.setItem("apiKey", key)
    setApiKey(key)
  }

  return <div className="graph-viewer">
    <Header />
    {apiKey
    ? <>
        <div className="graph-viewer-input">
          <Description fontSize="small" />
          <input className="graph-viewer-input-inner" type="text" defaultValue={graph} onKeyDown={onKey} />
        </div>
        <Graph key={graph} apiKey={apiKey} name={graph} />
      </>
    : <APIKeyModal callback={apiCallback} />}
  </div>
}
