import { styled } from "styled-components"
import { NodeType } from "../../types/node"
import { NodeButtons } from "./node_buttons"
import React from "react"

export const ButtonsContainer = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;

  > li {
    display: inline-block;
    margin: 0 0.2em;

    button {
      cursor: pointer;
    }
  }
`

export type HoveringButtonsArgs = {
  x: number
  y: number
  hide: boolean
}

export type HoveringButtonsProps = HoveringButtonsArgs & {
  onFocus: () => void
  onBlur: () => void
  content: () => React.ReactNode
}

export const HoveringButtons = ({
  x,
  y,
  hide = false,
  onFocus = () => {},
  onBlur = () => {},
  content = () => <></>,
}: HoveringButtonsProps) => {
  if (!hide)
    return (
      <div
        style={{
          zIndex: 100,
          position: "fixed",
          top: y,
          left: x,
          backgroundColor: "#ddd",
          borderRadius: "5px",
          padding: "3px",
        }}
        onMouseEnter={onFocus}
        onMouseLeave={onBlur}
      >
        {(() => {
          return content()
        })()}
      </div>
    )
}

export const Row = styled.div.attrs((p) => ({ className: p.className }))`
  display: block;
  margin: 0;
  padding: 5px 0;
  display: flex;
  flex-direction: row;

  &.danger {
    /* background-color: red; */
    background: repeating-linear-gradient(
      45deg,
      #ffeeee,
      #ffeeee 10px,
      white 10px,
      white 20px
    );
  }

  &.focus {
    background-color: rgba(94, 78, 78, 0.05);
  }

  > * {
    flex: 1 0 auto;
  }

  > a {
    width: 150px;
    max-width: 200px;
  }

  > .button {
    flex: 0 0 auto;
    width: 30px;
  }
`
