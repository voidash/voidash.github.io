import './css/timeline.css';
import { NotionURL } from '../model/MiscStore';
import { useEffect, useRef, useState } from "react";
import DraggableWindow from '../components/DraggableWindow/main';
import { window } from '../components/SpotlightElement';


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
  let [timelineDetails, setTimelineDetails] = useState<window | null>(null);
  let [showAdditionalTimeline, activateAdditionalTimeline] = useState([false,1]);

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
                  <div onClick={()=> {
                    activateAdditionalTimeline([true,i]);
                  }}>Learn More</div>

                  {showAdditionalTimeline[0] === true && showAdditionalTimeline[1] === i? <DraggableWindow key={ev.Title} ref={anotherRef} title={"katex"} content={<h1>post</h1>} /> : <></> }
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
