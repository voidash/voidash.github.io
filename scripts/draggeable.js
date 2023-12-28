  
  function makeDraggable (element) {
      // Make an element draggable (or if it has a .window-top class, drag based on the .window-top element)
      let currentPosX = 0, currentPosY = 0, previousPosX = 0, previousPosY = 0;

      // If there is a window-top classed element, attach to that element instead of full window
      if (element.querySelector('.menu-bar')) {
          // If present, the window-top element is where you move the parent element from
          element.querySelector('.menu-bar').onmousedown = dragMouseDown;
      } 
      else {
          // Otherwise, move the element itself
          element.onmousedown = dragMouseDown;
      }

      function dragMouseDown (e) {
          // Prevent any default action on this element (you can remove if you need this element to perform its default action)
          e.preventDefault();
          // Get the mouse cursor position and set the initial previous positions to begin
          previousPosX = e.clientX;
          previousPosY = e.clientY;
          // When the mouse is let go, call the closing event
          document.onmouseup = closeDragElement;
          // call a function whenever the cursor moves
          document.onmousemove = elementDrag;
      }

      function elementDrag (e) {
          // Prevent any default action on this element (you can remove if you need this element to perform its default action)
          e.preventDefault();
          // Calculate the new cursor position by using the previous x and y positions of the mouse
          currentPosX = previousPosX - e.clientX;
          currentPosY = previousPosY - e.clientY;
          // Replace the previous positions with the new x and y positions of the mouse
          previousPosX = e.clientX;
          previousPosY = e.clientY;
          // Set the element's new position
          element.style.top = (element.offsetTop - currentPosY) + 'px';
          element.style.left = (element.offsetLeft - currentPosX) + 'px';
      }

      function closeDragElement () {
          // Stop moving when mouse button is released and release events
          document.onmouseup = null;
          document.onmousemove = null;
      }
  }

  // Make myWindow and myWindow2 draggable in different ways...

  // myWindow will only be able to be moved via the top bar (.window-top element). The main element does nothing on mouse down.
  makeDraggable(document.querySelector('.window'));

  //Close the window on click of a red button
  document.addEventListener('click', e => {
    if (e.target.closest('.round.red')) {
      e.target.closest('.window').remove();
    }
  });

  //Close the window on click of a red button
  document.addEventListener('click', e => {
    if (e.target.closest('.round.yellow')) {
      e.target.closest('.window').remove();
    }
  });

  document.addEventListener('click', e => {
    if (e.target.closest('.round.green')) {
      e.target.closest('.window').style.transform = "rotate(0deg)";
      e.target.closest('.window').style.width = "98%";
      e.target.closest('.window').style.top = "0%";
      e.target.closest('.window').style.left = "0%";
    }
  });

