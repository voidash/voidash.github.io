import { ReactElement, forwardRef, useEffect} from 'react';
import './window.css';
import useWindowStore from '../../model/WindowStore';

export type WindowProps = {
    title: String, 
    content: ReactElement,
    disableWindow?: () => void | null
}


const DraggableWindow = forwardRef<HTMLDivElement, WindowProps>((props: WindowProps, ref) => {
  let removeFromWindowStore = useWindowStore((state) => state.disableWindow);
  let divElement = ref as React.RefObject<HTMLDivElement>;
  let disableWindow = props.disableWindow ?? (() => {
      if(divElement.current!.style.display != "None") {
        divElement.current!.style.display = "None";
      }
      removeFromWindowStore(divElement); });


  function makeDraggable(element: any) {
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
          let content = element.querySelector('.window-content');
          let startX = 0, startY = 0, startWidth = 0, startHeight = 0;
          let contentWidth = 0, contentHeight = 0;

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

          function initDrag(e: MouseEvent) {
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt( element.offsetWidth, 10);
            startHeight = parseInt( element.offsetHeight, 10);
            document.documentElement.addEventListener("mousemove", doDrag, false);
            document.documentElement.addEventListener("mouseup", stopDrag, false);
            }
            

            function doDrag(e: MouseEvent){
              

              element.style.width = startWidth + e.clientX - startX + "px";
              element.style.height = startHeight + e.clientY - startY + "px";
              
              content.style.height = element.clientHeight - element.querySelector('.menu-bar').clientHeight  + "px";
              content.style.width = element.clientWidth + "px";
              

            }
            
          function stopDrag() {
            document.documentElement.removeEventListener("mousemove", doDrag, false);
            document.documentElement.removeEventListener("mouseup", stopDrag, false); 
            }

          }
          initResizeElement();
          
      }
  



  useEffect(() => {
    makeDraggable(divElement.current);
  },[]);

  return (
    <div ref={ref} className="window">
      <div className="menu-bar">
        <div><div style={{display:"block", width: "10px"}}></div><h3>{props.title}</h3></div>
        <div>
          <button className="round green" onClick = {() => {
              divElement.current!.style.transform = "rotate(0deg)";
              divElement.current!.style.width = "100vw";
              divElement.current!.style.height = "100vh";
              divElement.current!.style.top = "0";
              divElement.current!.style.left = "0";
              (divElement.current!.getElementsByClassName('window-content')[0] as HTMLDivElement)!.style.maxHeight = "100%";
            }}></button>
          <button className="round yellow" onClick = {() => disableWindow()}></button>
          <button className="round red" onClick = {() => disableWindow()}></button>
        </div>
      </div> 
      <div className="window-content">
          {props.content}
      </div>
  </div>
  );
})

export default DraggableWindow;

