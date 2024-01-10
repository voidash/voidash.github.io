import { ReactElement, useState } from "react";
import DraggableWindow from "./DraggableWindow/main";
import useWindowStore from "./model/WindowStore";

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

  let activator = useWindowStore((state) => state.activateWindow);

  /**
   * Activate on Spotlight element click 
   *
   * @param {window} element  
   */
  function windowClick(element: window) {
    console.log("clicked");
    activator(element.title,element.content);
    // console.log(title);
  }


  return (<>
    {props.value.type === spotlightElementType.window ?
      <div className="spotlight-elements" onClick={() => {windowClick(props.value as window)}}>
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
