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
  let [searchQuery, setSearchQuery] = useState<string>("");

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

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const query = searchQuery.toLowerCase();
    return (
      bookmark.Title.toLowerCase().includes(query) ||
      bookmark.Description.toLowerCase().includes(query) ||
      bookmark.Tags.some(tag => tag.toString().toLowerCase().includes(query)) ||
      bookmark.URL.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <p>Links that i found really interesting</p>
      <div className="bookmark-search" style={{
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <input
          type="text"
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '10px 15px',
            width: '100%',
            maxWidth: '500px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(0,0,0,0.3)',
            color: 'white',
            fontSize: '16px',
            outline: 'none'
          }}
        />
      </div>
      <div className="bookmarks">
        {bookmarks.length === 0 ? <Spinner/> : filteredBookmarks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
            No bookmarks found matching "{searchQuery}"
          </div>
        ) : filteredBookmarks.map((content) => {
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
