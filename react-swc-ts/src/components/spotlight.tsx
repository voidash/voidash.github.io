import noise from '../svg/noise.svg';
import {mainSpotlightElements, socials, miscellaneous} from "./listOfSpotLightElements";

import SpotLightElement, {spotlightElementProps} from "./SpotlightElement"; 

function SpotLight() {

  function mapSpotlight(elements: Array<spotlightElementProps>) {
      return elements.map(
      (el) => {
          return <SpotLightElement key={el.description} {...el}  />
      }
    ) 
  }

  return (
  <>
<div className="parent">
<div className="spotlight unselectable" style = {{
  background: `linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.2)) ,url(${noise})`,
      }}>
   <div className="blur">
    </div>
      {mapSpotlight(mainSpotlightElements)}

    <div className="spotlight-element-description">Miscellaneous</div>
    <hr/>
      {mapSpotlight(miscellaneous)}

    <hr/>
      <div className="spotlight-element-description">Socials</div>
        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap"}}>
      {
          socials.map((props)=> {
            return (
            <a key={props.description} style={{ display: "flex", flexDirection: "column", alignItems: "center", textDecoration: "none", flex: "1 0 15%"}} className="spotlight-elements" target="blank" href={(props.value).href}>
            <div>
              <img src={props.icon} className="icon-png icon-small" style={{
                marginRight: "10px"
            }} />
            </div>
            <div>{props.description}</div>
            </a>
              );
          })
      } 
      </div>
    </div>
  </div>
  </>
 );
}

export default SpotLight;
