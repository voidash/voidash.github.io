import { useEffect } from 'react';
import './App.css'
import NavBoard from './components/navBoard.tsx'

import DraggableWindow from './components/DraggableWindow/main.tsx';
import useWindowStore from './components/model/WindowStore.tsx';

function App() {

let shouldActivateWindow = useWindowStore((state) => state.shouldActivateWindow); 
let windowTitle = useWindowStore((state) => state.windowTitle);
let windowContent = useWindowStore((state) => state.windowContent);

 useEffect(() => {
    const gradient = document.querySelector(".moving-gradient") as HTMLDivElement;

  document.body.addEventListener("mousemove",(event) => {
      gradient.style.left = `${event.clientX}px`;
      gradient.style.top = `${event.clientY}px`;  
    });
  },[]);



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

      {shouldActivateWindow === true ? <DraggableWindow title={windowTitle} content={windowContent} /> : <></>}
    </>
  )
}

export default App
