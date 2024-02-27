import { useState,useEffect } from "react";
import { NotionURL } from "../model/MiscStore";
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
    const tableURL = '6fab1aca487d4d8c875e6625c5d01a0a?v=6dc3a9d4faf04d19942183cb3e3e1359';
    let endpoint = `${NotionURL}/v1/table/${tableURL}`;
    let data = await fetch(endpoint);
    if (data.ok) {
      let content = await data.json();
      console.log(content);
      setBookmarks(content);
    }else{
      console.log("can't retreive from Notion");
    }
  }
  return (
    <>
      <p>Links that i found really interesting</p>
      <div className="bookmarks">
        {bookmarks.length === 0 ? <Spinner/> :bookmarks.map((content) => {
        return (<a className="card" key={content.Title} href={content.URL} target="_blank">
          <div className="title">{content.Title}</div>
          <div className="urlBar">
            {content.Tags.map((type) => {
                return ( <div className="tags">
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
          <a className="url" target="_blank" href={content.URL}>{new URL(content.URL).hostname}</a> 
          <div className="description">"{content.Description}"</div>
        </a>)
        })}
      </div>
    </>
  );
} 

export default Bookmark;
