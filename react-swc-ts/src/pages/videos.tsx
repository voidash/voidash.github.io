import { useState, useEffect } from 'react';
import './css/videos.css';

type Video = {
  id: string;
  title: string;
  description: string;
  date: string;
};

function Videos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/data/videos.json')
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(setVideos)
      .catch(() => setError(true));
  }, []);

  return (
    <div className="videos-page">
      <h2>Latest Videos</h2>
      <p className="videos-subtitle">
        YouTube: <a href="https://youtube.com/@voidash" target="_blank" rel="noopener noreferrer">@voidash</a>
      </p>
      {error && <p>Failed to load videos.</p>}
      <div className="videos-grid">
        {videos.map((video) => (
          <a
            key={video.id}
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="video-card"
          >
            <div className="video-thumb">
              <img
                src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                alt={video.title}
                loading="lazy"
              />
              <div className="video-play">▶</div>
            </div>
            <div className="video-info">
              <h3>{video.title}</h3>
              <p>{video.description}</p>
              <span className="video-date">{video.date}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default Videos;
