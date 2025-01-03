import './css/timeline.css';
import { NotionURL } from '../model/MiscStore';
import HocWindow from './hoc';


type TimelineType = {
  id: string,
  Title: string,
  Description: string,
  StartDate: string,
  EndDate: string,
  isPage: Boolean
}

let fetchRoutine = async () => {
  let res = await fetch(`${NotionURL}/v1/table/70bfec27eb6a4e11882b95e32bfdcdca`);
  let json = await res.json();
  let final_result = json.sort((a: TimelineType,b: TimelineType) => {
    let d1 = new Date(a.StartDate);
    let d2 = new Date(b.StartDate);
    if (d1 > d2) {
      return 1; 
    }
    return -1;
  });

  return final_result;
}

let content = (timeline: any, pageClick: any) => {
  return (
    <ul className="timeline">
      {timeline.map((ev: TimelineType, i: number) => {
          return (
            <li key={ev.Title}>
              <div className={i % 2 === 0 ? "direction-r":"direction-l"}>
                <div className="flag-wrapper">
                  <span className="flag">{ev.Title}</span>
                  <span className="time-wrapper"><span className="time"> {ev.StartDate} {ev.EndDate ? "to" : ""} {ev.EndDate ?? ""} </span></span>
                </div>
                <div className="desc">{ev.Description}

                {ev.isPage ? 
                      <>
                      <br/>
                      <br/>
                      <a style={{cursor: "pointer", background: "red", textDecoration: "underline", margin: "10px", border: "1px solid white", padding: "10px"}} 
                        onClick={() => pageClick(ev.id,ev.Title)}>Learn More</a>
                      </>
                      : <></>}
              </div>

              </div>

            </li>

          );
      }
              )}

    </ul>
  );
}

export default function Timeline() {
  return (
    <HocWindow content={content} fetchRoutine={fetchRoutine} />
  );
}
