import "react-notion/src/styles.css";
import "prismjs/themes/prism-tomorrow.css";
import { NotionRenderer } from "react-notion"; 
import { NotionURL } from "../model/MiscStore";
import { useEffect, useState } from "react";
import { Spinner } from "../components/spinner";


export function Music() {
  let [aboutme, setAboutme] = useState({});

  useEffect(()=> {
    fetch(`${NotionURL}/v1/page/Music-I-listen-to-f114f9d0040842adb8649125f13407dc`)
        .then(res => res.json())
        .then(json => setAboutme(json))
  },[]);

  return (
        <div>
          <p>Some of the finest hours of my life</p>
          <hr/>
          {Object.keys(aboutme).length === 0 ? <Spinner/> :<NotionRenderer blockMap={aboutme}/>}
        </div>
  );
}
