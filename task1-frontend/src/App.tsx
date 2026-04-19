import InteractionList from './components/InteractionList';
import InteractionForm from './components/InteractionForm';
import ChatPanel from './components/ChatPanel';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Log HCP Interaction</h1>
      </header>
      <main className="app-main">
        <div className="list-column">
          <InteractionList />
        </div>
        <div className="form-column">
          <InteractionForm />
        </div>
        <div className="chat-column">
          <ChatPanel />
        </div>
      </main>
    </div>
  );
}

export default App;
