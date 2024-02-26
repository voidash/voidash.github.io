import { useEffect } from "react";
 
function getBookmarks() {
  const NOTION_API_KEY = "secret_uXFsQApiSiSCf1vYhMBBlK6kfUV1OKod4TZJ2dPPL3M";

    const API_ENDPOINT = "https://api.notion.com/v1/databases/6fab1aca487d4d8c875e6625c5d01a0a/query";

    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NOTION_API_KEY}`
      },
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
}

function Bookmark() {
  useEffect(() => {
      getBookmarks();
  }, []);

  return (
    <>
      <h1>Dua lipa is good</h1>
    </>
  );
} 

export default Bookmark;
