import { useEffect, useState } from "react";
import "./css/askme.css";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { Spinner } from "../components/spinner";
import app from "../firebase/config";

// Firebase Firestore instance (ensure `firebase` is initialized elsewhere in your app)
const db = getFirestore(app);

type Qn = {
  id: string;
  created_at: string;
  Name: string;
  Question: string;
  Answer: string;
};

export default function Askme() {
  const [questionTab, activateQuestionTab] = useState(false);
  const [questions, setQuestions] = useState<Array<Qn>>([]);
  const [questionSubmitted, setQuestionSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [qn, setQn] = useState("");

  // Submit a new question to Firestore
  async function submitQN() {
    try {
      const docRef = await addDoc(collection(db, "questions"), {
        Name: name,
        Question: qn,
        Answer: "",
        created_at: new Date().toISOString(),
      });
      console.log("Document written with ID: ", docRef.id);
      setQuestionSubmitted(true);
      activateQuestionTab(false);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  // Fetch all questions from Firestore
  useEffect(() => {
    async function fetchQuestions() {
      const querySnapshot = await getDocs(collection(db, "questions"));
      const data: Array<Qn> = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Array<Qn>;
      setQuestions(data);
    }
    fetchQuestions();
  }, [questionSubmitted]);

  return (
    <>
      <h5>Anyone can ask questions. It's anonymous. I will answer it promptly. If something urgent then you can always mail me at ashish.thapa477{"<at>"}gmail.com</h5>
      <button
        className="button"
        onClick={() => {
          activateQuestionTab(!questionTab);
          setQuestionSubmitted(false);
        }}
      >
        Ask your Question
      </button>

      {questionTab ? (
        <div className="input-form">
          <br />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-bar"
            placeholder="Name"
          />
          <br />
          <textarea
            id="question"
            value={qn}
            onChange={(e) => setQn(e.target.value)}
            className="input-bar"
            placeholder="Question"
            required
          ></textarea>
          <br />
          <input
            type="submit"
            value="Submit"
            className="button"
            onClick={() => {
              submitQN();
            }}
          />
        </div>
      ) : (
        <></>
      )}

      {questions.length === 0 ? (
        <Spinner />
      ) : (
        questions.map((qna) => {
          return (
            <div className="qna" key={qna.id}>
              <div className="question">{qna.Question}</div>
              <div className="asker">
                <div className="avatar">{qna.Name[0].toUpperCase()}</div>
                <div className="name">{qna.Name}</div>
              </div>
              <div className="answer">
                 <p style={{textDecoration: "underline"}}>My answer</p>
                {qna.Answer === "" ? "Not Yet Answered" : qna.Answer}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
