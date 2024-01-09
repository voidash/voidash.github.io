import { ReactElement, useState } from "react";
import DraggableWindow from "./DraggableWindow/main";

export enum spotlightElementType {
  link,
  window
};

type link = { type: spotlightElementType,href: string};
type window = {type: spotlightElementType,title: string, content: ReactElement};

export type spotlightElementProps = {
  icon: string, 
  description: string,
  value: link | window,
};

function SpotLightElement(props: spotlightElementProps) {

  function windowClick(element: window) {
    console.log("clicked");
  }


  return (<>
    {props.value.type === spotlightElementType.window ?
      <div className="spotlight-elements" onClick={() => {}}>
        <img src={props.icon} className="icon-png icon-small" style={{
          marginRight: "10px"
      }} />
          {props.description}

      </div>
      :
      <a style={{display: "block", textDecoration: "none"}} className="spotlight-elements" target="blank" href={(props.value as link).href}>
        <img src={props.icon} className="icon-png icon-small" style={{
          marginRight: "10px"
      }} />
          {props.description}
      </a>
      }
  </>);
}

export default SpotLightElement;
