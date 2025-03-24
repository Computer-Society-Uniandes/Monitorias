import Explore from './Explore/pages/Explore.jsx';
import Home from './Home/pages/Home.jsx';
import Landing from './Landing/pages/Landing.jsx';
import Login from './Components/Login.js';
import Register from './Components/Register.js';
import Welcome from './Components/Welcome.js';
const routes = [
    {url:"/", component: Landing},
    {url:"/home", component: Home},
    {url:"/explore", component: Explore},
    {url:"/login", component: Login},
    {url:"/register", component: Register},
    // {url:"/home", component: Welcome},
];

export default routes;