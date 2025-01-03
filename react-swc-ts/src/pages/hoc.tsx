import './css/timeline.css';
import { NotionURL } from '../model/MiscStore';
import { useEffect, useState } from "react";
import useWindowStore from '../model/WindowStore';
import { NotionRenderer } from 'react-notion';
import { Spinner } from '../components/spinner';


type TimelineType = {
  id: string,
  Title: string,
  Description: string,
  StartDate: string,
  EndDate: string,
  isPage: Boolean
}

type ContentStore = {
  fetchRoutine: () => any,
  content: (mainContent: any, pageClick: any) => any 
};

export default function HocWindow(props: ContentStore) {
  let [mainContent,setMainContent] = useState<Array<TimelineType> | null>(null);
  let [fetching, setFetching] = useState<boolean>(false);
  let addWindow = useWindowStore((state) => state.addWindow);
  

  useEffect(()=> {
      props.fetchRoutine().then((val: any) => {
        setMainContent(val);
      });
  },[]);

  
  let pageClick = async (id: string,title: string)=> {
    setFetching(true);
    let datawork = await fetch(`${NotionURL}/v1/page/${id}`)
      .then(res => res.json());

     addWindow(`notion/${id}` , title, <NotionRenderer blockMap={datawork} customBlockComponents={{
       page : ({blockValue, renderComponent}) => {
          return (<div style={{cursor: "pointer",textDecoration: "underline",}} 
          onClick={(e) => {
            e.preventDefault();
            pageClick(blockValue.id, blockValue.properties.Title);
          }}>{renderComponent()}</div>)}
      }} />);

    setFetching(false);
};

return (
    <div>
    {fetching ? <div className="notify-bar">Fetching</div>: <></>}
    {mainContent !== null ? props.content(mainContent, pageClick): <Spinner/>}
  </div>
);

}
