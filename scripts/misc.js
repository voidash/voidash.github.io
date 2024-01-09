  const gradient = document.querySelector(".moving-gradient");

/**
 * Mouse move event gradient 
 *
 * @param {MouseEvent} event  
 */
function MouseMove(event) {
      console.log(`${event.clientX} ${event.clientY}`);
      gradient.style.left = `${event.clientX}px`;
      gradient.style.top = `${event.clientY}px`;  
  }

  document.body.addEventListener("mousemove", onMouseMove);
