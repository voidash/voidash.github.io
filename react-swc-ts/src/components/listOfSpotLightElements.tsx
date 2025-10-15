import { spotlightElementProps, spotlightElementType } from './SpotlightElement';
import images from '../svg/images';
import Bookmark from '../pages/bookmarks';
import Aboutme from '../pages/aboutme';
import Askme from '../pages/askme';
import Timeline from '../pages/timeline';
import { NotionPage } from '../pages/genericNotion';


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
    icon: images.ama,
    description: "Ask Me Anything",
    value: {
      type: spotlightElementType.window,
      url: "ama",
      title: "AMA",
      content: (<Askme/>)
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
      href: "https://voidash.github.io/blog"
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
    icon: images.blueprint,
    description: "Blueprint for 2025",
    value: {
      type: spotlightElementType.window,
      url: "2025",
      title: "Where 2025 will take me",
      content: (<NotionPage url='Blueprint-for-2025-171c12466a36808fbbb4cdbfcbbe8366?pvs=4'/>)
    }
  },
  {
    icon: images.musicnote ,
    description: "Music and Notes",
    value: {
      type: spotlightElementType.window,
      url: "music",
      title: "Music carrying my soul",
      content: (<NotionPage url='music-i-listen-to-f114f9d0040842adb8649125f13407dc'/>)
    }
  },
  {
    icon: images.briefcase,
    description: "My Setup",
    value: {
      type: spotlightElementType.window,
      url: "setup",
      title: "Setup",
      content: (<NotionPage url='My-Setup-171c12466a36802a9ebdf6ec516f7f3f'/>)
    }
  },

  {
    icon: images.cv,
    description: "Books",
    value: {
      type: spotlightElementType.window,
      url: "books",
      title: "My Books",
      content: (<NotionPage url='Books-171c12466a3680869dd4dd1007de7b10'/>)
    }
  },
];

export {mainSpotlightElements, socials, miscellaneous};
