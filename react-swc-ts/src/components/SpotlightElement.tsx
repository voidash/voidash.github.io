import { ReactElement,  useRef} from "react";
import useWindowStore from "../model/WindowStore";


export enum spotlightElementType {
  link,
  window
};

export type link = { type: spotlightElementType,href: string};
export type window = {type: spotlightElementType, url: string, title: string, content: ReactElement};

export type spotlightElementProps = {
  icon: string, 
  description: string,
  value: link | window,
};


function SpotLightElement(props: spotlightElementProps) {
  
  let addWindow = useWindowStore((state) => state.addWindow);
  let windowRef = useRef<HTMLDivElement>(null);

  function windowClick() {
    let windowDescription = props.value as window;
    if (windowRef.current)  {
      windowRef.current!.style.display = "block";
    }

    addWindow(windowDescription.url, windowDescription.title, windowDescription.content);
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

  </>);
}

export default SpotLightElement;
