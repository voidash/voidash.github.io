import { spotlightElementProps, spotlightElementType } from './SpotlightElement';
import images from '../svg/images';
import Bookmark from '../pages/bookmarks';

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
      title: "Bookmarks",
      content: (
        <Bookmark/>
      )
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

export {mainSpotlightElements, socials, miscellaneous};
