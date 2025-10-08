import { useState,useEffect } from "react";
import './css/bookmark.css';

import images from "../svg/images";
import { Spinner } from "../components/spinner";


type BookmarkEntry = {
  Title: string,
  id: string,
  URL: string,
  Description: string,
  Tags: Array<String>
};

function Bookmark() {
  let [bookmarks,setBookmarks] = useState<Array<BookmarkEntry>>([]);

  useEffect(() => {
      getBookmarks();
  }, []);

  async function getBookmarks() {
    try {
      const response = await fetch('/spa/data/bookmarks.json');
      if (!response.ok) {
        throw new Error('Failed to fetch bookmarks data');
      }
      const content = await response.json();
      setBookmarks(content);
    } catch (error) {
      console.error("Can't retrieve bookmarks:", error);
    }
  }
  return (
    <>
      <p>Links that i found really interesting</p>
      <div className="bookmarks">
        {bookmarks.length === 0 ? <Spinner/> :bookmarks.map((content) => {
        return (
          <div key={content.id}>
          <a className="card" key={content.Title} href={content.URL} target="_blank">
          <div className="title">{content.Title}</div>
          <div className="urlBar">
            {content.Tags.map((type,i) => {
                return ( <div className="tags" key={i}>
                    { type === "blog" ? 
                    <img className="favicon" src={images.writing}/> :
                      type === "advice" ? 
                    <img className="favicon" src={images.chat}/> :
                      type === "video" ? 
                    <img className="favicon" src={images.megaphone}/> : 
                    <img className="favicon" src={images.writing}/> 
                    }
                      <div className="tag">{type}</div>
                    </div>);

            })}

          </div>
          <span className="url">{new URL(content.URL).hostname}</span> 
          <div className="description">"{content.Description}"</div>
        </a>
        </div>)
        })}
      </div>
    </>
  );
} 

export default Bookmark;
