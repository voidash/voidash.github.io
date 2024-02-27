import './css/timeline.css';
import { NotionURL } from '../model/MiscStore';
import { useEffect, useState } from "react";
import DraggableWindow from '../components/DraggableWindow/main';


type TimelineType = {
  id: String,
  Title: String,
  Description: String,
  StartDate: String,
  EndDate: String,
  isPage: Boolean
}
export default function Timeline() {
  let [timeline,setTimeline] = useState<TimelineType>([]);
  useEffect(()=> {
    fetch(`${NotionURL}/v1/table/70bfec27eb6a4e11882b95e32bfdcdca`)
        .then(res => res.json())
        .then(json => {
          console.log(json);

          json.sort((a,b) => {
              let d1 = new Date(a.StartDate);
              let d2 = new Date(b.startDate);
              
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
          console.log(event);
      return (
        <li>
          <div className={i % 2 === 0 ? "direction-r":"direction-l"}>
            <div className="flag-wrapper">
              <span className="flag">{ev.Title}</span>
              <span className="time-wrapper"><span className="time"> {ev.StartDate} {ev.EndDate ? "to" : ""} {ev.EndDate ?? ""} </span></span>
            </div>
            <div className="desc">{ev.Description}</div>

            {ev.isPage ? 
                  <>
                  <div onClick={()=> {
                    console.log("something happened");
                  }}>Learn More</div>
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
