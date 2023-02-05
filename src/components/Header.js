import "./Header.css"

import React from "react"

const N_IMAGES = 5
const randomImage = () => Math.ceil(Math.random() * N_IMAGES)

export default function Header() {
  let [image, setImage] = React.useState(randomImage())
  let [inverted, setInverted] = React.useState(false)
  let [tetras, setTetras] = React.useState(parseInt(localStorage.getItem("tetras")) || 0)
  let textRef = React.createRef()

  let hoverTimeout = null

  const title = () => `${"Δ".repeat(tetras)}${tetras === 0 ? "" : " "}prism`
  const antiTitle = () => `${"Δ".repeat(tetras)}${tetras === 0 ? "" : " "}tetrahedron`

  const onHover = () =>
    hoverTimeout = setTimeout(() => {
      setTetras(tetras + 1)
      localStorage.setItem("tetras", tetras + 1)

      setInverted(true)
    }, 5000)

  const onUnhover = () => {
    clearTimeout(hoverTimeout)

    setInverted(false)
  }

  return <div className="header">
    <img
      src={require(`../assets/prism${image}.png`).default}
      className="header-image"
      onClick={() => setImage(image % N_IMAGES + 1)} />
    { inverted
    ? <span
        className="header-text header-text-inverted"
        onMouseEnter={onHover}
        onMouseLeave={onUnhover}
        ref={textRef}>{antiTitle()}</span>
    : <span
        className="header-text"
        onMouseEnter={onHover}
        onMouseLeave={onUnhover}
        ref={textRef}>{title()}</span>}
  </div>
}
