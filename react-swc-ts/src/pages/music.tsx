import "react-notion/src/styles.css";
import "prismjs/themes/prism-tomorrow.css";
import { NotionRenderer } from "react-notion"; 
import { NotionURL } from "../model/MiscStore";
import { useEffect, useState } from "react";
import { Spinner } from "../components/spinner";
import HocWindow from "./hoc";


let content = (maincontent: any, pageClick: any) => {
  return (<div>
          <p>Some of the finest hours of my life</p>
          <hr/>
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
    let res = await fetch(`${NotionURL}/v1/page/Music-I-listen-to-f114f9d0040842adb8649125f13407dc`);
    let final = await res.json();
    console.log(final);

    return final;
}
export function Music() {
  return (
    <HocWindow content={content} fetchRoutine={fetchRoutine} />
  );
}
