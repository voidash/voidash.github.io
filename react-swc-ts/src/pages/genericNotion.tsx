import "react-notion/src/styles.css";
import "prismjs/themes/prism-tomorrow.css";
import { NotionRenderer } from "react-notion"; 
import { NotionURL } from "../model/MiscStore";
import { ReactElement } from "react";
import { Spinner } from "../components/spinner";
import HocWindow from "./hoc";



interface NotionPageProps {
  url: string, 
  heroContent?: ReactElement
}

export function NotionPage(props: NotionPageProps) {

let content = (maincontent: any, pageClick: any) => {
  return (<div>
      {props.heroContent != undefined ? props.heroContent: ""}
      {Object.keys(maincontent).length === 0 ? <Spinner/> :<NotionRenderer fullPage hideHeader blockMap={maincontent}
      customBlockComponents={{
       page : ({blockValue, renderComponent}) => {
          return (<div style={{cursor: "pointer",textDecoration: "underline",}} 
          onClick={(e) => {
            e.preventDefault();
            pageClick(blockValue.id, blockValue.properties.Title);
          }}>{renderComponent()}</div>)}
      }} 
    />}
        </div>)
}

let fetchRoutine = async () => {
    let res = await fetch(`${NotionURL}/v1/page/${props.url}`);
    let final = await res.json();
    console.log(final);

    return final;
}

  return (
    <HocWindow content={content} fetchRoutine={fetchRoutine} />
  );
}
