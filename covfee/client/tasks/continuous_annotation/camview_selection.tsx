import React, { useEffect, useRef, useState } from "react"
// You can download this image and place it in the art folder from:
// @covfee.ewi.tudelft.nl:/home/kfunesmora/conflab-media/
// Do not commit to the repo for confidentiality reasons.
import SvgCamMultiview from "../../art/cam-multiview.svg"
import styles from "./continous_annotation.module.css"

type Props = {
  selectedView: number
  setSelectedView: (index: number) => void
  layoutIsVertical: boolean
  numberOfViews: number
}

const CamViewSelection: React.FC<Props> = (props) => {
  const selectedView = props.selectedView
  const setSelectedView = props.setSelectedView
  const layoutIsVertical = props.layoutIsVertical
  const numberOfViews = props.numberOfViews
  const [svgSize, setSvgSize] = useState({
    width: 0,
    height: 0,
  })

  const containerRef = useRef(null)
  const svgResizeObserver = useRef(null)

  const handleClickOnMultiviewImage = (e: MouseEvent) => {
    // Based on the known gallery image of participants, we calculate in which
    // participant the click is falling in.
    if (containerRef.current) {
      const camMultiviewImageElement =
        containerRef.current.querySelectorAll("svg")[0]
      if (camMultiviewImageElement) {
        var imageRect = camMultiviewImageElement.getBoundingClientRect()

        if (layoutIsVertical) {
          var mouse_pos: number = e.clientY
          var rect_start = imageRect.top
          var rect_length = imageRect.height
        } else {
          var mouse_pos: number = e.clientX
          var rect_start = imageRect.left
          var rect_length = imageRect.width
        }

        setSelectedView(
          Math.floor((numberOfViews * (mouse_pos - rect_start)) / rect_length)
        )
      }
    }
  }

  // We create a ResizeObserver to keep track of the size of the svg element
  useEffect(() => {
    const camMultiviewImageElement = containerRef.current.querySelector("svg")
    if (camMultiviewImageElement) {
      svgResizeObserver.current = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect
          setSvgSize({ width, height })
        }
      })
      svgResizeObserver.current.observe(camMultiviewImageElement)
    }
    return () => {
      if (svgResizeObserver.current) {
        svgResizeObserver.current.disconnect()
      }
    }
  }, [])

  /**************Bounding box geometry **************************/
  var boundingBoxRect = { top: 0, left: 0, ...svgSize }
  if (layoutIsVertical) {
    boundingBoxRect = {
      ...boundingBoxRect,
      height: svgSize.height / numberOfViews,
      top: (selectedView * svgSize.height) / numberOfViews - svgSize.height,
    }
  } else {
    boundingBoxRect = {
      ...boundingBoxRect,
      width: svgSize.width / numberOfViews,
      left: (selectedView * svgSize.width) / numberOfViews - svgSize.width,
    }
  }
  const boundingBoxRectPx = Object.fromEntries(
    Object.entries(boundingBoxRect).map(([key, value]) => [key, `${value}px`])
  )

  return (
    <div ref={containerRef}>
      <SvgCamMultiview
        onClick={handleClickOnMultiviewImage}
        className={styles["camview-selection-image"]}
      />
      <div style={{ position: "relative", width: 0, height: 0 }}>
        <div
          className={styles["camview-selection-bounding-box"]}
          style={{
            position: "relative",
            ...boundingBoxRectPx,
            zIndex: 999,
          }}
        />
      </div>
    </div>
  )
}

export default CamViewSelection
