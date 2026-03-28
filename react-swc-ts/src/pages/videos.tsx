import './css/videos.css';

type Video = {
  id: string;
  title: string;
  description: string;
  date: string;
};

const VIDEOS: Video[] = [
  {
    id: "kgiYvqQWhok",
    title: "केपी ओली र रमेश लेखक पछि कस्को पालो? ९०० पेज प्रतिवेदन के भन्छ?",
    description: "कार्की आयोगको ९०० पानाको प्रतिवेदनको पूरा breakdown — ७ जनामाथि फौजदारी सिफारिस, ७६ मृत्यु, २५२२ घाइते",
    date: "2026-03-28",
  },
  {
    id: "XbG8G4xfLR4",
    title: "RSP पछिको नेपाल: सुधार कि तानाशाह",
    description: "GenZ protest पछि नेपालको राजनीतिक दिशा — सुधारको बाटो कि अर्को authoritarian cycle?",
    date: "2025-12-01",
  },
  {
    id: "2Kh-cQZ6rBo",
    title: "Learn to Build Computer from scratch on FPGA",
    description: "स्क्र्याचबाट कम्प्युटर बनाउनुहोस् — FPGA मा 8-bit computer design",
    date: "2024-06-01",
  },
];

function Videos() {
  return (
    <div className="videos-page">
      <h2>Latest Videos</h2>
      <p className="videos-subtitle">
        YouTube: <a href="https://youtube.com/@voidash" target="_blank" rel="noopener noreferrer">@voidash</a>
      </p>
      <div className="videos-grid">
        {VIDEOS.map((video) => (
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
