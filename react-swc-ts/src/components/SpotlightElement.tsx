import { ReactElement, useState , useRef} from "react";
import useWindowStore from "../model/WindowStore";
import DraggableWindow from "./DraggableWindow/main";

export enum spotlightElementType {
  link,
  window
};

export type link = { type: spotlightElementType,href: string};
export type window = {type: spotlightElementType,title: string, content: ReactElement};

export type spotlightElementProps = {
  icon: string, 
  description: string,
  value: link | window,
};


function SpotLightElement(props: spotlightElementProps) {

  let [windowVisible,toggleWindowVisibility] = useState(false);
  let windowRef = useRef<HTMLDivElement>(null);

  /**
   * Activate on Spotlight element click 
   *
   * @param {window} element  
   */
  function windowClick() {
    if (windowRef.current)  {
      windowRef.current!.style.display = "block";
    }
    toggleWindowVisibility(true);
  }


  return (<>
    {props.value.type === spotlightElementType.window ?
      <div className="spotlight-elements" onClick={() => {windowClick()}}>
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

      {windowVisible? <DraggableWindow ref={windowRef} title={(props.value as window).title} content={(props.value as window).content} /> : <></> }
  </>);
}

export default SpotLightElement;
