import { useEffect } from 'react';
import './App.css'
import NavBoard from './components/navBoard.tsx'

import useWindowStore from './model/WindowStore.tsx';
import DraggableWindow from './components/DraggableWindow/main.tsx';
import { NotionURL } from './model/MiscStore.tsx';

function App() {
let windows = useWindowStore((state) => state.windows); 

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
     {windows.map((w) => {
            return (<DraggableWindow id={w.id} key={w.id} title={w.title} content={w.content} ref={w.ref} disableWindow={w.disableWindow} />);
      })}

    </>
  )
}

export default App
