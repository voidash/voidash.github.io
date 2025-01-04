import { useEffect, useState } from "react";
import "./css/askme.css";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { Spinner } from "../components/spinner";
import app from "../firebase/config";

const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

type Qn = {
  id: string;
  created_at: string;
  Name: string;
  Question: string;
  Answer: string;
};

export default function Admin() {
  const [questions, setQuestions] = useState<Array<Qn>>([]);
  const [questionSubmitted, setQuestionSubmitted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Google Sign-In
  async function signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setUser(user);
      setIsAdmin(user.email === "ashish.thapa477@gmail.com");
      console.log("Signed in as:", user.displayName);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  }

  // Sign-Out
  function handleSignOut() {
    signOut(auth);
    setUser(null);
    setIsAdmin(false);
  }

  // Update an answer (Admin Only)
  async function updateAnswer(id: string, newAnswer: string) {
    try {
      const questionDoc = doc(db, "questions", id);
      await updateDoc(questionDoc, { Answer: newAnswer });
      setQuestionSubmitted(true); // Refresh questions
    } catch (e) {
      console.error("Error updating answer:", e);
    }
  }

  // Delete a question
  async function deleteQuestion(id: string) {
    try {
      const questionDoc = doc(db, "questions", id);
      await deleteDoc(questionDoc);
      setQuestions((prev) => prev.filter((qna) => qna.id !== id)); // Update UI after deletion
      console.log(`Question with ID ${id} has been deleted.`);
    } catch (e) {
      console.error("Error deleting question:", e);
    }
  }

  // Fetch all questions
  useEffect(() => {
    async function fetchQuestions() {
      const querySnapshot = await getDocs(collection(db, "questions"));
      const data: Array<Qn> = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Array<Qn>;
      setQuestions(data);
      setLoading(false);
    }
    fetchQuestions();
  }, [questionSubmitted]);

  return (
    <div>
      {/* Authentication Section */}
      {!user ? (
        <div>
          <h3>Sign In</h3>
          <button onClick={signInWithGoogle}>Sign in with Google</button>
        </div>
      ) : (
        <div>
          <p>Welcome, {user.displayName}</p>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      )}

      {/* Questions Display Section */}
      {loading ? (
        <Spinner />
      ) : (
        questions.map((qna) => (
          <div className="qna" key={qna.id}>
            <div className="question">{qna.Question}?</div>
            <div className="asker">
              <div className="avatar">{qna.Name[0].toUpperCase()}</div>
              <div className="name">{qna.Name}</div>
            </div>
            <div className="answer">
              <h4>
                {qna.Answer !== "" ? `Answer: ${qna.Answer}` : "Not Answered Yet"}
              </h4>
              {isAdmin ? (
                <>
                  <textarea
                    cols={100}
                    rows={5}
                    placeholder="Type an answer"
                    style={{ color: "black" }}
                    onFocus={() => setQuestionSubmitted(false)}
                    onBlur={(e) => updateAnswer(qna.id, e.target.value)}
                  />
                  <button
                    className="delete-button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this question?")) {
                        deleteQuestion(qna.id);
                      }
                    }}
                    style={{
                      marginTop: "10px",
                      backgroundColor: "red",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
