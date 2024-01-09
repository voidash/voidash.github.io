import prompt from '../svg/prompt.png';

function SearchBar() {
  return (
    <>
    <div className="search-bar">
      <kbd>
        <img src={prompt} className="icon-png icon-big" />
      </kbd>
      <input type="text" placeholder="Ashish Thapa" className="input-search"/> 
    </div>
    </>
  );
}

export default SearchBar;
