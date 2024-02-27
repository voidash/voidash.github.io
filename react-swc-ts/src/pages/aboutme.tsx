import { NotionRenderer } from "react-notion"; 
import { NotionURL } from "../model/MiscStore";
import { useEffect, useState } from "react";
import { Spinner } from "../components/spinner";
import "react-notion/src/styles.css";
import "prismjs/themes/prism-tomorrow.css";



export default function Aboutme() {
  let [aboutme, setAboutme] = useState({});

  useEffect(()=> {
    fetch(`${NotionURL}/v1/page/About-Me-3aec394784ab48dd90fbe44b948a7da9`)
        .then(res => res.json())
        .then(json => setAboutme(json))
  },[]);

  return (
        <div>
          <h1>Hello</h1>
          {Object.keys(aboutme).length === 0 ? <Spinner/> :<NotionRenderer blockMap={aboutme}/>}
        </div>
  );
}
