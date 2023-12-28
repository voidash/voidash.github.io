
  const gradient = document.querySelector(".moving-gradient");

  
  function onMouseMove(event) {
      console.log(`${event.clientX} ${event.clientY}`);
      gradient.style.left = `${event.clientX}px`;
      gradient.style.top = `${event.clientY}px`;  
    }

  document.body.addEventListener("mousemove", onMouseMove);

