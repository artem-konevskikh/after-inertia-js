import './App.css';
import { Application } from '@playcanvas/react';
import { FILLMODE_FILL_WINDOW, RESOLUTION_AUTO } from 'playcanvas';
import Scene from './Scene';

function App() {
  return (
    <Application
      fillMode={FILLMODE_FILL_WINDOW}
      resolutionMode={RESOLUTION_AUTO}
    >
      <Scene />
    </Application>
  );
}

export default App;
