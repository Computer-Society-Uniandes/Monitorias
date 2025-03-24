import Explore from './Explore/pages/Explore.jsx';
import Home from './Home/pages/Home.jsx';
import Landing from './Landing/pages/Landing.jsx';
import Login from './Components/Login.jsx';
import Register from './Components/Register.jsx';
import Profile from './Components/Profile.jsx';

const routes = [
    {url:"/", component: Landing},
    {url:"/home", component: Home},
    {url:"/explore", component: Explore},
    {url:"/login", component: Login},
    {url:"/register", component: Register},
    {url:"/profile", component: Profile},
];

export default routes;