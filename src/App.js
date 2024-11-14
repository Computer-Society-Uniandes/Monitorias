import './App.css';
import Header from './Components/Header';
import Auth from './Components/Auth';
import Welcome from './Components/Welcome';
import BoxSubject from './Components/BoxSubject';

function App() {
  return (
    <div >
      {/* Manu */}
      <Header />  

      {/* Ashley */}
      <Auth />  

      {/* Felipe */}
      <BoxSubject /> 

      {/* Jorge */}
      <Welcome /> 
    </div>
  );
}

export default App;
