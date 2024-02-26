import { ReactElement, useEffect, useRef } from 'react';
import './window.css';
import useWindowStore from '../../model/WindowStore';

export type WindowProps = {
    title: String, 
    content: ReactElement,
}

function DraggableWindow(props: WindowProps) {
  let divElement = useRef(null);
  let disableWindow = useWindowStore((state) => state.disableWindow);

  function makeDraggable (element: any) {
      let currentPosX = 0, currentPosY = 0, previousPosX = 0, previousPosY = 0;

      if (element.querySelector('.menu-bar')) {
          element.querySelector('.menu-bar').onmousedown = dragMouseDown;
      } 
      else {
          element.onmousedown = dragMouseDown;
      }

      function dragMouseDown (e: any) {
          e.preventDefault();
          previousPosX = e.clientX;
          previousPosY = e.clientY;
          document.onmouseup = closeDragElement;
          document.onmousemove = elementDrag;
      }

      function elementDrag (e: any) {
          e.preventDefault();
          currentPosX = previousPosX - e.clientX;
          currentPosY = previousPosY - e.clientY;
          previousPosX = e.clientX;
          previousPosY = e.clientY;
          element.style.top = (element.offsetTop - currentPosY) + 'px';
          element.style.left = (element.offsetLeft - currentPosX) + 'px';
      }

      function closeDragElement () {
          document.onmouseup = null;
          document.onmousemove = null;
      }
      
      function initResizeElement() {
          let startX, startY, startWidth, startHeight;
          let right = document.createElement("div");
          right.className = "resizer-right";
          element.appendChild(right);
          right.addEventListener("mousedown", initDrag, false);

          var bottom = document.createElement("div");
          bottom.className = "resizer-bottom";
          element.appendChild(bottom);
          bottom.addEventListener("mousedown", initDrag, false);

          var both = document.createElement("div");
          both.className = "resizer-both";
          element.appendChild(both);
          both.addEventListener("mousedown", initDrag, false);

          function initDrag(e) {
            startX = e.clientX;
            startY = e.clientY;
             startWidth = parseInt(
              element.offsetWidth,
              10
            );
            startHeight = parseInt(
              element.offsetHeight,
              10
            );

            document.documentElement.addEventListener("mousemove", doDrag, false);
            document.documentElement.addEventListener("mouseup", stopDrag, false);
            }
            

            function doDrag(e){
              element.style.width = startWidth + e.clientX - startX + "px";
              element.style.height = startHeight + e.clientY - startY + "px";
            }
            
          function stopDrag(e) {
            document.documentElement.removeEventListener("mousemove", doDrag, false);
            document.documentElement.removeEventListener("mouseup", stopDrag, false); 
            }

          }
          initResizeElement();
          
      }
  

  function MenuBar() {
      return (
      <div className="menu-bar">
        <span>{props.title}</span>
        <div>
          <button className="round green"></button>
          <button className="round yellow"></button>
          <button className="round red"></button>
        </div>
      </div> 
      );
  }


  useEffect(() => {
    makeDraggable(divElement.current);
    document.addEventListener('click', (e: any) => {
      if (e.target.closest('.round.red')) {
          disableWindow();
      }
    });

    document.addEventListener('click', (e: any) => {
      if (e.target.closest('.round.yellow')) {
          disableWindow();
      }
    });


    document.addEventListener('click', (e: any)  => {
      if (e.target.closest('.round.green')) {
        divElement.current.style.transform = "rotate(0deg)";
        divElement.current.style.width = "98%";
        divElement.current.style.height = "100%";
        divElement.current.style.top = "0%";
        divElement.current.style.left = "0%";
      }
    });
  },[]);
  return (
    <div ref={divElement} className="window">
      <MenuBar/>
      <div className="window-content">
          {props.content}
      </div>
  </div>
  );
}

export default DraggableWindow;

