import SpotLightElement, {spotlightElementProps,spotlightElementType} from "./SpotlightElement"; 

import images from '../svg/images';
import noise from '../svg/noise.svg';

function SpotLight() {

  let mainSpotlightElements: Array<spotlightElementProps> = [
    {
      icon: images.user,
      description: "About Me",
      value: {
        type: spotlightElementType.window, 
        title: "About Me", 
        content: (<h1>Hello</h1>) 
      }  
    },
  
    {
      icon: images.blueprint,
      description: "Projects",
      value: {
        type: spotlightElementType.window,
        title: "Projects",
        content: (<h1>TODO</h1>)
      }
    },

    {
      icon: images.writing,
      description: "Blogs",
      value: {
        type: spotlightElementType.link,
        href: "https://thapa-ashish.com.np/blog" 
      }
    },

    {
      icon: images.cv,
      description: "Download CV",
      value: {
        type: spotlightElementType.link,
        href: "https://thapa-ashish.com.np/blog"
      }
    },
  ];

  let socials = [
    {
      icon: images.github,
      description: "Github",
      value: {
        type: spotlightElementType.link,
        href: "https://github.com/voidash"
      }
    },

    {
      icon: images.twitter,
      description: "X (formerly Twitter)",
      value: {
        type: spotlightElementType.link,
        href: "https://twitter.com/rifeash"
      }
    },
    {
      icon: images.instagram,
      description: "Instagram",
      value: {
        type: spotlightElementType.link,
        href: "https://instagram.com/voidash_"
      }
    },
    {
      icon: images.search,
      description: "LinkedIn",
      value: {
        type: spotlightElementType.link,
        href: "linkedin.com/in/iamlookingforjobs"
      }
    },
  ];

  let miscellaneous = [
    {
      icon: images.ama,
      description: "Ask Me Anything",
      value: {
        type: spotlightElementType.window,
        title: "AMA",
        content: (<h1>TODO</h1>)
      }
    },

    {
      icon: images.musicnote ,
      description: "Music i listen to",
      value: {
        type: spotlightElementType.window,
        title: "Music carrying my soul",
        content: (<h1>Music</h1>)
      }
    },
    {
      icon: images.heart,
      description: "My Bookmarks, You are going to love it",
      value: {
        type: spotlightElementType.window,
        title: "Music carrying my soul",
        content: (<h1>Todo</h1>)
      }
    },
    {
      icon: images.briefcase,
      description: "My Setup",
      value: {
        type: spotlightElementType.window,
        title: "Setup",
        content: (<h1>Todo</h1>)
      }
    },
  ];

  function mapSpotlight(elements: Array<spotlightElementProps>) {
      return elements.map(
      (el) => {
          return <SpotLightElement {...el}  />
      }
    ) 
  }

  return (
  <>
<div className="spotlight" style = {{
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
