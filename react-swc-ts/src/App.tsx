import { useEffect } from 'react';
import './App.css'
import NavBoard from './components/navBoard.tsx'

import DraggableWindow from './components/DraggableWindow/main.tsx';

function App() {


/**
 * Mouse move event gradient 
 *
 * @param {MouseEvent} event  
 */

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
      <div className="backdrop-content">
        MEANING PSYCHOLOGY PHILOSOPHY INNATE CURIOSITY 
      </div>
    <center>
        <h1>Ashish Thapa</h1>
    </center>
      <NavBoard/>

      <DraggableWindow/>
    </>
  )
}

export default App
