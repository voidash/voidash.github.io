import { spotlightElementProps, spotlightElementType } from './SpotlightElement';
import images from '../svg/images';
import Bookmark from '../pages/bookmarks';
import { Music } from '../pages/music';
import Aboutme from '../pages/aboutme';
import Askme from '../pages/askme';
import Timeline from '../pages/timeline';

let mainSpotlightElements: Array<spotlightElementProps> = [
  {
    icon: images.user,
    description: "About Me",
    value: {
      type: spotlightElementType.window, 
      url: "about-me",
      title: "About Me", 
      content: (<Aboutme/>) 
    }  
  },
  {
    icon: images.heart,
    description: "Bookmarks, You will find something useful here",
    value: {
      type: spotlightElementType.window,
      url: "bookmarks",
      title: "Bookmarks",
      content: (
        <Bookmark/>
      )
    }
  },
  {
    icon: images.timeline,
    description: "Timeline of My Life",
    value: {
      type: spotlightElementType.window,
      url: "timeline",
      title: "My Timeline",
      content: (<Timeline/>)
    }
  },

  {
    icon: images.blueprint,
    description: "My Projects",
    value: {
      type: spotlightElementType.link,
      url: "projects",
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
    icon: images.writing,
    description: "My Blog",
    value: {
      type: spotlightElementType.link,
      href: "https://thapa-ashish.com.np/blog" 
    }
  },
  {
    icon: images.twitter,
    description: "Twitter",
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
    icon: images.megaphone,
    description: "LinkedIn",
    value: {
      type: spotlightElementType.link,
      href: "linkedin.com/in/iamlookingforjobs"
    }
  },
];

let miscellaneous : Array<spotlightElementProps> = [
  {
    icon: images.ama,
    description: "Ask Me Anything",
    value: {
      type: spotlightElementType.window,
      url: "ama",
      title: "AMA",
      content: (<Askme/>)
    }
  },

  {
    icon: images.musicnote ,
    description: "Music and Notes",
    value: {
      type: spotlightElementType.window,
      url: "music",
      title: "Music carrying my soul",
      content: (<Music/>)
    }
  },
  {
    icon: images.briefcase,
    description: "TODO My Setup",
    value: {
      type: spotlightElementType.window,
      url: "setup",
      title: "Setup",
      content: (<h1>Todo</h1>)
    }
  },

  {
    icon: images.cv,
    description: "TODO CV",
    value: {
      type: spotlightElementType.window,
      url: "todo",
      title: "CV",
      content: (<h1>Todo</h1>)
    }
  },
];

export {mainSpotlightElements, socials, miscellaneous};
