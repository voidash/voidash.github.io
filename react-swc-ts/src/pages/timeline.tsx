import './css/timeline.css';
import { NotionURL } from '../model/MiscStore';
import { useEffect, useRef, useState } from "react";
import DraggableWindow from '../components/DraggableWindow/main';
import { window } from '../components/SpotlightElement';
import useWindowStore from '../model/WindowStore';
import { NotionRenderer } from 'react-notion';


type TimelineType = {
  id: string,
  Title: string,
  Description: string,
  StartDate: string,
  EndDate: string,
  isPage: Boolean
}

export default function Timeline() {
  let [timeline,setTimeline] = useState<Array<TimelineType>>([]);
  let addWindow = useWindowStore((state) => state.addWindow);

  let anotherRef = useRef<HTMLDivElement>(null);

  useEffect(()=> {
    fetch(`${NotionURL}/v1/table/70bfec27eb6a4e11882b95e32bfdcdca`)
        .then(res => res.json())
        .then(json => {
          console.log(json);

          json.sort((a: TimelineType,b: TimelineType) => {
              let d1 = new Date(a.StartDate);
              let d2 = new Date(b.StartDate);
              if (d1 > d2) {
                return 1; 
              }
              return -1;
          });
          setTimeline(json);
        })
  },[]);

  // TODO:
  // add multiple Refs so that closing one of the child of timeline doesn't close all the windows
  
  let pageClick = async (id: string,title: string)=> {
  let datawork = await fetch(`${NotionURL}/v1/page/${id}`)
    .then(res => res.json());

   addWindow(title, <NotionRenderer blockMap={datawork} customBlockComponents={{
     page : ({blockValue, renderComponent}) => {
        return (<div style={{cursor: "pointer",textDecoration: "underline",}} 
        onClick={(e) => {
          e.preventDefault();
          pageClick(blockValue.id, blockValue.properties.Title);
        }}>{renderComponent()}</div>)}
    }} />, anotherRef);
};

  return (
    <div>
<ul className="timeline">
  {timeline.map((ev,i) => {
      return (
        <li key={ev.Title}>
          <div className={i % 2 === 0 ? "direction-r":"direction-l"}>
            <div className="flag-wrapper">
              <span className="flag">{ev.Title}</span>
              <span className="time-wrapper"><span className="time"> {ev.StartDate} {ev.EndDate ? "to" : ""} {ev.EndDate ?? ""} </span></span>
            </div>
            <div className="desc">{ev.Description}</div>

            {ev.isPage ? 
                  <>
                  <br/>
                  <a style={{cursor: "pointer", textDecoration: "underline", margin: "10px", border: "1px solid white", padding: "10px"}} 
                    onClick={() => pageClick(ev.id,ev.Title)}>Learn More</a>
                  </>
                  : <></>}

          </div>

        </li>

      );
  })}

</ul>
</div>
  );
}
