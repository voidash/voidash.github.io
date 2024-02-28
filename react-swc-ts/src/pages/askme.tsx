import { useEffect, useState } from 'react';
import './css/askme.css';
import { DatabaseURL} from '../model/MiscStore';
import { Spinner } from '../components/spinner';

type Qn = {
  id: Number,
  created_at: String,
  Name: String,
  Question: String,
  Answer: String,
};

export default function Askme() {
  let [questionTab,activateQuestionTab] = useState(false);
  let [questions, setQuestions] = useState<Array<Qn>>([]);
  let [questionSubmitted, setQuestionSubmitted] = useState(false);
  let [name, setName] = useState("");
  let [qn,setQn] = useState("");

  async function submitQN() {
    // get the name and and question

    const response = await fetch(DatabaseURL, {
      method: "POST",
      body: JSON.stringify({name: name, question: qn})
    });

    if (response.status === 200) {
      setQuestionSubmitted(true);
      activateQuestionTab(false);
    }
  }

  useEffect(() => {
    fetch(`${DatabaseURL}`).then((resp) => resp.json()).then(data => {setQuestions(data);});
  }, [questionSubmitted]);
  return (<>

    <h5>I try my best to answer questions as soon as possible.</h5>
    <button className="button" onClick={() => {
      activateQuestionTab(!questionTab);
      setQuestionSubmitted(false);
    }}> ask your Question </button>

    {questionTab ? 
      <div className="input-form">
      <br/>
        <input type="text" value={name} onChange={(e) => setName(e.target.value) } className="input-bar" placeholder="Name"/>
        <br/>
        <textarea id="question" value={qn} onChange={(e) => setQn(e.target.value)} className="input-bar" placeholder="Question" required></textarea>
        <br/>
        <input type="submit" value="Submit" className="button" onClick={() => {submitQN()}}/>
      </div> : <></>}
      
      {questions.length === 0 ? <Spinner/> : questions.map((qna) => {
        return (<div className="qna" key={qna.id}>
          <div className="question">{qna.Question} ? </div>
          <div className="asker">
              <div className="avatar">{qna.Name[0].toUpperCase()}</div> 
              <div className="name">{qna.Name}</div> 
          </div>
            <div className="answer">{qna.Answer === "" ? "Not Yet Answered": qna.Answer}</div>
        </div>);
      })}
  </>);
}
