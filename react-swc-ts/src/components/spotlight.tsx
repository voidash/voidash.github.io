import noise from '../svg/noise.svg';
import {mainSpotlightElements, socials, miscellaneous} from "./listOfSpotLightElements";

import SpotLightElement, {spotlightElementProps,spotlightElementType} from "./SpotlightElement"; 

function SpotLight() {

  function mapSpotlight(elements: Array<spotlightElementProps>) {
      return elements.map(
      (el) => {
          return <SpotLightElement {...el}  />
      }
    ) 
  }

  return (
  <>
<div className="spotlight unselectable" style = {{
  background: `linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.2)) ,url(${noise})`

      }}>
      <div className="blur">
      </div>
      {mapSpotlight(mainSpotlightElements)}

    <hr/>
      <div className="spotlight-element-description">Socials</div>

      {mapSpotlight(socials)}
    <hr/>
      <div className="spotlight-element-description">Miscellaneous</div>

      {mapSpotlight(miscellaneous)}

    </div>
  </>
  );
}

export default SpotLight;
