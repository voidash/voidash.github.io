import { useEffect } from 'react';
import './App.css'
import NavBoard from './components/navBoard.tsx'

import useWindowStore from './model/WindowStore.tsx';
import DraggableWindow from './components/DraggableWindow/main.tsx';
import { Spinner } from './components/spinner.tsx';
import { NotionRenderer } from 'react-notion';
import { NotionURL } from './model/MiscStore.tsx';
import { mainSpotlightElements, miscellaneous } from './components/listOfSpotLightElements.tsx';
import HocWindow from './pages/hoc.tsx';
import Admin from './pages/admin.tsx';



function App() {


  let windows = useWindowStore((state) => state.windows); 
  let removeWindow = useWindowStore((state) => state.disableRecent);
  let addWindow = useWindowStore((state) => state.addWindow);

  useEffect(() => {
    const gradient = document.querySelector(".moving-gradient") as HTMLDivElement;

    console.log("stateChange");
    document.body.addEventListener("mousemove", (event) => {
        gradient.style.left = `${event.clientX}px`;
        gradient.style.top = `${event.clientY}px`;  
      });

    resolvePath();
    window.addEventListener("popstate", () => {
        console.log("popper");
        removeWindow();
    })
  },[]);

  function resolvePath() {
      let splitPaths = window.location.pathname.split("/");

      // if pathname is empty
      if (splitPaths.length < 2) {
          return undefined;
      }


      if (splitPaths[1] === "notion") {
        //use notion url
        let path = splitPaths[2];
        // build url and then fetch routine
        let url = `${NotionURL}/v1/page/${path}`;

        let fetchRoutine = async () => {
            let res = await fetch(url);
            let final = await res.json();
            return final;
        }

        // build content
        let content = (maincontent: any, pageClick: any) => {
          return (<div>
                  <p>Thanks for looking by</p>
                  <hr/>
                  {Object.keys(maincontent).length === 0 ? <Spinner/>:<NotionRenderer fullPage hideHeader blockMap={maincontent}
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

        let cnt = <HocWindow content={content} fetchRoutine={fetchRoutine}/>;
        addWindow(window.location.pathname, "Notion Window", cnt);

      } else if(splitPaths[1] === 'admin') {
          addWindow("admin", "admin dashboard", <Admin/>)
        
      } else {
        // try to check our own elements
        let element = mainSpotlightElements
          .concat(miscellaneous).find((el) => {
            return (el.value as any).url === splitPaths[1];
          });
        
        // if element is found
        if (element !== undefined) {
          let w = element.value as any;
          addWindow(w.url, w.title, w.content);
        }
      }

      return undefined;
  }

  return (
      <>
        <div className="moving-gradient"></div>
        <div className="backdrop-content unselectable">
          MEANING PSYCHOLOGY PHILOSOPHY INNATE CURIOSITY 
        </div>
      <center>
          <h1>Ashish Thapa</h1>
      </center>

        <NavBoard/>
        {windows.map((w) => {
              return (<DraggableWindow sref={w.sref} url={w.url} key={w.url} title={w.title} content={w.content} disableWindow={w.disableWindow} />);
        })}
      </>
    )
}

export default App
